# 📱 High-Availability Messaging System

A comprehensive real-time communication system built for the Loopify marketplace, featuring WebSocket connections, message queuing, push notifications, and high availability design.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Communication System                         │
├─────────────────────────────────────────────────────────────────┤
│  WebSocket Gateway → Message Service → Persistence Layer        │
│       ↓                    ↓                    ↓              │
│   Real-time Chat    Message Processing    PostgreSQL + Redis    │
│   Push Notifications  Message Queues     Message Storage        │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### ✅ **Real-time Communication**
- WebSocket-based instant messaging
- Online presence tracking
- Typing indicators
- Read receipts
- Multi-device support

### ✅ **Message Reliability**
- At-least-once delivery guarantee
- Message deduplication
- Automatic retry with exponential backoff
- Dead letter queue for failed messages
- Transaction-based persistence

### ✅ **High Availability**
- Horizontal scaling support
- Redis clustering
- Database failover
- Graceful degradation
- Health monitoring

### ✅ **Push Notifications**
- iOS (APNs) support
- Android (FCM) support
- Web Push notifications
- Smart delivery logic
- Batch processing

### ✅ **GraphQL API**
- Complete messaging API
- Real-time subscriptions
- Pagination support
- Type-safe operations

## 📊 Database Schema

### Core Tables
```sql
-- Conversations
conversations (id, type, title, item_id, last_message_at, created_at, updated_at)

-- Participants
conversation_participants (id, conversation_id, user_id, joined_at, last_read_at, is_active)

-- Messages
messages (id, conversation_id, sender_id, content, message_type, parent_message_id, 
         delivery_status, created_at, edited_at)

-- Delivery Tracking
message_deliveries (id, message_id, recipient_id, delivered_at, read_at, device_type)
```

## 🔧 Redis Data Structures

```javascript
// User presence
user:online:{userId} -> {socketId, lastSeen, deviceInfo}
socket:user:{socketId} -> userId

// Message queues
queue:messages -> List of QueuedMessage
queue:messages:priority -> High priority messages
queue:messages:dead_letter -> Failed messages

// Real-time features
user:unread_count:{userId} -> Integer
conversation:typing:{conversationId} -> Set<userId>
message:dedup:{hash} -> messageId (TTL: 5min)

// Rate limiting
rate_limit:user:{userId}:messages -> count (TTL: 1min)
```

## 🔌 WebSocket Events

### Client → Server
```javascript
// Authentication
socket.emit('connect', { token: 'jwt_token' });

// Room management
socket.emit('join_conversation', { conversationId: 'conv_123' });
socket.emit('leave_conversation', { conversationId: 'conv_123' });

// Messaging
socket.emit('send_message', { 
  conversationId: 'conv_123',
  content: 'Hello!',
  messageType: 'TEXT',
  parentMessageId: 'msg_456' // Optional
});

// Presence
socket.emit('typing', { conversationId: 'conv_123', isTyping: true });
socket.emit('mark_as_read', { conversationId: 'conv_123' });
socket.emit('heartbeat');
```

### Server → Client
```javascript
// Connection events
socket.on('joined_conversation', { conversationId });
socket.on('left_conversation', { conversationId });

// Message events
socket.on('message_received', { message, conversationId });
socket.on('messages_read', { conversationId, userId, readAt });

// Presence events
socket.on('typing_update', { conversationId, typingUsers: ['user1', 'user2'] });
socket.on('unread_count', { count: 5 });

// System events
socket.on('heartbeat_ack');
socket.on('error', { message: 'Error description' });
```

## 📖 GraphQL API

### Queries
```graphql
# Get user's conversations
conversations(first: Int!, after: String): ConversationConnection!

# Get conversation messages
conversationMessages(conversationId: ID!, first: Int!, after: String): MessageConnection!

# Get unread count
unreadMessageCount: Int!

# Check online status
usersOnlineStatus(userIds: [ID!]!): [OnlineStatus!]!
```

### Mutations
```graphql
# Start new conversation
startConversation(input: StartConversationInput!): Conversation!

# Send message
sendMessage(input: SendMessageInput!): Message!

# Mark as read
markConversationAsRead(conversationId: ID!): GenericResponse!

# Edit/delete messages
editMessage(messageId: ID!, content: String!): Message
deleteMessage(messageId: ID!): GenericResponse!
```

### Subscriptions
```graphql
# Real-time message updates
messageAdded(conversationId: ID!): Message!

# Typing indicators
typingIndicators(conversationId: ID!): TypingIndicator!

# Presence updates
userOnlineStatusChanged(userIds: [ID!]!): OnlineStatus!

# Unread count updates
unreadCountUpdated: UnreadCount!
```

## 🚦 Message Flow

### Sending a Message
```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Gateway
    participant Q as Message Queue
    participant DB as Database
    participant R as Redis
    participant P as Push Service

    C->>WS: send_message
    WS->>DB: persist message
    WS->>Q: queue for delivery
    Q->>R: check recipient status
    alt User Online
        Q->>WS: deliver via websocket
        WS->>C: message_received
    else User Offline
        Q->>P: queue push notification
    end
    Q->>DB: update delivery status
```

### Delivery Guarantees
1. **Persist First**: Messages are saved to database before queuing
2. **At-Least-Once**: Queue workers retry failed deliveries
3. **Exactly-Once Processing**: Deduplication prevents duplicate processing
4. **Ordered Delivery**: Messages are delivered in sequence per conversation

## 🔧 Configuration

### Environment Variables
```bash
# WebSocket Configuration
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Push Notifications
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_BUNDLE_ID=com.yourapp.bundle
FCM_SERVER_KEY=your_fcm_server_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```javascript
GET /health

Response:
{
  "status": "ok",
  "messaging": {
    "socketGateway": {
      "status": "healthy",
      "onlineUsers": 42
    },
    "messageQueue": {
      "status": "healthy",
      "isRunning": true,
      "queueStats": {
        "normalPriorityCount": 0,
        "highPriorityCount": 0,
        "deadLetterCount": 0
      }
    },
    "pushNotification": {
      "status": "healthy"
    }
  }
}
```

### Key Metrics
- Message delivery latency (P95, P99)
- WebSocket connection count and stability  
- Queue depth and processing rate
- Database query performance
- Push notification delivery rates

## 🛠️ Development Setup

1. **Install Dependencies**
   ```bash
   npm install socket.io @types/socket.io graphql-subscriptions
   ```

2. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name add_messaging_system
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Test WebSocket Connection**
   ```javascript
   const socket = io('http://localhost:4000', {
     auth: { token: 'your_jwt_token' }
   });
   
   socket.on('connect', () => {
     console.log('Connected!');
     socket.emit('join_conversation', { conversationId: 'test' });
   });
   ```

## 🏭 Production Deployment

### Scaling Considerations
- **WebSocket Load Balancing**: Use sticky sessions or Redis adapter
- **Message Queue Workers**: Deploy multiple worker processes
- **Database**: Use read replicas for better performance
- **Redis**: Deploy Redis cluster for high availability

### Security Best Practices
- JWT token validation on WebSocket connection
- Rate limiting per user (60 messages/minute default)
- Content sanitization and validation
- Proper CORS configuration

## 🐛 Troubleshooting

### Common Issues

**Messages not delivering**
- Check queue worker status: `GET /health`
- Verify Redis connection
- Check database connectivity

**WebSocket disconnections**
- Implement reconnection logic on client
- Check network connectivity
- Verify JWT token expiration

**High latency**
- Monitor database query performance
- Check Redis memory usage
- Scale queue workers

## 🔮 Future Enhancements

- [ ] End-to-end encryption
- [ ] Message reactions and emojis
- [ ] File sharing and multimedia messages
- [ ] Voice and video calling integration
- [ ] Message translation
- [ ] Advanced moderation tools
- [ ] Analytics dashboard
- [ ] Message search functionality

## 📄 API Documentation

Complete API documentation is available via GraphQL introspection at `/graphql` when the server is running in development mode.

---

**Built with ❤️ for high-scale, real-time communication needs.**