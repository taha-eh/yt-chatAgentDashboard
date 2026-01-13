'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DashboardLayout from '@/components/DashboardLayout';
import ConversationTable from '@/components/ConversationTable';
import {
  getUserProfile,
  getConversationsByOrg,
  type Conversation,
  type UserProfile,
} from '@/lib/queries';

type StatusFilter = 'all' | 'ok' | 'error';
type EscalatedFilter = 'all' | 'yes' | 'no';

export default function ConversationsPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [escalatedFilter, setEscalatedFilter] = useState<EscalatedFilter>('all');

  const fetchConversations = useCallback(async (
    orgId: string,
    token?: string | null,
    append = false
  ) => {
    setLoading(true);
    try {
      const { conversations: data, nextToken: newToken } = await getConversationsByOrg(
        orgId,
        { limit: 25, nextToken: token || undefined }
      );
      
      if (append) {
        setConversations(prev => [...prev, ...data]);
      } else {
        setConversations(data);
      }
      
      setNextToken(newToken);
      setHasMore(!!newToken);
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
          fetchConversations(userProfile.orgId);
        } else {
          setLoading(false);
        }
      }
    }
    loadProfile();
  }, [user?.userId, fetchConversations]);

  const loadMore = () => {
    if (profile?.orgId && nextToken) {
      fetchConversations(profile.orgId, nextToken, true);
    }
  };

  // Filter conversations client-side (for demo purposes)
  // In production, you'd want to do this server-side with proper indexes
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery && !conv.sessionId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && conv.status !== statusFilter) {
      return false;
    }
    
    // Escalated filter
    if (escalatedFilter === 'yes' && conv.escalationCount === 0) {
      return false;
    }
    if (escalatedFilter === 'no' && conv.escalationCount > 0) {
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setEscalatedFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || escalatedFilter !== 'all';

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Conversations</h1>
        <p className="text-surface-500 mt-1">View and search all agent conversations</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 border-b border-surface-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by session ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-surface-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="input w-auto"
              >
                <option value="all">All</option>
                <option value="ok">OK</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Escalated filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-surface-700">Escalated:</label>
              <select
                value={escalatedFilter}
                onChange={(e) => setEscalatedFilter(e.target.value as EscalatedFilter)}
                className="input w-auto"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div className="px-4 py-2 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
          <p className="text-sm text-surface-600">
            {loading ? (
              <span className="inline-block w-32 h-4 skeleton rounded"></span>
            ) : (
              <>
                Showing <span className="font-medium">{filteredConversations.length}</span>
                {filteredConversations.length !== conversations.length && (
                  <> of <span className="font-medium">{conversations.length}</span></>
                )} conversations
              </>
            )}
          </p>
          <button
            onClick={() => profile?.orgId && fetchConversations(profile.orgId)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Table */}
        <ConversationTable
          conversations={filteredConversations}
          loading={loading && conversations.length === 0}
        />

        {/* Load more */}
        {hasMore && !hasActiveFilters && (
          <div className="p-4 border-t border-surface-200 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Loading...
                </>
              ) : (
                'Load more conversations'
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

