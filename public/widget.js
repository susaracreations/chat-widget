(function () {
  "use strict";

  // Identify Current Script and Options
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  const websiteId =
    currentScript?.getAttribute("data-website-id") || "my-custom-chat-app";

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC2Giy0opKrSSFNdZIIFWxqAJGF7DWx7Vg",
    authDomain: "chat2-3f634.firebaseapp.com",
    projectId: "chat2-3f634",
    storageBucket: "chat2-3f634.firebasestorage.app",
    messagingSenderId: "106973712960",
    appId: "1:106973712960:web:5d33cb4273c5e856cec5a5",
  };

  // Dynamic Firebase CDN Loader
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    if (!window.firebase) {
      await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js");
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();

    // Anonymous sign in
    let user = auth.currentUser;
    if (!user) {
      const cred = await auth.signInAnonymously();
      user = cred.user;
    }

    return { auth, db, user };
  }

  // Fetch Website Settings / Config from Firestore
  async function fetchConfig(db) {
    try {
      const docSnap = await db.collection("websites").doc(websiteId).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        return {
          title: data.config?.title || `${data.name || "Live"} Support`,
          subtitle: data.config?.subtitle || data.welcomeMessage || "Typically replies in a few minutes",
          primaryColor: data.config?.primaryColor || data.themeColor || "#4f46e5",
          userBubbleColor: data.config?.userBubbleColor || data.themeColor || "#4f46e5",
          position: data.config?.position || "bottom-right",
          borderRadius: data.config?.borderRadius || 16,
          launcherStyle: data.config?.launcherStyle || "circle",
          launcherText: data.config?.launcherText || "Chat with us",
          themeMode: data.config?.themeMode || "light",
          showTimestamps: data.config?.showTimestamps !== false,
          quickPrompts: data.config?.quickPrompts || ["Pricing details", "Talk to an agent", "Report an issue"],
        };
      }
    } catch (e) {
      console.warn("Could not fetch remote widget config, using defaults", e);
    }
    return {
      title: "Live Support",
      subtitle: "Typically replies in a few minutes",
      primaryColor: "#4f46e5",
      userBubbleColor: "#4f46e5",
      position: "bottom-right",
      borderRadius: 16,
      launcherStyle: "circle",
      launcherText: "Chat with us",
      themeMode: "light",
      showTimestamps: true,
      quickPrompts: ["Pricing details", "Talk to an agent", "Report an issue"],
    };
  }

  // Build UI Elements
  async function mountWidget() {
    // Avoid double mounting
    if (document.getElementById("sc-chat-widget-root")) return;

    const { db, user } = await initFirebase();
    const config = await fetchConfig(db);
    const isDark = config.themeMode === "dark";

    const isLeft = config.position === "bottom-left";
    const bgMain = isDark ? "#0f172a" : "#ffffff";
    const bgMessages = isDark ? "#1e293b" : "#f8fafc";
    const borderCol = isDark ? "#334155" : "#e2e8f0";
    const textMain = isDark ? "#f8fafc" : "#0f172a";
    const textMuted = isDark ? "#94a3b8" : "#64748b";
    const incomingBubbleBg = isDark ? "#334155" : "#ffffff";
    const incomingBubbleText = isDark ? "#f1f5f9" : "#1e293b";
    const incomingBubbleBorder = isDark ? "#475569" : "#e2e8f0";
    const outgoingBubbleBg = config.userBubbleColor || config.primaryColor;
    const rad = config.borderRadius + "px";

    // Root wrapper
    const root = document.createElement("div");
    root.id = "sc-chat-widget-root";
    root.style.cssText = `
      position: fixed;
      bottom: 24px;
      ${isLeft ? "left: 24px;" : "right: 24px;"}
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: ${isLeft ? "flex-start" : "flex-end"};
    `;

    // Chat Window
    const chatWindow = document.createElement("div");
    chatWindow.id = "sc-chat-window";
    chatWindow.style.cssText = `
      display: none;
      flex-direction: column;
      width: 360px;
      max-width: calc(100vw - 48px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background-color: ${bgMain};
      border: 1px solid ${borderCol};
      border-radius: ${rad};
      overflow: hidden;
      margin-bottom: 14px;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      box-sizing: border-box;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      background-color: ${config.primaryColor};
      padding: 14px 16px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: ${rad};
      border-top-right-radius: ${rad};
      box-sizing: border-box;
    `;

    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;border-radius:50%;background-color:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;position:relative;">
          <svg style="width:16px;height:16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span style="position:absolute;bottom:0;right:0;width:8px;height:8px;background-color:#10b981;border-radius:50%;border:2px solid ${config.primaryColor};"></span>
        </div>
        <div>
          <div style="font-weight:600;font-size:14px;line-height:1.2;color:#ffffff;">${config.title}</div>
          <div style="font-size:11px;opacity:0.85;margin-top:2px;color:#ffffff;">Active Now</div>
        </div>
      </div>
      <button id="sc-close-btn" style="background:none;border:none;color:#ffffff;cursor:pointer;opacity:0.85;padding:4px;display:flex;align-items:center;justify-content:center;">
        <svg style="width:16px;height:16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    // Messages Area
    const messagesArea = document.createElement("div");
    messagesArea.id = "sc-messages-area";
    messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background-color: ${bgMessages};
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-sizing: border-box;
    `;

    // System greeting & quick prompts
    const systemBox = document.createElement("div");
    systemBox.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:4px;`;
    if (config.subtitle) {
      const subBadge = document.createElement("span");
      subBadge.style.cssText = `font-size:11px;color:${textMuted};background-color:${isDark ? "#334155" : "#e2e8f0"};padding:3px 10px;border-radius:20px;text-align:center;font-weight:500;`;
      subBadge.innerText = config.subtitle;
      systemBox.appendChild(subBadge);
    }

    const quickPromptsBox = document.createElement("div");
    quickPromptsBox.id = "sc-quick-prompts";
    quickPromptsBox.style.cssText = `display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:6px;`;

    if (config.quickPrompts && config.quickPrompts.length > 0) {
      config.quickPrompts.forEach((prompt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.cssText = `font-size:11px;color:${isDark ? "#cbd5e1" : "#475569"};background-color:${bgMain};border:1px solid ${borderCol};padding:5px 10px;border-radius:14px;cursor:pointer;`;
        btn.innerText = prompt;
        btn.onclick = () => sendMessage(prompt);
        quickPromptsBox.appendChild(btn);
      });
      systemBox.appendChild(quickPromptsBox);
    }

    messagesArea.appendChild(systemBox);

    const messageList = document.createElement("div");
    messageList.style.cssText = `display:flex;flex-direction:column;gap:12px;flex:1;`;
    messagesArea.appendChild(messageList);

    // Input Form
    const inputForm = document.createElement("form");
    inputForm.style.cssText = `
      display: flex;
      padding: 10px 12px;
      border-top: 1px solid ${borderCol};
      background-color: ${bgMain};
      gap: 8px;
      align-items: center;
      box-sizing: border-box;
    `;

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.placeholder = "Write a message...";
    inputField.style.cssText = `
      flex: 1;
      border: 1px solid ${borderCol};
      border-radius: ${Math.max(6, config.borderRadius - 6)}px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      background-color: ${isDark ? "#1e293b" : "#ffffff"};
      color: ${textMain};
      box-sizing: border-box;
    `;

    const sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.style.cssText = `
      background-color: ${config.primaryColor};
      color: #ffffff;
      border: none;
      border-radius: ${Math.max(6, config.borderRadius - 6)}px;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    sendBtn.innerHTML = `
      <svg style="width:15px;height:15px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    `;

    inputForm.appendChild(inputField);
    inputForm.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(inputForm);

    // Launcher Button
    const launcher = document.createElement("button");
    launcher.id = "sc-launcher";

    if (config.launcherStyle === "pill") {
      launcher.style.cssText = `
        background-color: ${config.primaryColor};
        color: #ffffff;
        height: 46px;
        padding: 0 18px;
        border-radius: 24px;
        border: none;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease;
      `;
      launcher.innerHTML = `
        <span style="width:8px;height:8px;background-color:#10b981;border-radius:50%;"></span>
        <span id="sc-launcher-text">${config.launcherText || "Chat with us"}</span>
      `;
    } else {
      launcher.style.cssText = `
        background-color: ${config.primaryColor};
        color: #ffffff;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      `;
      launcher.innerHTML = `
        <svg id="sc-icon-chat" style="width:22px;height:22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      `;
    }

    root.appendChild(chatWindow);
    root.appendChild(launcher);
    document.body.appendChild(root);

    // Toggle logic
    let isOpen = false;
    function setOpen(open) {
      isOpen = open;
      if (isOpen) {
        chatWindow.style.display = "flex";
        setTimeout(() => {
          chatWindow.style.opacity = "1";
          chatWindow.style.transform = "translateY(0)";
          inputField.focus();
        }, 10);
      } else {
        chatWindow.style.opacity = "0";
        chatWindow.style.transform = "translateY(10px)";
        setTimeout(() => {
          chatWindow.style.display = "none";
        }, 200);
      }

      if (config.launcherStyle === "pill") {
        const textSpan = document.getElementById("sc-launcher-text");
        if (textSpan) textSpan.innerText = isOpen ? "Close chat" : (config.launcherText || "Chat with us");
      }
    }

    launcher.onclick = () => setOpen(!isOpen);
    document.getElementById("sc-close-btn").onclick = () => setOpen(false);

    // Register visitor session in Firestore
    const sessionRef = db
      .collection("merchants")
      .doc(websiteId)
      .collection("sessions")
      .doc(user.uid);

    sessionRef.set(
      {
        userId: user.uid,
        lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
        platform: window.location.hostname || "external-web",
        websiteName: config.title,
      },
      { merge: true }
    );

    // Send Message Handler
    async function sendMessage(text) {
      if (!text || !text.trim()) return;
      const cleanText = text.trim();

      const messagesRef = db
        .collection("merchants")
        .doc(websiteId)
        .collection("sessions")
        .doc(user.uid)
        .collection("messages");

      await messagesRef.add({
        text: cleanText,
        sender: user.uid,
        timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
      });

      await sessionRef.set(
        {
          lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    inputForm.onsubmit = (e) => {
      e.preventDefault();
      const val = inputField.value;
      if (!val) return;
      inputField.value = "";
      sendMessage(val);
    };

    // Realtime message listener
    const messagesQuery = db
      .collection("merchants")
      .doc(websiteId)
      .collection("sessions")
      .doc(user.uid)
      .collection("messages")
      .orderBy("timestamp", "asc");

    messagesQuery.onSnapshot((snapshot) => {
      messageList.innerHTML = "";
      if (snapshot.size > 0 && quickPromptsBox) {
        quickPromptsBox.style.display = "none";
      }

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isOwn = data.sender === user.uid;

        const row = document.createElement("div");
        row.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: ${isOwn ? "flex-end" : "flex-start"};
          width: 100%;
        `;

        const bubble = document.createElement("div");
        bubble.style.cssText = `
          max-width: 78%;
          padding: 9px 13px;
          border-radius: ${Math.max(8, config.borderRadius - 4)}px;
          font-size: 13px;
          line-height: 1.45;
          background-color: ${isOwn ? outgoingBubbleBg : incomingBubbleBg};
          color: ${isOwn ? "#ffffff" : incomingBubbleText};
          border: ${isOwn ? "none" : `1px solid ${incomingBubbleBorder}`};
          word-break: break-word;
          box-sizing: border-box;
        `;
        bubble.innerText = data.text;
        row.appendChild(bubble);

        if (config.showTimestamps) {
          const time = document.createElement("span");
          time.style.cssText = `font-size:10px;color:${textMuted};margin-top:3px;padding:0 4px;`;
          time.innerText = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
          row.appendChild(time);
        }

        messageList.appendChild(row);
      });

      messagesArea.scrollTop = messagesArea.scrollHeight;
    });
  }

  // Run on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();
