import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: 'No team membership' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string | null;
  const name = formData.get('name') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  // Verify project belongs to team if projectId is provided
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, teamId: membership.teamId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  }

  // Generate safe filename
  const timestamp = Date.now();
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
  const safeName = file.name
    .replace(ext, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const key = `uploads/${timestamp}-${safeName}${ext}`;

  // Upload to R2
  const buffer = Buffer.from(await file.arrayBuffer());
  const r2 = getR2Client();

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
  } catch (err) {
    console.error('R2 upload failed:', err);
    return NextResponse.json(
      { error: 'File upload failed. Please try again.' },
      { status: 502 }
    );
  }

  const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  // Create document record
  const document = await prisma.document.create({
    data: {
      name: name || file.name,
      fileName: `${timestamp}-${safeName}${ext}`,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      projectId: projectId || null,
      teamId: membership.teamId,
      uploadedById: session.user.id,
    },
  });

  // Emit activity if linked to a project
  if (projectId) {
    await prisma.activity.create({
      data: {
        entityType: 'project',
        entityId: projectId,
        projectId,
        userId: session.user.id,
        type: 'document_uploaded',
        description: `uploaded "${name || file.name}"`,
        metadata: { documentId: document.id },
      },
    });
  }

  return NextResponse.json({ success: true, document });
}
