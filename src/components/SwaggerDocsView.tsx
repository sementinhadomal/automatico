'use client';

import React, { useState } from 'react';
import { FileCode2, Play, CheckCircle2, Copy as CopyIcon, Check } from 'lucide-react';

export const SwaggerDocsView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('POST_PUBLISH');
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'POST_PUBLISH',
      method: 'POST',
      path: '/api/v1/publisher/dispatch',
      summary: 'Publicar / Agendar Conteúdo com Auto-Localização',
      description: 'Recebe os parâmetros da conta, dispara edição Sharp/FFmpeg e enfileira no BullMQ via proxy.',
      requestBody: `{
  "accountId": "acc_hot_01",
  "category": "HOT",
  "countryCode": "BR",
  "languageCode": "PT-BR",
  "mediaAssetId": "med_01",
  "options": {
    "sharpVariant": "auto_hsv_crop",
    "ffmpegSpeed": 1.02
  },
  "customCaption": "🔥 Conteúdo inédito liberado!",
  "autoRotateHashtags": true
}`,
      response200: `{
  "statusCode": 200,
  "message": "Job successfully enqueued to BullMQ Redis cluster",
  "data": {
    "jobId": "job_991823a0",
    "status": "QUEUED",
    "scheduledFor": "2026-08-03T15:00:00.000Z",
    "accountLocalTime": "15:00 (São Paulo)",
    "proxyUsed": "177.12.89.45:8080"
  }
}`,
    },
    {
      id: 'POST_SHARP_VARIANTS',
      method: 'POST',
      path: '/api/v1/editors/sharp/generate-variations',
      summary: 'Gerar Variações Micro-HSV de Imagens (Sharp Engine)',
      description: 'Executa a pipeline Sharp gerando N variações únicas com rotação leve e micro-crop para evitar o descarte por conteúdo duplicado.',
      requestBody: `{
  "mediaAssetId": "med_02",
  "count": 5,
  "watermarkText": "© OmniMedia VIP"
}`,
      response200: `{
  "statusCode": 200,
  "data": {
    "totalGenerated": 5,
    "variants": [
      { "id": "var_1", "checksum": "sha256_k91a...", "url": "https://s3.omnimedia.saas/var_1.jpg" }
    ]
  }
}`,
    },
    {
      id: 'POST_FFMPEG_MUTATIONS',
      method: 'POST',
      path: '/api/v1/editors/ffmpeg/render-mutations',
      summary: 'Executar Renderização de Vídeo (FFmpeg Engine)',
      description: 'Aplica filtros de velocidade (setpts), trim de frames e injeção de legenda/logo.',
      requestBody: `{
  "mediaAssetId": "med_01",
  "speedMultiplier": 1.02,
  "trimStartSec": 0.2,
  "subtitleText": "🔥 PROMOÇÃO HOJE!"
}`,
      response200: `{
  "statusCode": 200,
  "data": {
    "ffmpegLog": "ffmpeg -i input.mp4 -vf setpts=0.98*PTS ... OK",
    "variantUrl": "https://s3.omnimedia.saas/ffmpeg_mut_1.mp4"
  }
}`,
    },
    {
      id: 'GET_ACCOUNTS',
      method: 'GET',
      path: '/api/v1/accounts',
      summary: 'Listar Contas & Status de Proxies Exclusivos',
      description: 'Retorna a lista completa de contas com diagnósticos de latência dos proxies HTTP/SOCKS5.',
      requestBody: `// No request body required for GET`,
      response200: `{
  "statusCode": 200,
  "totalAccounts": 20,
  "data": [
    {
      "id": "acc_hot_01",
      "name": "Bella VIP Model BR",
      "category": "HOT",
      "proxy": { "ip": "177.12.89.45", "latencyMs": 42, "status": "ACTIVE" }
    }
  ]
}`,
    },
  ];

  const currentEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-indigo-500" />
          Documentação Interativa da API REST (OpenAPI / Swagger Specification)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Interface REST totalmente documentada para integração externa com outros microserviços e n8n/Make workflows.
        </p>
      </div>

      {/* Main Swagger Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Endpoints List */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 pb-2 border-b border-[var(--border-color)]">
            Endpoints da API v1
          </div>

          <div className="space-y-1">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpoint(ep.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${
                  selectedEndpoint === ep.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="truncate">{ep.path}</span>
                </div>
                <div className="text-[10px] font-sans text-[var(--text-muted)] mt-1 truncate">{ep.summary}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Payload & Playground Inspector */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--text-primary)]">
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">{currentEp.method}</span>
              <span>{currentEp.path}</span>
            </div>

            <button
              onClick={() => handleCopyCode(currentEp.requestBody)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Payload JSON'}
            </button>
          </div>

          <div>
            <h4 className="font-bold text-xs text-[var(--text-primary)]">{currentEp.summary}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{currentEp.description}</p>
          </div>

          {/* Request Body JSON */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold">Request Body Example</div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
              {currentEp.requestBody}
            </pre>
          </div>

          {/* Response 200 OK JSON */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Response 200 OK Example</div>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
              {currentEp.response200}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
