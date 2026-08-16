import { useState, useMemo, useEffect } from "react";
import { useWebsites, type Website, type WidgetConfig, defaultWidgetConfig } from "../hooks/useWebsites";
import { useSessions, type Session } from "../hooks/useSessions";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import { ChatWidget } from "./ChatWidget";
import { 
  MessageSquare, 
  Send, 
  User, 
  Layers, 
  Globe, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Code2, 
  ChevronDown, 
  X, 
  Radio,
  Sliders,
  Sun,
  Moon,
  Sparkles,
  Eye
} from "lucide-react";

export function Dashboard() {
  const { websites, loading: websitesLoading, addWebsite, updateWebsite, deleteWebsite } = useWebsites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  
  // Find selected site object (or default to first if single site selected)
  const currentWebsite = useMemo(() => {
    if (selectedSiteId === "all") return websites[0] || null;
    return websites.find((w) => w.id === selectedSiteId) || websites[0] || null;
  }, [websites, selectedSiteId]);

  const { sessions, loading: sessionsLoading } = useSessions(selectedSiteId, websites);
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "websites" | "customizer">("chats");

  // Chat hook targeting the active session's merchantId/website
  const activeMerchantId = selectedSession?.merchantId || (selectedSiteId === "all" ? currentWebsite?.id : selectedSiteId) || "my-custom-chat-app";
  const { messages, sendMessage } = useChat(selectedSession?.userId, activeMerchantId);

  // New Website Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteDomain, setNewSiteDomain] = useState("");
  const [newSiteColor, setNewSiteColor] = useState("#4f46e5");
  const [newSiteWelcome, setNewSiteWelcome] = useState("Typically replies in a few minutes");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Customizer Studio Draft State
  const [customizerDraft, setCustomizerDraft] = useState<WidgetConfig>(defaultWidgetConfig);
  const [customizerSiteId, setCustomizerSiteId] = useState<string>("");
  const [newPromptInput, setNewPromptInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customizerSubTab, setCustomizerSubTab] = useState<"appearance" | "layout" | "prompts">("appearance");

  // Sync draft state when current website changes or when switching to customizer
  useEffect(() => {
    const targetSite = (selectedSiteId !== "all" ? currentWebsite : websites[0]) || null;
    if (targetSite) {
      setCustomizerSiteId(targetSite.id);
      setCustomizerDraft({
        ...defaultWidgetConfig,
        primaryColor: targetSite.themeColor || defaultWidgetConfig.primaryColor,
        subtitle: targetSite.welcomeMessage || defaultWidgetConfig.subtitle,
        title: targetSite.config?.title || `${targetSite.name} Support`,
        ...(targetSite.config || {}),
      });
    }
  }, [selectedSiteId, currentWebsite, websites]);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession || !user) return;
    const textToSend = replyText;
    setReplyText("");
    await sendMessage(textToSend, user.uid);
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteDomain.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await addWebsite({
        name: newSiteName,
        domain: newSiteDomain,
        themeColor: newSiteColor,
        welcomeMessage: newSiteWelcome,
      });
      setNewSiteName("");
      setNewSiteDomain("");
      setIsAddModalOpen(false);
      setSelectedSiteId(created.id);
    } catch (err) {
      console.error("Failed to add website:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCustomizer = async () => {
    if (!customizerSiteId) return;
    try {
      await updateWebsite(customizerSiteId, {
        themeColor: customizerDraft.primaryColor,
        welcomeMessage: customizerDraft.subtitle,
        config: customizerDraft,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save customization:", err);
    }
  };

  const handleAddPrompt = () => {
    if (!newPromptInput.trim()) return;
    setCustomizerDraft((prev) => ({
      ...prev,
      quickPrompts: [...(prev.quickPrompts || []), newPromptInput.trim()],
    }));
    setNewPromptInput("");
  };

  const handleRemovePrompt = (idx: number) => {
    setCustomizerDraft((prev) => ({
      ...prev,
      quickPrompts: prev.quickPrompts.filter((_, i) => i !== idx),
    }));
  };

  const handleDeleteWebsite = async (site: Website) => {
    if (confirm(`Are you sure you want to delete "${site.name}"? This action cannot be undone.`)) {
      await deleteWebsite(site.id);
      if (selectedSiteId === site.id) {
        setSelectedSiteId("all");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Support Console</span>
          </div>

          {/* Website Switcher Dropdown */}
          <div className="relative flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <div className="relative inline-block">
              <select
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setSelectedSession(null);
                }}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Websites ({websites.length})</option>
                <optgroup label="Managed Websites">
                  {websites.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.domain})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Website</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Radio className="w-3 h-3 text-emerald-500" />
            <span>Realtime Sync</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 bg-white border-r border-slate-200 flex flex-col justify-between">
          <nav className="p-3 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "chats"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Conversations</span>
              </div>
              <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("websites")}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "websites"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Websites & Embeds</span>
              </div>
              <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {websites.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("customizer")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "customizer"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Widget Customizer</span>
            </button>
          </nav>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-200 text-[11px] text-slate-400">
            <p className="font-medium text-slate-600">Active Tenant:</p>
            <p className="truncate mt-0.5 text-slate-500">
              {selectedSiteId === "all" ? "All Websites Aggregate" : currentWebsite?.name || "None"}
            </p>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeTab === "chats" && (
            <div className="flex-1 flex flex-col md:flex-row h-full min-h-0">
              {/* Sessions List */}
              <div className="w-full md:w-80 border-r border-slate-200 flex flex-col h-full bg-white">
                <div className="p-3.5 border-b border-slate-200 bg-slate-50/75 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                    Inbox {selectedSiteId === "all" ? "(All Sites)" : `(${currentWebsite?.name})`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {sessions.length} active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {sessionsLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Loading conversations...</div>
                  ) : sessions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 stroke-1" />
                      <p>No active conversations</p>
                      <span className="text-[11px] text-slate-400">
                        {selectedSiteId === "all" ? "Waiting for visitors to start chats" : "Embed the widget on your site to test"}
                      </span>
                    </div>
                  ) : (
                    sessions.map((session) => {
                      const isSelected = selectedSession?.id === session.id;
                      return (
                        <button
                          key={`${session.merchantId}_${session.id}`}
                          onClick={() => setSelectedSession(session)}
                          className={`w-full text-left p-3.5 transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/70 border-l-2 border-indigo-600"
                              : "hover:bg-slate-50 border-l-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                Visitor {session.userId.substring(0, 7)}...
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate font-medium text-slate-600">
                                  {session.websiteName || session.platform}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Conversation Area */}
              <div className="flex-1 flex flex-col bg-slate-50/50 h-full min-h-0">
                {selectedSession ? (
                  <>
                    {/* Active Session Info Header */}
                    <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Visitor ID: {selectedSession.userId}
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                              {selectedSession.websiteName || selectedSession.merchantId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Domain: {selectedSession.platform}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No messages yet in this session.
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMerchant = msg.sender === user?.uid;
                          return (
                            <div key={msg.id} className={`flex ${isMerchant ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[70%] px-4 py-2.5 rounded-lg text-xs leading-relaxed ${
                                  isMerchant
                                    ? "bg-indigo-600 text-white font-normal"
                                    : "bg-white text-slate-800 border border-slate-200"
                                }`}
                              >
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Reply Form */}
                    <form onSubmit={handleSendReply} className="p-3.5 bg-white border-t border-slate-200 flex gap-2.5">
                      <input
                        type="text"
                        placeholder="Type response to visitor..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                    <MessageSquare className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">Select a conversation from the left</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Choose any incoming visitor message to read and respond in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Websites & Integrations Tab */}
          {activeTab === "websites" && (
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Registered Websites</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage all connected websites, inspect credentials, and copy customized embed snippets.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Website</span>
                  </button>
                </div>

                {/* Websites List */}
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden bg-white">
                  {websitesLoading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading websites...</div>
                  ) : websites.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">No websites found. Click "Register Website" to add one.</div>
                  ) : (
                    websites.map((site) => {
                      const snippet = `<script\n  src="${window.location.origin}/widget.js"\n  data-website-id="${site.id}"\n  defer>\n</script>`;
                      const isCopied = copiedId === site.id;

                      return (
                        <div key={site.id} className="p-5 flex flex-col gap-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0"
                                style={{ backgroundColor: site.themeColor }}
                                title={`Theme: ${site.themeColor}`}
                              />
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">{site.name}</h3>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{site.domain}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedSiteId(site.id);
                                  setActiveTab("chats");
                                }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                              >
                                View Chats
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSiteId(site.id);
                                  setCustomizerSiteId(site.id);
                                  setCustomizerDraft({
                                    ...defaultWidgetConfig,
                                    primaryColor: site.themeColor || defaultWidgetConfig.primaryColor,
                                    subtitle: site.welcomeMessage || defaultWidgetConfig.subtitle,
                                    title: site.config?.title || `${site.name} Support`,
                                    ...(site.config || {}),
                                  });
                                  setActiveTab("customizer");
                                }}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                              >
                                Customize
                              </button>
                              {websites.length > 1 && (
                                <button
                                  onClick={() => handleDeleteWebsite(site)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors cursor-pointer"
                                  title="Delete Website"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Embed Snippet Area */}
                          <div className="bg-slate-900 rounded-lg p-3.5 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>HTML Embed Snippet (Site ID: <span className="font-mono text-indigo-400">{site.id}</span>)</span>
                              </div>
                              <button
                                onClick={() => handleCopy(snippet, site.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto selection:bg-indigo-600 selection:text-white leading-relaxed">
                              {snippet}
                            </pre>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Installation Instructions */}
                <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">How to Embed on Any Website</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste the script snippet before the closing <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[11px]">&lt;/body&gt;</code> tag on HTML sites, WordPress, Shopify, Next.js, or React applications. Messages will automatically route to this Support Console under the appropriate Website tenant.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Widget Customizer Studio */}
          {activeTab === "customizer" && (
            <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden bg-slate-50/60">
              {/* Studio Left Control Panel */}
              <div className="w-full md:w-[480px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
                {/* Studio Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Customizer Studio</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Editing: <span className="font-semibold text-slate-800">{websites.find(w => w.id === customizerSiteId)?.name || "Default Site"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCustomizer}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{saveSuccess ? "Published!" : "Publish Changes"}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-4 text-xs font-semibold">
                  <button
                    onClick={() => setCustomizerSubTab("appearance")}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      customizerSubTab === "appearance"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Theme & Colors
                  </button>
                  <button
                    onClick={() => setCustomizerSubTab("layout")}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      customizerSubTab === "layout"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Layout & Launcher
                  </button>
                  <button
                    onClick={() => setCustomizerSubTab("prompts")}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      customizerSubTab === "prompts"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Headers & Prompts
                  </button>
                </div>

                {/* Controls Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                  {/* Appearance Sub-tab */}
                  {customizerSubTab === "appearance" && (
                    <div className="space-y-4">
                      {/* Theme Mode */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700">Theme Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, themeMode: "light" }))}
                            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.themeMode === "light"
                                ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Sun className="w-4 h-4 text-amber-500" />
                            <span>Light Mode</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, themeMode: "dark" }))}
                            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.themeMode === "dark"
                                ? "border-indigo-600 bg-slate-900 text-white font-semibold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Moon className="w-4 h-4 text-indigo-400" />
                            <span>Dark Mode</span>
                          </button>
                        </div>
                      </div>

                      {/* Header / Brand Primary Color */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700">Header & Accent Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={customizerDraft.primaryColor}
                            onChange={(e) => setCustomizerDraft(p => ({ ...p, primaryColor: e.target.value }))}
                            className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-white flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={customizerDraft.primaryColor}
                            onChange={(e) => setCustomizerDraft(p => ({ ...p, primaryColor: e.target.value }))}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 flex-1 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* User Chat Bubble Color */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700">Visitor Bubble Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={customizerDraft.userBubbleColor}
                            onChange={(e) => setCustomizerDraft(p => ({ ...p, userBubbleColor: e.target.value }))}
                            className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-white flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={customizerDraft.userBubbleColor}
                            onChange={(e) => setCustomizerDraft(p => ({ ...p, userBubbleColor: e.target.value }))}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 flex-1 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Corner Radius */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-semibold text-slate-700">Border Radius (Corner Curvature)</label>
                          <span className="font-mono text-slate-500 text-[11px]">{customizerDraft.borderRadius}px</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Sharp", val: 4 },
                            { label: "Soft", val: 12 },
                            { label: "Modern", val: 16 },
                            { label: "Pill", val: 24 },
                          ].map((r) => (
                            <button
                              key={r.val}
                              type="button"
                              onClick={() => setCustomizerDraft(p => ({ ...p, borderRadius: r.val }))}
                              className={`p-2 rounded-lg border text-center text-xs cursor-pointer transition-colors ${
                                customizerDraft.borderRadius === r.val
                                  ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout & Launcher Sub-tab */}
                  {customizerSubTab === "layout" && (
                    <div className="space-y-4">
                      {/* Screen Position */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700">Widget Position on Website</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, position: "bottom-right" }))}
                            className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.position === "bottom-right"
                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            Bottom Right
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, position: "bottom-left" }))}
                            className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.position === "bottom-left"
                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            Bottom Left
                          </button>
                        </div>
                      </div>

                      {/* Launcher Button Style */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700">Launcher Button Style</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, launcherStyle: "circle" }))}
                            className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.launcherStyle === "circle"
                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            Circular Floating Button
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft(p => ({ ...p, launcherStyle: "pill" }))}
                            className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              customizerDraft.launcherStyle === "pill"
                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            Pill Bar with Text
                          </button>
                        </div>
                      </div>

                      {customizerDraft.launcherStyle === "pill" && (
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700">Pill Button Text</label>
                          <input
                            type="text"
                            value={customizerDraft.launcherText}
                            onChange={(e) => setCustomizerDraft(p => ({ ...p, launcherText: e.target.value }))}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs w-full outline-none focus:border-indigo-500"
                            placeholder="Chat with us"
                          />
                        </div>
                      )}

                      {/* Timestamps toggle */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <label className="font-semibold text-slate-700">Show Message Timestamps</label>
                        <input
                          type="checkbox"
                          checked={customizerDraft.showTimestamps}
                          onChange={(e) => setCustomizerDraft(p => ({ ...p, showTimestamps: e.target.checked }))}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Prompts & Messaging Sub-tab */}
                  {customizerSubTab === "prompts" && (
                    <div className="space-y-4">
                      {/* Widget Title */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Widget Title</label>
                        <input
                          type="text"
                          value={customizerDraft.title}
                          onChange={(e) => setCustomizerDraft(p => ({ ...p, title: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-xs w-full outline-none focus:border-indigo-500"
                          placeholder="Live Support"
                        />
                      </div>

                      {/* Subtitle / Greeting */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Subtitle / Response Hint</label>
                        <input
                          type="text"
                          value={customizerDraft.subtitle}
                          onChange={(e) => setCustomizerDraft(p => ({ ...p, subtitle: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-xs w-full outline-none focus:border-indigo-500"
                          placeholder="Typically replies in a few minutes"
                        />
                      </div>

                      {/* Quick Starter Action Prompts */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="font-semibold text-slate-700">Quick Starter Prompts</label>
                        <p className="text-[11px] text-slate-400">
                          These buttons are displayed to visitors before they type to initiate quick conversations.
                        </p>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPromptInput}
                            onChange={(e) => setNewPromptInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPrompt())}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex-1 outline-none focus:border-indigo-500"
                            placeholder="e.g. Request Demo"
                          />
                          <button
                            type="button"
                            onClick={handleAddPrompt}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {customizerDraft.quickPrompts?.map((prompt, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px]"
                            >
                              <span>{prompt}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePrompt(idx)}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Studio Right Live Interactive Preview Box */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-slate-100/70">
                <div className="w-full max-w-md flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Live Interactive Preview</span>
                  </div>

                  {/* Isolated Widget Canvas */}
                  <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[560px]">
                    <ChatWidget
                      merchantId={customizerSiteId || "preview-mode"}
                      config={customizerDraft}
                      isOpenDefault={true}
                      isInlinePreview={true}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Changes take effect instantly on your live embedded widget once you click <strong>"Publish Changes"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Website Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register New Website</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Website Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My E-commerce Store"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Domain / URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. store.mysite.com"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Widget Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newSiteColor}
                    onChange={(e) => setNewSiteColor(e.target.value)}
                    className="w-9 h-9 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={newSiteColor}
                    onChange={(e) => setNewSiteColor(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Welcome Subtitle</label>
                <input
                  type="text"
                  placeholder="Typically replies in a few minutes"
                  value={newSiteWelcome}
                  onChange={(e) => setNewSiteWelcome(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Add Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
