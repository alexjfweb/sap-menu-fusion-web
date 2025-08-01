import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import PasswordReset from "./pages/PasswordReset";
import Dashboard from "./components/Dashboard";
import PublicMenu from "./components/menu/PublicMenu";
import NotFound from "./pages/NotFound";
import ConnectionStatusIndicator from "@/components/ConnectionStatusIndicator";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import SuperAdminDashboard from "./components/dashboards/SuperAdminDashboard";
import EmpleadoDashboard from "./components/dashboards/EmpleadoDashboard";
import RouteVerifier from "./components/RouteVerifier";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <ConnectionStatusIndicator />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<PublicMenu />} />
              <Route path="/menu/:restaurantSlug" element={<PublicMenu />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth/reset-password" element={<PasswordReset />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={
                <RouteVerifier requiredRole="admin">
                  <AdminDashboard />
                </RouteVerifier>
              } />
              <Route path="/superadmin" element={
                <RouteVerifier requiredRole="superadmin">
                  <SuperAdminDashboard />
                </RouteVerifier>
              } />
              <Route path="/empleado" element={
                <RouteVerifier requiredRole="empleado">
                  <EmpleadoDashboard />
                </RouteVerifier>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
