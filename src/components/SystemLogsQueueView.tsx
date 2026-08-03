'use client';

import React, { useState } from 'react';
import { Terminal, Server, RefreshCw, Play, Pause, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SystemLogsQueueView: React.FC = () => {
  const [isWorkerActive, setIsWorkerActive] = useState(true);

  const logsStream = [
    { id: 1, level: 'info', timestamp: '2026-08-03T12:00:01.102Z', msg: '[WinstonLogger] NestJS Application Bootstrap successful. Listening on port 3001.' },
    { id: 2, level: 'info', timestamp: '2026-08-03T12:00:02.450Z', msg: '[RedisCluster] BullMQ connected to 127.0.0.1:6379 (Queue: social-publishing-queue).' },
    { id: 3, level: 'info', timestamp: '2026-08-03T12:00:05.820Z', msg: '[ProxyManager] Verified 20 proxies (SOCKS5/HTTP/HTTPS). Avg Latency: 64ms.' },
    { id: 4, level: 'debug', timestamp: '2026-08-03T12:00:10.110Z', msg: '[SharpEngine] Processed micro-variation sha256_k91a2b for @bella_vip_br.' },
    { id: 5, level: 'info', timestamp: '2026-08-03T12:00:14.305Z', msg: '[PublishWorker] Job #job_991823a0 completed via InstagramAdapter. Post ID: ig_k9x2m1a0.' },
    { id: 6, level: 'warn', timestamp: '2026-08-03T12:00:20.912Z', msg: '[ProxyManager] Latency spike on proxy 188.40.142.11:1080 (110ms). Auto-recalibrating.' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            Telemetry Stream: Logs Winston & Fila BullMQ Redis
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Monitoramento em tempo real dos workers BullMQ, logs do Winston e status do cluster Redis.
          </p>
        </div>

        {/* Worker Toggle Button */}
        <button
          onClick={() => setIsWorkerActive(!isWorkerActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            isWorkerActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {isWorkerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          Worker BullMQ: {isWorkerActive ? 'RODANDO (5 Workers)' : 'PAUSADO'}
        </button>
      </div>

      {/* Cluster Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-muted)] text-[10px] font-mono block">Redis Memory Usage</span>
          <span className="text-lg font-black text-indigo-400 font-mono">24.5 MB</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-muted)] text-[10px] font-mono block">Jobs Concluídos Hoje</span>
          <span className="text-lg font-black text-emerald-400 font-mono">1.420</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-muted)] text-[10px] font-mono block">Jobs Falhos (Auto-Retry)</span>
          <span className="text-lg font-black text-rose-400 font-mono">18</span>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-muted)] text-[10px] font-mono block">Prometheus Metrics</span>
          <span className="text-lg font-black text-purple-400 font-mono">http://localhost:9090</span>
        </div>
      </div>

      {/* Winston Terminal Box */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Winston Live Logger Output Stream
          </span>
          <span className="text-[10px] text-slate-500">FORMAT: JSON / Standard Out</span>
        </div>

        <div className="space-y-2 text-xs">
          {logsStream.map((log) => (
            <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/50 p-1.5 rounded transition-colors">
              <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
              <span
                className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase shrink-0 ${
                  log.level === 'info'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : log.level === 'warn'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {log.level}
              </span>
              <span className="text-slate-300 overflow-x-auto">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
