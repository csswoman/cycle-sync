import { useState } from 'react';
import { ChatMessage } from '@/types';
import { sendChatMessage, analyzeImage, analyzeVideo } from '@/services/geminiService';

export const useGeminiAssistant = (initialMessages: ChatMessage[]) => {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text
        };

        setMessages(prev => [...prev, newMessage]);
        setIsChatLoading(true);

        try {
            const validHistoryMessages = messages.at(0)?.role === 'model' ? messages.slice(1) : messages;
            const history = validHistoryMessages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await sendChatMessage(text, history);

            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Assistant Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: `Error: ${errorMessage}. Please check your API key and connection.`
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleImageAnalysis = async (image: string, prompt: string) => {
        setIsImageLoading(true);
        try {
            const result = await analyzeImage(image, prompt);
            return result;
        } catch (error) {
            throw error;
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleVideoAnalysis = async (video: string, prompt: string) => {
        setIsVideoLoading(true);
        try {
            const result = await analyzeVideo(video, prompt);
            return result;
        } catch (error) {
            throw error;
        } finally {
            setIsVideoLoading(false);
        }
    };

    return {
        messages,
        isChatLoading,
        isImageLoading,
        isVideoLoading,
        handleSendMessage,
        handleImageAnalysis,
        handleVideoAnalysis
    };
};
