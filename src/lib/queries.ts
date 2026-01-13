import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Generate the typed client
export const client = generateClient<Schema>();

// Types for our data
export interface Conversation {
  id: string;
  orgId: string;
  sessionId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastUserMessagePreview?: string | null;
  lastAssistantMessagePreview?: string | null;
  status: 'ok' | 'error';
  escalationCount: number;
}

export interface Message {
  id: string;
  orgId: string;
  conversationId: string;
  sessionId: string;
  createdAt: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  latencyMs?: number | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  toolUsed: boolean;
  escalated: boolean;
}

export interface ToolCall {
  id: string;
  orgId: string;
  messageId: string;
  toolName: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMs?: number | null;
  status: 'ok' | 'error';
  metadata?: Record<string, unknown> | null;
}

export interface UserProfile {
  userId: string;
  orgId: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt?: string | null;
}

export interface OrgStats {
  orgId: string;
  period: string;
  totalConversations: number;
  totalMessages: number;
  totalUserMessages: number;
  totalAssistantMessages: number;
  totalEscalations: number;
  totalErrors: number;
  avgLatencyMs?: number | null;
}

// Query helpers
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const response = await client.models.UserProfile.get({ userId });
    return response.data as UserProfile | null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getConversationsByOrg(
  orgId: string,
  options?: {
    limit?: number;
    nextToken?: string | null;
    sortDirection?: 'ASC' | 'DESC';
  }
): Promise<{ conversations: Conversation[]; nextToken: string | null }> {
  try {
    const response = await client.models.Conversation.listConversationsByOrg(
      { orgId },
      {
        limit: options?.limit || 25,
        nextToken: options?.nextToken || undefined,
        sortDirection: options?.sortDirection || 'DESC',
      }
    );
    return {
      conversations: (response.data || []) as Conversation[],
      nextToken: response.nextToken || null,
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { conversations: [], nextToken: null };
  }
}

export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const response = await client.models.Conversation.get({ id });
    return response.data as Conversation | null;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }
}

export async function getMessagesByConversation(
  conversationId: string,
  options?: {
    limit?: number;
    nextToken?: string | null;
  }
): Promise<{ messages: Message[]; nextToken: string | null }> {
  try {
    const response = await client.models.Message.listMessagesByConversation(
      { conversationId },
      {
        limit: options?.limit || 100,
        nextToken: options?.nextToken || undefined,
        sortDirection: 'ASC',
      }
    );
    return {
      messages: (response.data || []) as Message[],
      nextToken: response.nextToken || null,
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], nextToken: null };
  }
}

export async function getToolCallsByMessage(messageId: string): Promise<ToolCall[]> {
  try {
    const response = await client.models.ToolCall.listToolCallsByMessage({ messageId });
    return (response.data || []) as ToolCall[];
  } catch (error) {
    console.error('Error fetching tool calls:', error);
    return [];
  }
}

export async function getOrgStats(
  orgId: string,
  periods: string[]
): Promise<OrgStats[]> {
  try {
    const stats: OrgStats[] = [];
    for (const period of periods) {
      const response = await client.models.OrgStats.get({ orgId, period });
      if (response.data) {
        stats.push(response.data as OrgStats);
      }
    }
    return stats;
  } catch (error) {
    console.error('Error fetching org stats:', error);
    return [];
  }
}

export async function getUsersByOrg(orgId: string): Promise<UserProfile[]> {
  try {
    const response = await client.models.UserProfile.listUserProfileByOrgId({ orgId });
    return (response.data || []) as UserProfile[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<UserProfile | null> {
  try {
    const response = await client.models.UserProfile.create({
      ...profile,
      createdAt: new Date().toISOString(),
    });
    return response.data as UserProfile | null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

// Utility functions
export function getDateRangePeriods(range: '7d' | '30d' | 'all'): string[] {
  const periods: string[] = [];
  const now = new Date();
  
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    periods.push(date.toISOString().substring(0, 10));
  }
  
  return periods;
}

export function aggregateStats(stats: OrgStats[]): {
  totalConversations: number;
  totalMessages: number;
  totalEscalations: number;
  totalErrors: number;
  avgLatencyMs: number;
  escalationRate: number;
  errorRate: number;
} {
  const totals = stats.reduce(
    (acc, stat) => ({
      totalConversations: acc.totalConversations + (stat.totalConversations || 0),
      totalMessages: acc.totalMessages + (stat.totalMessages || 0),
      totalEscalations: acc.totalEscalations + (stat.totalEscalations || 0),
      totalErrors: acc.totalErrors + (stat.totalErrors || 0),
      latencySum: acc.latencySum + (stat.avgLatencyMs || 0),
      latencyCount: acc.latencyCount + (stat.avgLatencyMs ? 1 : 0),
    }),
    { totalConversations: 0, totalMessages: 0, totalEscalations: 0, totalErrors: 0, latencySum: 0, latencyCount: 0 }
  );

  return {
    totalConversations: totals.totalConversations,
    totalMessages: totals.totalMessages,
    totalEscalations: totals.totalEscalations,
    totalErrors: totals.totalErrors,
    avgLatencyMs: totals.latencyCount > 0 ? Math.round(totals.latencySum / totals.latencyCount) : 0,
    escalationRate: totals.totalConversations > 0 ? (totals.totalEscalations / totals.totalConversations) * 100 : 0,
    errorRate: totals.totalMessages > 0 ? (totals.totalErrors / totals.totalMessages) * 100 : 0,
  };
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

