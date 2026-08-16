import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { ChatWidget } from "./components/ChatWidget";

function App() {
  return (
    <Router>
      <div className="min-h-screen relative">
        <Routes>
          {/* Main Dashboard & Tab URL Routing */}
          <Route path="/" element={<Navigate to="/dashboard/chats" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/chats" replace />} />
          
          <Route path="/dashboard/:tab" element={<Dashboard />} />
          <Route path="/dashboard/:tab/:siteId" element={<Dashboard />} />
          <Route path="/dashboard/:tab/:siteId/:sessionId" element={<Dashboard />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard/chats" replace />} />
        </Routes>
        
        {/* Floating Chat Widget available globally for instant testing and preview */}
        <ChatWidget />
      </div>
    </Router>
  );
}

export default App;
