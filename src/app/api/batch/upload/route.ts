import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        // Fallback for local testing if user hasn't setup Vercel Blob yet
        return NextResponse.json(
            { url: `https://mock-blob-storage.com/simulated/${filename}` },
            { status: 200 }
        );
    }

    const blob = await put(filename, request.body as any, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
