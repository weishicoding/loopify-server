import { z } from 'zod';

const createConversationSchema = z.object({
  type: z.enum(['DIRECT_MESSAGE', 'GROUP_CHAT', 'ITEM_INQUIRY']),
  participantIds: z.array(z.string().min(1)).min(1).max(50), // Limit participants
  title: z.string().min(1).max(100).optional(),
  itemId: z.string().min(1).optional(),
});

const startConversationSchema = z.object({
  participantId: z.string().min(1),
  itemId: z.string().min(1).optional(),
  initialMessage: z.string().min(1).max(2000).optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
  messageType: z.enum(['TEXT', 'IMAGE', 'SYSTEM_NOTIFICATION', 'ITEM_SHARE']).optional(),
  parentMessageId: z.string().min(1).optional(),
});

const markMessageAsReadSchema = z.object({
  messageId: z.string().min(1),
});

const markConversationAsReadSchema = z.object({
  conversationId: z.string().min(1),
});

const editMessageSchema = z.object({
  messageId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

const deleteMessageSchema = z.object({
  messageId: z.string().min(1),
});

const leaveConversationSchema = z.object({
  conversationId: z.string().min(1),
});

const conversationMessagesSchema = z.object({
  conversationId: z.string().min(1),
  // first and after are excluded from validation as requested
});

const conversationSchema = z.object({
  id: z.string().min(1),
});

const usersOnlineStatusSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
});

const findOrCreateDirectConversationSchema = z.object({
  participantId: z.string().min(1),
  itemId: z.string().min(1).optional(),
});

// Push notification validation schemas
const registerDeviceTokenSchema = z.object({
  token: z.string().min(1).max(4096), // Device tokens can be long
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  deviceInfo: z.string().max(500).optional(),
});

const unregisterDeviceTokenSchema = z.object({
  token: z.string().min(1),
});

export default {
  createConversationSchema,
  startConversationSchema,
  sendMessageSchema,
  markMessageAsReadSchema,
  markConversationAsReadSchema,
  editMessageSchema,
  deleteMessageSchema,
  leaveConversationSchema,
  conversationMessagesSchema,
  conversationSchema,
  usersOnlineStatusSchema,
  findOrCreateDirectConversationSchema,
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
};
