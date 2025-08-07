import { Server as HttpServer } from 'http';
import { SocketGateway, socketGateway as socketGatewayVar } from './socket-gateway.js';
import {
  MessageQueueService,
  messageQueueService as messageQueueServiceVar,
} from '../services/message-queue.js';
import {
  PushNotificationService,
  pushNotificationService as pushNotificationServiceVar,
  PushNotificationPayload,
} from '../services/push-notification.js';
import { MyContext } from '@/types/index.js';
import logger from './logger.js';

export class MessagingSystem {
  private socketGateway: SocketGateway;
  private messageQueueService: MessageQueueService;
  private pushNotificationService: PushNotificationService;
  private isInitialized = false;

  constructor(private httpServer: HttpServer, private context: MyContext) {
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

      // Set global references for other modules to use
      Object.assign(socketGatewayVar, this.socketGateway);
      Object.assign(messageQueueServiceVar, this.messageQueueService);
      Object.assign(pushNotificationServiceVar, this.pushNotificationService);

      this.isInitialized = true;
      logger.info('Messaging system initialized successfully');

      // Set up graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
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

// Utility functions for external use

export function sendMessageToUser(userId: string, event: string, data: unknown) {
  if (socketGatewayVar) {
    socketGatewayVar.sendMessageToUser(userId, event, data);
  }
}

export function sendMessageToConversation(conversationId: string, event: string, data: unknown) {
  if (socketGatewayVar) {
    socketGatewayVar.sendMessageToConversation(conversationId, event, data);
  }
}

export function isUserOnline(userId: string) {
  if (socketGatewayVar) {
    return socketGatewayVar.isUserOnline(userId);
  }
  return false;
}

export async function queuePushNotification(payload: PushNotificationPayload): Promise<void> {
  if (pushNotificationServiceVar) {
    await pushNotificationServiceVar.queueNotification(payload);
  }
}
