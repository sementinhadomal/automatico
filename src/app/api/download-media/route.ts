import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mediaUrl, batchName, filename, mediaType = 'video' } = body;

    if (!mediaUrl || !batchName) {
      return NextResponse.json({ error: 'mediaUrl and batchName are required' }, { status: 400 });
    }

    // Build local folder path: C:\OmniMedia\Lotes\[BatchName]\
    const batchDir = path.join('C:\\OmniMedia', 'Lotes', batchName);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(batchDir)) {
      fs.mkdirSync(batchDir, { recursive: true });
    }

    // Generate filename if not provided
    const ext = mediaType === 'video' ? '.mp4' : '.png';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const finalFilename = filename || `${batchName}_${timestamp}${ext}`;
    const destPath = path.join(batchDir, finalFilename);

    // Download the file
    await downloadFile(mediaUrl, destPath);

    return NextResponse.json({
      success: true,
      savedTo: destPath,
      batchDir,
      filename: finalFilename,
    });

  } catch (err: any) {
    console.error('[Download Media] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
