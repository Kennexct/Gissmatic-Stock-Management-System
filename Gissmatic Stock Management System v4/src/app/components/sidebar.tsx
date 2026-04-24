import React from "react";
import {
  LayoutDashboard, Package, Settings, LogOut, Menu, X,
  BarChart3, Truck, ShoppingCart, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "./auth-context";
import { cn } from "../../lib/utils";

const logoImage = "https://placehold.co/100x100/16c60c/ffffff?text=G&font=roboto";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onToggle, isMinimized, onToggleMinimize }: SidebarProps) {
  const { currentUser, logout, getUserPermissions } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";
  const perms = currentUser ? getUserPermissions(currentUser.id) : null;

  const allLinks: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "customers", label: "Customers", icon: ShoppingCart },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  // Filter nav items by permissions
  const visibleLinks = allLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (link.id === "dashboard") return perms?.canAccessDashboard;
    if (link.id === "inventory") return perms?.canViewInventory;
    if (link.id === "customers") return perms?.canViewCustomers;
    if (link.id === "suppliers") return perms?.canViewSuppliers;
    if (link.id === "reports") return perms?.canViewReports;
    return false;
  });

  const roleLabel: Record<string, string> = {
    superadmin: "Superadmin", manager: "Manager", clerk: "Clerk", viewer: "Viewer",
  };

  const navigate = (page: string) => {
    onNavigate(page);
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 h-screen inset-y-0 left-0 z-50 flex flex-col transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMinimized ? "lg:w-16" : "lg:w-64",
          "w-64"
        )}
        style={{ background: "linear-gradient(180deg, #070e42 0%, #0a1565 60%, #0b1f6e 100%)" }}
      >
        {/* Logo / Branding */}
        <div className={cn("border-b border-white/[0.07]", isMinimized ? "px-2 pt-4 pb-3" : "px-4 pt-5 pb-4")}>
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-2.5", isMinimized && "lg:justify-center lg:w-full")}>
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <img src={logoImage} alt="GISSMATIC" className="w-full h-full object-cover" />
              </div>
              {!isMinimized && (
                <div>
                  <p className="text-white font-semibold tracking-wide text-sm">GISSMATIC</p>
                  <p className="text-[#16c60c]/70 text-xs">Automatisierung</p>
                </div>
              )}
            </div>
            <button onClick={onToggle} className="lg:hidden text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
            {/* Desktop minimize toggle */}
            {!isMinimized && (
              <button
                onClick={onToggleMinimize}
                className="hidden lg:flex text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand button when minimized */}
          {isMinimized && (
            <div className="hidden lg:flex justify-center mt-2">
              <button
                onClick={onToggleMinimize}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-4 space-y-0.5 overflow-y-auto", isMinimized ? "px-2" : "px-3")}>
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                title={isMinimized ? link.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-150 text-left group",
                  isMinimized ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                  isActive
                    ? "text-[#070e42] font-semibold shadow-lg"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                )}
                style={isActive ? { background: "linear-gradient(135deg, #16c60c, #0d9904)" } : {}}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {!isMinimized && <span className="text-sm flex-1">{link.label}</span>}
                {!isMinimized && isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}

          {/* Settings (superadmin only) */}
          {isSuperAdmin && (
            <>
              {isMinimized && <div className="pt-2" />}
              <button
                onClick={() => navigate("settings")}
                title={isMinimized ? "Settings" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-150 text-left",
                  isMinimized ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                  currentPage === "settings"
                    ? "text-[#070e42] font-semibold shadow-lg"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                )}
                style={currentPage === "settings" ? { background: "linear-gradient(135deg, #16c60c, #0d9904)" } : {}}
              >
                <Settings className="w-4.5 h-4.5 shrink-0" />
                {!isMinimized && <span className="text-sm flex-1">Settings</span>}
                {!isMinimized && currentPage === "settings" && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div className={cn("py-4 border-t border-white/[0.07]", isMinimized ? "px-2" : "px-3")}>
          {!isMinimized ? (
            <>
              <div className="px-3 py-2.5 rounded-xl bg-white/[0.05] mb-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16c60c20, #16c60c40)" }}>
                  <span className="text-[#16c60c] text-sm font-bold">{currentUser?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "#16c60c20", color: "#16c60c" }}>
                    {roleLabel[currentUser?.role || "viewer"]}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/[0.05] hover:text-white transition-all duration-150"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-sm">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16c60c20, #16c60c40)" }}>
                <span className="text-[#16c60c] text-sm font-bold">{currentUser?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border border-white/10"
        style={{ background: "linear-gradient(135deg, #0a1565, #070e42)" }}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>
    </>
  );
}
