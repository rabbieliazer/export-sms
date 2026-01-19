
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
  Send
} from 'lucide-react';
import { parseSMSXml } from './services/parser';
import { generateStandaloneHTML } from './services/exporter';
import { ChatThread, SMSMessage } from './types';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      alert("Failed to parse the backup file. Ensure it's a valid XML from SMS Backup & Restore.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(t => 
      t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.address.includes(searchQuery)
    );
  }, [threads, searchQuery]);

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

    // Update the master threads list to reflect the new message
    setThreads(prev => prev.map(t => t.address === selectedThread.address ? updatedThread : t));
    // Update the currently viewed thread
    setSelectedThread(updatedThread);
    // Clear input
    setNewMessage('');
  };

  const exportToJSON = () => {
    if (!selectedThread) return;
    const data = JSON.stringify(selectedThread, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thread-${selectedThread.address}.json`;
    a.click();
  };

  const exportToHTML = () => {
    if (!selectedThread) return;
    const htmlContent = generateStandaloneHTML(selectedThread, null);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-with-${selectedThread.contactName.replace(/\s+/g, '-')}.html`;
    a.click();
  };

  if (threads.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-8 border border-slate-100 transition-all hover:shadow-2xl">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto transform -rotate-6 shadow-indigo-200 shadow-2xl">
              <FileUp className="w-12 h-12 text-white rotate-6" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">SMS to FIG</h1>
            <p className="text-slate-500 text-lg font-medium">
              Transform SMS backups into visual stories.
            </p>
          </div>

          <div className="relative group">
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full bg-slate-900 group-hover:bg-indigo-600 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 transform group-active:scale-95">
              <Download className="w-6 h-6" />
              Upload XML Backup
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">Key Features</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Visual Timeline
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Thread Management
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Offline HTML Export
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Simple Archive
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-3 text-indigo-600 font-bold animate-pulse py-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              <span className="text-sm">Processing Backup Data...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                 <FileUp className="w-4 h-4 text-white" />
               </div>
               <h2 className="text-lg font-bold text-slate-900 tracking-tight">Messages</h2>
            </div>
            <button 
              onClick={() => setThreads([])} 
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              title="Upload different file"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search contacts or numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent border focus:border-indigo-500 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredThreads.map(thread => (
            <button
              key={thread.address}
              onClick={() => {
                setSelectedThread(thread);
              }}
              className={`w-full p-4 flex items-start gap-4 hover:bg-white transition-all border-b border-slate-100/50 group ${
                selectedThread?.address === thread.address ? 'bg-white shadow-sm ring-1 ring-inset ring-slate-200' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selectedThread?.address === thread.address ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-500'
              }`}>
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{thread.contactName}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                    {format(thread.lastMessageDate, 'MMM d')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {thread.messages[thread.messages.length - 1].body}
                </p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-white">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <header className="px-8 py-5 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedThread.contactName}</h2>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {selectedThread.address} • {selectedThread.messages.length} messages
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToHTML}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-bold group"
                >
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                  HTML Export
                </button>
                
                <button
                  onClick={exportToJSON}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold"
                >
                  <FileCode className="w-4 h-4 text-slate-400" />
                  JSON
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Message History & Input Column */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                  {selectedThread.messages.map((msg, i) => {
                    const isNewDay = i === 0 || format(msg.date, 'yyyyMMdd') !== format(selectedThread.messages[i-1].date, 'yyyyMMdd');
                    return (
                      <React.Fragment key={msg.id}>
                        {isNewDay && (
                          <div className="flex justify-center my-10 relative">
                             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <span className="relative px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                              {format(msg.date, 'EEEE, MMMM do, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${msg.type === 'sent' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[80%] md:max-w-[70%] px-6 py-3.5 rounded-3xl shadow-sm text-[15px] leading-relaxed transition-transform hover:scale-[1.01] ${
                            msg.type === 'sent' 
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 shadow-md' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                          }`}>
                            {msg.body}
                          </div>
                          <span className="mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 px-1 opacity-70">
                            {format(msg.date, 'h:mm a')}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Local Message Input Bar */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-100 p-2 rounded-2xl border border-transparent focus-within:border-indigo-500 transition-all focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:transform-none shadow-lg shadow-indigo-100"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30 p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">No Thread Selected</h3>
            <p className="max-w-xs text-sm text-slate-400 font-medium">Select a conversation from the sidebar to view the full message history.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
