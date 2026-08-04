import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────────────────────
// TIKTOK — tikwm é a mais confiável (retorna MP4 sem watermark direto)
// ─────────────────────────────────────────────────────────────────────────────
async function extractTikTok(url: string) {
  // API 1: tikwm (sem watermark, HD)
  try {
    const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    });
    const j = await r.json();
    if (j?.data?.hdplay || j?.data?.play) {
      return {
        directUrl: (j.data.hdplay || j.data.play) as string,
        title: (j.data.title as string) || 'TikTok Vídeo',
        thumbnail: (j.data.cover as string) || '',
      };
    }
  } catch (_) {}

  // API 2: tikmate
  try {
    const r = await fetch('https://tikmate.online/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    if (j?.token && j?.id) {
      return {
        directUrl: `https://tikmate.online/download/${j.token}/${j.id}.mp4`,
        title: (j.desc as string) || 'TikTok Vídeo',
        thumbnail: (j.thumbnail as string) || '',
      };
    }
  } catch (_) {}

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE — ytdl-core funciona no Vercel serverless
// ─────────────────────────────────────────────────────────────────────────────
async function extractYouTube(url: string) {
  // API 1: @distube/ytdl-core
  try {
    const ytdl = await import('@distube/ytdl-core').catch(() => null);
    if (ytdl) {
      const info = await ytdl.default.getInfo(url, {
        requestOptions: { headers: { 'User-Agent': UA } },
      });
      // Escolhe mp4 com video+audio juntos (para não precisar de merge)
      const fmt =
        ytdl.default.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' }) ??
        ytdl.default.chooseFormat(info.formats, { quality: '18' }) ?? // 360p audioandvideo
        ytdl.default.chooseFormat(info.formats, { quality: 'lowest', filter: 'audioandvideo' });

      if (fmt?.url) {
        return {
          directUrl: fmt.url,
          title: info.videoDetails.title || 'YouTube Vídeo',
          thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url || '',
        };
      }
    }
  } catch (_) {}

  // API 2: cobalt.tools (fallback gratuito)
  try {
    const r = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url, vQuality: '720', isNoTTWatermark: true }),
      signal: AbortSignal.timeout(12000),
    });
    const j = await r.json();
    if (j?.url) return { directUrl: j.url as string, title: 'YouTube Shorts HD', thumbnail: '' };
  } catch (_) {}

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTAGRAM — múltiplas APIs em cascata
// ─────────────────────────────────────────────────────────────────────────────
async function extractInstagram(url: string) {
  // API 1: instasave.io
  try {
    const r = await fetch('https://instasave.io/api/v1/instagram/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Referer: 'https://instasave.io/' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(12000),
    });
    const j = await r.json();
    const videoItem = Array.isArray(j?.data) ? j.data.find((d: any) => d.type === 'video' || d.url?.includes('.mp4')) : null;
    if (videoItem?.url) return { directUrl: videoItem.url as string, title: 'Instagram Reels HD', thumbnail: videoItem.thumbnail || '' };
  } catch (_) {}

  // API 2: snapinsta
  try {
    const r = await fetch('https://snapinsta.app/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        Referer: 'https://snapinsta.app/',
      },
      body: new URLSearchParams({ url }).toString(),
      signal: AbortSignal.timeout(12000),
    });
    const j = await r.json();
    const mp4 = (j?.data?.medias as any[])?.find((m) => m.type === 'mp4' || m.url?.includes('.mp4'));
    if (mp4?.url) return { directUrl: mp4.url as string, title: 'Instagram Reels HD', thumbnail: (j?.data?.thumbnail as string) || '' };
  } catch (_) {}

  // API 3: savefrom.net (suporta instagram)
  try {
    const r = await fetch(`https://worker.sf-tools.com/savefrom?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    const mp4link = j?.url?.[0]?.url || j?.url;
    if (mp4link && typeof mp4link === 'string' && mp4link.startsWith('http')) {
      return { directUrl: mp4link, title: 'Instagram Reels', thumbnail: (j?.thumb as string) || '' };
    }
  } catch (_) {}

  // API 4: reels-downloader.net
  try {
    const r = await fetch('https://reels-downloader.net/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    if (j?.video_url) return { directUrl: j.video_url as string, title: 'Instagram Reels', thumbnail: (j?.thumbnail as string) || '' };
  } catch (_) {}

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TWITTER / X
// ─────────────────────────────────────────────────────────────────────────────
async function extractTwitter(url: string) {
  try {
    const r = await fetch(`https://twdownload.com/api/search?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    const best = (j?.data?.urls as any[])?.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    if (best?.url) return { directUrl: best.url as string, title: 'Twitter/X Vídeo', thumbnail: (j?.data?.thumbnail_url as string) || '' };
  } catch (_) {}
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY — serve o arquivo de CDN via Next.js (evita bloqueios CORS)
// ─────────────────────────────────────────────────────────────────────────────
async function proxyStream(cdnUrl: string, filename: string): Promise<NextResponse> {
  const clean = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 100);

  const res = await fetch(cdnUrl, {
    headers: { 'User-Agent': UA, Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8', Referer: 'https://www.tiktok.com/' },
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) throw new Error(`CDN ${res.status}`);

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': res.headers.get('content-type') || 'video/mp4',
      'Content-Disposition': `attachment; filename="${clean}"`,
      'Content-Length': buffer.byteLength.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — proxy de URL de CDN já resolvida (nunca aceita /api/ como target)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rawFilename = searchParams.get('filename') || 'video.mp4';

  if (!targetUrl) return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });

  // Bloqueia loop recursivo
  if (targetUrl.startsWith('/') || targetUrl.includes('/api/media-downloader')) {
    return NextResponse.json({ error: 'URL inválida — loop detectado' }, { status: 400 });
  }

  try {
    return await proxyStream(targetUrl, rawFilename);
  } catch (err: any) {
    // Último recurso: redireciona o browser direto para a CDN
    return NextResponse.redirect(targetUrl, 307);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — extrai URL real e devolve proxyDownloadUrl para o cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    if (!url) return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });

    const lower = url.toLowerCase();
    let platform = 'generic';
    let extracted: { directUrl: string; title: string; thumbnail: string } | null = null;

    if (lower.includes('tiktok.com') || lower.includes('vm.tiktok')) {
      platform = 'tiktok';
      extracted = await extractTikTok(url);
    } else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
      platform = 'instagram';
      extracted = await extractInstagram(url);
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      platform = 'youtube';
      extracted = await extractYouTube(url);
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      platform = 'twitter';
      extracted = await extractTwitter(url);
    }

    const title = extracted?.title || `${platform.toUpperCase()} Vídeo HD`;
    const safeTitle = title.replace(/[^a-zA-Z0-9 _\-]/g, '').trim().substring(0, 80) || `${platform}_video`;

    if (extracted?.directUrl) {
      // proxyDownloadUrl aponta para CDN direta — NUNCA para outra chamada /api/media-downloader
      const proxyDownloadUrl = `/api/media-downloader?url=${encodeURIComponent(extracted.directUrl)}&filename=${encodeURIComponent(safeTitle + '.mp4')}`;
      return NextResponse.json({
        success: true,
        platform,
        title,
        downloadUrl: extracted.directUrl,
        thumbnailUrl: extracted.thumbnail,
        proxyDownloadUrl,
      });
    }

    return NextResponse.json({
      success: false,
      platform,
      title,
      downloadUrl: '',
      thumbnailUrl: '',
      proxyDownloadUrl: '',
      error: 'Nenhuma API conseguiu extrair este vídeo. Verifique se o link é público.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
