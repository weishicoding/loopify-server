import { CoreServiceContext } from '@/types/index.js';
import { DeviceToken } from '@prisma/client';
import logger from '@/lib/logger.js';

export interface PushNotificationPayload {
  userId: string;
  messageId: string;
  conversationId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

// DeviceToken interface now comes from Prisma

export class PushNotificationService {
  constructor(private context: CoreServiceContext) {}

  async sendNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's device tokens
      const deviceTokens = await this.getUserDeviceTokens(payload.userId);
      
      if (deviceTokens.length === 0) {
        logger.info('No device tokens found for user', { userId: payload.userId });
        return;
      }

      // Send to each platform
      const sendPromises = deviceTokens.map(async (token) => {
        switch (token.platform) {
          case 'IOS':
            return await this.sendAPNS(token, payload);
          case 'ANDROID':
            return await this.sendFCM(token, payload);
          case 'WEB':
            return await this.sendWebPush(token, payload);
          default:
            logger.warn('Unknown platform', { platform: token.platform });
        }
      });

      await Promise.allSettled(sendPromises);
      
      logger.info('Push notifications sent', {
        userId: payload.userId,
        messageId: payload.messageId,
        deviceCount: deviceTokens.length,
      });

    } catch (error) {
      logger.error('Failed to send push notification:', error, { payload });
      throw error;
    }
  }

  async registerDeviceToken(userId: string, token: string, platform: 'IOS' | 'ANDROID' | 'WEB', deviceInfo?: string): Promise<void> {
    try {
      logger.info('Device token registered', {
        userId,
        platform,
        token: token.substring(0, 20) + '...',
      });

      await this.context.prisma.deviceToken.upsert({
        where: { 
          userId_token: { 
            userId, 
            token 
          } 
        },
        create: { 
          userId, 
          token, 
          platform, 
          deviceInfo,
          isActive: true 
        },
        update: { 
          isActive: true, 
          lastUsedAt: new Date(),
          deviceInfo: deviceInfo || undefined,
        },
      });

    } catch (error) {
      logger.error('Failed to register device token:', error);
      throw error;
    }
  }

  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    try {
      logger.info('Device token unregistered', {
        userId,
        token: token.substring(0, 20) + '...',
      });

      await this.context.prisma.deviceToken.updateMany({
        where: { userId, token },
        data: { isActive: false },
      });

    } catch (error) {
      logger.error('Failed to unregister device token:', error);
      throw error;
    }
  }

  private async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    const tokens = await this.context.prisma.deviceToken.findMany({
      where: { 
        userId, 
        isActive: true 
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    });
    return tokens;
  }

  private async sendAPNS(token: DeviceToken, payload: PushNotificationPayload): Promise<void> {
    try {
      // TODO: Implement Apple Push Notification Service
      logger.info('APNS notification would be sent', {
        token: token.token.substring(0, 20) + '...',
        title: payload.title,
        body: payload.body,
      });

      // Example implementation would use apn library:
      // const notification = new apn.Notification();
      // notification.alert = { title: payload.title, body: payload.body };
      // notification.payload = payload.data;
      // notification.topic = process.env.APNS_BUNDLE_ID;
      // await apnProvider.send(notification, token.token);

    } catch (error) {
      logger.error('APNS send failed:', error);
      // Mark token as invalid if needed
      await this.handleFailedToken(token, error);
    }
  }

  private async sendFCM(token: DeviceToken, payload: PushNotificationPayload): Promise<void> {
    try {
      // TODO: Implement Firebase Cloud Messaging
      logger.info('FCM notification would be sent', {
        token: token.token.substring(0, 20) + '...',
        title: payload.title,
        body: payload.body,
      });

      // Example implementation would use firebase-admin:
      // await admin.messaging().send({
      //   token: token.token,
      //   notification: {
      //     title: payload.title,
      //     body: payload.body,
      //   },
      //   data: payload.data as Record<string, string>,
      // });

    } catch (error) {
      logger.error('FCM send failed:', error);
      await this.handleFailedToken(token, error);
    }
  }

  private async sendWebPush(token: DeviceToken, payload: PushNotificationPayload): Promise<void> {
    try {
      // TODO: Implement Web Push Protocol
      logger.info('Web Push notification would be sent', {
        token: token.token.substring(0, 20) + '...',
        title: payload.title,
        body: payload.body,
      });

      // Example implementation would use web-push library:
      // await webpush.sendNotification(
      //   JSON.parse(token.token), // Contains endpoint, keys
      //   JSON.stringify({
      //     title: payload.title,
      //     body: payload.body,
      //     data: payload.data,
      //   })
      // );

    } catch (error) {
      logger.error('Web Push send failed:', error);
      await this.handleFailedToken(token, error);
    }
  }

  private async handleFailedToken(token: DeviceToken, error: unknown): Promise<void> {
    // Check if token is invalid (common error patterns)
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('invalid') || 
        errorMessage.includes('not found') || 
        errorMessage.includes('unregistered')) {
      
      logger.info('Marking token as inactive due to error', {
        tokenId: token.id,
        error: errorMessage,
      });

      await this.context.prisma.deviceToken.update({
        where: { id: token.id },
        data: { isActive: false },
      });
    }
  }

  // Queue-based methods for better reliability
  
  async queueNotification(payload: PushNotificationPayload): Promise<void> {
    // TODO: Queue notification for processing by a worker
    logger.info('Notification queued', { payload });
    
    // For now, send directly
    await this.sendNotification(payload);
  }

  async processBatchNotifications(payloads: PushNotificationPayload[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      
      const sendPromises = batch.map(payload => 
        this.sendNotification(payload).catch(error => {
          logger.error('Batch notification failed:', error, { payload });
          return null;
        })
      );

      await Promise.allSettled(sendPromises);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Analytics and monitoring methods
  
  async getNotificationStats(userId?: string): Promise<{
    sent: number;
    delivered: number;
    failed: number;
    clicked: number;
    activeTokenCount: number;
  }> {
    logger.info('Getting notification stats', { userId });
    
    // Get active device token count for user
    let activeTokenCount = 0;
    if (userId) {
      activeTokenCount = await this.context.prisma.deviceToken.count({
        where: {
          userId,
          isActive: true
        }
      });
    }
    
    // TODO: Implement full notification analytics with tracking tables
    return {
      sent: 0,
      delivered: 0,
      failed: 0,
      clicked: 0,
      activeTokenCount,
    };
  }

  // Device token management methods

  async cleanupExpiredTokens(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.context.prisma.deviceToken.updateMany({
      where: {
        lastUsedAt: {
          lt: cutoffDate
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    logger.info(`Cleaned up ${result.count} expired device tokens`);
    return result.count;
  }
}

// Export singleton instance
export let pushNotificationService: PushNotificationService;