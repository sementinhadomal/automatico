import { NextResponse } from 'next/server';

// Kie.ai Grok Imagine API integration
// Docs: https://docs.kie.ai

async function pollForResult(taskId: string, apiKey: string, maxWaitMs = 300000): Promise<string> {
  const pollInterval = 5000;
  const maxAttempts = maxWaitMs / pollInterval;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));
    
    const statusRes = await fetch(`https://api.kie.ai/v1/video/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();

    // Kie.ai returns status: 'completed' | 'processing' | 'failed'
    if (statusData.status === 'completed' && statusData.output?.url) {
      return statusData.output.url;
    }
    if (statusData.status === 'failed') {
      throw new Error(`Kie.ai generation failed: ${statusData.error || 'Unknown error'}`);
    }
  }

  throw new Error('Timeout: Video generation took too long.');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, prompt, subjectImageBase64, scenarioImageBase64, batchName, duration = 8, ratio = '9:16' } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required. Please enter your Kie.ai API Key in the settings.' }, { status: 401 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Build request payload for Kie.ai Grok Imagine (video generation)
    const payload: any = {
      model: 'grok-video',
      prompt: prompt,
      aspect_ratio: ratio,         // "9:16"
      duration: duration,           // seconds
    };

    // Attach reference images if provided
    if (subjectImageBase64) {
      payload.reference_image = subjectImageBase64;
    }
    if (scenarioImageBase64) {
      payload.background_image = scenarioImageBase64;
    }

    // Step 1: Submit generation task to Kie.ai
    const genRes = await fetch('https://api.kie.ai/v1/video/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!genRes.ok) {
      const errData = await genRes.json().catch(() => ({}));
      return NextResponse.json({
        error: `Kie.ai API error: ${genRes.status} - ${errData.message || genRes.statusText}`,
      }, { status: genRes.status });
    }

    const genData = await genRes.json();
    const taskId = genData.task_id || genData.id;

    if (!taskId) {
      return NextResponse.json({ error: 'No task ID returned from Kie.ai', raw: genData }, { status: 500 });
    }

    // Step 2: Poll for result (wait up to 5 minutes)
    const videoUrl = await pollForResult(taskId, apiKey);

    // Step 3: Auto-save to C:\OmniMedia\Lotes\[batchName]\ if batchName provided
    let savedTo: string | null = null;
    if (batchName && videoUrl) {
      const downloadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/download-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: videoUrl,
          batchName,
          mediaType: 'video',
        }),
      });
      const downloadData = await downloadRes.json();
      if (downloadData.success) savedTo = downloadData.savedTo;
    }

    return NextResponse.json({
      success: true,
      taskId,
      videoUrl,
      savedTo,
      message: savedTo
        ? `Vídeo gerado e salvo em ${savedTo}`
        : 'Vídeo gerado com sucesso.',
    });

  } catch (err: any) {
    console.error('[Kie.ai] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
