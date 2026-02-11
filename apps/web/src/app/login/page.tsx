'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col mesh-gradient font-display">
      {/* Top Navigation / Brand Bar */}
      <nav className="w-full p-8 flex justify-between items-center">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-6 transition-transform">
            <span className="material-icons text-background-dark -rotate-3 group-hover:-rotate-6 transition-transform">bolt</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-background-dark dark:text-white uppercase">
            Nexus<span className="text-primary italic">AI</span>
          </span>
        </div>
        <div className="hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Multi-Agent Architecture v2.4</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/80 dark:bg-background-dark/80 border border-primary/10 rounded-2xl shadow-[0_20px_50px_rgba(19,236,236,0.1)] p-8 md:p-12 relative overflow-hidden backdrop-blur-xl">
            {/* Decorative Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 shadow-[0_0_20px_rgba(19,236,236,0.5)]"></div>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-background-dark dark:text-white mb-4 tracking-tighter uppercase leading-none">
                Enterprise <br /><span className="text-primary">Intelligence</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-widest opacity-70">
                Secure access to the multi-agent routing engine.
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-6">
              <button
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full flex items-center justify-center gap-4 bg-background-dark dark:bg-white text-white dark:text-background-dark p-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/10 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 transition-transform" />
                <span className="text-sm font-black uppercase tracking-widest">Connect via Google</span>
              </button>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white dark:bg-background-dark px-6 text-slate-400 font-black tracking-[0.3em]">Identity Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center gap-2 p-5 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-colors">
                  <span className="material-icons text-primary text-2xl">bolt</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Fast Sync</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 p-5 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-colors">
                  <span className="material-icons text-primary text-2xl">security</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">AES-256</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-primary/5 flex flex-col items-center gap-4">
              <div className="flex gap-8">
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Security</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacy</a>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest opacity-50">BY ACCESSING THIS SYSTEM YOU AGREE TO TERMS</p>
            </div>
          </div>

          <p className="text-center mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] opacity-40">
            NexusAI // Core Systems Branch // 2026
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(19,236,236,0.5)]"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
