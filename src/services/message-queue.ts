import { redisMessaging, QueuedMessage } from '@/lib/redis-messaging.js';
import { socketGateway } from '@/lib/socket-gateway.js';
import { MyContext } from '@/types/index.js';
import logger from '@/lib/logger.js';

export class MessageQueueService {
  private isRunning = false;
  private workers: Promise<void>[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private workerCount = 3;

  constructor(private context: MyContext) {}

  public start(): void {
    if (this.isRunning) {
      logger.warn('Message queue service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting message queue service with workers', { count: this.workerCount });

    // Start high priority worker
    this.workers.push(this.startWorker('high'));

    // Start normal priority workers
    for (let i = 0; i < this.workerCount - 1; i++) {
      this.workers.push(this.startWorker('normal'));
    }

    // Start dead letter queue processor
    this.workers.push(this.startDeadLetterProcessor());
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping message queue service');
    this.isRunning = false;

    // Wait for all workers to finish current tasks
    await Promise.allSettled(this.workers);
    this.workers = [];
  }

  private async startWorker(priority: 'high' | 'normal'): Promise<void> {
    logger.info(`Starting ${priority} priority message worker`);

    while (this.isRunning) {
      try {
        const message = await redisMessaging.dequeueMessage(priority);

        if (!message) {
          // No messages, wait briefly before polling again
          await this.sleep(100);
          continue;
        }

        await this.processMessage(message);
      } catch (error) {
        logger.error(`Error in ${priority} priority worker:`, error);
        await this.sleep(this.retryDelay);
      }
    }

    logger.info(`Stopped ${priority} priority message worker`);
  }

  private async processMessage(message: QueuedMessage): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug('Processing message', {
        messageId: message.id,
        conversationId: message.conversationId,
        priority: message.priority,
      });

      // Get conversation participants
      const conversationUsers = await redisMessaging.getConversationUsers(message.conversationId);

      if (conversationUsers.length === 0) {
        // Fallback to database if Redis cache is empty
        const conversations = await this.context.models.messaging.getUserConversations(
          message.senderId,
          { first: 1 }
        );
        const conversation = conversations.edges.find(
          (edge) => edge.node.id === message.conversationId
        );

        if (conversation) {
          for (const participant of conversation.node.participants) {
            await redisMessaging.addUserToConversation(message.conversationId, participant.userId);
          }
        }
      }

      // Determine recipients (exclude sender)
      const recipients = conversationUsers.filter((userId) => userId !== message.senderId);

      // Process delivery for each recipient
      const deliveryPromises = recipients.map(async (recipientId) => {
        await this.deliverMessageToUser(message, recipientId);
      });

      await Promise.allSettled(deliveryPromises);

      // Update delivery status in database
      await this.context.models.messaging.markMessageAsDelivered(message.id, message.senderId);

      const processingTime = Date.now() - startTime;
      logger.debug('Message processed successfully', {
        messageId: message.id,
        recipientCount: recipients.length,
        processingTime: `${processingTime}ms`,
      });
    } catch (error) {
      logger.error('Failed to process message:', error, { message });

      // Increment retry count and handle retries
      const retryCount = (message.retryCount || 0) + 1;

      if (retryCount < this.maxRetries) {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, retryCount - 1);
        await this.sleep(delay);

        message.retryCount = retryCount;
        await redisMessaging.queueMessage(message);

        logger.info('Message queued for retry', {
          messageId: message.id,
          retryCount,
          delay: `${delay}ms`,
        });
      } else {
        // Move to dead letter queue
        await redisMessaging.moveToDeadLetter(message);
        logger.error('Message moved to dead letter queue after max retries', {
          messageId: message.id,
          retryCount,
        });
      }
    }
  }

  private async deliverMessageToUser(message: QueuedMessage, recipientId: string): Promise<void> {
    try {
      // Check if user is online
      const userStatus = await redisMessaging.getUserOnlineStatus(recipientId);

      if (userStatus && socketGateway) {
        // User is online, deliver via WebSocket
        await this.deliverViaWebSocket(message, recipientId);

        // Mark as delivered in database
        await this.context.models.messaging.markMessageAsDelivered(message.id, recipientId);

        logger.debug('Message delivered via WebSocket', {
          messageId: message.id,
          recipientId,
        });
      } else {
        // User is offline, queue for push notification
        this.queuePushNotification(message, recipientId);

        logger.debug('User offline, queued push notification', {
          messageId: message.id,
          recipientId,
        });
      }
    } catch (error) {
      logger.error('Failed to deliver message to user:', error, {
        messageId: message.id,
        recipientId,
      });
      throw error;
    }
  }

  private async deliverViaWebSocket(message: QueuedMessage, recipientId: string): Promise<void> {
    // Fetch full message data from database
    const fullMessage = await this.context.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        parentMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!fullMessage) {
      logger.error('Message not found in database', { messageId: message.id });
      return;
    }

    const messageData = {
      id: fullMessage.id,
      content: fullMessage.content,
      messageType: fullMessage.messageType,
      sender: {
        id: fullMessage.sender.id,
        name: fullMessage.sender.name,
        avatarUrl: fullMessage.sender.avatarUrl,
      },
      parentMessage: fullMessage.parentMessage
        ? {
            id: fullMessage.parentMessage.id,
            content: fullMessage.parentMessage.content,
            sender: {
              id: fullMessage.parentMessage.sender.id,
              name: fullMessage.parentMessage.sender.name,
            },
          }
        : null,
      createdAt: fullMessage.createdAt,
      conversationId: message.conversationId,
    };

    // Send to user's sockets
    socketGateway.sendMessageToUser(recipientId, 'message_received', messageData);
  }

  private queuePushNotification(message: QueuedMessage, recipientId: string) {
    // This is a placeholder for push notification queuing
    // In a real implementation, you would:
    // 1. Get user's push notification tokens
    // 2. Format the notification payload
    // 3. Queue it in a notification service (APNs, FCM)

    const notificationPayload = {
      userId: recipientId,
      messageId: message.id,
      conversationId: message.conversationId,
      title: 'New Message',
      body:
        message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
      data: {
        type: 'new_message',
        conversationId: message.conversationId,
        messageId: message.id,
      },
    };

    logger.info('Push notification queued', notificationPayload);

    // TODO: Implement actual push notification service
    // await pushNotificationService.queue(notificationPayload);
  }

  private async startDeadLetterProcessor(): Promise<void> {
    logger.info('Starting dead letter queue processor');

    while (this.isRunning) {
      try {
        // Process dead letter queue every 30 seconds
        await this.sleep(30000);

        // In a real implementation, you might:
        // 1. Alert administrators about failed messages
        // 2. Attempt manual retry for certain types of failures
        // 3. Archive messages older than X days
        // 4. Generate reports on failure patterns

        logger.debug('Dead letter queue check completed');
      } catch (error) {
        logger.error('Error in dead letter processor:', error);
      }
    }

    logger.info('Stopped dead letter queue processor');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public methods for monitoring

  public async getQueueStats(): Promise<{
    highPriorityCount: number;
    normalPriorityCount: number;
    deadLetterCount: number;
  }> {
    const [highPriorityCount, normalPriorityCount, deadLetterCount] = await Promise.all([
      this.context.redis.llen('queue:messages:priority'),
      this.context.redis.llen('queue:messages'),
      this.context.redis.llen('queue:messages:dead_letter'),
    ]);

    return {
      highPriorityCount,
      normalPriorityCount,
      deadLetterCount,
    };
  }

  public isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export let messageQueueService: MessageQueueService;
