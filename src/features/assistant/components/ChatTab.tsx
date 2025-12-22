import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { Button } from '@/components/ui/Button';

interface ChatTabProps {
    messages: ChatMessage[];
    inputText: string;
    setInputText: (text: string) => void;
    isChatLoading: boolean;
    onSend: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
    messages,
    inputText,
    setInputText,
    isChatLoading,
    onSend,
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
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
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface-dark border-transparent rounded-xl text-white text-sm placeholder-text-secondary focus:border-primary focus:ring-0"
                />
                <Button
                    onClick={onSend}
                    disabled={isChatLoading || !inputText.trim()}
                    variant="primary"
                    className="!p-2.5 !rounded-xl"
                    isLoading={isChatLoading}
                    icon="send"
                />
            </div>
        </div>
    );
};
