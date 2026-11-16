import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/i18n/LanguageContext';

interface ChatTabProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  isChatLoading: boolean;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const markdownStyles = [
  '[&_p]:my-0 [&_p+p]:mt-2 [&_p+ul]:mt-2 [&_p+ol]:mt-2',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-2 [&_ol]:my-2',
  '[&_li]:my-1 [&_li]:pl-0.5 [&_li::marker]:text-primary',
  '[&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic',
  '[&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:bg-background/70 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground',
  '[&_hr]:my-3 [&_hr]:border-border/60',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
].join(' ');

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  const quickSuggestions = [
    t.suggestMeals,
    t.suggestCramps,
    t.suggestWorkout,
    t.suggestLabs,
    t.suggestCycles,
  ];

  const handleSelectSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages list */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3 pr-1 scrollbar-hide"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 animate-in fade-in duration-200 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="size-7 rounded-xl bg-blossom-soft/40 border border-blossom/20 flex items-center justify-center shrink-0 text-primary mt-0.5 shadow-xs">
                  <Icon name="sparkle" size={14} weight="duotone" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed transition-colors ${
                  isUser ? 'whitespace-pre-wrap' : ''
                } ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-tr-xs shadow-sm shadow-primary/20'
                    : `bg-secondary/80 border border-border/60 text-foreground rounded-tl-xs shadow-xs ${markdownStyles}`
                }`}
              >
                {isUser ? (
                  msg.text
                ) : (
                  <ReactMarkdown
                    components={{
                      a: ({ node: _node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading typing indicator */}
        {isChatLoading && (
          <div className="flex items-start gap-2 animate-in fade-in duration-200">
            <div className="size-7 rounded-xl bg-blossom-soft/40 border border-blossom/20 flex items-center justify-center shrink-0 text-primary mt-0.5 shadow-xs">
              <Icon name="sparkle" size={14} weight="duotone" />
            </div>
            <div className="bg-secondary/80 border border-border/60 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs">
              <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="size-1.5 rounded-full bg-primary/70 animate-bounce"></span>
            </div>
          </div>
        )}

        {/* Quick prompt suggestions when conversation is fresh */}
        {messages.length <= 1 && !isChatLoading && (
          <div className="pt-2 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t.quickActions}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="text-left text-xs bg-secondary/60 hover:bg-secondary text-foreground/90 hover:text-primary border border-border/60 hover:border-primary/40 rounded-xl px-3 py-1.5 transition-all active:scale-95 shadow-2xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input toolbar */}
      <div className="pt-2.5 border-t border-border/50 flex items-center gap-2">
        {/* Upload media button */}
        <label
          className="cursor-pointer flex items-center justify-center size-10 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground/70 hover:text-primary transition-all active:scale-95 border border-border/60 shrink-0 shadow-2xs"
          title={t.uploadTooltip}
        >
          <Icon name="add_a_photo" size={19} weight="duotone" />
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={onFileSelect}
          />
        </label>

        {/* Text input */}
        <div className="flex-1 flex items-center bg-secondary/60 hover:bg-secondary/85 focus-within:bg-card border border-border/70 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 rounded-xl px-3 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={t.typeMessage}
            className="w-full bg-transparent border-0 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 py-2.5"
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={isChatLoading || !inputText.trim()}
          aria-label={t.send}
          className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/20"
        >
          <Icon name="send" size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
};
