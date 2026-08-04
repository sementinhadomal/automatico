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

// ─── Serviços de extração em cascata ─────────────────────────────────────────

async function extractTikTok(url: string) {
  const apis = [
    // API 1: tikwm (sem watermark)
    async () => {
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0' },
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.data?.play) return { url: j.data.hdplay || j.data.play, title: j.data.title || 'TikTok HD', thumb: j.data.cover };
      return null;
    },
    // API 2: musicaldown / ssstik fallback
    async () => {
      const r = await fetch(`https://api.tikmate.app/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.token) {
        return {
          url: `https://tikmate.app/download/${j.token}/${j.id}.mp4`,
          title: j.desc || 'TikTok Vídeo',
          thumb: j.thumbnail,
        };
      }
      return null;
    },
    // API 3: snaptik
    async () => {
      const form = new URLSearchParams({ url });
      const r = await fetch('https://snaptik.app/abc2.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
        body: form.toString(),
        signal: AbortSignal.timeout(8000),
      });
      const text = await r.text();
      const match = text.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
      if (match) return { url: match[1], title: 'TikTok Sem Marca', thumb: '' };
      return null;
    },
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return result;
    } catch (_) { /* tenta próximo */ }
  }
  return null;
}

async function extractInstagram(url: string) {
  const apis = [
    // API 1: SaveInsta / Insta Downloader via RapidAPI alternativo público
    async () => {
      const r = await fetch(`https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.media) return { url: j.media, title: 'Instagram Reels HD', thumb: j.thumbnail || '' };
      return null;
    },
    // API 2: igdownloader.app API pública
    async () => {
      const r = await fetch(`https://igdownloader.app/api/instagram-downloader?url=${encodeURIComponent(url)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.data?.url) return { url: j.data.url, title: 'Instagram Reels', thumb: j.data.thumbnail || '' };
      return null;
    },
    // API 3: reelsdown.com API
    async () => {
      const r = await fetch('https://reelsdown.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.url) return { url: j.url, title: 'Instagram Reels HD', thumb: j.thumbnail || '' };
      return null;
    },
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return result;
    } catch (_) { /* tenta próximo */ }
  }
  return null;
}

async function extractYouTube(url: string) {
  const apis = [
    // API 1: yt-dlp via API pública cobalt.tools
    async () => {
      const r = await fetch('https://co.wuk.sh/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url, vQuality: '1080', isNoTTWatermark: true }),
        signal: AbortSignal.timeout(12000),
      });
      const j = await r.json();
      if (j?.url) return { url: j.url, title: 'YouTube Shorts HD', thumb: j.thumbnail || '' };
      return null;
    },
    // API 2: yt1s.com API alternativa
    async () => {
      const r = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${extractYouTubeId(url)}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.link) return { url: j.link, title: j.title || 'YouTube Video', thumb: '' };
      return null;
    },
    // API 3: cobalt.tools v2
    async () => {
      const r = await fetch('https://cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url, vQuality: '1080' }),
        signal: AbortSignal.timeout(12000),
      });
      const j = await r.json();
      if (j?.url) return { url: j.url, title: 'YouTube HD', thumb: '' };
      return null;
    },
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return result;
    } catch (_) { /* tenta próximo */ }
  }
  return null;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

// ─── Stream proxy de um URL para download ────────────────────────────────────
async function streamDownload(mediaUrl: string, filename: string): Promise<NextResponse> {
  const res = await fetch(mediaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Referer': 'https://google.com',
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) return NextResponse.redirect(mediaUrl, 307);

  const contentType = res.headers.get('content-type') || 'video/mp4';
  const arrayBuffer = await res.arrayBuffer();
  const clean = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${clean}"`,
      'Content-Length': arrayBuffer.byteLength.toString(),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ─── GET: proxy direto de um URL já resolvido ─────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rawFilename = searchParams.get('filename') || 'video_hd.mp4';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  try {
    return await streamDownload(targetUrl, rawFilename);
  } catch (error: any) {
    return NextResponse.redirect(targetUrl, 307);
  }
}

// ─── POST: extração inteligente por plataforma ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    const lower = url.toLowerCase();
    let extracted: { url: string; title: string; thumb: string } | null = null;
    let platform = 'generic';

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
      // Twitter não tem API pública fácil — redireciona para o próprio link
      extracted = { url, title: 'Twitter/X Vídeo', thumb: '' };
    }

    // Se nenhuma API extraiu, retornar o próprio link (funciona para vídeos diretos .mp4)
    if (!extracted) {
      extracted = {
        url: lower.endsWith('.mp4') || lower.includes('.mp4?') ? url : url,
        title: `${platform.toUpperCase()} Vídeo HD`,
        thumb: '',
      };
    }

    const proxyDownloadUrl = `/api/media-downloader?url=${encodeURIComponent(extracted.url)}&filename=${encodeURIComponent(extracted.title + '.mp4')}`;

    return NextResponse.json({
      success: true,
      platform,
      title: extracted.title,
      downloadUrl: extracted.url,
      thumbnailUrl: extracted.thumb,
      proxyDownloadUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
