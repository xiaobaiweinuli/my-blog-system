import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('avatar');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `avatar_${Date.now()}.png`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
} 