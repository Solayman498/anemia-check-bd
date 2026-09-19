// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import ProfileSetup from "./pages/ProfileSetup";
import Success from "./pages/Success";
import Dashboard from "./pages/Dashboard";
import LabReport from "./pages/LabReport";
import Symptoms from "./pages/Symptoms";
import Result from "./pages/Result";
import History from "./pages/History";
import DailyTracker from "./pages/DailyTracker"; 
import HBTracker from "./pages/HBTracker";
import Settings from "./pages/Settings";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Outside Layout - No Sidebar */}
          <Route path="/" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/success" element={<Success />} />
          
          {/* Inside Layout - With Sidebar */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lab" element={<LabReport />} />
            <Route path="/symptoms" element={<Symptoms />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
            {/* New Daily Tracker Route */}
            <Route path="/daily-tracker" element={<DailyTracker />} />
            <Route path="/hb-tracker" element={<HBTracker />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;