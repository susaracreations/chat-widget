import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import type { WidgetConfig } from "../hooks/useWebsites";
import { defaultWidgetConfig } from "../hooks/useWebsites";

export interface ChatWidgetProps {
  merchantId?: string;
  config?: Partial<WidgetConfig>;
  // Direct overrides
  title?: string;
  themeColor?: string;
  welcomeMessage?: string;
  isOpenDefault?: boolean;
  isInlinePreview?: boolean;
}

export function ChatWidget({ 
  merchantId = "my-custom-chat-app",
  config = {},
  title: overrideTitle,
  themeColor: overrideThemeColor,
  welcomeMessage: overrideWelcome,
  isOpenDefault = false,
  isInlinePreview = false,
}: ChatWidgetProps) {
  // Merge configurations
  const mergedConfig: WidgetConfig = {
    ...defaultWidgetConfig,
    ...config,
    primaryColor: overrideThemeColor || config.primaryColor || defaultWidgetConfig.primaryColor,
    title: overrideTitle || config.title || defaultWidgetConfig.title,
    subtitle: overrideWelcome || config.subtitle || defaultWidgetConfig.subtitle,
  };

  const isDark = mergedConfig.themeMode === "dark";
  const [isOpen, setIsOpen] = useState(isInlinePreview ? true : isOpenDefault);
  const [inputValue, setInputValue] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { messages, sendMessage } = useChat(user?.uid, merchantId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;
    const textToSend = inputValue;
    setInputValue("");
    await sendMessage(textToSend, user.uid);
  };

  const handleQuickPromptClick = async (promptText: string) => {
    if (!user) return;
    await sendMessage(promptText, user.uid);
  };

  // Color Tokens based on light/dark mode
  const bgMain = isDark ? "#0f172a" : "#ffffff";
  const bgMessages = isDark ? "#1e293b" : "#f8fafc";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f8fafc" : "#0f172a";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const incomingBubbleBg = isDark ? "#334155" : "#ffffff";
  const incomingBubbleText = isDark ? "#f1f5f9" : "#1e293b";
  const incomingBubbleBorder = isDark ? "#475569" : "#e2e8f0";
  const outgoingBubbleBg = mergedConfig.userBubbleColor || mergedConfig.primaryColor;
  const rad = `${mergedConfig.borderRadius}px`;
  const isLeft = mergedConfig.position === "bottom-left";

  // Container styling
  const containerStyle: React.CSSProperties = isInlinePreview
    ? {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }
    : {
        position: "fixed",
        bottom: "24px",
        left: isLeft ? "24px" : "auto",
        right: isLeft ? "auto" : "24px",
        zIndex: 9999,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "flex-end",
      };

  const windowStyle: React.CSSProperties = {
    display: isOpen ? "flex" : "none",
    flexDirection: "column",
    width: isInlinePreview ? "100%" : "360px",
    maxWidth: isInlinePreview ? "380px" : "360px",
    height: isInlinePreview ? "480px" : "520px",
    backgroundColor: bgMain,
    border: `1px solid ${borderCol}`,
    borderRadius: rad,
    overflow: "hidden",
    marginBottom: isInlinePreview ? "0" : "14px",
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: mergedConfig.primaryColor,
    padding: "14px 16px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: rad,
    borderTopRightRadius: rad,
  };

  const headerTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const avatarBoxStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    position: "relative",
  };

  const onlinePulseStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "8px",
    height: "8px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    border: `2px solid ${mergedConfig.primaryColor}`,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    opacity: 0.85,
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const messagesAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    backgroundColor: bgMessages,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const systemMessageContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  };

  const systemBadgeStyle: React.CSSProperties = {
    fontSize: "11px",
    color: textMuted,
    backgroundColor: isDark ? "#334155" : "#e2e8f0",
    padding: "3px 10px",
    borderRadius: "20px",
    textAlign: "center",
    fontWeight: 500,
  };

  const quickPromptsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    justifyContent: "center",
    marginTop: "6px",
  };

  const quickPromptBtnStyle: React.CSSProperties = {
    fontSize: "11px",
    color: isDark ? "#cbd5e1" : "#475569",
    backgroundColor: bgMain,
    border: `1px solid ${borderCol}`,
    padding: "5px 10px",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const messageRowStyle = (isOwn: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: isOwn ? "flex-end" : "flex-start",
    width: "100%",
  });

  const messageBubbleStyle = (isOwn: boolean): React.CSSProperties => ({
    maxWidth: "78%",
    padding: "9px 13px",
    borderRadius: `${Math.max(8, mergedConfig.borderRadius - 4)}px`,
    fontSize: "13px",
    lineHeight: "1.45",
    backgroundColor: isOwn ? outgoingBubbleBg : incomingBubbleBg,
    color: isOwn ? "#ffffff" : incomingBubbleText,
    border: isOwn ? "none" : `1px solid ${incomingBubbleBorder}`,
    wordBreak: "break-word",
  });

  const timestampStyle: React.CSSProperties = {
    fontSize: "10px",
    color: textMuted,
    marginTop: "3px",
    padding: "0 4px",
  };

  const inputFormStyle: React.CSSProperties = {
    display: "flex",
    padding: "10px 12px",
    borderTop: `1px solid ${borderCol}`,
    backgroundColor: bgMain,
    gap: "8px",
    alignItems: "center",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: `1px solid ${borderCol}`,
    borderRadius: `${Math.max(6, mergedConfig.borderRadius - 6)}px`,
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    color: textMain,
  };

  const sendButtonStyle: React.CSSProperties = {
    backgroundColor: mergedConfig.primaryColor,
    color: "#ffffff",
    border: "none",
    borderRadius: `${Math.max(6, mergedConfig.borderRadius - 6)}px`,
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s ease",
  };

  const circleLauncherStyle: React.CSSProperties = {
    backgroundColor: mergedConfig.primaryColor,
    color: "#ffffff",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  };

  const pillLauncherStyle: React.CSSProperties = {
    backgroundColor: mergedConfig.primaryColor,
    color: "#ffffff",
    height: "46px",
    padding: "0 18px",
    borderRadius: "24px",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s ease",
  };

  if (authLoading && !isInlinePreview) return null;

  return (
    <div style={containerStyle}>
      {/* Chat Window */}
      <div style={windowStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={headerTitleStyle}>
            <div style={avatarBoxStyle}>
              <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span style={onlinePulseStyle} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", lineHeight: "1.2" }}>
                {mergedConfig.title}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>
                Active Now
              </div>
            </div>
          </div>

          {!isInlinePreview && (
            <button 
              style={closeButtonStyle} 
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages Body */}
        <div style={messagesAreaStyle}>
          <div style={systemMessageContainerStyle}>
            {mergedConfig.subtitle && (
              <span style={systemBadgeStyle}>{mergedConfig.subtitle}</span>
            )}

            {/* Quick Starter Action Prompts */}
            {mergedConfig.quickPrompts && mergedConfig.quickPrompts.length > 0 && messages.length === 0 && (
              <div style={quickPromptsContainerStyle}>
                {mergedConfig.quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={quickPromptBtnStyle}
                    onClick={() => handleQuickPromptClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {messages.map((msg) => {
            const isOwn = msg.sender === user?.uid;
            return (
              <div key={msg.id} style={messageRowStyle(isOwn)}>
                <div style={messageBubbleStyle(isOwn)}>
                  {msg.text}
                </div>
                {mergedConfig.showTimestamps && (
                  <span style={timestampStyle}>Just now</span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form style={inputFormStyle} onSubmit={handleSubmit}>
          <input
            type="text"
            style={inputStyle}
            placeholder="Write a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" style={sendButtonStyle} aria-label="Send message">
            <svg style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>

      {/* Floating Launcher Button */}
      {!isInlinePreview && (
        mergedConfig.launcherStyle === "pill" ? (
          <button 
            style={pillLauncherStyle}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle chat"
          >
            <span style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%" }} />
            <span>{isOpen ? "Close chat" : mergedConfig.launcherText || "Chat with us"}</span>
          </button>
        ) : (
          <button 
            style={circleLauncherStyle} 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle chat"
          >
            {isOpen ? (
              <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg style={{ width: "22px", height: "22px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </button>
        )
      )}
    </div>
  );
}
