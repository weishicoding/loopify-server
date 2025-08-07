import { Redis } from 'ioredis';
import { redis } from './redis.js';

// Redis key patterns for messaging system
export const REDIS_KEYS = {
  // User online status and connection mapping
  userOnline: (userId: string) => `user:online:${userId}`,
  socketUser: (socketId: string) => `socket:user:${socketId}`,
  
  // Message queues
  messageQueue: 'queue:messages',
  priorityQueue: 'queue:messages:priority',
  deadLetterQueue: 'queue:messages:dead_letter',
  
  // Real-time counters and status
  unreadCount: (userId: string) => `user:unread_count:${userId}`,
  typingUsers: (conversationId: string) => `conversation:typing:${conversationId}`,
  
  // Message deduplication (TTL: 5 minutes)
  messageDedup: (hash: string) => `message:dedup:${hash}`,
  
  // Rate limiting
  rateLimitMessages: (userId: string) => `rate_limit:user:${userId}:messages`,
  
  // Conversation metadata
  conversationUsers: (conversationId: string) => `conversation:users:${conversationId}`,
} as const;

export interface UserOnlineStatus {
  socketId: string;
  lastSeen: number; // Unix timestamp
  deviceInfo?: string;
}

export interface QueuedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  parentMessageId?: string;
  priority: 'high' | 'normal';
  createdAt: number;
  retryCount?: number;
}

export class RedisMessaging {
  constructor(private redis: Redis) {}

  // ===== USER PRESENCE =====
  
  async setUserOnline(userId: string, socketId: string, deviceInfo?: string): Promise<void> {
    const status: UserOnlineStatus = {
      socketId,
      lastSeen: Date.now(),
      deviceInfo,
    };
    
    await Promise.all([
      this.redis.setex(REDIS_KEYS.userOnline(userId), 300, JSON.stringify(status)), // 5 minutes TTL
      this.redis.setex(REDIS_KEYS.socketUser(socketId), 300, userId),
    ]);
  }

  async setUserOffline(userId: string, socketId: string): Promise<void> {
    await Promise.all([
      this.redis.del(REDIS_KEYS.userOnline(userId)),
      this.redis.del(REDIS_KEYS.socketUser(socketId)),
    ]);
  }

  async getUserOnlineStatus(userId: string): Promise<UserOnlineStatus | null> {
    const status = await this.redis.get(REDIS_KEYS.userOnline(userId));
    return status ? JSON.parse(status) as UserOnlineStatus : null;
  }

  async getUserBySocket(socketId: string): Promise<string | null> {
    return await this.redis.get(REDIS_KEYS.socketUser(socketId));
  }

  async updateLastSeen(userId: string): Promise<void> {
    const currentStatus = await this.getUserOnlineStatus(userId);
    if (currentStatus) {
      currentStatus.lastSeen = Date.now();
      await this.redis.setex(REDIS_KEYS.userOnline(userId), 300, JSON.stringify(currentStatus));
    }
  }

  // ===== TYPING INDICATORS =====
  
  async addTypingUser(conversationId: string, userId: string): Promise<void> {
    await this.redis.sadd(REDIS_KEYS.typingUsers(conversationId), userId);
    // Set TTL for auto-cleanup
    await this.redis.expire(REDIS_KEYS.typingUsers(conversationId), 10);
  }

  async removeTypingUser(conversationId: string, userId: string): Promise<void> {
    await this.redis.srem(REDIS_KEYS.typingUsers(conversationId), userId);
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    return await this.redis.smembers(REDIS_KEYS.typingUsers(conversationId));
  }

  // ===== UNREAD COUNTERS =====
  
  async incrementUnreadCount(userId: string): Promise<number> {
    return await this.redis.incr(REDIS_KEYS.unreadCount(userId));
  }

  async decrementUnreadCount(userId: string, count: number = 1): Promise<number> {
    const result = await this.redis.decrby(REDIS_KEYS.unreadCount(userId), count);
    // Ensure it doesn't go below 0
    if (result < 0) {
      await this.redis.set(REDIS_KEYS.unreadCount(userId), 0);
      return 0;
    }
    return result;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.redis.get(REDIS_KEYS.unreadCount(userId));
    return count ? parseInt(count, 10) : 0;
  }

  async resetUnreadCount(userId: string): Promise<void> {
    await this.redis.set(REDIS_KEYS.unreadCount(userId), 0);
  }

  // ===== MESSAGE QUEUING =====
  
  async queueMessage(message: QueuedMessage): Promise<void> {
    const queueKey = message.priority === 'high' ? REDIS_KEYS.priorityQueue : REDIS_KEYS.messageQueue;
    await this.redis.lpush(queueKey, JSON.stringify(message));
  }

  async dequeueMessage(priority: 'high' | 'normal' = 'normal'): Promise<QueuedMessage | null> {
    const queueKey = priority === 'high' ? REDIS_KEYS.priorityQueue : REDIS_KEYS.messageQueue;
    const result = await this.redis.rpop(queueKey);
    return result ? JSON.parse(result) as QueuedMessage : null;
  }

  async moveToDeadLetter(message: QueuedMessage): Promise<void> {
    message.retryCount = (message.retryCount || 0) + 1;
    await this.redis.lpush(REDIS_KEYS.deadLetterQueue, JSON.stringify(message));
  }

  // ===== MESSAGE DEDUPLICATION =====
  
  async isMessageDuplicate(messageHash: string): Promise<boolean> {
    const exists = await this.redis.exists(REDIS_KEYS.messageDedup(messageHash));
    return exists === 1;
  }

  async markMessageSent(messageHash: string, messageId: string): Promise<void> {
    await this.redis.setex(REDIS_KEYS.messageDedup(messageHash), 300, messageId); // 5 minutes TTL
  }

  // ===== RATE LIMITING =====
  
  async checkRateLimit(userId: string, limit: number = 60, windowSeconds: number = 60): Promise<boolean> {
    const key = REDIS_KEYS.rateLimitMessages(userId);
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    return current <= limit;
  }

  // ===== CONVERSATION MANAGEMENT =====
  
  async addUserToConversation(conversationId: string, userId: string): Promise<void> {
    await this.redis.sadd(REDIS_KEYS.conversationUsers(conversationId), userId);
  }

  async removeUserFromConversation(conversationId: string, userId: string): Promise<void> {
    await this.redis.srem(REDIS_KEYS.conversationUsers(conversationId), userId);
  }

  async getConversationUsers(conversationId: string): Promise<string[]> {
    return await this.redis.smembers(REDIS_KEYS.conversationUsers(conversationId));
  }

  // ===== UTILITY METHODS =====
  
  generateMessageHash(senderId: string, conversationId: string, content: string, timestamp: number): string {
    // Create a hash for deduplication
    const data = `${senderId}:${conversationId}:${content}:${Math.floor(timestamp / 1000)}`;
    return Buffer.from(data).toString('base64');
  }

  async cleanupExpiredKeys(): Promise<void> {
    // This would be called by a background job to clean up expired typing indicators, etc.
    // For now, we rely on Redis TTL for cleanup
  }
}

// Create singleton instance
export const redisMessaging = new RedisMessaging(redis);