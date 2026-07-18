import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Workspace from "./pages/Workspace";
import ProblemsPage from "./pages/ProblemsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage isLogin={true} />} />
        <Route path="/signup" element={<AuthPage isLogin={false} />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/docs" element={<PlaceholderPage title="Documentation" description="Comprehensive API references, guides, and tutorials for CodePro Engine." icon="library_books" />} />
        <Route path="/pricing" element={<PlaceholderPage title="Pricing Plans" description="Choose the perfect plan for your high-performance cloud execution needs." icon="payments" />} />
        <Route path="/ai" element={<PlaceholderPage title="AI Assistant" description="Next-generation intelligent code completion, debugging, and refactoring." icon="smart_toy" />} />
        <Route path="/community" element={<PlaceholderPage title="Community" description="Join thousands of developers worldwide to discuss, share, and collaborate." icon="forum" />} />
      </Routes>
    </Router>
  );
}

export default App;