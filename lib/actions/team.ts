'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getTeamData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Find user's team membership
  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: { team: true },
  });

  if (!membership) return null;

  const teamId = membership.teamId;

  // Get all members with user info
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  });

  // Get pending invitations
  const invitations = await prisma.invitation.findMany({
    where: { teamId, status: 'pending' },
    include: { inviter: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return {
    teamId,
    teamName: membership.team.name,
    currentUserRole: membership.role,
    members: members.map((m: typeof members[number]) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name || '',
      email: m.user.email || '',
      role: m.role as 'admin' | 'editor' | 'viewer',
      avatar: (m.user.name || m.user.email || '?').charAt(0).toUpperCase(),
      joinedAt: m.joinedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
    invitations: invitations.map((i: typeof invitations[number]) => ({
      id: i.id,
      token: i.token,
      email: i.email,
      role: i.role as 'admin' | 'editor' | 'viewer',
      invitedBy: i.inviter.name || 'Unknown',
      createdAt: i.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
  };
}

export async function createInvitation(email: string, role: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only admins can invite members' };
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findFirst({
      where: { userId: existingUser.id, teamId: membership.teamId },
    });
    if (existingMember) return { error: 'This person is already a team member' };
  }

  // Check if already invited
  const existingInvite = await prisma.invitation.findFirst({
    where: { email, teamId: membership.teamId, status: 'pending' },
  });
  if (existingInvite) return { error: 'An invitation is already pending for this email' };

  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      teamId: membership.teamId,
      invitedBy: session.user.id,
    },
  });

  return { success: true, token: invitation.token };
}

export async function changeRole(memberId: string, newRole: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only admins can change roles' };
  }

  const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== membership.teamId) {
    return { error: 'Member not found' };
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  return { success: true };
}

export async function removeMember(memberId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only admins can remove members' };
  }

  const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== membership.teamId) {
    return { error: 'Member not found' };
  }

  if (target.userId === session.user.id) {
    return { error: 'You cannot remove yourself' };
  }

  await prisma.teamMember.delete({ where: { id: memberId } });

  return { success: true };
}

export async function getInviteDetails(token: string) {
  if (!token) return null;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  if (!invitation || invitation.status !== 'pending') return null;

  return {
    email: invitation.email,
    role: invitation.role,
    teamName: invitation.team.name,
  };
}

export async function revokeInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only admins can revoke invitations' };
  }

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.teamId !== membership.teamId) {
    return { error: 'Invitation not found' };
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' },
  });

  return { success: true };
}
