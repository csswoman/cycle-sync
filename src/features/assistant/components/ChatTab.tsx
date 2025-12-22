import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/i18n/LanguageContext';

interface ChatTabProps {
    messages: ChatMessage[];
    inputText: string;
    setInputText: (text: string) => void;
    isChatLoading: boolean;
    onSend: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
    messages,
    inputText,
    setInputText,
    isChatLoading,
    onSend,
    onFileSelect,
}) => {
    const { t } = useLanguage();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 scrollbar-hide">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-secondary text-foreground rounded-bl-none'}`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isChatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary text-muted-foreground rounded-2xl rounded-bl-none px-4 py-2 text-xs italic animate-pulse">
                            Typing...
                        </div>
                    </div>
                )}

            </div>
            <div className="pt-2 flex items-center gap-2 relative">
                <div className="group relative">
                    <label className="cursor-pointer flex items-center justify-center p-2.5 rounded-xl bg-secondary text-primary hover:bg-accent hover:scale-105 transition-all active:scale-95 border border-border/5 shadow-inner">

                        <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={onFileSelect}
                        />
                    </label>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-foreground text-background text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-2xl border border-border translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100 origin-bottom">

                        sube tu imagen o video
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-gray-900/95"></div>
                    </div>
                </div>


                <div className="flex-1 flex items-center bg-secondary border border-border focus-within:border-primary/40 rounded-2xl px-4 transition-all shadow-inner">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        placeholder={t.typeMessage}
                        className="flex-1 bg-transparent border-none text-foreground text-sm placeholder-muted-foreground focus:ring-0 py-3.5"
                    />
                </div>


                <Button
                    onClick={onSend}
                    disabled={isChatLoading || !inputText.trim()}
                    variant="primary"
                    className="!p-3.5 !rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 hover:brightness-110"
                    isLoading={isChatLoading}
                    icon="send"
                />
            </div>
        </div>
    );
};
