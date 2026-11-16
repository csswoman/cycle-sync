import React, { useState, useRef, useEffect } from 'react';
import { AssistantTab } from '@/types';
import { useGeminiAssistant } from '@/hooks/useGeminiAssistant';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
    <div className="flex flex-col h-full overflow-hidden bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/70 flex items-center justify-between bg-card/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-blossom/20 via-blossom-soft/40 to-primary/10 border border-blossom/30 flex items-center justify-center text-primary shadow-sm shrink-0">
            <Icon name="chat_circle_dots" size={22} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight truncate">
              {t.assistantTitle}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {t.assistantOnline} • {t.assistantSubtitle}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0"
          aria-label="Cerrar asistente"
        >
          <Icon name="close" size={18} weight="bold" />
        </button>
      </div>

      {/* Segmented Tabs */}
      <div className="px-3.5 pt-2.5 pb-2 bg-background/30 border-b border-border/50">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-secondary/60 border border-border/40 gap-1 text-xs">
          {[
            { id: AssistantTab.CHAT, label: t.chat, icon: 'chat_circle_dots' },
            { id: AssistantTab.IMAGE, label: t.image, icon: 'photo_camera' },
            { id: AssistantTab.VIDEO, label: t.video, icon: 'videocam' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon name={tab.icon} size={15} weight={activeTab === tab.id ? 'duotone' : 'regular'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4 relative flex flex-col">
        {activeTab === AssistantTab.CHAT && (
          <ChatTab
            messages={messages.map((m) => (m.id === '1' ? { ...m, text: initialGreeting } : m))}
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