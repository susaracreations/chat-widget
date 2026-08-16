import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { ChatWidget } from "./components/ChatWidget";

function App() {
  return (
    <Router>
      <div className="min-h-screen relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        
        {/* Floating Chat Widget available globally for instant testing and preview */}
        <ChatWidget />
      </div>
    </Router>
  );
}

export default App;
