import { Server as HttpServer } from 'http';
import { SocketGateway } from './socket-gateway.js';
import { MessageQueueService } from '../services/message-queue.js';
import {
  PushNotificationService,
  type PushNotificationPayload,
} from '../services/push-notification.js';
import { MyContext } from '@/types/index.js';
import logger from './logger.js';

// Re-export for external use
export type { PushNotificationPayload };

export class MessagingSystem {
  private socketGateway: SocketGateway;
  private messageQueueService: MessageQueueService;
  private pushNotificationService: PushNotificationService;
  private isInitialized = false;

  constructor(
    private httpServer: HttpServer,
    private context: MyContext
  ) {
    this.socketGateway = new SocketGateway(httpServer, context);
    this.messageQueueService = new MessageQueueService(context);
    this.pushNotificationService = new PushNotificationService(context);
  }

  public initialize() {
    if (this.isInitialized) {
      logger.warn('Messaging system already initialized');
      return;
    }

    try {
      logger.info('Initializing messaging system...');

      // Start message queue workers
      this.messageQueueService.start();

      this.isInitialized = true;
      logger.info('Messaging system initialized successfully');

      // Set up graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.log(error);
      logger.error('Failed to initialize messaging system:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      logger.info('Shutting down messaging system...');

      // Stop message queue service
      await this.messageQueueService.stop();

      this.isInitialized = false;
      logger.info('Messaging system shut down successfully');
    } catch (error) {
      logger.error('Error during messaging system shutdown:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down messaging system...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Getter methods for accessing services
  public getSocketGateway(): SocketGateway {
    return this.socketGateway;
  }

  public getMessageQueueService(): MessageQueueService {
    return this.messageQueueService;
  }

  public getPushNotificationService(): PushNotificationService {
    return this.pushNotificationService;
  }

  // Utility methods for external use
  public sendMessageToUser(userId: string, event: string, data: unknown) {
    this.socketGateway.sendMessageToUser(userId, event, data);
  }

  public sendMessageToConversation(conversationId: string, event: string, data: unknown) {
    this.socketGateway.sendMessageToConversation(conversationId, event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.socketGateway.isUserOnline(userId);
  }

  public async queuePushNotification(payload: PushNotificationPayload): Promise<void> {
    await this.pushNotificationService.queueNotification(payload);
  }

  // Health check methods
  public async getHealthStatus(): Promise<{
    socketGateway: { status: 'healthy' | 'unhealthy'; onlineUsers: number };
    messageQueue: {
      status: 'healthy' | 'unhealthy';
      isRunning: boolean;
      queueStats: {
        highPriorityCount: number;
        normalPriorityCount: number;
        deadLetterCount: number;
      } | null;
    };
    pushNotification: { status: 'healthy' | 'unhealthy' };
  }> {
    try {
      const [queueStats] = await Promise.all([
        this.messageQueueService.getQueueStats().catch(() => null),
      ]);

      return {
        socketGateway: {
          status: 'healthy',
          onlineUsers: this.socketGateway.getOnlineUsersCount(),
        },
        messageQueue: {
          status: this.messageQueueService.isServiceRunning() ? 'healthy' : 'unhealthy',
          isRunning: this.messageQueueService.isServiceRunning(),
          queueStats,
        },
        pushNotification: {
          status: 'healthy', // Placeholder
        },
      };
    } catch (error) {
      logger.error('Error getting health status:', error);
      throw error;
    }
  }

  // Monitoring and metrics methods
  public async getMetrics(): Promise<{
    messagesProcessed: number;
    messagesQueued: number;
    onlineUsers: number;
    activeConversations: number;
  }> {
    const queueStats = await this.messageQueueService.getQueueStats();

    return {
      messagesProcessed: 0, // TODO: Implement counter
      messagesQueued: queueStats.normalPriorityCount + queueStats.highPriorityCount,
      onlineUsers: this.socketGateway.getOnlineUsersCount(),
      activeConversations: 0, // TODO: Implement counter
    };
  }
}

// Utility methods moved to MessagingSystem class
// Access these through the messagingSystem instance
