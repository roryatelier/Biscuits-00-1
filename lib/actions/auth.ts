'use server';

import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';

// In-memory sliding window rate limiter
const loginAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(email) ?? [];
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
  loginAttempts.set(email, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  loginAttempts.set(email, recent);
  return false;
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;

  if (isRateLimited(email)) {
    return { error: 'Too many login attempts. Please wait 60 seconds and try again.' };
  }

  try {
    await signIn('credentials', {
      email,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' };
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters' };
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: 'Password must include uppercase, lowercase, and a number' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists' };
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  // Notify via Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🆕 New user signed up on Atelier: *${name}* (${email})`,
      }),
    })
      .then(res => {
        if (!res.ok) console.error(`Slack webhook failed: ${res.status} ${res.statusText}`);
      })
      .catch(err => {
        console.error('Slack webhook error:', err);
      });
  }

  // Check for invite token — join existing team instead of creating new one
  const inviteToken = formData.get('inviteToken') as string | null;

  if (inviteToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
    });

    if (invitation && invitation.status === 'pending') {
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });
    } else {
      // Invalid token — fall back to creating default team
      await prisma.team.create({
        data: {
          name: `${name}'s Team`,
          members: { create: { userId: user.id, role: 'admin' } },
        },
      });
    }
  } else {
    // No invite — create default team
    await prisma.team.create({
      data: {
        name: `${name}'s Team`,
        members: { create: { userId: user.id, role: 'admin' } },
      },
    });
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/onboarding',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Account created but sign-in failed. Please sign in manually.' };
    }
    throw error;
  }
}

export async function completeOnboarding(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingComplete: true },
  });
  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
