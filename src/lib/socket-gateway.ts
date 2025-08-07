import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MessageType } from '@prisma/client';
import { redisMessaging } from './redis-messaging.js';
import { MyContext } from '@/types/index.js';
import logger from './logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceInfo?: string;
}

interface SocketMessage {
  conversationId: string;
  content: string;
  messageType?: string;
  parentMessageId?: string;
}

interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

interface JoinRoomData {
  conversationId: string;
}

export class SocketGateway {
  private io: SocketIOServer;
  private context: MyContext;

  // Map of socketId -> userId for quick lookup
  private socketUserMap = new Map<string, string>();

  // Map of userId -> Set<socketId> for multiple device support
  private userSocketsMap = new Map<string, Set<string>>();

  constructor(httpServer: HttpServer, context: MyContext) {
    this.context = context;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = 
          (socket.handshake.auth.token as string) ||
          (socket.handshake.headers.authorization as string)?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & { userId: string };
        socket.userId = decoded.userId;
        socket.deviceInfo = (socket.handshake.headers['user-agent'] as string) || 'unknown';

        logger.info(`Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      await this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    const userId = socket.userId;
    const socketId = socket.id;

    try {
      // Track socket connection
      this.socketUserMap.set(socketId, userId);

      if (!this.userSocketsMap.has(userId)) {
        this.userSocketsMap.set(userId, new Set());
      }
      this.userSocketsMap.get(userId)!.add(socketId);

      // Set user online in Redis
      await redisMessaging.setUserOnline(userId, socketId, socket.deviceInfo);

      // Send current unread count
      const unreadCount = await this.context.models.messaging.getUnreadMessageCount(userId);
      socket.emit('unread_count', { count: unreadCount });

      logger.info(`User ${userId} connected with socket ${socketId}`);

      // Set up event handlers
      socket.on('join_conversation', (data: JoinRoomData) =>
        this.handleJoinConversation(socket, data)
      );
      socket.on('leave_conversation', (data: JoinRoomData) =>
        this.handleLeaveConversation(socket, data)
      );
      socket.on('send_message', (data: SocketMessage) => this.handleSendMessage(socket, data));
      socket.on('typing', (data: TypingData) => this.handleTyping(socket, data));
      socket.on('mark_as_read', (data: { conversationId: string }) =>
        this.handleMarkAsRead(socket, data)
      );
      socket.on('heartbeat', () => this.handleHeartbeat(socket));

      socket.on('disconnect', () => this.handleDisconnection(socket));
    } catch (error) {
      logger.error(`Error handling connection for user ${userId}:`, error);
      socket.disconnect();
    }
  }

  private async handleJoinConversation(
    socket: AuthenticatedSocket,
    data: JoinRoomData
  ): Promise<void> {
    try {
      const { conversationId } = data;
      const userId = socket.userId!;

      // Verify user is participant in conversation
      const conversations = await this.context.models.messaging.getUserConversations(userId, {
        first: 100,
      });
      const isParticipant = conversations.edges.some((edge) => edge.node.id === conversationId);

      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized to join this conversation' });
        return;
      }

      // Join the room
      await socket.join(`conversation:${conversationId}`);

      // Add to Redis conversation tracking
      await redisMessaging.addUserToConversation(conversationId, userId);

      logger.info(`User ${userId} joined conversation ${conversationId}`);
      socket.emit('joined_conversation', { conversationId });
    } catch (error) {
      logger.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  private async handleLeaveConversation(
    socket: AuthenticatedSocket,
    data: JoinRoomData
  ): Promise<void> {
    try {
      const { conversationId } = data;
      const userId = socket.userId!;

      await socket.leave(`conversation:${conversationId}`);
      await redisMessaging.removeTypingUser(conversationId, userId);

      logger.info(`User ${userId} left conversation ${conversationId}`);
      socket.emit('left_conversation', { conversationId });
    } catch (error) {
      logger.error('Error leaving conversation:', error);
    }
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: SocketMessage): Promise<void> {
    try {
      const userId = socket.userId!;
      const { conversationId, content, messageType, parentMessageId } = data;

      // Send message using the model
      const message = await this.context.models.messaging.sendMessage(userId, {
        conversationId,
        content,
        messageType: messageType as MessageType,
        parentMessageId,
      });

      // Emit to all participants in the conversation
      this.io.to(`conversation:${conversationId}`).emit('message_received', {
        message: {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatarUrl: message.sender.avatarUrl,
          },
          parentMessage: message.parentMessage
            ? {
                id: message.parentMessage.id,
                content: message.parentMessage.content,
                sender: {
                  id: message.parentMessage.sender.id,
                  name: message.parentMessage.sender.name,
                },
              }
            : null,
          createdAt: message.createdAt,
        },
        conversationId,
      });

      // Remove typing indicator
      await redisMessaging.removeTypingUser(conversationId, userId);
      await this.broadcastTypingUpdate(conversationId);

      // Update unread counts for other participants
      for (const participant of message.conversation.participants) {
        if (participant.userId !== userId) {
          await this.updateUserUnreadCount(participant.userId);
        }
      }

      logger.info(`Message sent by user ${userId} in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }

  private async handleTyping(socket: AuthenticatedSocket, data: TypingData): Promise<void> {
    try {
      const userId = socket.userId!;
      const { conversationId, isTyping } = data;

      if (isTyping) {
        await redisMessaging.addTypingUser(conversationId, userId);
      } else {
        await redisMessaging.removeTypingUser(conversationId, userId);
      }

      await this.broadcastTypingUpdate(conversationId);
    } catch (error) {
      logger.error('Error handling typing:', error);
    }
  }

  private async handleMarkAsRead(
    socket: AuthenticatedSocket,
    data: { conversationId: string }
  ): Promise<void> {
    try {
      const userId = socket.userId!;
      const { conversationId } = data;

      const markedCount = await this.context.models.messaging.markConversationAsRead(
        conversationId,
        userId
      );

      if (markedCount > 0) {
        await this.updateUserUnreadCount(userId);

        // Notify other participants that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          readAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Error marking messages as read:', error);
    }
  }

  private async handleHeartbeat(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.userId!;
    await redisMessaging.updateLastSeen(userId);
    socket.emit('heartbeat_ack');
  }

  private async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.userId;
    const socketId = socket.id;

    if (!userId) return;

    try {
      // Remove from tracking maps
      this.socketUserMap.delete(socketId);
      const userSockets = this.userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userSocketsMap.delete(userId);
          // User has no more connections, set offline
          await redisMessaging.setUserOffline(userId, socketId);
        }
      }

      // Remove from all typing indicators
      const conversations = await this.context.models.messaging.getUserConversations(userId, {
        first: 100,
      });
      for (const edge of conversations.edges) {
        await redisMessaging.removeTypingUser(edge.node.id, userId);
        await this.broadcastTypingUpdate(edge.node.id);
      }

      logger.info(`User ${userId} disconnected (socket: ${socketId})`);
    } catch (error) {
      logger.error('Error handling disconnection:', error);
    }
  }

  private async broadcastTypingUpdate(conversationId: string): Promise<void> {
    try {
      const typingUsers = await redisMessaging.getTypingUsers(conversationId);
      this.io.to(`conversation:${conversationId}`).emit('typing_update', {
        conversationId,
        typingUsers,
      });
    } catch (error) {
      logger.error('Error broadcasting typing update:', error);
    }
  }

  private async updateUserUnreadCount(userId: string): Promise<void> {
    try {
      const unreadCount = await this.context.models.messaging.getUnreadMessageCount(userId);
      const userSockets = this.userSocketsMap.get(userId);

      if (userSockets) {
        for (const socketId of userSockets) {
          this.io.to(socketId).emit('unread_count', { count: unreadCount });
        }
      }
    } catch (error) {
      logger.error('Error updating unread count:', error);
    }
  }

  // Public methods for external use

  public sendMessageToUser(userId: string, event: string, data: unknown) {
    const userSockets = this.userSocketsMap.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  public sendMessageToConversation(conversationId: string, event: string, data: unknown) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  public isUserOnline(userId: string) {
    return this.userSocketsMap.has(userId);
  }

  public getOnlineUsersCount(): number {
    return this.userSocketsMap.size;
  }

  public getUsersInConversation(conversationId: string) {
    const room = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    const userIds: string[] = [];

    if (room) {
      for (const socketId of room) {
        const userId = this.socketUserMap.get(socketId);
        if (userId) {
          userIds.push(userId);
        }
      }
    }

    return [...new Set(userIds)]; // Remove duplicates
  }
}

// Export singleton instance (will be initialized in the main server file)
export let socketGateway: SocketGateway;
