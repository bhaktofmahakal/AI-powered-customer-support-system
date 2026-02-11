'use client';

import { cn } from '@/lib/utils';
import { Terminal, Info, X, Network, Cpu, Activity, CircleCheck, Fingerprint } from 'lucide-react';

interface DebugPanelProps {
  trace: any;
  onClose?: () => void;
}

function safeParseTrace(trace: any): any {
  if (!trace) return null;
  if (typeof trace === 'string') {
    try {
      return JSON.parse(trace);
    } catch {
      return { selectedAgent: 'unknown', rationale: trace, toolsCalled: [] };
    }
  }
  return trace;
}

export function DebugPanel({ trace: rawTrace, onClose }: DebugPanelProps) {
  const trace = safeParseTrace(rawTrace);

  return (
    <aside className="w-[320px] h-full border-l border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col z-20 transition-all duration-300 shadow-xl overflow-hidden">
      <header className="h-16 flex-shrink-0 border-b border-primary/10 flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Context Panel</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary/10 rounded transition-all text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      {!trace ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4">
            Monitoring multi-agent routing... Ready for next prompt.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* Agent Profile Card (Branding) */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-tight">Active Engine</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Llama-3.3-70B</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Latency</span>
              <span className="text-[10px] font-mono text-primary font-bold">2.4s</span>
            </div>
          </div>

          {/* Routing Reasoning */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest block px-1">Reasoning Engine</label>
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Fingerprint className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Classifier Decision</span>
              </div>
              <p className="text-xs font-medium leading-relaxed italic text-slate-600 dark:text-slate-400">
                &quot;{trace.rationale}&quot;
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400">Mapped Agent:</span>
                <span className="text-[10px] font-black uppercase text-primary tracking-tighter">{trace.selectedAgent}</span>
              </div>
            </div>
          </div>

          {/* Context Management */}
          {trace.contextCompacted && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block px-1">Memory Optimization</label>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-600">Context Compacted</p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Thread history was automatically summarized to preserve context window tokens.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tools Log */}
          <div className="space-y-3 pb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Capability Execution</label>
            <div className="space-y-2">
              {trace.toolsCalled && trace.toolsCalled.length > 0 ? (
                trace.toolsCalled.map((tool: string, i: number) => (
                  <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(19,236,236,1)]"></div>
                      <code className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-200">{tool}</code>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400 italic">200 OK</span>
                  </div>
                ))
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No tools invoked</p>
                </div>
              )}
            </div>
          </div>

          {/* Done State */}
          <div className="flex items-center gap-2 text-green-500 px-1 py-4 border-t border-slate-100 dark:border-white/5">
            <CircleCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Response Ready</span>
          </div>
        </div>
      )}
    </aside>
  );
}
