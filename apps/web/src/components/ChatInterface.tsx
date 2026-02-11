'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Menu, Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api as client } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
  createdAt: string;
  debugTrace?: any;
  toolCalls?: any[];
}

interface ChatInterfaceProps {
  conversationId?: string;
  onTraceUpdate: (trace: any) => void;
  onMenuToggle: () => void;
  onConversationChange: (id: string | undefined) => void;
}

export function ChatInterface({
  conversationId,
  onTraceUpdate,
  onMenuToggle,
  onConversationChange
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isTestAuth = typeof window !== 'undefined' && window.location.search.includes('testAuth=true');

  useEffect(() => {
    if (conversationId) {
      loadHistory(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingStatus]);

  async function loadHistory(id: string) {
    try {
      const res = await (client as any).api['chat']['conversations'][':id'].$get({
        param: { id },
        query: isTestAuth ? { testAuth: 'true' } : undefined
      });

      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json() as any;

      const parsedMessages = data.messages.map((m: any) => ({
        ...m,
        debugTrace: typeof m.debugTrace === 'string' ? JSON.parse(m.debugTrace) : m.debugTrace,
        toolCalls: typeof m.toolCalls === 'string' ? JSON.parse(m.toolCalls) : m.toolCalls,
      }));
      setMessages(parsedMessages);
    } catch (error) {
      console.error('History load error:', error);
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setThinkingStatus('Analyzing your request...');

    try {
      const authParam = isTestAuth ? '?testAuth=true' : '';
      const response = await fetch(`/api/chat/messages${authParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentMsgId = 'assistant-' + Date.now();
      let streamAgentType = '';
      let streamTrace: any = null;
      let streamTools: any[] = [];

      setMessages(prev => [...prev, {
        id: currentMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'thinking') {
              setThinkingStatus(data.status);
              if (data.agentType) setActiveAgent(data.agentType);
            } else if (data.type === 'text') {
              assistantContent += data.content;
              setMessages(prev => prev.map(m =>
                m.id === currentMsgId ? { ...m, content: assistantContent } : m
              ));
              setThinkingStatus(null);
            } else if (data.type === 'done') {
              streamAgentType = data.agentType;
              streamTrace = data.debugTrace;
              streamTools = data.toolCalls;

              setMessages(prev => prev.map(m =>
                m.id === currentMsgId ? {
                  ...m,
                  agentType: streamAgentType,
                  debugTrace: streamTrace,
                  toolCalls: streamTools
                } : m
              ));

              onTraceUpdate(streamTrace);
              if (data.conversationId && !conversationId) {
                onConversationChange(data.conversationId);
              } else {
                onConversationChange(conversationId);
              }
            }
          } catch (e) {
            console.warn('SSE Parse error', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setThinkingStatus(null);
      setActiveAgent(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-background-dark relative overflow-hidden font-display transition-colors duration-300">
      <header className="h-16 flex-shrink-0 border-b border-primary/10 flex items-center justify-between px-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-primary/10 rounded-full transition-all text-slate-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight flex items-center gap-2">
              {conversationId ? 'Conversation' : 'New Chat'}
              <span className="px-2 py-0.5 text-[10px] rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold uppercase tracking-widest border border-green-200 dark:border-green-800">
                Active
              </span>
            </h1>
            <p className="text-xs text-slate-500">Multi-Agent Architecture v2.4</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-background-dark dark:text-white">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Online</span>
          </div>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <span className="material-icons text-xl">more_vert</span>
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 space-y-8 max-w-4xl mx-auto w-full"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-0 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary rotate-3 shadow-lg shadow-primary/10 transition-transform hover:rotate-6">
              <span className="material-icons text-5xl">auto_awesome</span>
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-bold tracking-tight text-background-dark dark:text-white">How can I assist you today?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Our multi-agent system is ready to help with orders, billing, or general support.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">
              {[
                { label: "Check my order status", icon: "local_shipping" },
                { label: "I need a refund", icon: "payments" },
                { label: "What's the return policy?", icon: "help" },
                { label: "Update my account", icon: "manage_accounts" }
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion.label)}
                  className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary hover:shadow-lg transition-all text-left flex items-center gap-3 group"
                >
                  <span className="material-icons text-primary/50 group-hover:text-primary transition-colors">{suggestion.icon}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col space-y-2 animate-in slide-in-from-bottom-2 duration-300",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest flex items-center gap-1",
                  msg.agentType === 'order' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
                    msg.agentType === 'billing' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                      "bg-primary/20 text-primary border-primary/30"
                )}>
                  <span className="material-icons text-[12px]">
                    {msg.agentType === 'order' ? 'local_shipping' :
                      msg.agentType === 'billing' ? 'payments' : 'support_agent'}
                  </span>
                  {msg.agentType ? `${msg.agentType.charAt(0).toUpperCase() + msg.agentType.slice(1)} Agent` : 'AI Assistant'}
                </span>
              </div>
            )}

            <div className={cn(
              "max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed",
              msg.role === 'user'
                ? "bg-primary/10 border border-primary/20 rounded-tr-none text-background-dark dark:text-white font-medium"
                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none text-slate-800 dark:text-slate-200"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && !msg.content && (
                <div className="flex gap-1 py-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 px-1 italic">
              {msg.role === 'user' ? 'Delivered' : 'Synthesized'} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {thinkingStatus && (
          <div className="flex items-center gap-3 text-slate-400 px-1 animate-in fade-in duration-300">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-xs font-medium italic">
              {activeAgent ? `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Agent: ` : ''}
              {thinkingStatus}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-primary/10 bg-white dark:bg-background-dark/50 transition-colors">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto w-full relative"
        >
          <div className="flex items-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <button
              type="button"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              id="message-input"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type your message here..."
              rows={1}
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 resize-none max-h-32 custom-scrollbar placeholder:text-slate-400 text-slate-800 dark:text-slate-100 italic"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  !input.trim() || isLoading
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-primary text-background-dark hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
            Shift + Enter for new line • Multi-Agent Routing Active
          </p>
        </form>
      </div>
    </div>
  );
}
