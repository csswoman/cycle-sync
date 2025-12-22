import React, { useState, useRef, useEffect } from 'react';
import { AssistantTab, ChatMessage } from '../types';
import { sendChatMessage, analyzeImage, analyzeVideo } from '../services/geminiService';

interface SmartAssistantProps {
  onClose: () => void;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>(AssistantTab.CHAT);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hi Sarah! I am your CycleSync Assistant. How can I help you with your health today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResult, setImageResult] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Video State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoResult, setVideoResult] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsChatLoading(true);

    try {
      // Format history for Gemini API
      // Gemini requires history to start with 'user'. We skip the initial greeting if present.
      const validHistoryMessages = messages.at(0)?.role === 'model' ? messages.slice(1) : messages;

      const history = validHistoryMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(newMessage.text, history);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Assistant Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Error: ${errorMessage}. Please check your API key and connection.` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageResult(''); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsImageLoading(true);
    try {
      const result = await analyzeImage(selectedImage, imagePrompt);
      setImageResult(result);
    } catch (error) {
      setImageResult("Failed to analyze image.");
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (approx 10MB limit for browser based base64 reliability)
      if (file.size > 10 * 1024 * 1024) {
        alert("Video file too large for this demo. Please use a clip under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedVideo(reader.result as string);
        setVideoResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!selectedVideo) return;
    setIsVideoLoading(true);
    try {
      const result = await analyzeVideo(selectedVideo, videoPrompt);
      setVideoResult(result);
    } catch (error) {
      setVideoResult("Failed to analyze video.");
    } finally {
      setIsVideoLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-dark/95 backdrop-blur-xl border border-surface-dark shadow-2xl rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-surface-dark flex items-center justify-between bg-surface-dark/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <h2 className="text-lg font-bold text-white">Smart Assistant</h2>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-surface-dark/30 border-b border-surface-dark">
        <button
          onClick={() => setActiveTab(AssistantTab.CHAT)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === AssistantTab.CHAT ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-dark hover:text-white'}`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab(AssistantTab.IMAGE)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === AssistantTab.IMAGE ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-dark hover:text-white'}`}
        >
          Image
        </button>
        <button
          onClick={() => setActiveTab(AssistantTab.VIDEO)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === AssistantTab.VIDEO ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-dark hover:text-white'}`}
        >
          Video
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide relative">

        {/* TAB: CHAT */}
        {activeTab === AssistantTab.CHAT && (
          <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                      ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-surface-dark text-gray-200 rounded-bl-none'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-dark text-gray-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs italic">
                    Typing...
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-surface-dark border-transparent rounded-xl text-white text-sm placeholder-text-secondary focus:border-primary focus:ring-0"
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatLoading || !inputText.trim()}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: IMAGE ANALYSIS */}
        {activeTab === AssistantTab.IMAGE && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-dark/40 border border-surface-dark rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-4">
                Upload a photo of your meal or health docs.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-text-secondary
                      file:mr-2 file:py-1.5 file:px-3
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary-hover
                    "
                />

                {selectedImage && (
                  <div className="relative rounded-lg overflow-hidden border border-surface-dark bg-black/50 max-h-40 w-fit mx-auto">
                    <img src={selectedImage} alt="Preview" className="max-h-40 object-contain" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Prompt (e.g. nutrition check)"
                    className="w-full bg-surface-dark border-transparent rounded-lg text-white text-sm placeholder-text-secondary focus:border-primary focus:ring-0"
                  />
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={!selectedImage || isImageLoading}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {isImageLoading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">auto_awesome</span>}
                    Analyze
                  </button>
                </div>
              </div>
            </div>

            {imageResult && (
              <div className="bg-surface-dark/40 border border-surface-dark rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-primary font-bold mb-1 flex items-center gap-1 text-sm">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Result
                </h4>
                <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{imageResult}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: VIDEO ANALYSIS */}
        {activeTab === AssistantTab.VIDEO && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-dark/40 border border-surface-dark rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-4">
                Upload a short clip (max 10MB) to analyze form.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="block w-full text-xs text-text-secondary
                    file:mr-2 file:py-1.5 file:px-3
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary-hover
                  "
                />

                {selectedVideo && (
                  <div className="relative rounded-lg overflow-hidden border border-surface-dark bg-black/50 max-h-40 w-fit mx-auto">
                    <video src={selectedVideo} controls className="max-h-40 object-contain" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Prompt (e.g. check squat form)"
                    className="w-full bg-surface-dark border-transparent rounded-lg text-white text-sm placeholder-text-secondary focus:border-primary focus:ring-0"
                  />
                  <button
                    onClick={handleAnalyzeVideo}
                    disabled={!selectedVideo || isVideoLoading}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {isVideoLoading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">auto_awesome</span>}
                    Analyze Video
                  </button>
                </div>
              </div>
            </div>

            {videoResult && (
              <div className="bg-surface-dark/40 border border-surface-dark rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-primary font-bold mb-1 flex items-center gap-1 text-sm">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Result
                </h4>
                <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{videoResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAssistant;