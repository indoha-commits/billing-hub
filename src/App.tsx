import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import LoginRedirect from "./pages/LoginRedirect";
import AuthCallback from "./pages/AuthCallback";
import { RequireAuth } from "./components/auth/RequireAuth";

// Pages
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Invoices from "./pages/Invoices";
import Subscriptions from "./pages/Subscriptions";
import Provisioning from "./pages/Provisioning";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/clients"
            element={
              <RequireAuth>
                <Clients />
              </RequireAuth>
            }
          />
          <Route
            path="/payments"
            element={
              <RequireAuth>
                <Payments />
              </RequireAuth>
            }
          />
          <Route
            path="/invoices"
            element={
              <RequireAuth>
                <Invoices />
              </RequireAuth>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <RequireAuth>
                <Subscriptions />
              </RequireAuth>
            }
          />
          <Route
            path="/provisioning"
            element={
              <RequireAuth>
                <Provisioning />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth>
                <Calendar />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="/audit-log"
            element={
              <RequireAuth>
                <AuditLog />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
