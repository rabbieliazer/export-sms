
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  FileUp, 
  MessageSquare, 
  Search, 
  Download, 
  User, 
  ChevronRight,
  Clock,
  ArrowLeft,
  XCircle,
  Hash,
  FileCode,
  Globe,
  Send,
  Sparkles,
  Package,
  Trash2
} from 'lucide-react';
import { parseSMSXml } from './services/parser';
import { analyzeThread } from './services/gemini';
import { generateStandaloneHTML } from './services/exporter';
import { ChatThread, SMSMessage, AIAnalysisResult } from './types';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const parsedThreads = await parseSMSXml(text);
      setThreads(parsedThreads);
      if (parsedThreads.length > 0) {
        setSelectedThread(parsedThreads[0]);
      }
    } catch (error) {
      alert("Failed to parse the backup file.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedThread) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeThread(selectedThread.messages);
      setAnalysis(result);
    } catch (error) {
      alert("AI analysis failed.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = () => {
    if (!selectedThread || !newMessage.trim()) return;

    const newMsg: SMSMessage = {
      id: `local-${Date.now()}`,
      address: selectedThread.address,
      body: newMessage,
      date: Date.now(),
      type: 'sent',
      contactName: selectedThread.contactName
    };

    const updatedThread = {
      ...selectedThread,
      messages: [...selectedThread.messages, newMsg],
      lastMessageDate: newMsg.date
    };

    setThreads(prev => prev.map(t => t.address === selectedThread.address ? updatedThread : t));
    setSelectedThread(updatedThread);
    setNewMessage('');
  };

  const deleteMessage = (id: string) => {
    if (!selectedThread) return;
    const updatedMessages = selectedThread.messages.filter(m => m.id !== id);
    const updatedThread = { ...selectedThread, messages: updatedMessages };
    setThreads(prev => prev.map(t => t.address === selectedThread.address ? updatedThread : t));
    setSelectedThread(updatedThread);
  };

  const exportToHTML = () => {
    if (!selectedThread) return;
    const htmlContent = generateStandaloneHTML(selectedThread, analysis);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${selectedThread.contactName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fix: Added missing exportToJSON function to handle the JSON download
  const exportToJSON = () => {
    if (!selectedThread) return;
    const data = {
      thread: selectedThread,
      analysis: analysis
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${selectedThread.contactName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPortableSite = async () => {
    // This fetches the current script to bundle it
    try {
      const response = await fetch(window.location.href);
      const htmlText = await response.text();
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sms-to-fig-portable-site.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Could not bundle site. Try saving the page directly via Browser (Ctrl+S).");
    }
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(t => 
      t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.address.includes(searchQuery)
    );
  }, [threads, searchQuery]);

  if (threads.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto transform -rotate-6 shadow-2xl">
            <FileUp className="w-10 h-10 text-white rotate-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SMS to FIG</h1>
          <div className="relative group">
            <input type="file" accept=".xml" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="w-full bg-slate-900 group-hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Upload XML Backup
            </div>
          </div>
          {isLoading && <p className="animate-pulse text-indigo-600 font-bold">Processing XML...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Threads</h2>
            <button onClick={downloadPortableSite} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Download site as single file">
              <Package className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map(thread => (
            <button key={thread.address} onClick={() => { setSelectedThread(thread); setAnalysis(null); }}
              className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 hover:bg-white transition-all ${selectedThread?.address === thread.address ? 'bg-white shadow-sm ring-1 ring-inset ring-slate-200' : ''}`}>
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-left min-w-0">
                <div className="font-bold text-slate-900 truncate">{thread.contactName}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{thread.messages[thread.messages.length-1]?.body}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        {selectedThread ? (
          <>
            <header className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><User className="w-5 h-5" /></div>
                <h2 className="text-lg font-black text-slate-900">{selectedThread.contactName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Thinking...' : 'AI Insights'}
                </button>
                <button onClick={exportToHTML} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"><Globe className="w-4 h-4 text-slate-600" /></button>
                <button onClick={exportToJSON} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"><FileCode className="w-4 h-4 text-slate-600" /></button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {selectedThread.messages.map((msg, i) => (
                    <div key={msg.id} className={`group flex flex-col ${msg.type === 'sent' ? 'items-end' : 'items-start'} relative`}>
                      <div className="flex items-center gap-2 max-w-[80%]">
                        {msg.type === 'received' && <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>}
                        <div className={`px-5 py-3 rounded-2xl text-sm ${msg.type === 'sent' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                          {msg.body}
                        </div>
                        {msg.type === 'sent' && <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <span className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(msg.date, 'h:mm a')}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="max-w-4xl mx-auto flex gap-2 bg-slate-100 p-2 rounded-2xl">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type locally..." className="flex-1 bg-transparent border-none outline-none text-sm px-3" />
                    <button onClick={handleSendMessage} className="p-2 bg-indigo-600 text-white rounded-xl"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {(analysis || isAnalyzing) && (
                <div className="w-80 border-l border-slate-200 p-6 bg-white overflow-y-auto">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Conversation AI</h3>
                  {isAnalyzing ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-32 bg-slate-50 rounded-2xl"></div>
                      <div className="h-10 bg-slate-50 rounded-xl"></div>
                    </div>
                  ) : analysis && (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400">SUMMARY</label>
                        <div className="mt-2 p-4 bg-slate-50 rounded-2xl text-sm leading-relaxed">{analysis.summary}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-indigo-50 rounded-xl text-center">
                          <label className="text-[10px] font-bold text-indigo-400 block mb-1">SENTIMENT</label>
                          <span className="text-xs font-black text-indigo-700">{analysis.sentiment}</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-center">
                          <label className="text-[10px] font-bold text-emerald-400 block mb-1">TONE</label>
                          <span className="text-xs font-black text-emerald-700">{analysis.tone}</span>
                        </div>
                      </div>
                      {analysis.keyDates.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400">SCHEDULED</label>
                          <ul className="mt-2 space-y-2">
                            {analysis.keyDates.map((d, i) => <li key={i} className="text-xs font-bold p-2 bg-slate-50 rounded-lg flex items-center gap-2"><Clock className="w-3 h-3" /> {d}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="font-bold">Select a thread to begin</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
