import { useState } from 'react';
import { useInvitations, useTeamMembers, useInvitationMutations, useTeamMutations } from '../hooks/useInvitations';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SiteMultiSelect from '../components/team/SiteMultiSelect';

const emptyRow = () => ({ email: '', role: 'viewer', siteIds: [] });

export default function TeamPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRows, setInviteRows] = useState([emptyRow()]);
  const [inviteErrors, setInviteErrors] = useState({});
  const [editMemberId, setEditMemberId] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'viewer', sharedSites: [] });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { members, isLoading: membersLoading } = useTeamMembers();
  const { invitations, isLoading: invLoading } = useInvitations();
  const { createInvitations, deleteInvitation, resendInvitation } = useInvitationMutations();
  const { updateMember, removeMember } = useTeamMutations();

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Invite form helpers
  const updateRow = (index, field, value) => {
    setInviteRows(inviteRows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setInviteRows([...inviteRows, emptyRow()]);
  const removeRow = (index) => {
    if (inviteRows.length === 1) return;
    setInviteRows(inviteRows.filter((_, i) => i !== index));
  };

  const validateInvite = () => {
    const errs = {};
    inviteRows.forEach((row, i) => {
      if (!row.email) errs[`${i}.email`] = 'Required';
      else if (!/\S+@\S+\.\S+/.test(row.email)) errs[`${i}.email`] = 'Invalid email';
    });
    setInviteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendInvites = async () => {
    if (!validateInvite()) return;
    try {
      await createInvitations.mutateAsync(inviteRows);
      setInviteRows([emptyRow()]);
      setInviteErrors({});
      setShowInviteForm(false);
    } catch {
      // handled by mutation
    }
  };

  // Edit member helpers
  const startEdit = (member) => {
    setEditMemberId(member._id);
    setEditForm({
      role: member.role,
      sharedSites: (member.sharedSites || []).map((s) => (typeof s === 'string' ? s : s._id)),
    });
  };
  const cancelEdit = () => setEditMemberId(null);
  const saveEdit = async () => {
    try {
      await updateMember.mutateAsync({ userId: editMemberId, data: editForm });
      setEditMemberId(null);
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage team members and invitations</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
        />
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </Button>
      </div>

      {/* Inline Invite Form */}
      {showInviteForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-brand-200 dark:border-brand-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Invite Users</h2>

          {inviteRows.map((row, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Input
                    label="Email"
                    id={`inv-email-${index}`}
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(index, 'email', e.target.value)}
                    error={inviteErrors[`${index}.email`]}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={row.role}
                    onChange={(e) => updateRow(index, 'role', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {inviteRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="mt-7 text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {row.role === 'viewer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Share Projects
                  </label>
                  <SiteMultiSelect
                    selected={row.siteIds}
                    onChange={(ids) => updateRow(index, 'siteIds', ids)}
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
            >
              + Add another user
            </button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteRows([emptyRow()]);
                  setInviteErrors({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSendInvites} isLoading={createInvitations.isPending}>
                Send Invitations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingInvitations.map((inv) => (
                <div key={inv._id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{inv.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {inv.sharedSites?.length || 0} project{inv.sharedSites?.length !== 1 ? 's' : ''} shared
                    </p>
                  </div>
                  <Badge variant={inv.role === 'admin' ? 'info' : 'neutral'}>{inv.role}</Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resendInvitation.mutate(inv._id)}
                      isLoading={resendInvitation.isPending}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRevoke(inv)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Team Members ({filteredMembers.length})
        </h2>
        {membersLoading || invLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No team members yet. Invite someone to get started.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMembers.map((member) => (
                <div key={member._id} className="px-4 py-3">
                  {editMemberId === member._id ? (
                    /* Inline edit row */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                        <div className="w-32">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} isLoading={updateMember.isPending}>
                            Save
                          </Button>
                          <Button variant="secondary" size="sm" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {editForm.role === 'viewer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Shared Projects
                          </label>
                          <SiteMultiSelect
                            selected={editForm.sharedSites}
                            onChange={(ids) => setEditForm({ ...editForm, sharedSites: ids })}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Normal display row */
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'info' : 'neutral'}>{member.role}</Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {member.sharedSites?.length || 0} project{member.sharedSites?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(member)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(member)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Only confirm dialogs for destructive actions */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeMember.mutate(confirmDelete._id);
          setConfirmDelete(null);
        }}
        title="Remove team member"
        message={`Are you sure you want to remove ${confirmDelete?.name}? They will lose all access.`}
        confirmText="Remove"
        isLoading={removeMember.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => {
          deleteInvitation.mutate(confirmRevoke._id);
          setConfirmRevoke(null);
        }}
        title="Revoke invitation"
        message={`Revoke the invitation to ${confirmRevoke?.email}?`}
        confirmText="Revoke"
        isLoading={deleteInvitation.isPending}
      />
    </div>
  );
}
