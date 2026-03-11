import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useRef, useEffect } from 'react';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function AIAssistant() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Gia sư AI của bạn. Hãy nhờ tôi giải thích các khái niệm, tóm tắt tài liệu hoặc giúp bạn giải quyết vấn đề.',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // File list from Firebase
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [selectedPdfs, setSelectedPdfs] = useState([]);

  // Fetch syllabus files
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const syllabusRef = ref(db, `syllabuses/${currentUser.uid}`);
        onValue(syllabusRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const files = Object.entries(data)
              .filter(([id, syllabus]) => syllabus.fileUrl && syllabus.fileUrl !== '#')
              .map(([id, syllabus]) => ({
                id,
                name: syllabus.fileName || syllabus.title || 'Tài liệu không tên',
                url: syllabus.fileUrl
              }));
            setPdfs(files);
          } else {
            setPdfs([]);
          }
          setLoadingPdfs(false);
        });
      } else {
        setLoadingPdfs(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    alert('Đã lưu API Key!');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!apiKey) {
      alert('Vui lòng nhập Gemini API Key ở cột bên trái trước khi bắt đầu.');
      return;
    }

    // Add user message
    const newUserMsg = { id: Date.now(), sender: 'user', text: inputMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);
    
    const userPrompt = inputMessage;
    setInputMessage('');

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      let contextStr = '';
      if (selectedPdfs.length > 0) {
        const selectedNames = pdfs.filter(p => selectedPdfs.includes(p.id)).map(p => p.name).join(', ');
        contextStr = `Tôi đã cung cấp cho bạn các tài liệu sau: [${selectedNames}]. Hãy ưu tiên trả lời dựa trên những tài liệu này nếu có liên quan.\n\n`;
      }

      const prompt = `Bạn là một trợ lý AI thông minh dành cho Gia sư giáo dục. ${contextStr}Câu hỏi của người dùng là: "${userPrompt}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const newAiMsg = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: response.text || 'Tôi không thể trả lời câu hỏi này vào lúc này.'
      };
      setMessages(prev => [...prev, newAiMsg]);

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMsg = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: `Lỗi kết nối API: ${error.message}. Vui lòng kiểm tra lại API Key của bạn.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const togglePdf = (id) => {
    setSelectedPdfs(prev => 
      prev.includes(id) ? prev.filter(pdfId => pdfId !== id) : [...prev, id]
    );
  };

  return (
    <>
      <TutorNavbar activePage="ai" />
      <main className="pt-[68px] h-screen bg-[#F1F3F5] flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6">
            <h2 className="text-[20px] font-bold text-slate-800 mb-1">Nguồn</h2>
            <p className="text-[12px] text-slate-500 mb-6">Tải tài liệu học tập lên cho AI</p>

            <button className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg text-[14px] hover:bg-blue-700 transition-colors mb-6 shadow-sm shadow-blue-500/20">
              Tải tài liệu lên
            </button>

            <div className="space-y-2">
              {loadingPdfs ? (
                <div className="text-center py-4 text-slate-400 text-[13px]">Đang tải...</div>
              ) : pdfs.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[13px] italic bg-slate-50 border border-slate-100 rounded-lg">Chưa có tài liệu nào</div>
              ) : (
                pdfs.map(pdf => (
                  <div 
                    key={pdf.id} 
                    onClick={() => togglePdf(pdf.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedPdfs.includes(pdf.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selectedPdfs.includes(pdf.id) ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
                    }`}>
                      {selectedPdfs.includes(pdf.id) && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    </div>
                    <span className={`text-[13px] font-medium truncate ${selectedPdfs.includes(pdf.id) ? 'text-blue-700' : 'text-slate-700'}`}>
                      {pdf.name}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-[13px] font-bold text-slate-800 mb-2">Cài đặt Gemini API</h3>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">Nhập API Key để chat thật với Gemini 2.5 Flash.</p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Nhập API Key ở đây..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all mb-2"
              />
              <button 
                onClick={handleSaveApiKey}
                className="w-full bg-slate-800 text-white font-medium py-2 rounded-lg text-[12px] hover:bg-slate-900 transition-colors"
              >
                Lưu Key
              </button>
            </div>

          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <div className="h-[80px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-[24px] font-black text-slate-900">Trợ lý AI</h1>
              <p className="text-[13px] text-slate-500 mt-1">Hãy đặt câu hỏi về tài liệu học tập của bạn.</p>
            </div>
            <button className="bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-[13px] hover:bg-slate-300 transition-colors">
              Trò chuyện mới
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F1F3F5]">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] px-5 py-4 text-[14px] leading-relaxed shadow-sm overflow-x-auto ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-[4px]' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-[20px] rounded-tl-[4px] prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      msg.text
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-[20px] rounded-tl-[4px] px-5 py-4 shadow-sm flex items-center gap-1.5 h-[52px]">
                    <div className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-6 bg-white shrink-0">
            <div className="max-w-3xl mx-auto relative flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi AI để giải thích, tóm tắt, hoặc giải...."
                className="flex-1 bg-white border border-slate-200 rounded-xl py-4 pl-5 pr-4 text-[14px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all shadow-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 text-white font-bold w-[60px] rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-blue-600 shadow-sm shadow-blue-500/20"
              >
                Gửi
              </button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}

export default AIAssistant;
