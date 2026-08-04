import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

// yt-dlp local na pasta bin/ do projeto
const YT_DLP = path.join(process.cwd(), 'bin', 'yt-dlp.exe');

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

// ─── Extrai JSON de metadados via yt-dlp ─────────────────────────────────────
async function ytdlpGetInfo(url: string): Promise<any | null> {
  try {
    const { stdout } = await execAsync(
      `"${YT_DLP}" --dump-json --no-playlist --no-warnings -q "${url}"`,
      { timeout: 30000 }
    );
    return JSON.parse(stdout.trim().split('\n')[0]);
  } catch {
    return null;
  }
}

// ─── Pega a melhor URL de vídeo+áudio do JSON do yt-dlp ──────────────────────
function getBestDirectUrl(info: any): string {
  if (!info) return '';

  // requested_formats contém as URLs separadas de vídeo e áudio
  // Para streaming direto queremos o formato com vídeo+áudio merged (single file)
  const formats: any[] = info.formats || [];

  // 1. Preferir formato único com vídeo + áudio (mp4)
  const merged = formats
    .filter((f) => f.url && f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4')
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  if (merged[0]?.url) return merged[0].url;

  // 2. Qualquer formato com vídeo (sem áudio) — ainda melhor que nada
  const anyVideo = formats
    .filter((f) => f.url && f.vcodec !== 'none')
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  if (anyVideo[0]?.url) return anyVideo[0].url;

  // 3. URL direto no objeto raiz
  if (info.url) return info.url;

  return '';
}

// ─── TikTok: usa tikwm (sem watermark) como primary, yt-dlp como fallback ────
async function extractTikTok(url: string) {
  // Tentativa 1: tikwm API (mais confiável para TikTok)
  try {
    const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json();
    if (j?.data?.hdplay || j?.data?.play) {
      return {
        directUrl: j.data.hdplay || j.data.play,
        title: j.data.title || 'TikTok Vídeo',
        thumbnail: j.data.cover || '',
      };
    }
  } catch (_) {}

  // Tentativa 2: yt-dlp (pode falhar se IP bloqueado pelo TikTok)
  const info = await ytdlpGetInfo(url);
  if (info) {
    return {
      directUrl: getBestDirectUrl(info),
      title: info.title || 'TikTok Vídeo',
      thumbnail: info.thumbnail || '',
    };
  }

  return null;
}

// ─── YouTube / YT Shorts: yt-dlp funciona muito bem ─────────────────────────
async function extractYouTube(url: string) {
  const info = await ytdlpGetInfo(url);
  if (!info) return null;

  return {
    directUrl: getBestDirectUrl(info),
    title: info.title || 'YouTube Vídeo',
    thumbnail: info.thumbnail || '',
  };
}

// ─── Instagram: yt-dlp funciona para posts públicos ───────────────────────────
async function extractInstagram(url: string) {
  const info = await ytdlpGetInfo(url);
  if (info) {
    return {
      directUrl: getBestDirectUrl(info),
      title: info.title || 'Instagram Reels',
      thumbnail: info.thumbnail || '',
    };
  }

  // Fallback: igdownloader.app
  try {
    const r = await fetch(`https://igdownloader.app/api/instagram-downloader?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    if (j?.data?.url) return { directUrl: j.data.url, title: 'Instagram Reels', thumbnail: j.data.thumbnail || '' };
  } catch (_) {}

  return null;
}

// ─── Stream de download: baixa via yt-dlp para tmp e serve como blob ─────────
async function downloadViaYtdlp(url: string, filename: string): Promise<NextResponse> {
  const tmpFile = path.join(os.tmpdir(), `dl_${Date.now()}.mp4`);

  try {
    await execAsync(
      `"${YT_DLP}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 --no-playlist -o "${tmpFile}" -q --no-warnings "${url}"`,
      { timeout: 180000 }
    );

    if (!fs.existsSync(tmpFile)) throw new Error('Arquivo não criado');

    const buffer = fs.readFileSync(tmpFile);
    try { fs.unlinkSync(tmpFile); } catch (_) {}

    const clean = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${clean}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
    throw err;
  }
}

// ─── Proxy simples de URL direto de CDN ──────────────────────────────────────
async function proxyDirectUrl(mediaUrl: string, filename: string): Promise<NextResponse> {
  const res = await fetch(mediaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
      'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Referer': 'https://www.tiktok.com/',
    },
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`CDN retornou ${res.status}`);

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

// ─── GET: baixa um vídeo (já extraído via POST ou direto via yt-dlp) ─────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rawFilename = searchParams.get('filename') || 'video.mp4';
  const mode = searchParams.get('mode'); // 'ytdlp' = forçar download yt-dlp | 'proxy' = proxy direto CDN

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  try {
    if (mode === 'ytdlp') {
      return await downloadViaYtdlp(targetUrl, rawFilename);
    }

    // Modo proxy (CDN direta — para links tikwm/googlevideo etc.)
    return await proxyDirectUrl(targetUrl, rawFilename);
  } catch (error: any) {
    console.error('[GET] erro:', error.message);
    // Último recurso: download direto no browser
    return NextResponse.redirect(targetUrl, 307);
  }
}

// ─── POST: extrai metadata + gera URL de download ────────────────────────────
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
      extracted = await (async () => {
        const info = await ytdlpGetInfo(url);
        if (info) return { directUrl: getBestDirectUrl(info), title: info.title || 'Twitter Vídeo', thumbnail: info.thumbnail || '' };
        return null;
      })();
    }

    const title = extracted?.title || `${platform.toUpperCase()} Vídeo HD`;
    const safeTitle = title.replace(/[^a-zA-Z0-9 _\-]/g, '').substring(0, 80) || `${platform}_video`;

    if (extracted?.directUrl) {
      // Temos URL direta de CDN — usa proxy para servir o download
      const isCdnDirect = extracted.directUrl.includes('googlevideo') || extracted.directUrl.includes('tikwm') || extracted.directUrl.includes('tikcdn') || extracted.directUrl.includes('tiktokcdn');
      const mode = isCdnDirect ? 'proxy' : 'ytdlp';
      const proxyDownloadUrl = `/api/media-downloader?url=${encodeURIComponent(extracted.directUrl)}&filename=${encodeURIComponent(safeTitle + '.mp4')}&mode=${mode}`;

      return NextResponse.json({
        success: true,
        platform,
        title,
        downloadUrl: extracted.directUrl,
        thumbnailUrl: extracted.thumbnail,
        proxyDownloadUrl,
      });
    }

    // Nenhuma extração funcionou — retorna URL original com mode=ytdlp para tentar na hora do download
    const proxyDownloadUrl = `/api/media-downloader?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeTitle + '.mp4')}&mode=ytdlp`;

    return NextResponse.json({
      success: true,
      platform,
      title,
      downloadUrl: url,
      thumbnailUrl: '',
      proxyDownloadUrl,
    });
  } catch (error: any) {
    console.error('[POST] erro:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
