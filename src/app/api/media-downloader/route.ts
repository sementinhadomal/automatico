import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Vercel Pro: até 60s | Free: 10s

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

// ─── Headers genéricos de browser ────────────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

// ─── TikTok via tikwm (sem watermark, sem auth) ───────────────────────────────
async function extractTikTok(url: string) {
  const apis = [
    // tikwm – mais confiável, retorna HD sem watermark
    async () => {
      const r = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        { headers: { 'User-Agent': BROWSER_HEADERS['User-Agent'] }, signal: AbortSignal.timeout(10000) }
      );
      const j = await r.json();
      if (j?.data?.hdplay || j?.data?.play) {
        return {
          directUrl: j.data.hdplay || j.data.play,
          title: (j.data.title as string) || 'TikTok Vídeo',
          thumbnail: (j.data.cover as string) || '',
        };
      }
      return null;
    },
    // Musicaldown API alternativa
    async () => {
      const form = new URLSearchParams({ id: url, locale: 'pt', tt: '' });
      const r = await fetch('https://musicaldown.com/api/', {
        method: 'POST',
        headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://musicaldown.com/' },
        body: form.toString(),
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j?.links?.[0]?.url) return { directUrl: j.links[0].url, title: j.title || 'TikTok', thumbnail: j.cover || '' };
      return null;
    },
  ];

  for (const fn of apis) {
    try {
      const res = await fn();
      if (res?.directUrl) return res;
    } catch (_) {}
  }
  return null;
}

// ─── YouTube Shorts via @distube/ytdl-core ────────────────────────────────────
async function extractYouTube(url: string) {
  try {
    // Dynamic import para não crashar no build caso o pacote falhe
    const ytdl = await import('@distube/ytdl-core').catch(() => null);
    if (!ytdl) throw new Error('ytdl-core não disponível');

    const info = await ytdl.default.getInfo(url, { requestOptions: { headers: BROWSER_HEADERS } });
    const format = ytdl.default.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' })
      ?? ytdl.default.chooseFormat(info.formats, { quality: 'highest' });

    return {
      directUrl: format?.url || '',
      title: info.videoDetails.title || 'YouTube Vídeo',
      thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url || '',
    };
  } catch (_) {}

  // Fallback: cobalt.tools API pública
  try {
    const r = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url, vQuality: '1080', isNoTTWatermark: true }),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    if (j?.url) return { directUrl: j.url, title: 'YouTube Shorts HD', thumbnail: '' };
  } catch (_) {}

  return null;
}

// ─── Instagram via APIs públicas ─────────────────────────────────────────────
async function extractInstagram(url: string) {
  const apis = [
    // snapinsta.app API pública
    async () => {
      const r = await fetch('https://snapinsta.app/api', {
        method: 'POST',
        headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://snapinsta.app/' },
        body: new URLSearchParams({ url }).toString(),
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      const videoUrl = j?.data?.medias?.find((m: any) => m.type === 'mp4')?.url || j?.data?.url;
      if (videoUrl) return { directUrl: videoUrl, title: 'Instagram Reels HD', thumbnail: j?.data?.thumbnail || '' };
      return null;
    },
    // saveinsta / igram.io
    async () => {
      const r = await fetch(`https://igram.io/api/ajaxSearch`, {
        method: 'POST',
        headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://igram.io/' },
        body: new URLSearchParams({ q: url }).toString(),
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      if (j?.medias?.[0]?.url) return { directUrl: j.medias[0].url, title: 'Instagram Reels', thumbnail: j.thumbnail || '' };
      return null;
    },
    // reelsaver.net
    async () => {
      const r = await fetch('https://reelsaver.net/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...BROWSER_HEADERS },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      if (j?.url) return { directUrl: j.url, title: 'Instagram Reels', thumbnail: j.thumbnail || '' };
      return null;
    },
  ];

  for (const fn of apis) {
    try {
      const res = await fn();
      if (res?.directUrl) return res;
    } catch (_) {}
  }
  return null;
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────
async function extractTwitter(url: string) {
  try {
    const r = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();
    const match = html.match(/href="(https:\/\/video\.twimg\.com[^"]+)"/);
    if (match) return { directUrl: match[1], title: 'Twitter/X Vídeo', thumbnail: '' };
  } catch (_) {}
  return null;
}

// ─── Proxy: faz stream do arquivo de CDN para o browser ──────────────────────
async function proxyStream(mediaUrl: string, filename: string): Promise<NextResponse> {
  const clean = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 100);

  const res = await fetch(mediaUrl, {
    headers: {
      ...BROWSER_HEADERS,
      Accept: 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
      Referer: 'https://www.tiktok.com/',
    },
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) throw new Error(`CDN retornou ${res.status}: ${res.statusText}`);

  const contentType = res.headers.get('content-type') || 'video/mp4';
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${clean}"`,
      'Content-Length': buffer.byteLength.toString(),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ─── GET: proxy direto de URL de CDN já resolvida ────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rawFilename = searchParams.get('filename') || 'video.mp4';

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  // Segurança: bloquear loop (não aceitar /api/ como url alvo)
  if (targetUrl.startsWith('/') || targetUrl.includes('/api/media-downloader')) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  try {
    return await proxyStream(targetUrl, rawFilename);
  } catch (error: any) {
    // Fallback: redireciona direto para o CDN
    return NextResponse.redirect(targetUrl, 307);
  }
}

// ─── POST: extrai a URL real do vídeo e retorna para o cliente ────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

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
    const safeTitle = title.replace(/[^a-zA-Z0-9 _\-]/g, '').substring(0, 80) || `${platform}_video`;

    if (extracted?.directUrl) {
      // Gera URL de proxy apontando para o CDN direto (NUNCA para outra chamada da API)
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

    // Nenhuma extração funcionou
    return NextResponse.json({
      success: false,
      platform,
      title,
      downloadUrl: '',
      thumbnailUrl: '',
      proxyDownloadUrl: '',
      error: 'Não foi possível extrair o vídeo. Verifique se o link é público e tente novamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
