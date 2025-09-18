import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import { Suspense, lazy } from "react";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load page components for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CitizenDashboard = lazy(() => import("./pages/CitizenDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SupervisorDashboard = lazy(() => import("./pages/SupervisorDashboard"));
const CreateAdmin = lazy(() => import("./pages/CreateAdmin"));
const AdminInviteRegister = lazy(() => import("./pages/AdminInviteRegister"));
const ReportIssuePage = lazy(() => import("./pages/ReportIssuePage"));
const AlertDetailsPage = lazy(() => import("./pages/AlertDetailsPage"));

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
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
