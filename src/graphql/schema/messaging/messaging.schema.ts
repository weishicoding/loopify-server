import { gql } from 'graphql-tag';

export const messagingTypeDefs = gql`
  enum ConversationType {
    DIRECT_MESSAGE
    GROUP_CHAT
    ITEM_INQUIRY
  }

  enum MessageType {
    TEXT
    IMAGE
    SYSTEM_NOTIFICATION
    ITEM_SHARE
  }

  enum MessageDeliveryStatus {
    SENT
    DELIVERED
    READ
    FAILED
  }

  type User {
    id: ID!
    name: String
    avatarUrl: String
  }

  type Conversation {
    id: ID!
    type: ConversationType!
    title: String
    item: ItemDetail
    participants: [ConversationParticipant!]!
    lastMessage: Message
    lastMessageAt: String
    unreadCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type ConversationParticipant {
    id: ID!
    user: User!
    joinedAt: String!
    lastReadAt: String
    isActive: Boolean!
  }

  type Message {
    id: ID!
    conversation: Conversation!
    sender: User!
    content: String!
    messageType: MessageType!
    parentMessage: Message
    replies: [Message!]!
    deliveryStatus: MessageDeliveryStatus!
    isDelivered: Boolean!
    isRead: Boolean!
    createdAt: String!
    editedAt: String
  }

  type ConversationEdge implements Edge {
    cursor: ID!
    node: Conversation!
  }

  type ConversationConnection implements Connection {
    edges: [ConversationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MessageEdge implements Edge {
    cursor: ID!
    node: Message!
  }

  type MessageConnection implements Connection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input CreateConversationInput {
    """
    The type of conversation to create.
    """
    type: ConversationType!
    
    """
    List of user IDs to add as participants (not including the creator).
    """
    participantIds: [ID!]!
    
    """
    Optional title for group chats.
    """
    title: String
    
    """
    Optional item ID for item-related conversations.
    """
    itemId: ID
  }

  input SendMessageInput {
    """
    The ID of the conversation to send the message to.
    """
    conversationId: ID!
    
    """
    The message content.
    """
    content: String!
    
    """
    The type of message (defaults to TEXT).
    """
    messageType: MessageType = TEXT
    
    """
    Optional parent message ID for replies.
    """
    parentMessageId: ID
  }

  input StartConversationInput {
    """
    The ID of the user to start a conversation with.
    """
    participantId: ID!
    
    """
    Optional item ID if this is about a specific item.
    """
    itemId: ID
    
    """
    Optional initial message content.
    """
    initialMessage: String
  }

  type OnlineStatus {
    userId: ID!
    isOnline: Boolean!
    lastSeen: String
  }

  type TypingIndicator {
    conversationId: ID!
    userId: ID!
    isTyping: Boolean!
  }

  type UnreadCount {
    count: Int!
  }

  type MessageDelivery {
    messageId: ID!
    recipientId: ID!
    deliveredAt: String
    readAt: String
  }

  extend type Query {
    """
    Get paginated conversations for the current user.
    """
    conversations(
      first: Int!
      after: String
    ): ConversationConnection! @auth

    """
    Get a specific conversation by ID.
    """
    conversation(id: ID!): Conversation @auth

    """
    Get paginated messages for a conversation.
    """
    conversationMessages(
      conversationId: ID!
      first: Int!
      after: String
    ): MessageConnection! @auth

    """
    Get the current user's total unread message count.
    """
    unreadMessageCount: Int! @auth

    """
    Get online status for specific users.
    """
    usersOnlineStatus(userIds: [ID!]!): [OnlineStatus!]! @auth

    """
    Find or create a direct conversation with another user.
    """
    findOrCreateDirectConversation(
      participantId: ID!
      itemId: ID
    ): Conversation! @auth
  }

  extend type Mutation {
    """
    Create a new conversation.
    """
    createConversation(input: CreateConversationInput!): Conversation! @auth

    """
    Start a conversation with another user (creates conversation if needed and sends initial message).
    """
    startConversation(input: StartConversationInput!): Conversation! @auth

    """
    Send a message to a conversation.
    """
    sendMessage(input: SendMessageInput!): Message! @auth

    """
    Mark a conversation as read (marks all unread messages as read).
    """
    markConversationAsRead(conversationId: ID!): GenericResponse! @auth

    """
    Mark a specific message as read.
    """
    markMessageAsRead(messageId: ID!): GenericResponse! @auth

    """
    Edit a message (only allowed by the sender).
    """
    editMessage(messageId: ID!, content: String!): Message @auth

    """
    Delete a message (only allowed by the sender).
    """
    deleteMessage(messageId: ID!): GenericResponse! @auth

    """
    Leave a conversation (marks participant as inactive).
    """
    leaveConversation(conversationId: ID!): GenericResponse! @auth
  }

  extend type Subscription {
    """
    Subscribe to new messages in a specific conversation.
    """
    messageAdded(conversationId: ID!): Message! @auth

    """
    Subscribe to message delivery/read status updates.
    """
    messageStatusUpdated(conversationId: ID!): MessageDelivery! @auth

    """
    Subscribe to typing indicators in a conversation.
    """
    typingIndicators(conversationId: ID!): TypingIndicator! @auth

    """
    Subscribe to user online status changes.
    """
    userOnlineStatusChanged(userIds: [ID!]!): OnlineStatus! @auth

    """
    Subscribe to unread message count updates for the current user.
    """
    unreadCountUpdated: UnreadCount! @auth

    """
    Subscribe to new conversations (when user is added to a conversation).
    """
    conversationAdded: Conversation! @auth

    """
    Subscribe to conversation updates (title changes, participants, etc.).
    """
    conversationUpdated: Conversation! @auth
  }
`;