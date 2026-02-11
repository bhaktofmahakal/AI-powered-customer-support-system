'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Plus, MessageSquare, Trash2, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api as client } from '@/lib/api-client';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onClose?: () => void;
}

export interface ConversationSidebarRef {
  refresh: () => void;
}

export const ConversationSidebar = forwardRef<ConversationSidebarRef, ConversationSidebarProps>(
  ({ currentConversationId, onSelectConversation, onNewConversation, onClose }, ref) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const isTestAuth = typeof window !== 'undefined' && window.location.search.includes('testAuth=true');

    useImperativeHandle(ref, () => ({
      refresh: () => loadConversations()
    }));

    useEffect(() => {
      loadConversations();
    }, []);

    async function loadConversations() {
      try {
        setIsLoading(true);
        const res = await (client.api as any)['chat']['conversations'].$get({
          query: isTestAuth ? { testAuth: 'true' } : undefined
        });

        if (!res.ok) throw new Error('Failed to load conversations');
        const data = await res.json() as { conversations: Conversation[] };
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Sidebar error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    async function deleteConversation(id: string) {
      try {
        const res = await (client.api as any)['chat']['conversations'][':id'].$delete({
          param: { id },
          query: isTestAuth ? { testAuth: 'true' } : undefined
        });

        if (!res.ok) throw new Error('Failed to delete');

        if (currentConversationId === id) {
          onNewConversation();
        }
        loadConversations();
        setDeleteId(null);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    return (
      <aside className="w-[280px] h-full flex-shrink-0 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col z-50 font-display transition-colors duration-300">
        <div className="p-4 border-b border-primary/10">
          <button
            onClick={onNewConversation}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 mb-2 tracking-[0.2em]">
            History Logs
          </div>

          {isLoading && conversations.length === 0 ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs text-slate-400 italic">No previous logs records.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                  currentConversationId === conv.id
                    ? "bg-primary/10 border-primary/20 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-primary/5 hover:border-primary/10"
                )}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    currentConversationId === conv.id ? "text-primary" : "text-slate-400"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold truncate tracking-tight",
                    currentConversationId === conv.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-primary/80"
                  )}>
                    {conv.title || 'Untitled Session'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(conv.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-primary/10 bg-slate-50 dark:bg-background-dark/80 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shadow-inner rotate-3 transition-transform hover:rotate-6">
              <User className="w-5 h-5 text-primary -rotate-3 hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black truncate text-slate-800 dark:text-white uppercase tracking-tighter">
                Session Active
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                <p className="text-[9px] text-primary font-black uppercase tracking-[0.1em]">
                  Encrypted
                </p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl max-w-sm w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold tracking-tight uppercase">Purge Session?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">This will permanently delete all logs and context associated with this conversation.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Retention
                </button>
                <button
                  onClick={() => deleteConversation(deleteId)}
                  className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-500/30"
                >
                  Purge
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  }
);

ConversationSidebar.displayName = 'ConversationSidebar';
