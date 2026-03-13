'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Team.module.css';
import { getTeamData, createInvitation, changeRole, removeMember, revokeInvitation } from '@/lib/actions/team';

type Role = 'admin' | 'editor' | 'viewer';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  joinedAt: string;
}

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  role: Role;
  invitedBy: string;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access — manage team, projects, settings',
  editor: 'Can edit projects, formulations, and orders',
  viewer: 'View-only access to projects and data',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('editor');
  const [inviteConfirm, setInviteConfirm] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [roleChangeNew, setRoleChangeNew] = useState<Role>('viewer');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const data = await getTeamData();
    if (data) {
      setMembers(data.members);
      setInvitations(data.invitations);
      setCurrentUserRole(data.currentUserRole);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const adminCount = members.filter(m => m.role === 'admin').length;
  const editorCount = members.filter(m => m.role === 'editor').length;

  const handleInviteSend = async () => {
    const result = await createInvitation(inviteEmail, inviteRole);
    if (result.error) {
      alert(result.error);
      return;
    }
    setInviteEmail('');
    setInviteRole('editor');
    setInviteConfirm(false);
    setShowInvite(false);
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
    loadData();
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (member.role === 'admin' && adminCount <= 1 && newRole !== 'admin') {
      setRoleChangeTarget(memberId);
      setRoleChangeNew(newRole);
      return;
    }
    if (member.role === 'editor' && editorCount <= 1 && newRole === 'viewer') {
      setRoleChangeTarget(memberId);
      setRoleChangeNew(newRole);
      return;
    }

    await applyRoleChange(memberId, newRole);
  };

  const applyRoleChange = async (memberId: string, newRole: Role) => {
    await changeRole(memberId, newRole);
    setRoleChangeTarget(null);
    loadData();
  };

  const handleRemove = (memberId: string) => {
    setRemoveTarget(memberId);
  };

  const applyRemove = async (memberId: string) => {
    await removeMember(memberId);
    setRemoveTarget(null);
    loadData();
  };

  const handleRevoke = async (invitationId: string) => {
    await revokeInvitation(invitationId);
    loadData();
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Team</h1>
              <p className={styles.pageSubtitle}>Loading...</p>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Team</h1>
            <p className={styles.pageSubtitle}>{members.length} member{members.length !== 1 ? 's' : ''} · {invitations.length} pending</p>
          </div>
          {currentUserRole === 'admin' && (
            <button className={styles.inviteBtn} onClick={() => setShowInvite(true)}>
              + Invite member
            </button>
          )}
        </div>

        {/* ── Success toast ── */}
        {inviteSuccess && (
          <div className={styles.toast}>
            <span className={styles.toastIcon}>✓</span>
            Invitation sent successfully
          </div>
        )}

        {/* ── Invite modal ── */}
        {showInvite && (
          <div className={styles.modalOverlay} onClick={() => { setShowInvite(false); setInviteConfirm(false); }}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              {!inviteConfirm ? (
                <>
                  <h2 className={styles.modalTitle}>Invite a team member</h2>
                  <p className={styles.modalSub}>They will receive an email invitation to join your workspace.</p>

                  <div className={styles.modalField}>
                    <label className={styles.fieldLabel} htmlFor="invite-email">Email address</label>
                    <input
                      id="invite-email"
                      className={styles.input}
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.fieldLabel}>Role</label>
                    <div className={styles.roleCards}>
                      {(['viewer', 'editor', 'admin'] as Role[]).map(r => (
                        <button
                          key={r}
                          className={`${styles.roleCard} ${inviteRole === r ? styles.roleCardActive : ''}`}
                          onClick={() => setInviteRole(r)}
                          aria-pressed={inviteRole === r}
                        >
                          <span className={styles.roleCardLabel}>{ROLE_LABELS[r]}</span>
                          <span className={styles.roleCardDesc}>{ROLE_DESCRIPTIONS[r]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={() => { setShowInvite(false); setInviteConfirm(false); }}>Cancel</button>
                    <button
                      className={`${styles.primaryBtn} ${!inviteEmail.includes('@') ? styles.btnDisabled : ''}`}
                      onClick={() => setInviteConfirm(true)}
                      disabled={!inviteEmail.includes('@')}
                    >
                      Review invitation
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.modalTitle}>Confirm invitation</h2>
                  <div className={styles.confirmCard}>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Email</span>
                      <span className={styles.confirmValue}>{inviteEmail}</span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Role</span>
                      <span className={styles.confirmValue}>
                        <span className={`${styles.roleBadge} ${styles[`role${inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}`]}`}>
                          {ROLE_LABELS[inviteRole]}
                        </span>
                      </span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Permissions</span>
                      <span className={styles.confirmValue}>{ROLE_DESCRIPTIONS[inviteRole]}</span>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={() => setInviteConfirm(false)}>Back</button>
                    <button className={styles.primaryBtn} onClick={handleInviteSend}>Send invitation</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Role change confirmation ── */}
        {roleChangeTarget && (
          <div className={styles.modalOverlay} onClick={() => setRoleChangeTarget(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Change role?</h2>
              <p className={styles.modalSub}>
                {(() => {
                  const m = members.find(x => x.id === roleChangeTarget);
                  if (m?.role === 'admin' && adminCount <= 1) {
                    return `${m.name || m.email} is the only Admin. Changing their role means no one will have admin access. Are you sure?`;
                  }
                  if (m?.role === 'editor' && editorCount <= 1) {
                    return `${m.name || m.email} is the only Editor. Changing their role may limit who can make changes.`;
                  }
                  return `Change ${m?.name || m?.email}'s role to ${ROLE_LABELS[roleChangeNew]}?`;
                })()}
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setRoleChangeTarget(null)}>Cancel</button>
                <button className={styles.dangerBtn} onClick={() => applyRoleChange(roleChangeTarget, roleChangeNew)}>
                  Change role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Remove confirmation ── */}
        {removeTarget && (
          <div className={styles.modalOverlay} onClick={() => setRemoveTarget(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Remove team member?</h2>
              <p className={styles.modalSub}>
                {(() => {
                  const m = members.find(x => x.id === removeTarget);
                  if (m?.role === 'admin' && adminCount <= 1) {
                    return `${m.name || m.email} is the only Admin. Removing them will leave no admin for this workspace.`;
                  }
                  return `${m?.name || m?.email} will lose access to this workspace. This action can't be undone.`;
                })()}
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setRemoveTarget(null)}>Cancel</button>
                <button className={styles.dangerBtn} onClick={() => applyRemove(removeTarget)}>Remove member</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active members ── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Active members ({members.length})</h2>
          <div className={styles.memberList}>
            {members.map(m => (
              <div key={m.id} className={styles.memberCard}>
                <div className={styles.memberLeft}>
                  <div className={`${styles.avatar} ${styles[`avatar${m.role.charAt(0).toUpperCase() + m.role.slice(1)}`]}`}>
                    {m.avatar}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberNameRow}>
                      <span className={styles.memberName}>{m.name || m.email}</span>
                      <span className={`${styles.roleBadge} ${styles[`role${m.role.charAt(0).toUpperCase() + m.role.slice(1)}`]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    </div>
                    <span className={styles.memberEmail}>{m.email}</span>
                    <span className={styles.memberMeta}>Joined {m.joinedAt}</span>
                  </div>
                </div>
                {currentUserRole === 'admin' && (
                  <div className={styles.memberActions}>
                    <select
                      className={styles.roleSelect}
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value as Role)}
                      aria-label={`Change role for ${m.name || m.email}`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(m.id)}
                      aria-label={`Remove ${m.name || m.email}`}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pending invitations ── */}
        {invitations.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pending invitations ({invitations.length})</h2>
            <div className={styles.memberList}>
              {invitations.map(inv => (
                <div key={inv.id} className={`${styles.memberCard} ${styles.pendingCard}`}>
                  <div className={styles.memberLeft}>
                    <div className={`${styles.avatar} ${styles.avatarPending}`}>
                      {inv.email.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberNameRow}>
                        <span className={styles.memberEmail}>{inv.email}</span>
                        <span className={styles.pendingBadge}>Pending</span>
                        <span className={`${styles.roleBadge} ${styles[`role${inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}`]}`}>
                          {ROLE_LABELS[inv.role]}
                        </span>
                      </div>
                      <span className={styles.memberMeta}>Invited {inv.createdAt} by {inv.invitedBy}</span>
                    </div>
                  </div>
                  {currentUserRole === 'admin' && (
                    <div className={styles.memberActions}>
                      {copiedToken === inv.token ? (
                        <span className={styles.resendConfirm}>Copied ✓</span>
                      ) : (
                        <button className={styles.resendBtn} onClick={() => handleCopyLink(inv.token)}>
                          Copy link
                        </button>
                      )}
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRevoke(inv.id)}
                        aria-label={`Revoke invitation for ${inv.email}`}
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Roles reference ── */}
        <div className={styles.rolesRef}>
          <h2 className={styles.sectionTitle}>Role permissions</h2>
          <div className={styles.rolesGrid}>
            <div className={styles.rolesHeader}>
              <span />
              <span className={styles.rolesColHead}>Viewer</span>
              <span className={styles.rolesColHead}>Editor</span>
              <span className={styles.rolesColHead}>Admin</span>
            </div>
            {[
              { perm: 'View projects & formulations', viewer: true, editor: true, admin: true },
              { perm: 'View sample orders',           viewer: true, editor: true, admin: true },
              { perm: 'Edit projects & briefs',       viewer: false, editor: true, admin: true },
              { perm: 'Request samples',              viewer: false, editor: true, admin: true },
              { perm: 'Review & score samples',       viewer: false, editor: true, admin: true },
              { perm: 'Manage formulations',          viewer: false, editor: true, admin: true },
              { perm: 'Invite team members',          viewer: false, editor: false, admin: true },
              { perm: 'Manage roles & permissions',   viewer: false, editor: false, admin: true },
              { perm: 'Workspace settings',           viewer: false, editor: false, admin: true },
            ].map(row => (
              <div key={row.perm} className={styles.rolesRow}>
                <span className={styles.rolesPerm}>{row.perm}</span>
                <span className={styles.rolesCell}>{row.viewer ? <span className={styles.checkMark}>✓</span> : <span className={styles.dash}>—</span>}</span>
                <span className={styles.rolesCell}>{row.editor ? <span className={styles.checkMark}>✓</span> : <span className={styles.dash}>—</span>}</span>
                <span className={styles.rolesCell}>{row.admin  ? <span className={styles.checkMark}>✓</span> : <span className={styles.dash}>—</span>}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PlatformLayout>
  );
}
