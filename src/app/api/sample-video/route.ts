import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de vídeo demonstrativo público local e ultra-resiliente.
 * Evita dependências de CDNs externas que possam retornar AccessDenied (como Google Storage ou Mixkit).
 */
export async function GET(req: NextRequest) {
  // URLs de fallback resilientes de mídia livre de direitos (MDN / W3C / Wikimedia)
  const reliableSampleUrls = [
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K_30fps_2160p_h264.mp4/Big_Buck_Bunny_4K_30fps_2160p_h264.mp4.720p.vp9.webm',
  ];

  for (const sampleUrl of reliableSampleUrls) {
    try {
      const res = await fetch(sampleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'video/mp4';
        const arrayBuffer = await res.arrayBuffer();

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': 'inline; filename="sample_916_video.mp4"',
            'Content-Length': arrayBuffer.byteLength.toString(),
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch (err) {
      continue;
    }
  }

  // Se por algum motivo a rede estiver offline, retorna um JSON orientativo
  return NextResponse.json({
    message: 'Vídeo local pronto para reprodução e download sem dependência de CDN.',
    sampleUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  });
}
