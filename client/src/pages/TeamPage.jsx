import { useState, useRef, useEffect } from 'react';
import { useInvitations, useTeamMembers, useInvitationMutations, useTeamMutations } from '../hooks/useInvitations';
import { useAuthStore } from '../store/authStore';
import { useIsOwner } from '../hooks/useRole';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Card from '../components/common/Card';
import SiteMultiSelect from '../components/team/SiteMultiSelect';

const emptyRow = () => ({ email: '', role: 'viewer', siteIds: [] });

// Simple avatar helper for a modern look
function UserAvatar({ name, email, className = '' }) {
  const initials = (name || email || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

// Custom modern Role Selector Dropdown
function RoleSelector({ value, onChange, isOwner, label = "Role" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const roles = [
    { id: 'viewer', title: 'Viewer', description: 'Can view selected projects only' },
    ...(isOwner ? [{ id: 'admin', title: 'Admin', description: 'Full access to all projects' }] : []),
  ];

  const activeRole = roles.find(r => r.id === value) || roles[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-100">{activeRole.title}</span>
          </div>
          <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  onChange(role.id);
                  setIsOpen(false);
                }}
                className={`flex flex-col items-start w-full px-3 py-2.5 rounded-xl text-left transition-all ${value === role.id ? 'bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold ${value === role.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {role.title}
                  </span>
                  {value === role.id && (
                    <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium mt-0.5 leading-tight">{role.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRows, setInviteRows] = useState([emptyRow()]);
  const [inviteErrors, setInviteErrors] = useState({});
  const [editMemberId, setEditMemberId] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'viewer', sharedSites: [] });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const isOwner = useIsOwner();
  const { members, isLoading: membersLoading } = useTeamMembers();
  const { invitations, isLoading: invLoading } = useInvitations();
  const { createInvitations, deleteInvitation, resendInvitation } = useInvitationMutations();
  const { updateMember, removeMember } = useTeamMutations();

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  const membersWithSelf = currentUser
    ? [
        { ...currentUser, _self: true },
        ...members.filter((m) => m._id !== currentUser._id),
      ]
    : members;

  const filteredMembers = membersWithSelf.filter(
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
    <div className="space-y-8 max-w-8xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Team Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage your organization's members and their access levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-full md:w-64 shadow-sm"
            />
            <svg className="absolute left-3 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Button onClick={() => setShowInviteForm(!showInviteForm)} className="whitespace-nowrap rounded-xl shadow-lg shadow-brand-500/10">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </Button>
        </div>
      </div>

      {/* Inline Invite Form */}
      {showInviteForm && (
        <Card className="border-brand-100 dark:border-brand-900/50 bg-brand-50/30 dark:bg-brand-900/10 animate-in fade-in slide-in-from-top-4 duration-300 overflow-visible">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg text-brand-600 dark:text-brand-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invite New Members</h2>
          </div>

          <div className="space-y-4">
            {inviteRows.map((row, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all hover:border-brand-200 dark:hover:border-brand-800 overflow-visible">
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  <div className="flex-1 w-full">
                    <Input
                      label="Email Address"
                      id={`inv-email-${index}`}
                      type="email"
                      value={row.email}
                      onChange={(e) => updateRow(index, 'email', e.target.value)}
                      error={inviteErrors[`${index}.email`]}
                      placeholder="teammate@example.com"
                      className="!bg-slate-50 dark:!bg-slate-800/50"
                    />
                  </div>
                  <div className="w-full lg:w-64">
                    <RoleSelector 
                      value={row.role}
                      onChange={(role) => updateRow(index, 'role', role)}
                      isOwner={isOwner}
                    />
                  </div>
                  {inviteRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="lg:mt-8 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                {row.role === 'viewer' && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 mb-3 ml-1">
                      <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Project Access
                      </label>
                    </div>
                    <div className="p-1 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden">
                      <SiteMultiSelect
                        selected={row.siteIds}
                        onChange={(ids) => updateRow(index, 'siteIds', ids)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-bold px-4 py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add another member
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteRows([emptyRow()]);
                    setInviteErrors({});
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button onClick={handleSendInvites} isLoading={createInvitations.isPending} className="flex-1 sm:flex-none">
                  Send Invitations
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <section className="animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Pending Invitations ({pendingInvitations.length})
            </h2>
          </div>
          <Card noPadding className="overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingInvitations.map((inv) => (
                <div key={inv._id} className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <UserAvatar email={inv.email} className="h-10 w-10 text-xs shadow-sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{inv.email}</p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Awaiting acceptance • {inv.sharedSites?.length || 0} projects
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <Badge variant={inv.role === 'admin' ? 'brand' : 'neutral'} className="text-[10px]">
                      {inv.role}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvitation.mutate(inv._id)}
                        isLoading={resendInvitation.isPending}
                        className="hover:!text-brand-600 dark:hover:!text-brand-400 !px-2"
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRevoke(inv)}
                        className="!text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-900/20 !px-2"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Team Members Section */}
      <section className="animate-in fade-in duration-700">
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Active Members ({membersLoading || invLoading ? '...' : filteredMembers.length})
          </h2>
        </div>

        <Card noPadding className="overflow-hidden">
          {membersLoading || invLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner size="lg" />
              <p className="text-sm font-medium text-slate-500 animate-pulse">Loading roster...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No members found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or add a new team member.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => (
                <div key={member._id} className="group transition-all">
                  {editMemberId === member._id ? (
                    /* Inline edit row */
                    <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 animate-in fade-in zoom-in-95 duration-200 overflow-visible">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 overflow-visible">
                        <div className="flex items-center gap-4 flex-1">
                          <UserAvatar name={member.name} email={member.email} className="h-12 w-12 text-sm shadow-md border-brand-200 dark:border-brand-800" />
                          <div className="min-w-0">
                            <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{member.name}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto overflow-visible">
                          <div className="w-full md:w-64">
                            <RoleSelector 
                              value={editForm.role}
                              onChange={(role) => setEditForm({ ...editForm, role })}
                              isOwner={isOwner}
                              label="New Role"
                            />
                          </div>
                          <div className="flex gap-2 pt-5 ml-auto">
                            <Button size="sm" onClick={saveEdit} isLoading={updateMember.isPending} className="px-5">
                              Save
                            </Button>
                            <Button variant="secondary" size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                      {editForm.role === 'viewer' && (
                        <div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="flex items-center gap-2 mb-3 ml-1">
                            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Manage Shared Projects
                            </label>
                          </div>
                          <div className="p-1 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <SiteMultiSelect
                              selected={editForm.sharedSites}
                              onChange={(ids) => setEditForm({ ...editForm, sharedSites: ids })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Normal display row */
                    <div className="p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <UserAvatar name={member.name} email={member.email} className="h-11 w-11 text-xs shadow-sm transition-transform group-hover:scale-105 duration-300" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {member.name || 'Invited Member'}
                            </p>
                            {member._self && (
                              <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 ring-1 ring-inset ring-brand-500/10 dark:ring-brand-500/20">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-8 sm:ml-0 ml-[60px]">
                        <div className="flex flex-col sm:items-end">
                          <Badge variant={member.role === 'admin' ? 'brand' : 'neutral'} className="text-[10px] px-2.5">
                            {member.role}
                          </Badge>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {!member._self && member.role !== 'admin' && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                {member.sharedSites?.length || 0} project{member.sharedSites?.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {!member._self && member.role === 'admin' && (
                              <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400 uppercase tracking-wide italic">Full Access</span>
                            )}
                            {member._self && (
                              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wide">Primary Account</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {member._self ? (
                            <div className="p-2 text-slate-200 dark:text-slate-700 cursor-not-allowed" title="Self-management not available">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          ) : member.role === 'admin' && !isOwner ? (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                              Protected
                            </span>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(member)}
                                className="hover:!text-brand-600 dark:hover:!text-brand-400 !px-3"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDelete(member)}
                                className="!text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-900/20 !px-3"
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeMember.mutate(confirmDelete._id);
          setConfirmDelete(null);
        }}
        title="Remove Member"
        message={`Are you sure you want to remove ${confirmDelete?.name || confirmDelete?.email}? They will immediately lose access to all shared resources and data.`}
        confirmText="Remove Member"
        confirmVariant="danger"
        isLoading={removeMember.isPending}
      />
      <ConfirmDialog
        isOpen={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => {
          deleteInvitation.mutate(confirmRevoke._id);
          setConfirmRevoke(null);
        }}
        title="Revoke Invitation"
        message={`This will cancel the pending invitation to ${confirmRevoke?.email}. The invitation link previously sent will no longer function.`}
        confirmText="Revoke Invitation"
        confirmVariant="danger"
        isLoading={deleteInvitation.isPending}
      />
    </div>
  );
}
