import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import CreateAdmin from "./pages/CreateAdmin";
import AdminInviteRegister from "./pages/AdminInviteRegister";
import ReportIssuePage from "./pages/ReportIssuePage";
import AlertDetailsPage from "./pages/AlertDetailsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster position="top-right" />
        <BrowserRouter>
          <Navbar />
                  <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* New dashboard routes */}
          <Route path="/citizen-dashboard" element={<PrivateRoute role="citizen"><CitizenDashboard /></PrivateRoute>} />
          <Route path="/admin-dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/supervisor-dashboard" element={<PrivateRoute role="supervisor"><SupervisorDashboard /></PrivateRoute>} />
          <Route path="/create-admin" element={<PrivateRoute role="supervisor"><CreateAdmin /></PrivateRoute>} />
          <Route path="/admin-register" element={<AdminInviteRegister />} />
          <Route path="/report" element={<PrivateRoute><ReportIssuePage /></PrivateRoute>} />
          <Route path="/alert/:id" element={<PrivateRoute><AlertDetailsPage /></PrivateRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
