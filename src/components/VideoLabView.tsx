'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Video, Image as ImageIcon, Sparkles, Settings, Play, CheckCircle2, Loader2, Download, Plus, X, ListVideo, Layers } from 'lucide-react';

interface QueuedTask {
  id: string;
  status: 'Aguardando' | 'Gerando vídeo' | 'Pronto' | 'Erro';
  prompt: string;
  resultUrl?: string;
  progress?: number;
  savedTo?: string;
  errorMsg?: string;
}

export function VideoLabView() {
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [motionPrompt, setMotionPrompt] = useState('Quero que ela fale em tom de voz picante "Seja sincero, ficaria comigo mesmo eu sendo especial?"');
  
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [scenarioImage, setScenarioImage] = useState<string | null>(null);
  
  const [queue, setQueue] = useState<QueuedTask[]>([]);

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const scenarioInputRef = useRef<HTMLInputElement>(null);

  // Carregar API Key do localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('kie_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('kie_api_key', key);
    setIsSettingsOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processTask = async (task: QueuedTask) => {
    setQueue(q => q.map(t => t.id === task.id ? { ...t, status: 'Gerando vídeo', progress: 5 } : t));
    
    try {
      const body: any = {
        apiKey,
        prompt: task.prompt,
        batchName,
        duration: 8,
        ratio: '9:16',
      };
      if (subjectImage) body.subjectImageBase64 = subjectImage;
      if (scenarioImage) body.scenarioImageBase64 = scenarioImage;

      // Simulate progress while we wait
      const progressInterval = setInterval(() => {
        setQueue(q => q.map(t => {
          if (t.id === task.id && t.status === 'Gerando vídeo') {
            return { ...t, progress: Math.min((t.progress || 5) + 3, 90) };
          }
          return t;
        }));
      }, 3000);

      const res = await fetch('/api/kie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      clearInterval(progressInterval);

      const data = await res.json();

      if (data.success) {
        setQueue(q => q.map(t => t.id === task.id ? {
          ...t,
          status: 'Pronto',
          progress: 100,
          resultUrl: data.videoUrl,
          savedTo: data.savedTo,
        } : t));
      } else {
        setQueue(q => q.map(t => t.id === task.id ? {
          ...t,
          status: 'Erro',
          errorMsg: data.error || 'Erro desconhecido',
        } : t));
      }
    } catch (err: any) {
      setQueue(q => q.map(t => t.id === task.id ? {
        ...t,
        status: 'Erro',
        errorMsg: err.message,
      } : t));
    }
  };

  const addToQueue = () => {
    if (!batchName) {
      alert('Por favor, defina um Nome do Lote primeiro.');
      return;
    }
    if (!apiKey) {
      alert('Por favor, insira sua API Key da Kie.ai nas Configurações (⚙️).');
      setIsSettingsOpen(true);
      return;
    }
    const newTask: QueuedTask = {
      id: Math.random().toString(36).substring(7),
      status: 'Aguardando',
      prompt: motionPrompt,
      progress: 0,
    };
    setQueue(prev => {
      const updated = [...prev, newTask];
      return updated;
    });

    // Start processing immediately
    processTask(newTask);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Video className="w-6 h-6" />
            </span>
            Video Lab Pro
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-amber-950 uppercase tracking-wider">
              Powered by Kie.ai
            </span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">
            Geração em lote de vídeos 9:16 de alta qualidade via Grok Imagine.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <Layers className="w-4 h-4 text-indigo-400" />
            <input 
              type="text" 
              placeholder="Nome do Lote (Ex: Lote_Hot_PT)"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-white w-48 placeholder:font-normal placeholder:text-[var(--text-muted)]"
            />
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Sidebar - Prompts & Assets (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-500/20 to-transparent">
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5">
              
              {/* Assunto Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assunto (Input Image)</label>
                <div 
                  onClick={() => subjectInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-[var(--border-color)] hover:border-amber-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group bg-[var(--bg-primary)]"
                >
                  {subjectImage ? (
                    <>
                      <img src={subjectImage} alt="Assunto" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-xs font-bold text-white">Trocar Imagem</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                      <span className="text-xs font-semibold text-[var(--text-muted)]">Clique para enviar</span>
                    </>
                  )}
                  <input type="file" hidden ref={subjectInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, setSubjectImage)} />
                </div>
              </div>

              {/* Cenario Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Cenário (Background)</label>
                <div 
                  onClick={() => scenarioInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-[var(--border-color)] hover:border-amber-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group bg-[var(--bg-primary)]"
                >
                  {scenarioImage ? (
                    <>
                      <img src={scenarioImage} alt="Cenário" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-xs font-bold text-white">Trocar Imagem</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                      <span className="text-xs font-semibold text-[var(--text-muted)]">Opcional</span>
                    </>
                  )}
                  <input type="file" hidden ref={scenarioInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, setScenarioImage)} />
                </div>
              </div>

            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
             <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Prompt Global de Movimento</label>
             <textarea 
               value={motionPrompt}
               onChange={(e) => setMotionPrompt(e.target.value)}
               className="w-full h-32 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-medium text-white focus:outline-none focus:border-amber-500/50 resize-none"
               placeholder="Descreva o que deve acontecer no vídeo..."
             />
             
             <div className="flex gap-3">
               <div className="flex-1 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1">
                 <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duração</span>
                 <span className="text-sm font-black text-white">08 SEGUN</span>
               </div>
               <div className="flex-1 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1">
                 <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Proporção</span>
                 <span className="text-sm font-black text-white">9:16 VERT</span>
               </div>
             </div>

             <button 
               onClick={addToQueue}
               className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
             >
               <Sparkles className="w-4 h-4" />
               GERAR VÍDEO
             </button>
          </div>
        </div>

        {/* Right Content - Queue & History (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50">
             <div className="flex items-center gap-6">
               <button className="text-sm font-black text-white flex items-center gap-2">
                 <ListVideo className="w-4 h-4 text-amber-500" />
                 FILA DE GERAÇÃO
               </button>
               <button className="text-sm font-bold text-[var(--text-muted)] hover:text-white transition-all">
                 HISTÓRICO
               </button>
             </div>
             
             <div className="px-3 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
               <span className="text-xs font-bold text-[var(--text-muted)]">STATUS DA FILA: </span>
               <span className="text-xs font-black text-amber-500 ml-1">{queue.length} Tarefas</span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 space-y-3">
                <Video className="w-12 h-12" />
                <p className="font-bold">Fila vazia</p>
              </div>
            ) : (
              queue.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-amber-500/30 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0 overflow-hidden">
                    {subjectImage ? (
                       <img src={subjectImage} alt="Thumb" className="w-full h-full object-cover opacity-80" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                         <ImageIcon className="w-6 h-6 opacity-30" />
                       </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--text-secondary)]">TAREFA #{idx + 1}</span>
                      
                      {task.status === 'Pronto' && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> PRONTO
                        </span>
                      )}
                      {task.status === 'Gerando vídeo' && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> GERANDO VÍDEO
                        </span>
                      )}
                      {task.status === 'Aguardando' && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-color)]">
                          AGUARDANDO
                        </span>
                      )}
                      {task.status === 'Erro' && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          ERRO
                        </span>
                      )}
                    </div>

                    {task.status === 'Pronto' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          {task.resultUrl && task.resultUrl !== '#' && (
                            <a href={task.resultUrl} target="_blank" rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs flex items-center gap-2 hover:bg-slate-200 transition-all">
                              <Play className="w-3.5 h-3.5 fill-black" />
                              ASSISTIR
                            </a>
                          )}
                          {task.resultUrl && task.resultUrl !== '#' && (
                            <a href={task.resultUrl} download
                              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white transition-all">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {task.savedTo && (
                          <p className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2 py-1 truncate">
                            ✓ Salvo: {task.savedTo}
                          </p>
                        )}
                      </div>
                    ) : task.status === 'Erro' ? (
                      <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2">
                        {task.errorMsg || 'Erro ao gerar vídeo.'}
                      </p>
                    ) : (
                      <div className="w-full h-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                        <div 
                          className={`h-full ${task.status === 'Gerando vídeo' ? 'bg-amber-500' : 'bg-[var(--border-color)]'}`} 
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Configurações Kie.ai
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Kie.ai API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                Sua chave ficará salva localmente no navegador.
              </p>
            </div>

            <button 
              onClick={() => saveApiKey(apiKey)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
