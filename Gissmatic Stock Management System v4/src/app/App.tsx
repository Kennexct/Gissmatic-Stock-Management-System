import React, { useState } from "react";
import { AuthProvider, useAuth } from "./components/auth-context";
import { GlobalActionsProvider } from "./components/global-actions";
import { CrudProgressProvider } from "./components/crud-progress";
import { Login } from "./components/login";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { Inventory } from "./components/inventory-revamped";
import { Settings } from "./components/settings";
import { Suppliers } from "./components/suppliers";
import { Reports } from "./components/reports";
import { Customers } from "./components/customers";
import { Toaster } from "sonner";

// ── Error Boundary ──────────────────────────────────────────────────
// Catches runtime errors in any child component and shows a recovery UI
// instead of crashing the entire application to a white screen.
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#f0f5ff" }}>
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#fff1f2" }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "#0a1565" }}>Something went wrong</h2>
            <p className="text-slate-500 text-sm">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Technical details</summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-red-600 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl text-white font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { currentUser, getUserPermissions } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  if (!currentUser) return <Login />;

  const isSuperAdmin = currentUser.role === "superadmin";
  const perms = getUserPermissions(currentUser.id);

  // Build allowed pages from permissions
  const allowedPages = new Set<string>();
  if (isSuperAdmin || perms.canAccessDashboard) allowedPages.add("dashboard");
  if (isSuperAdmin || perms.canViewInventory) allowedPages.add("inventory");
  if (isSuperAdmin || perms.canViewCustomers) allowedPages.add("customers");
  if (isSuperAdmin || perms.canViewSuppliers) allowedPages.add("suppliers");
  if (isSuperAdmin || perms.canViewReports) allowedPages.add("reports");
  if (isSuperAdmin) allowedPages.add("settings");

  // Default to first allowed page
  const firstAllowed = Array.from(allowedPages)[0] || "inventory";
  const activePage = allowedPages.has(currentPage) ? currentPage : firstAllowed;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setCurrentPage} />;
      case "inventory": return <Inventory />;
      case "customers": return <Customers />;
      case "suppliers": return <Suppliers />;
      case "reports": return <Reports />;
      case "settings": return <Settings />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <GlobalActionsProvider>
      <div className="min-h-screen flex" style={{ backgroundColor: "#f0f5ff" }}>
        <Sidebar
          currentPage={activePage}
          onNavigate={setCurrentPage}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
        />
        <main className="flex-1 min-w-0 min-h-screen max-w-full flex flex-col">
          <div className="p-4 sm:p-5 lg:p-8 w-full max-w-7xl mx-auto pt-20 lg:pt-8 flex-1">
            {renderPage()}
          </div>
        </main>
      </div>
    </GlobalActionsProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CrudProgressProvider>
        <AuthProvider>
          <AppContent />
          <Toaster position="bottom-left" richColors closeButton />
        </AuthProvider>
      </CrudProgressProvider>
    </ErrorBoundary>
  );
}

