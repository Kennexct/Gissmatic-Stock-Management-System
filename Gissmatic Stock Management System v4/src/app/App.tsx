import React, { useState } from "react";
import { AuthProvider, useAuth } from "./components/auth-context";
import { GlobalActionsProvider } from "./components/global-actions";
import { Login } from "./components/login";
import { Sidebar } from "./components/sidebar";
import { Dashboard } from "./components/dashboard";
import { Inventory } from "./components/inventory-revamped";
import { Settings } from "./components/settings";
import { Suppliers } from "./components/suppliers";
import { Reports } from "./components/reports";
import { Customers } from "./components/customers";
import { Toaster } from "sonner";

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
    <AuthProvider>
      <AppContent />
      <Toaster position="bottom-left" richColors closeButton />
    </AuthProvider>
  );
}
