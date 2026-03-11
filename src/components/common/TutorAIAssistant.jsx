import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useRef } from 'react';

function TutorAIAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      const unsubscribe = GeminiService.getChatHistory(user.uid, (history) => {
        // Transform Firestore data for UI
        const formatted = [];
        history.forEach(item => {
          if (item.prompt) formatted.push({ role: 'user', text: item.prompt });
          if (item.response) formatted.push({ role: 'assistant', text: item.response });
        });
        setMessages(formatted);
      });
      return () => unsubscribe();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setLoading(true);

    try {
      await GeminiService.askAssistant(user.uid, userMsg, () => {
        setLoading(false);
        // The listener in useEffect will update the messages
      });
    } catch (error) {
      console.error('AI Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping group-hover:hidden"></div>
        {isOpen ? <i className="fa-solid fa-xmark text-2xl"></i> : <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6 text-white">
            <h3 className="font-black text-lg">AI Trợ Lý Gia Sư</h3>
            <p className="text-xs opacity-80 font-medium">Sức mạnh từ Google Gemini</p>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50"
          >
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  <i className="fa-solid fa-face-smile-wink"></i>
                </div>
                <p className="text-slate-500 text-sm font-bold">Chào bạn! Tôi có thể giúp gì cho việc quản lý lớp học hôm nay?</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi AI về học sinh hoặc bài giảng..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default TutorAIAssistant;
