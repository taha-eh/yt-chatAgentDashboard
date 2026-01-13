'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DashboardLayout from '@/components/DashboardLayout';
import KPICard from '@/components/KPICard';
import {
  getUserProfile,
  getOrgStats,
  getConversationsByOrg,
  getDateRangePeriods,
  aggregateStats,
  formatRelativeTime,
  type Conversation,
  type UserProfile,
} from '@/lib/queries';

type DateRange = '7d' | '30d' | 'all';

export default function DashboardPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalEscalations: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    escalationRate: 0,
    errorRate: 0,
  });
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);

  const fetchData = useCallback(async (orgId: string, range: DateRange) => {
    setLoading(true);
    try {
      // Fetch stats for the date range
      const periods = getDateRangePeriods(range);
      const orgStats = await getOrgStats(orgId, periods);
      const aggregated = aggregateStats(orgStats);
      setStats(aggregated);

      // Fetch recent conversations
      const { conversations } = await getConversationsByOrg(orgId, { limit: 5 });
      setRecentConversations(conversations);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (user?.userId) {
        const userProfile = await getUserProfile(user.userId);
        setProfile(userProfile);
        if (userProfile?.orgId) {
          fetchData(userProfile.orgId, dateRange);
        } else {
          setLoading(false);
        }
      }
    }
    loadProfile();
  }, [user?.userId, dateRange, fetchData]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    if (profile?.orgId) {
      fetchData(profile.orgId, range);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 mt-1">Overview of your agent conversations</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-surface-200 p-1">
          {(['7d', '30d', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard
          title="Total Conversations"
          value={stats.totalConversations.toLocaleString()}
          subtitle={`Last ${dateRange === 'all' ? '90' : dateRange.replace('d', '')} days`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          subtitle="User + Assistant messages"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
          color="purple"
          loading={loading}
        />
        <KPICard
          title="Avg Response Time"
          value={stats.avgLatencyMs > 0 ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : '-'}
          subtitle="Agent latency"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
          loading={loading}
        />
        <KPICard
          title="Escalation Rate"
          value={`${stats.escalationRate.toFixed(1)}%`}
          subtitle={`${stats.totalEscalations} escalations`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="orange"
          loading={loading}
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Error Rate</h3>
            <span className={`badge ${stats.errorRate < 5 ? 'badge-success' : 'badge-error'}`}>
              {stats.errorRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.errorRate < 5 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(stats.errorRate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-surface-500 mt-2">
            {stats.totalErrors} errors out of {stats.totalMessages} messages
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Message Distribution</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-surface-600">User Messages</span>
                <span className="font-medium">{Math.floor(stats.totalMessages / 2).toLocaleString()}</span>
              </div>
              <div className="h-2 bg-brand-100 rounded-full">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-surface-600">Assistant Messages</span>
                <span className="font-medium">{Math.floor(stats.totalMessages / 2).toLocaleString()}</span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="card">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Recent Conversations</h3>
          <a href="/conversations" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </a>
        </div>
        <div className="divide-y divide-surface-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 skeleton rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 skeleton rounded"></div>
                    <div className="w-48 h-3 skeleton rounded"></div>
                  </div>
                  <div className="w-16 h-5 skeleton rounded"></div>
                </div>
              </div>
            ))
          ) : recentConversations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-surface-600 font-medium">No conversations yet</p>
              <p className="text-surface-500 text-sm mt-1">
                Conversations will appear here once your agent starts receiving messages
              </p>
            </div>
          ) : (
            recentConversations.map((conv) => (
              <a
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="block px-5 py-4 hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    conv.status === 'ok' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <svg
                      className={`w-5 h-5 ${conv.status === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {conv.status === 'ok' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-surface-900 truncate">
                        Session {conv.sessionId.substring(0, 8)}...
                      </p>
                      {conv.escalationCount > 0 && (
                        <span className="badge badge-warning">
                          {conv.escalationCount} escalation{conv.escalationCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-500 truncate mt-0.5">
                      {conv.lastUserMessagePreview || 'No preview available'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-surface-900">{conv.messageCount} msgs</p>
                    <p className="text-xs text-surface-500">{formatRelativeTime(conv.lastMessageAt)}</p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

