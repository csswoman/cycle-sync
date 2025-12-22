import React, { useState, useRef, useEffect } from 'react';
import { AssistantTab } from '@/types';
import { useGeminiAssistant } from '@/hooks/useGeminiAssistant';
import { Button } from '@/components/ui/Button';
import { ChatTab } from './components/ChatTab';
import { ImageTab } from './components/ImageTab';
import { VideoTab } from './components/VideoTab';

interface SmartAssistantProps {
  onClose: () => void;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>(AssistantTab.CHAT);

  const {
    messages,
    isChatLoading,
    isImageLoading,
    isVideoLoading,
    handleSendMessage,
    handleImageAnalysis,
    handleVideoAnalysis
  } = useGeminiAssistant([
    { id: '1', role: 'model', text: 'Hi Sarah! I am your CycleSync Assistant. How can I help you with your health today?' }
  ]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-dark/95 backdrop-blur-xl border border-surface-dark shadow-2xl rounded-2xl">
      <div className="p-4 border-b border-surface-dark flex items-center justify-between bg-surface-dark/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <h2 className="text-lg font-bold text-white">Smart Assistant</h2>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex p-2 gap-1 bg-surface-dark/30 border-b border-surface-dark">
        {[
          { id: AssistantTab.CHAT, label: 'Chat' },
          { id: AssistantTab.IMAGE, label: 'Image' },
          { id: AssistantTab.VIDEO, label: 'Video' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-surface-dark hover:text-white'
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