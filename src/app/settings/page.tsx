'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  getUserProfile,
  getUsersByOrg,
  createUserProfile,
  type UserProfile,
} from '@/lib/queries';

export default function SettingsPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orgUsers, setOrgUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const userProfile = await getUserProfile(user.userId);
      setProfile(userProfile);
      
      if (userProfile?.orgId) {
        const users = await getUsersByOrg(userProfile.orgId);
        setOrgUsers(users);
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId || !inviteEmail) return;
    
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      // In a real app, you would:
      // 1. Call Cognito AdminCreateUser to create the user
      // 2. Then create the UserProfile
      // For now, we'll just create the UserProfile (assuming user exists in Cognito)
      
      // Generate a temporary userId (in production, this would come from Cognito)
      const tempUserId = `pending-${Date.now()}`;
      
      const newProfile = await createUserProfile({
        userId: tempUserId,
        orgId: profile.orgId,
        email: inviteEmail,
        role: inviteRole,
      });

      if (newProfile) {
        setInviteSuccess(true);
        setInviteEmail('');
        setInviteRole('viewer');
        setShowInviteForm(false);
        fetchData(); // Refresh the user list
      } else {
        setInviteError('Failed to create user profile');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError('An error occurred while inviting the user');
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your organization and team members</p>
      </div>

      {/* Organization Info */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900">Organization</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-4 skeleton rounded"></div>
                <div className="w-48 h-4 skeleton rounded"></div>
              </div>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-surface-500 mb-1">
                  Organization ID
                </label>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-surface-100 rounded-lg text-sm font-mono text-surface-700">
                    {profile.orgId}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(profile.orgId)}
                    className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-surface-500 mt-1">
                  Use this ID when configuring your n8n workflow
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-500 mb-1">
                  Your Role
                </label>
                <span className={`badge ${profile.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                  {profile.role === 'admin' ? 'Admin' : 'Viewer'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-surface-500">
                No organization profile found. Please contact support.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Team Members</h2>
          {profile?.role === 'admin' && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Invite User
            </button>
          )}
        </div>

        {/* Success message */}
        {inviteSuccess && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium">User invited successfully!</p>
            </div>
          </div>
        )}

        {/* Invite form */}
        {showInviteForm && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-surface-50 border border-surface-200">
            <form onSubmit={handleInvite}>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
                    className="input"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="btn-primary"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setInviteError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
              {inviteError && (
                <p className="text-sm text-red-600 mt-2">{inviteError}</p>
              )}
            </form>
          </div>
        )}

        {/* Users list */}
        <div className="divide-y divide-surface-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 skeleton rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 skeleton rounded"></div>
                    <div className="w-24 h-3 skeleton rounded"></div>
                  </div>
                  <div className="w-16 h-5 skeleton rounded"></div>
                </div>
              </div>
            ))
          ) : orgUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-surface-600 font-medium">No team members yet</p>
              <p className="text-surface-500 text-sm mt-1">
                Invite colleagues to collaborate on your dashboard
              </p>
            </div>
          ) : (
            orgUsers.map((member) => (
              <div key={member.userId} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-700">
                      {member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 truncate">
                      {member.email}
                    </p>
                    <p className="text-sm text-surface-500">
                      {member.userId === user?.userId && '(You) · '}
                      Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  <span className={`badge ${member.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                    {member.role === 'admin' ? 'Admin' : 'Viewer'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Integration Info */}
      <div className="card mt-6">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900">Integration</h2>
        </div>
        <div className="p-6">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">n8n Integration Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  To see conversation data in this dashboard, you need to configure your n8n workflow
                  to send data to the ingestion endpoint. See the README for setup instructions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-500 mb-1">
                Ingestion Endpoint
              </label>
              <code className="block px-3 py-2 bg-surface-100 rounded-lg text-sm font-mono text-surface-700 break-all">
                https://[your-amplify-url]/ingest
              </code>
              <p className="text-xs text-surface-500 mt-1">
                This URL will be available after deploying your Amplify backend
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-500 mb-1">
                Required Headers
              </label>
              <pre className="px-3 py-2 bg-surface-100 rounded-lg text-sm font-mono text-surface-700 overflow-x-auto">
{`Content-Type: application/json
X-Signature: <HMAC-SHA256 signature>`}</pre>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

