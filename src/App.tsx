import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { LoginPage } from "./pages/LoginPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TestSystem } from "./pages/TestSystem";
import { TestDashboard } from "./pages/TestDashboard";
import { Settings } from "./pages/Settings";
import { SystemSetup } from "./pages/SystemSetup";
import { WebIntegration } from "./pages/WebIntegration";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Index />} />
          <Route 
            path="/employee" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <TestSystem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-dashboard" 
            element={
              <ProtectedRoute>
                <TestDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="/integration" element={<WebIntegration />} />
          <Route path="/setup" element={<SystemSetup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
