import React, { useState, useRef, useEffect } from 'react';
import { AssistantTab } from '@/types';
import { useGeminiAssistant } from '@/hooks/useGeminiAssistant';
import { Button } from '@/components/ui/Button';
import { ChatTab } from './components/ChatTab';
import { ImageTab } from './components/ImageTab';
import { VideoTab } from './components/VideoTab';
import { useLanguage } from '@/i18n/LanguageContext';

interface SmartAssistantProps {
  onClose: () => void;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ onClose }) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AssistantTab>(AssistantTab.CHAT);

  const initialGreeting = language === 'es'
    ? '¡Hola! Soy tu asistente de CycleSync. ¿Cómo puedo ayudarte con tu salud hoy?'
    : 'Hi! I am your CycleSync Assistant. How can I help you with your health today?';

  const {
    messages,
    isChatLoading,
    isImageLoading,
    isVideoLoading,
    handleSendMessage,
    handleImageAnalysis,
    handleVideoAnalysis
  } = useGeminiAssistant([
    { id: '1', role: 'model', text: initialGreeting }
  ], language);

  const [inputText, setInputText] = useState('');

  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResult, setImageResult] = useState('');

  // Video State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoResult, setVideoResult] = useState('');

  const onSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await handleSendMessage(text);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageResult('');
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImageResult('');
    }
  };

  const onAnalyzeImage = async () => {
    if (!selectedImage) return;
    try {
      const result = await handleImageAnalysis(selectedImage, imagePrompt);
      setImageResult(result);
    } catch (error) {
      setImageResult("Failed to analyze image.");
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    } else {
      setSelectedVideo(null);
      setVideoResult('');
    }
  };

  const onAnalyzeVideo = async () => {
    if (!selectedVideo) return;
    try {
      const result = await handleVideoAnalysis(selectedVideo, videoPrompt);
      setVideoResult(result);
    } catch (error) {
      setVideoResult("Failed to analyze video.");
    }
  };

  const handleUnifiedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleImageSelect(e);
      setActiveTab(AssistantTab.IMAGE);
    } else if (file.type.startsWith('video/')) {
      handleVideoSelect(e);
      setActiveTab(AssistantTab.VIDEO);
    }
  };


  return (
    <div className="flex flex-col h-full overflow-hidden bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl">
      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <h2 className="text-lg font-bold text-foreground">Smart Assistant</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex p-2 gap-1 bg-secondary/30 border-b border-border">
        {[
          { id: AssistantTab.CHAT, label: t.chat },
          { id: AssistantTab.IMAGE, label: t.image },
          { id: AssistantTab.VIDEO, label: t.video }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide relative">
        {activeTab === AssistantTab.CHAT && (
          <ChatTab
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            isChatLoading={isChatLoading}
            onSend={onSend}
            onFileSelect={handleUnifiedFileSelect}
          />
        )}

        {activeTab === AssistantTab.IMAGE && (
          <ImageTab
            selectedImage={selectedImage}
            imagePrompt={imagePrompt}
            setImagePrompt={setImagePrompt}
            imageResult={imageResult}
            isImageLoading={isImageLoading}
            onImageSelect={handleImageSelect}
            onAnalyzeImage={onAnalyzeImage}
          />
        )}

        {activeTab === AssistantTab.VIDEO && (
          <VideoTab
            selectedVideo={selectedVideo}
            videoPrompt={videoPrompt}
            setVideoPrompt={setVideoPrompt}
            videoResult={videoResult}
            isVideoLoading={isVideoLoading}
            onVideoSelect={handleVideoSelect}
            onAnalyzeVideo={onAnalyzeVideo}
          />
        )}
      </div>
    </div>
  );
};

export default SmartAssistant;