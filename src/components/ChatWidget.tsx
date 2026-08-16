import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import type { WidgetConfig } from "../hooks/useWebsites";
import { defaultWidgetConfig } from "../hooks/useWebsites";
import { db, doc, onSnapshot, setDoc, serverTimestamp } from "../utils/firebase";

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

  // CSAT Rating & Session Status State
  const [sessionStatus, setSessionStatus] = useState<"active" | "closed">("active");
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Listen to Session status & CSAT
  useEffect(() => {
    if (!user || isInlinePreview) return;
    const sessionDocRef = doc(db, "merchants", merchantId, "sessions", user.uid);
    const unsub = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === "closed") {
          setSessionStatus("closed");
        } else {
          setSessionStatus("active");
        }
        if (data.rating) {
          setExistingRating(data.rating);
          setRatingSubmitted(true);
        }
      }
    });

    // Record Visitor Metadata & Co-browsing Context
    const detectBrowser = () => {
      const ua = navigator.userAgent;
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Edg")) return "Edge";
      if (ua.includes("Chrome")) return "Chrome";
      if (ua.includes("Safari")) return "Safari";
      return "Browser";
    };

    const detectOS = () => {
      const ua = navigator.userAgent;
      if (ua.includes("Win")) return "Windows";
      if (ua.includes("Mac")) return "macOS";
      if (ua.includes("Linux")) return "Linux";
      if (ua.includes("Android")) return "Android";
      if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
      return "Unknown OS";
    };

    const metadata = {
      pageUrl: window.location.href,
      pageTitle: document.title || "Live Page",
      referrer: document.referrer || "Direct Visit",
      browser: detectBrowser(),
      os: detectOS(),
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "en",
      sessionStartedAt: serverTimestamp(),
    };

    setDoc(sessionDocRef, {
      userId: user.uid,
      lastActive: serverTimestamp(),
      platform: window.location.hostname || "local",
      websiteName: mergedConfig.title,
      metadata,
    }, { merge: true }).catch((err) => console.error("Error setting session metadata:", err));

    return unsub;
  }, [user, merchantId, isInlinePreview, mergedConfig.title]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, sessionStatus]);

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

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const sessionDocRef = doc(db, "merchants", merchantId, "sessions", user.uid);
      await setDoc(sessionDocRef, {
        rating: selectedStars,
        ratingFeedback: ratingComment.trim(),
        ratingSubmittedAt: serverTimestamp(),
      }, { merge: true });
      setRatingSubmitted(true);
      setExistingRating(selectedStars);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
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
    backgroundColor: sessionStatus === "closed" ? "#94a3b8" : "#10b981",
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
                {sessionStatus === "closed" ? "Conversation Resolved" : "Active Now"}
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
                  <span style={timestampStyle}>
                    {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                )}
              </div>
            );
          })}

          {/* Advanced CSAT Customer Satisfaction Prompt Card */}
          {sessionStatus === "closed" && (
            <div
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: `${Math.max(10, mergedConfig.borderRadius - 2)}px`,
                padding: "18px 16px",
                margin: "12px 0 6px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              {/* Badge & Header */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 9px",
                    borderRadius: "12px",
                    backgroundColor: isDark ? "#064e3b" : "#ecfdf5",
                    border: `1px solid ${isDark ? "#047857" : "#a7f3d0"}`,
                    color: isDark ? "#6ee7b7" : "#047857",
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <svg style={{ width: "12px", height: "12px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Chat Resolved</span>
                </div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: textMain, letterSpacing: "-0.01em" }}>
                  {ratingSubmitted ? "Thank you for your feedback!" : "How was our support service?"}
                </h4>
                <p style={{ margin: 0, fontSize: "11.5px", color: textMuted, lineHeight: "1.4" }}>
                  {ratingSubmitted
                    ? "Your feedback helps us continuously improve our customer experience."
                    : "Please take a moment to rate your conversation with our team."}
                </p>
              </div>

              {/* Star Rating Selector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "24px",
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    border: `1px solid ${borderCol}`,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (existingRating || selectedStars) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={ratingSubmitted}
                        onClick={() => setSelectedStars(star)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: ratingSubmitted ? "default" : "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isFilled ? "#f59e0b" : isDark ? "#475569" : "#cbd5e1",
                          transition: "color 0.15s ease",
                        }}
                        aria-label={`Rate ${star} stars`}
                      >
                        <svg
                          style={{ width: "26px", height: "26px" }}
                          fill={isFilled ? "#f59e0b" : "none"}
                          stroke={isFilled ? "#f59e0b" : "currentColor"}
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Text */}
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b" }}>
                  {(existingRating || selectedStars) === 5 && "⭐ Excellent - Perfect support!"}
                  {(existingRating || selectedStars) === 4 && "Great service, thank you"}
                  {(existingRating || selectedStars) === 3 && "Average experience"}
                  {(existingRating || selectedStars) === 2 && "Could be better"}
                  {(existingRating || selectedStars) === 1 && "Poor experience"}
                </div>
              </div>

              {/* Form or Result View */}
              {!ratingSubmitted ? (
                <form
                  onSubmit={handleRatingSubmit}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "2px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Tell us what you liked or what to improve (optional)..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    style={{
                      width: "100%",
                      border: `1px solid ${borderCol}`,
                      borderRadius: `${Math.max(6, mergedConfig.borderRadius - 6)}px`,
                      padding: "8px 12px",
                      fontSize: "12px",
                      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                      color: textMain,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      backgroundColor: mergedConfig.primaryColor,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: `${Math.max(6, mergedConfig.borderRadius - 6)}px`,
                      padding: "9px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    <span>Submit Rating</span>
                    <svg style={{ width: "13px", height: "13px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                    color: textMuted,
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  <svg style={{ width: "13px", height: "13px", color: "#10b981" }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Review recorded in support console</span>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        {sessionStatus !== "closed" ? (
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
        ) : (
          <div style={{ padding: "12px", borderTop: `1px solid ${borderCol}`, backgroundColor: bgMain, textAlign: "center", fontSize: "12px", color: textMuted }}>
            This conversation is resolved.
          </div>
        )}
      </div>

      {/* Floating Launcher Button */}
      {!isInlinePreview && (
        mergedConfig.launcherStyle === "pill" ? (
          <button 
            style={pillLauncherStyle} 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle chat"
          >
            <span style={{ width: "8px", height: "8px", backgroundColor: sessionStatus === "closed" ? "#94a3b8" : "#10b981", borderRadius: "50%" }} />
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
