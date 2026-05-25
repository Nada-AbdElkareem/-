import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Stays from "./pages/Stays";
import Rooms from "./pages/Rooms";
import Services from "./pages/Services";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Inventory from "./pages/Inventory";
import Assets from "./pages/Assets";
import { AuthProvider, useAuth } from "./lib/auth";

function AppContent() {
  const { user: authUser, setUser, loading } = useAuth();
  
  // Create a mock user if not logged in to disable the login phase
  const user = authUser || { id: 1, name: "مستخدم تجريبي", email: "guest@example.com", role: "admin" };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-sans tracking-tight">جاري التحميل...</div>;

  return (
    <Router>
      <Toaster position="top-center" dir="rtl" />
      <Routes>
        <Route path="/login" element={<Navigate to="/" />} />
        
        <Route element={<Layout user={user} setUser={setUser} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/stays" element={<Stays />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/services" element={<Services />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
