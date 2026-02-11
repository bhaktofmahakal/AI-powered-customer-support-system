'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationSidebar, ConversationSidebarRef } from '@/components/ConversationSidebar';
import { DebugPanel } from '@/components/DebugPanel';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [currentTrace, setCurrentTrace] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<ConversationSidebarRef>(null);

  useEffect(() => {
    // Bypass auth check if testAuth query param is present
    if (typeof window !== 'undefined' && window.location.search.includes('testAuth=true')) {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access in testAuth mode even without a session
  const isTestAuth = typeof window !== 'undefined' && window.location.search.includes('testAuth=true');
  if (!session && !isTestAuth) return null;

  const handleConversationChange = () => {
    // Refresh the sidebar conversation list
    sidebarRef.current?.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1st & 2nd Columns: Sidebar & Conversations */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex-shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ConversationSidebar
          ref={sidebarRef}
          currentConversationId={conversationId}
          onSelectConversation={(id) => {
            setConversationId(id);
            setCurrentTrace(null);
            setIsSidebarOpen(false);
          }}
          onNewConversation={() => {
            setConversationId(undefined);
            setCurrentTrace(null);
            setIsSidebarOpen(false);
          }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* 3rd Column: Main Chat */}
      <main className="flex-1 flex flex-col relative bg-white dark:bg-background-dark/20 min-w-0">
        <ChatInterface
          conversationId={conversationId}
          onTraceUpdate={setCurrentTrace}
          onMenuToggle={() => setIsSidebarOpen(true)}
          onConversationChange={handleConversationChange}
        />
      </main>

      {/* 4th Column (optional debug panel): Right Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 bg-white dark:bg-background-dark shadow-2xl lg:shadow-none",
        currentTrace ? "translate-x-0" : "translate-x-full"
      )}>
        <DebugPanel
          trace={currentTrace}
          onClose={() => setCurrentTrace(null)}
        />
      </div>
    </div>
  );
}
