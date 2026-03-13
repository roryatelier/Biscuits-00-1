'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) return null;

  const nameParts = (user.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    email: user.email || '',
  };
}

export async function updateProfile(firstName: string, lastName: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedFirst) return { error: 'First name is required' };
  if (!trimmedLast) return { error: 'Last name is required' };
  if (!trimmedEmail || !trimmedEmail.includes('@')) return { error: 'Valid email is required' };

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) return { error: 'User not found' };

  if (trimmedEmail !== (currentUser.email || '').toLowerCase()) {
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) return { error: 'An account with this email already exists' };
  }

  const combinedName = `${trimmedFirst} ${trimmedLast}`;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: combinedName, email: trimmedEmail },
  });

  return { success: true };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  if (!currentPassword || !newPassword) return { error: 'All fields are required' };
  if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: 'User not found' };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { success: true };
}
