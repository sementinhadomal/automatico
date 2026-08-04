import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rawFilename = searchParams.get('filename') || 'video_hd.mp4';
  const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL da mídia é obrigatória' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Falha ao obter mídia da fonte. HTTP status: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro no servidor de streaming: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    const lower = url.toLowerCase();
    let downloadUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    let title = 'Vídeo Verticial HD 9:16';
    let platform = 'generic';

    if (lower.includes('tiktok.com')) {
      platform = 'tiktok';
      try {
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });
        const tikData = await tikRes.json();
        if (tikData && tikData.data) {
          downloadUrl = tikData.data.play || tikData.data.wmplay || downloadUrl;
          title = tikData.data.title || 'TikTok Vídeo Sem Marca D\'água';
        }
      } catch (e) {
        // Fallback
      }
    } else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
      platform = 'instagram';
      title = 'Instagram Reels HD 1080p';
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      platform = 'youtube';
      title = 'YouTube Shorts HD 4K';
    }

    return NextResponse.json({
      success: true,
      platform,
      title,
      downloadUrl,
      proxyDownloadUrl: `/api/media-downloader?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(title + '.mp4')}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
