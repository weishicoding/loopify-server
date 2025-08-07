import { MyContext } from '@/types/index.js';
import { redisMessaging } from '@/lib/redis-messaging.js';
import { ConversationType, MessageType } from '@prisma/client';
import logger from '@/lib/logger.js';
import { validateInput } from '@/utils/validation.util.js';
import messagingValidation from '@/validations/messaging.validation.js';
// import { withFilter } from 'graphql-subscriptions'; // For future subscription implementation
import {
  ConversationResolvers,
  MessageResolvers,
  MutationResolvers,
  QueryResolvers,
  SubscriptionResolvers,
} from '@/graphql/generated/types.js';

const query: QueryResolvers<MyContext> = {
  conversations: async (_parent, { first, after }, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const connection = await context.models.messaging.getUserConversations(userId, {
      first,
      after,
    });

    return {
      ...connection,
      edges: connection.edges.map((edge) => ({
        ...edge,
        node: {
          ...edge.node,
          unreadCount: 0, // Will be calculated in resolver
        },
      })),
    } as never;
  },

  conversation: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { id } = validateInput(messagingValidation.conversationSchema, args);

    // Get user conversations and find the requested one
    const conversations = await context.models.messaging.getUserConversations(userId, {
      first: 100,
    });
    const conversation = conversations.edges.find((edge) => edge.node.id === id);

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    return {
      ...conversation.node,
      unreadCount: 0, // Will be calculated in resolver
    } as never;
  },

  conversationMessages: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { first, after } = args;

    const { conversationId } = validateInput(messagingValidation.conversationMessagesSchema, args);
    return (await context.models.messaging.getConversationMessages(conversationId, userId, {
      first,
      after,
    })) as never;
  },

  unreadMessageCount: async (_parent, _args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return await context.models.messaging.getUnreadMessageCount(userId);
  },

  usersOnlineStatus: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { userIds } = validateInput(messagingValidation.usersOnlineStatusSchema, args);
    const statusPromises = userIds.map(async (targetUserId) => {
      const status = await redisMessaging.getUserOnlineStatus(targetUserId);
      return {
        userId: targetUserId,
        isOnline: !!status,
        lastSeen: status ? new Date(status.lastSeen).toISOString() : null,
      };
    });

    return Promise.all(statusPromises);
  },

  findOrCreateDirectConversation: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { participantId, itemId } = validateInput(
      messagingValidation.findOrCreateDirectConversationSchema,
      args
    );
    const conversation = await context.models.messaging.findOrCreateDirectConversation(
      userId,
      participantId,
      itemId || undefined
    );

    return {
      ...conversation,
      unreadCount: 0, // Will be calculated in resolver
    } as never;
  },
};

const mutation: MutationResolvers<MyContext> = {
  createConversation: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { input } = args;
    const validatedInput = validateInput(messagingValidation.createConversationSchema, input);
    const conversation = await context.models.messaging.createConversation({
      type: validatedInput.type as ConversationType,
      participantIds: [...validatedInput.participantIds, userId], // Include creator
      title: validatedInput.title || undefined,
      itemId: validatedInput.itemId || undefined,
    });

    return {
      ...conversation,
      unreadCount: 0,
    } as never;
  },

  startConversation: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { input } = args;
    const validatedInput = validateInput(messagingValidation.startConversationSchema, input);
    const conversation = await context.models.messaging.findOrCreateDirectConversation(
      userId,
      validatedInput.participantId,
      validatedInput.itemId || undefined
    );

    // Send initial message if provided
    if (validatedInput.initialMessage) {
      await context.models.messaging.sendMessage(userId, {
        conversationId: conversation.id,
        content: validatedInput.initialMessage,
        messageType: MessageType.TEXT,
      });
    }

    return {
      ...conversation,
      unreadCount: 0,
    } as never;
  },

  sendMessage: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { input } = args;
    const validatedInput = validateInput(messagingValidation.sendMessageSchema, input);
    const message = await context.models.messaging.sendMessage(userId, {
      conversationId: validatedInput.conversationId,
      content: validatedInput.content,
      messageType: (validatedInput.messageType as MessageType) || MessageType.TEXT,
      parentMessageId: validatedInput.parentMessageId || undefined,
    });

    return {
      ...message,
      isDelivered: true,
      isRead: false,
    } as never;
  },

  markConversationAsRead: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    try {
      const { conversationId } = validateInput(
        messagingValidation.markConversationAsReadSchema,
        args
      );
      await context.models.messaging.markConversationAsRead(conversationId, userId);

      return {
        success: true,
        message: 'Conversation marked as read',
      };
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      return {
        success: false,
        message: 'Failed to mark conversation as read',
      };
    }
  },

  markMessageAsRead: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    try {
      const { messageId } = validateInput(messagingValidation.markMessageAsReadSchema, args);
      await context.models.messaging.markMessageAsRead(messageId, userId);

      return {
        success: true,
        message: 'Message marked as read',
      };
    } catch (error) {
      logger.error('Error marking message as read:', error);
      return {
        success: false,
        message: 'Failed to mark message as read',
      };
    }
  },

  editMessage: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { messageId, content } = validateInput(messagingValidation.editMessageSchema, args);
    const message = await context.models.messaging.editMessage(messageId, userId, content);

    if (!message) {
      throw new Error('Message not found or you do not have permission to edit it');
    }

    return {
      ...message,
      isDelivered: true,
      isRead: false,
    } as never;
  },

  deleteMessage: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    try {
      const { messageId } = validateInput(messagingValidation.deleteMessageSchema, args);
      const success = await context.models.messaging.deleteMessage(messageId, userId);

      if (!success) {
        return {
          success: false,
          message: 'Message not found or you do not have permission to delete it',
        };
      }

      return {
        success: true,
        message: 'Message deleted',
      };
    } catch (error) {
      logger.error('Error deleting message:', error);
      return {
        success: false,
        message: 'Failed to delete message',
      };
    }
  },

  leaveConversation: async (_parent, args, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    try {
      const { conversationId } = validateInput(messagingValidation.leaveConversationSchema, args);

      // Mark participant as inactive
      await context.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          isActive: false,
        },
      });

      // Remove from Redis conversation tracking
      await redisMessaging.removeUserFromConversation(conversationId, userId);

      return {
        success: true,
        message: 'Left conversation',
      };
    } catch (error) {
      logger.error('Error leaving conversation:', error);
      return {
        success: false,
        message: 'Failed to leave conversation',
      };
    }
  },
};

// Field resolvers
const conversationResolvers: ConversationResolvers<MyContext> = {
  unreadCount: async (parent, _args, context: MyContext) => {
    const { userId } = context;
    if (!userId) return 0;

    // Count unread messages in this conversation
    const count = await context.prisma.messageDelivery.count({
      where: {
        recipientId: userId,
        readAt: null,
        message: {
          conversationId: parent.id,
        },
      },
    });

    return count;
  },

  lastMessage: async (parent, _args, context: MyContext) => {
    // Get the last message for this conversation
    if (!context.userId) return null;

    const messages = await context.models.messaging.getConversationMessages(
      parent.id,
      context.userId,
      { first: 1 }
    );
    if (messages.edges.length > 0) {
      const lastMessage = messages.edges[0].node;
      return {
        ...lastMessage,
        isDelivered: true,
        isRead: false,
      } as never;
    }
    return null;
  },
};

const messageResolvers: MessageResolvers<MyContext> = {
  isDelivered: async (parent, _args, context: MyContext) => {
    const { userId } = context;
    if (!userId) return false;

    const delivery = await context.prisma.messageDelivery.findFirst({
      where: {
        messageId: parent.id,
        recipientId: userId,
        deliveredAt: { not: null },
      },
    });

    return !!delivery;
  },

  isRead: async (parent, _args, context: MyContext) => {
    const { userId } = context;
    if (!userId) return false;

    const delivery = await context.prisma.messageDelivery.findFirst({
      where: {
        messageId: parent.id,
        recipientId: userId,
        readAt: { not: null },
      },
    });

    return !!delivery;
  },
};

// Subscription resolvers (placeholder - requires subscription infrastructure)
const subscription: SubscriptionResolvers<MyContext> = {
  messageAdded: {
    // This is a placeholder - you'll need to implement PubSub
    subscribe: () => {
      // Return async iterator from your PubSub implementation
      throw new Error('Subscriptions not yet implemented');
    },
  },

  // Add other subscription resolvers...
};

export const messagingResolvers = {
  Query: query,
  Mutation: mutation,
  Subscription: subscription,
  Conversation: conversationResolvers,
  Message: messageResolvers,
};
