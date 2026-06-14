import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import NewComparison from "./pages/NewComparison";
import Progress from "./pages/Progress";
import Results from "./pages/Results";
import ElementDetail from "./pages/ElementDetail";
import ScreenshotViewer from "./pages/ScreenshotViewer";
import History from "./pages/History";
import Settings from "./pages/Settings";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/new" element={<NewComparison />} />
                <Route path="/progress/:sessionId" element={<Progress />} />
                <Route path="/results/:sessionId" element={<Results />} />
                <Route path="/results/:sessionId/element/:elementId" element={<ElementDetail />} />
                <Route path="/results/:sessionId/screenshots" element={<ScreenshotViewer />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
