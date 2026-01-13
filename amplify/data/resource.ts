import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // User profile for multi-tenant org mapping
  UserProfile: a.model({
    userId: a.string().required(),
    orgId: a.string().required(),
    email: a.string().required(),
    role: a.enum(['admin', 'viewer']),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .identifier(['userId'])
    .secondaryIndexes((index) => [
      index('orgId'),
      index('email'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner().to(['read', 'update']),
      allow.groups(['admins']).to(['create', 'read', 'update', 'delete']),
    ]),

  // Conversation aggregate record
  Conversation: a.model({
    orgId: a.string().required(),
    sessionId: a.string().required(),
    createdAt: a.datetime().required(),
    lastMessageAt: a.datetime().required(),
    messageCount: a.integer().default(0),
    lastUserMessagePreview: a.string(),
    lastAssistantMessagePreview: a.string(),
    status: a.enum(['ok', 'error']),
    escalationCount: a.integer().default(0),
  })
    .secondaryIndexes((index) => [
      index('orgId').sortKeys(['lastMessageAt']).queryField('listConversationsByOrg'),
      index('sessionId').queryField('listConversationsBySession'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['create', 'update']), // For Lambda ingestion
    ]),

  // Individual message record
  Message: a.model({
    orgId: a.string().required(),
    conversationId: a.string().required(),
    sessionId: a.string().required(),
    createdAt: a.datetime().required(),
    role: a.enum(['user', 'assistant', 'system']),
    text: a.string().required(),
    latencyMs: a.integer(),
    tokensIn: a.integer(),
    tokensOut: a.integer(),
    toolUsed: a.boolean().default(false),
    escalated: a.boolean().default(false),
  })
    .secondaryIndexes((index) => [
      index('conversationId').sortKeys(['createdAt']).queryField('listMessagesByConversation'),
      index('orgId').sortKeys(['createdAt']).queryField('listMessagesByOrg'),
      index('sessionId').queryField('listMessagesBySession'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['create']), // For Lambda ingestion
    ]),

  // Tool call tracking
  ToolCall: a.model({
    orgId: a.string().required(),
    messageId: a.string().required(),
    toolName: a.string().required(),
    startedAt: a.datetime(),
    endedAt: a.datetime(),
    durationMs: a.integer(),
    status: a.enum(['ok', 'error']),
    metadata: a.json(),
  })
    .secondaryIndexes((index) => [
      index('messageId').queryField('listToolCallsByMessage'),
      index('orgId').queryField('listToolCallsByOrg'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['create']), // For Lambda ingestion
    ]),

  // Analytics aggregates (optional, for faster dashboard queries)
  OrgStats: a.model({
    orgId: a.string().required(),
    period: a.string().required(), // e.g., "2024-01", "2024-01-15", "2024-W03"
    totalConversations: a.integer().default(0),
    totalMessages: a.integer().default(0),
    totalUserMessages: a.integer().default(0),
    totalAssistantMessages: a.integer().default(0),
    totalEscalations: a.integer().default(0),
    totalErrors: a.integer().default(0),
    avgLatencyMs: a.integer(),
    updatedAt: a.datetime(),
  })
    .identifier(['orgId', 'period'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['create', 'update']), // For Lambda ingestion
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});

