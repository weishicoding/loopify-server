import { ConnectionArguments, CoreServiceContext } from '@/types/index.js';
import { Prisma, ConversationType, MessageType } from '@prisma/client';
import { redisMessaging, QueuedMessage } from '@/lib/redis-messaging.js';

export type ConversationPayload = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      include: {
        user: true;
      };
    };
    messages: {
      include: {
        sender: true;
        deliveries: true;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
    item: true;
  };
}>;

export type MessagePayload = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    conversation: {
      include: {
        participants: {
          include: {
            user: true;
          };
        };
      };
    };
    parentMessage: {
      include: {
        sender: true;
      };
    };
    replies: {
      include: {
        sender: true;
      };
    };
    deliveries: {
      include: {
        recipient: true;
      };
    };
  };
}>;

export interface SendMessageInput {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  parentMessageId?: string;
}

export interface CreateConversationInput {
  type: ConversationType;
  participantIds: string[];
  title?: string;
  itemId?: string;
}

export const generateMessagingModel = (context: CoreServiceContext) => {
  const { prisma } = context;

  return {
    // ===== CONVERSATION MANAGEMENT =====
    
    createConversation: async (input: CreateConversationInput): Promise<ConversationPayload> => {
      const { type, participantIds, title, itemId } = input;
      
      return await prisma.$transaction(async (tx) => {
        // Create the conversation
        const conversation = await tx.conversation.create({
          data: {
            type,
            title,
            itemId,
          },
        });

        // Add participants
        await tx.conversationParticipant.createMany({
          data: participantIds.map(userId => ({
            conversationId: conversation.id,
            userId,
          })),
        });

        // Cache participants in Redis for quick lookup
        for (const userId of participantIds) {
          await redisMessaging.addUserToConversation(conversation.id, userId);
        }

        // Fetch the complete conversation with relations
        return await tx.conversation.findUniqueOrThrow({
          where: { id: conversation.id },
          include: {
            participants: {
              include: {
                user: true,
              },
            },
            messages: {
              include: {
                sender: true,
                deliveries: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
            item: true,
          },
        });
      });
    },

    findOrCreateDirectConversation: async (userId1: string, userId2: string, itemId?: string): Promise<ConversationPayload> => {
      const type = itemId ? ConversationType.ITEM_INQUIRY : ConversationType.DIRECT_MESSAGE;
      
      // Try to find existing conversation
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type,
          itemId,
          participants: {
            every: {
              userId: {
                in: [userId1, userId2],
              },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            include: {
              sender: true,
              deliveries: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          item: true,
        },
      });

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation - recursively call the exported function
      const model = generateMessagingModel(context);
      return await model.createConversation({
        type,
        participantIds: [userId1, userId2],
        itemId,
      });
    },

    getUserConversations: async (userId: string, paginationArgs: ConnectionArguments): Promise<{
      edges: Array<{ cursor: string; node: ConversationPayload }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    }> => {
      const { first, after } = paginationArgs;

      const where: Prisma.ConversationWhereInput = {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      };

      const [conversations, totalCount] = await prisma.$transaction([
        prisma.conversation.findMany({
          take: first + 1,
          cursor: after ? { id: after } : undefined,
          skip: after ? 1 : 0,
          where,
          include: {
            participants: {
              include: {
                user: true,
              },
            },
            messages: {
              include: {
                sender: true,
                deliveries: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
            item: true,
          },
          orderBy: {
            lastMessageAt: 'desc',
          },
        }),
        prisma.conversation.count({ where }),
      ]);

      const hasNextPage = conversations.length > first;
      if (hasNextPage) conversations.pop();

      const edges = conversations.map((conversation) => ({
        cursor: conversation.id,
        node: conversation,
      }));

      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor,
        },
        totalCount,
      };
    },

    // ===== MESSAGE MANAGEMENT =====
    
    sendMessage: async (senderId: string, input: SendMessageInput): Promise<MessagePayload> => {
      const { conversationId, content, messageType = MessageType.TEXT, parentMessageId } = input;
      
      // Check rate limit
      const canSend = await redisMessaging.checkRateLimit(senderId, 60, 60); // 60 messages per minute
      if (!canSend) {
        throw new Error('Rate limit exceeded');
      }

      // Generate deduplication hash
      const timestamp = Date.now();
      const messageHash = redisMessaging.generateMessageHash(senderId, conversationId, content, timestamp);
      
      // Check for duplicate
      if (await redisMessaging.isMessageDuplicate(messageHash)) {
        throw new Error('Duplicate message detected');
      }

      return await prisma.$transaction(async (tx) => {
        // Verify sender is participant
        const participation = await tx.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: senderId,
            isActive: true,
          },
        });

        if (!participation) {
          throw new Error('User is not a participant in this conversation');
        }

        // Create the message
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId,
            content,
            messageType,
            parentMessageId,
          },
        });

        // Update conversation last message timestamp
        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: message.createdAt },
        });

        // Get all active participants except sender
        const recipients = await tx.conversationParticipant.findMany({
          where: {
            conversationId,
            isActive: true,
            userId: { not: senderId },
          },
          include: {
            user: true,
          },
        });

        // Create delivery records
        await tx.messageDelivery.createMany({
          data: recipients.map(recipient => ({
            messageId: message.id,
            recipientId: recipient.userId,
          })),
        });

        // Update unread counters in Redis
        for (const recipient of recipients) {
          await redisMessaging.incrementUnreadCount(recipient.userId);
        }

        // Mark message as sent (for deduplication)
        await redisMessaging.markMessageSent(messageHash, message.id);

        // Queue message for real-time delivery
        const queuedMessage: QueuedMessage = {
          id: message.id,
          conversationId,
          senderId,
          content,
          messageType,
          parentMessageId,
          priority: messageType === MessageType.SYSTEM_NOTIFICATION ? 'high' : 'normal',
          createdAt: timestamp,
        };

        await redisMessaging.queueMessage(queuedMessage);

        // Fetch complete message with relations
        return await tx.message.findUniqueOrThrow({
          where: { id: message.id },
          include: {
            sender: true,
            conversation: {
              include: {
                participants: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            parentMessage: {
              include: {
                sender: true,
              },
            },
            replies: {
              include: {
                sender: true,
              },
            },
            deliveries: {
              include: {
                recipient: true,
              },
            },
          },
        });
      });
    },

    getConversationMessages: async (conversationId: string, userId: string, paginationArgs: ConnectionArguments): Promise<{
      edges: Array<{ cursor: string; node: MessagePayload }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    }> => {
      // Verify user is participant
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
          isActive: true,
        },
      });

      if (!participation) {
        throw new Error('User is not a participant in this conversation');
      }

      const { first, after } = paginationArgs;

      const where: Prisma.MessageWhereInput = {
        conversationId,
      };

      const [messages, totalCount] = await prisma.$transaction([
        prisma.message.findMany({
          take: first + 1,
          cursor: after ? { id: after } : undefined,
          skip: after ? 1 : 0,
          where,
          include: {
            sender: true,
            conversation: {
              include: {
                participants: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            parentMessage: {
              include: {
                sender: true,
              },
            },
            replies: {
              include: {
                sender: true,
              },
            },
            deliveries: {
              include: {
                recipient: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.message.count({ where }),
      ]);

      const hasNextPage = messages.length > first;
      if (hasNextPage) messages.pop();

      const edges = messages.map((message) => ({
        cursor: message.id,
        node: message,
      }));

      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor,
        },
        totalCount,
      };
    },

    // ===== MESSAGE DELIVERY TRACKING =====
    
    markMessageAsDelivered: async (messageId: string, userId: string): Promise<void> => {
      await prisma.messageDelivery.updateMany({
        where: {
          messageId,
          recipientId: userId,
          deliveredAt: null,
        },
        data: {
          deliveredAt: new Date(),
        },
      });
    },

    markMessageAsRead: async (messageId: string, userId: string): Promise<void> => {
      await prisma.messageDelivery.updateMany({
        where: {
          messageId,
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          deliveredAt: new Date(), // Also mark as delivered if not already
        },
      });
    },

    markConversationAsRead: async (conversationId: string, userId: string): Promise<number> => {
      // Update last read timestamp
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Get unread message count before marking as read
      const unreadMessages = await prisma.messageDelivery.findMany({
        where: {
          recipientId: userId,
          readAt: null,
          message: {
            conversationId,
          },
        },
      });

      // Mark all unread messages as read
      await prisma.messageDelivery.updateMany({
        where: {
          recipientId: userId,
          readAt: null,
          message: {
            conversationId,
          },
        },
        data: {
          readAt: new Date(),
          deliveredAt: new Date(),
        },
      });

      // Update Redis unread counter
      if (unreadMessages.length > 0) {
        await redisMessaging.decrementUnreadCount(userId, unreadMessages.length);
      }

      return unreadMessages.length;
    },

    // ===== UTILITY METHODS =====
    
    getUnreadMessageCount: async (userId: string): Promise<number> => {
      // Try Redis first (faster)
      const redisCount = await redisMessaging.getUnreadCount(userId);
      if (redisCount > 0) {
        return redisCount;
      }

      // Fallback to database count
      const dbCount = await prisma.messageDelivery.count({
        where: {
          recipientId: userId,
          readAt: null,
        },
      });

      // Sync Redis with database count
      if (dbCount > 0) {
        await redisMessaging.resetUnreadCount(userId);
        for (let i = 0; i < dbCount; i++) {
          await redisMessaging.incrementUnreadCount(userId);
        }
      }

      return dbCount;
    },

    deleteMessage: async (messageId: string, userId: string): Promise<boolean> => {
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!message) {
        return false;
      }

      // Soft delete by updating content
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: '[Message deleted]',
          messageType: MessageType.SYSTEM_NOTIFICATION,
        },
      });

      return true;
    },

    editMessage: async (messageId: string, userId: string, newContent: string): Promise<MessagePayload | null> => {
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!message) {
        return null;
      }

      return await prisma.message.update({
        where: { id: messageId },
        data: {
          content: newContent,
          editedAt: new Date(),
        },
        include: {
          sender: true,
          conversation: {
            include: {
              participants: {
                include: {
                  user: true,
                },
              },
            },
          },
          parentMessage: {
            include: {
              sender: true,
            },
          },
          replies: {
            include: {
              sender: true,
            },
          },
          deliveries: {
            include: {
              recipient: true,
            },
          },
        },
      });
    },
  };
};