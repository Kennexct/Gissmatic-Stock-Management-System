import React, { useState } from "react";
import {
  Settings as SettingsIcon, User, Bell, Shield,
  Users, UserPlus, Trash2, AlertTriangle, ChevronDown, ChevronUp, Mail, Search, Database
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { useAuth } from "./auth-context";
import { UserRole, User as UserType, UserPermissions } from "../../lib/types";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

type SettingsTab = "profile" | "security" | "notifications" | "staff" | "data_inventory";

const PERMISSION_GROUPS = [
  {
    group: "Quick Action Buttons",
    description: "Global floating quick-action visibility",
    items: [
      { key: "showQuickAddStock", label: "Show Add Stock Button", desc: "Floating quick-add stock button" },
      { key: "showQuickOutStock", label: "Show Out Stock Button", desc: "Floating quick out-stock button" },
    ],
  },
  {
    group: "Dashboard",
    description: "Main overview page access",
    items: [
      { key: "canAccessDashboard", label: "View Dashboard", desc: "Access the main dashboard overview" },
    ],
  },
  {
    group: "Inventory",
    description: "Part number & stock management",
    items: [
      { key: "canViewInventory", label: "View Inventory", desc: "Browse the full product list" },
      { key: "canAddStock", label: "Add Stock", desc: "Add stock to existing or new part numbers" },
      { key: "canStockIn", label: "Edit Products", desc: "Edit product details from inventory" },
      { key: "canOutStock", label: "Out Stock", desc: "Record outgoing stock movements" },
      { key: "canFreezeStock", label: "Freeze Stock", desc: "Freeze stock and manage freeze list" },
    ],
  },
  {
    group: "Customers",
    description: "Customer data access",
    items: [
      { key: "canViewCustomers", label: "View Customers", desc: "Browse customer list and history" },
      { key: "canManageCustomers", label: "Manage Customers", desc: "Add and delete customers" },
    ],
  },
  {
    group: "Suppliers",
    description: "Supplier data access",
    items: [
      { key: "canViewSuppliers", label: "View Suppliers", desc: "Browse supplier list" },
      { key: "canManageSuppliers", label: "Manage Suppliers", desc: "Add and edit suppliers" },
    ],
  },
  {
    group: "Reports",
    description: "Analytics and export",
    items: [
      { key: "canViewReports", label: "View Reports", desc: "Access the reports page" },
      { key: "canExportReports", label: "Export Reports", desc: "Download PDF and Excel reports" },
    ],
  },
];

function PermissionToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative shrink-0 transition-all"
      style={{ width: "40px", height: "22px" }}
    >
      <div
        className="w-full h-full rounded-full transition-colors"
        style={{ background: value ? "linear-gradient(135deg, #16c60c, #0d9904)" : "#cbd5e1" }}
      />
      <div
        className="absolute top-0.5 rounded-full bg-white shadow-sm transition-all"
        style={{ width: "18px", height: "18px", transform: value ? "translateX(19px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function StaffPermissionsPanel({ user, permissions, onUpdate, onDelete, confirmAction }: {
  user: UserType;
  permissions: UserPermissions;
  onUpdate: (updates: Partial<UserPermissions>) => void;
  onDelete?: () => void;
  confirmAction?: (title: string, desc: string, actionName: string, onConfirm: () => void) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: "linear-gradient(135deg, #0a156520, #1229b320)", color: "#0a1565" }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{user.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "#0a156515", color: "#0a1565" }}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          {onDelete && (
            <button
               onClick={(e) => { e.stopPropagation(); onDelete(); }}
               className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
               title="Remove Staff"
            >
               <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 sm:px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6 mb-5">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="text-sm font-semibold mb-2 border-b border-slate-200 pb-1" style={{ color: "#0a1565" }}>{group.group}</p>
                <div className="space-y-2.5 mt-2">
                  {group.items.map((item) => {
                    const val = permissions[item.key as keyof UserPermissions] as boolean;
                    return (
                      <label key={item.key} className="flex items-start gap-2.5 group cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (confirmAction) {
                              confirmAction("Update Permission", `Are you sure you want to ${checked ? "grant" : "revoke"} access for "${item.label}"?`, "Confirm", () => {
                                onUpdate({ [item.key]: checked } as Partial<UserPermissions>);
                              });
                            } else {
                              onUpdate({ [item.key]: checked } as Partial<UserPermissions>);
                            }
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0a1565] focus:ring-[#0a1565] cursor-pointer"
                        />
                        <div className="min-w-0 -mt-0.5">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</p>
                          <p className="text-[11px] text-slate-400 leading-tight block mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                if (confirmAction) {
                  confirmAction("Enable All", `Are you sure you want to grant all permissions to ${user.name}?`, "Enable All", () => {
                    const updates: Partial<UserPermissions> = {};
                    PERMISSION_GROUPS.flatMap((g) => g.items).forEach((item) => updates[item.key as keyof UserPermissions] = true);
                    onUpdate(updates);
                    toast.success(`All permissions enabled for ${user.name}`);
                  });
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: "#f0fff4", color: "#0d6604", border: "1px solid #bbf7d0" }}
            >
              Enable All
            </button>
            <button
              onClick={() => {
                if (confirmAction) {
                  confirmAction("Disable All", `Are you sure you want to safely revoke all permissions from ${user.name}?`, "Disable All", () => {
                    const updates: Partial<UserPermissions> = {};
                    PERMISSION_GROUPS.flatMap((g) => g.items).forEach((item) => updates[item.key as keyof UserPermissions] = false);
                    onUpdate(updates);
                    toast.success(`All permissions disabled for ${user.name}`);
                  });
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-red-50 text-red-600 border border-red-100"
            >
              Disable All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Settings() {
  const { currentUser, users, addUser, deleteUser, getUserPermissions, updateUserPermissions, updateProfile, updatePassword, factoryReset } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifAdjust, setNotifAdjust] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", role: "viewer" as UserRole });
  const [isCreating, setIsCreating] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean; title: string; desc: string; action: string; onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, desc: string, action: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, desc, action, onConfirm });
  };

  // Data Inventory Security State
  const [isDataInventoryUnlocked, setIsDataInventoryUnlocked] = useState(false);
  const [dataInventoryPass, setDataInventoryPass] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showDataUnlockModal, setShowDataUnlockModal] = useState(false);

  const handleTabClick = (tabId: SettingsTab) => {
    if (tabId === "data_inventory" && !isDataInventoryUnlocked) {
      setShowDataUnlockModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleUnlockDataInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    if (!currentUser?.email) return;
    
    setIsUnlocking(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: dataInventoryPass });
    setIsUnlocking(false);

    if (error || !data.user) {
      setUnlockError("Incorrect password");
    } else {
      setIsDataInventoryUnlocked(true);
      setShowDataUnlockModal(false);
      setActiveTab("data_inventory");
      setDataInventoryPass("");
      toast.success("Data Inventory unlocked");
    }
  };

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isSavingPass, setIsSavingPass] = useState(false);

  const nonAdminUsers = users.filter((u) => u.role !== "superadmin");
  const filteredStaff = nonAdminUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setIsSavingProfile(true);
    const { success, error } = await updateProfile(profileName.trim(), profileEmail.trim());
    setIsSavingProfile(false);
    if (success) toast.success("Profile updated successfully");
    else toast.error(error || "Failed to update profile");
  };

  const handleUpdatePassword = async () => {
    if (!newPass || !confirmPass) {
      toast.error("Please fill in the new password fields");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsSavingPass(true);
    const { success, error } = await updatePassword(newPass);
    setIsSavingPass(false);
    if (success) {
      toast.success("Password updated successfully");
      setNewPass("");
      setConfirmPass("");
    } else {
      toast.error(error || "Failed to update password");
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.name || !staffForm.email) { toast.error("Please fill in all fields"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffForm.email)) { toast.error("Enter a valid email"); return; }
    
    setIsCreating(true);
    const result = await addUser(staffForm);
    setIsCreating(false);

    if (result.success) {
      toast.success(`Staff member "${staffForm.name}" created`);
      setIsCreateModalOpen(false);
      setStaffForm({ name: "", email: "", role: "viewer" });
    } else {
      toast.error(result.error || "Failed to create staff member");
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    toast.success(`"${userToDelete.name}" removed`);
    setUserToDelete(null);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "staff", label: "Staff & Access", icon: Users },
  ];
  
  if (currentUser?.role === 'superadmin') {
    tabs.push({ id: "data_inventory", label: "Data Inventory", icon: Database });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2" style={{ color: "#0a1565" }}>
          <SettingsIcon className="h-7 w-7" style={{ color: "#16c60c" }} />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account, preferences, and team access</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${isActive ? "border-[#16c60c] text-[#0a1565]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-5">

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-4 flex-col sm:flex-row sm:items-start">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0a156515" }}>
                  <User className="h-5 w-5" style={{ color: "#0a1565" }} />
                </div>
                <div>
                  <CardTitle className="text-base">Profile Information</CardTitle>
                  <CardDescription className="mt-0.5">Update your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Full Name</Label>
                  <Input id="p-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">Email Address</Label>
                  <Input id="p-email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-role">Role</Label>
                <Input
                  id="p-role"
                  disabled
                  value={currentUser?.role.charAt(0).toUpperCase() + (currentUser?.role.slice(1) || "")}
                  className="rounded-xl bg-slate-50 text-slate-500"
                />
              </div>
              <Button
                disabled={isSavingProfile}
                className="rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
                onClick={() => requestConfirm("Update Profile", "Are you sure you want to permanently save changes to your profile name and email address?", "Save Profile", handleUpdateProfile)}
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Security Settings</CardTitle>
                  <CardDescription className="mt-0.5">Manage your password and security preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pass">New Password</Label>
                  <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass">Confirm Password</Label>
                  <Input id="confirm-pass" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="••••••••" className="rounded-xl" />
                </div>
              </div>
              <Button disabled={isSavingPass} variant="outline" className="rounded-xl" onClick={() => requestConfirm("Update Password", "Are you sure you want to change your password? Doing so might require you to login again.", "Change Password", handleUpdatePassword)}>
                {isSavingPass ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Notification Preferences</CardTitle>
                  <CardDescription className="mt-0.5">Control which alerts you receive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Low Stock Alerts", desc: "Notify when items fall below minimum stock", val: notifLowStock, set: setNotifLowStock },
                { label: "Email Notifications", desc: "Receive daily summary reports via email", val: notifEmail, set: setNotifEmail },
                { label: "Stock Adjustment Alerts", desc: "Alert when other users adjust inventory", val: notifAdjust, set: setNotifAdjust },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{item.desc}</p>
                  </div>
                  <PermissionToggle value={item.val} onChange={(v) => { 
                    requestConfirm(
                      `${v ? "Enable" : "Disable"} Notification`,
                      `Are you sure you want to ${v ? "enable" : "disable"} ${item.label.toLowerCase()}?`,
                      "Confirm",
                      () => { item.set(v); toast.success(`${item.label} ${v ? "enabled" : "disabled"}`); }
                    );
                  }} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Staff & Access Tab */}
        {activeTab === "staff" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold" style={{ color: "#0a1565" }}>Staff Members</h3>
                <p className="text-sm text-slate-500">{nonAdminUsers.length} non-admin staff · manage access</p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-xl text-white gap-2"
                style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
              >
                <UserPlus className="w-4 h-4" />Add Staff
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Superadmin list */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {users.filter((u) => u.role === "superadmin").map((u) => (
                    <div key={u.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)", color: "white" }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                          {u.id === currentUser?.id && <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#16c60c20", color: "#0d6604" }}>You</span>}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{u.email}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)", color: "white" }}>Superadmin</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Non-admin staff permissions */}
            <div className="space-y-3">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>{searchQuery ? `No staff matching "${searchQuery}"` : "No non-admin staff members found"}</p>
                </div>
              ) : (
                filteredStaff.map((user) => {
                  const perms = getUserPermissions(user.id);
                  return (
                    <div key={user.id} className="relative">
                      <StaffPermissionsPanel
                        user={user}
                        permissions={perms}
                        onUpdate={(updates) => {
                          updateUserPermissions(user.id, updates);
                          const keys = Object.keys(updates);
                          if (keys.length === 1) {
                            toast.success(`Updated: ${keys[0].replace(/([A-Z])/g, " $1").trim()}`);
                          }
                        }}
                        onDelete={() => setUserToDelete(user)}
                        confirmAction={requestConfirm}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Data Inventory Tab */}
        {activeTab === "data_inventory" && currentUser?.role === 'superadmin' && isDataInventoryUnlocked && (
          <div className="space-y-5">
            <Card className="rounded-2xl border-red-200 shadow-sm bg-red-50/30 overflow-hidden">
              <div className="h-1 bg-red-500 w-full" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-red-700">Danger Zone: Database Reset</CardTitle>
                    <CardDescription className="mt-0.5 text-red-600/80">Permanent and irreversible actions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-red-100">
                  <p className="font-semibold text-slate-800 mb-1">Erase active inventory database</p>
                  <p className="text-sm text-slate-500 mb-4">
                    This will permanently empty all Products, Customers, Suppliers, Transactions, and Audit Logs from the cloud database and your local browser. User accounts and login credentials will be retained so you can log back in.
                  </p>
                  <Button
                    variant="destructive"
                    className="rounded-xl w-full sm:w-auto"
                    onClick={() => {
                      requestConfirm(
                        "Absolute Final Warning",
                        "Are you absolutely certain? This will wipe the active Supabase transactional tables. This cannot be undone.",
                        "Yes, Wipe Database",
                        async () => {
                          const { success, error } = await factoryReset();
                          if (success) {
                            toast.success("Database has been completely wiped.");
                          } else {
                            toast.error("Wipe failed: " + error);
                          }
                        }
                      );
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Inventory Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Staff Member</DialogTitle>
            <DialogDescription>Add a new user and configure their default access level</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="sm-name">Full Name</Label>
              <Input id="sm-name" placeholder="Jane Doe" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sm-email">Email Address</Label>
              <Input id="sm-email" type="email" placeholder="jane@company.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Default Role</Label>
              <Select value={staffForm.role} onValueChange={(v: UserRole) => setStaffForm({ ...staffForm, role: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager — broad access</SelectItem>
                  <SelectItem value="clerk">Clerk — inventory operations</SelectItem>
                  <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-400">You can fine-tune individual permissions after creation in the Staff & Access tab.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button disabled={isCreating} className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleCreateStaff}>
              {isCreating ? "Creating..." : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />Remove Staff Member
            </DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-slate-900">{userToDelete?.name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteUser}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Universal Action Confirm */}
      <Dialog open={!!confirmConfig?.isOpen} onOpenChange={(open) => !open && setConfirmConfig(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{confirmConfig?.title}</DialogTitle>
            <DialogDescription>{confirmConfig?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmConfig(null)}>Cancel</Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={() => {
              if (confirmConfig) {
                confirmConfig.onConfirm();
                setConfirmConfig(null);
              }
            }}>
              {confirmConfig?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Inventory Password Challenge */}
      <Dialog open={showDataUnlockModal} onOpenChange={setShowDataUnlockModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-amber-500" /> Security Verification
            </DialogTitle>
            <DialogDescription>
              Please enter your Master Admin password to safely access the Data Inventory settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnlockDataInventory} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="unlock-pass">Password</Label>
              <Input
                id="unlock-pass"
                type="password"
                autoFocus
                placeholder="••••••••"
                value={dataInventoryPass}
                onChange={(e) => { setDataInventoryPass(e.target.value); setUnlockError(""); }}
                className="rounded-xl"
              />
            </div>
            {unlockError && <p className="text-sm text-red-600">{unlockError}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowDataUnlockModal(false); setDataInventoryPass(""); setUnlockError(""); }}>Cancel</Button>
              <Button type="submit" disabled={isUnlocking} className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}>
                {isUnlocking ? "Verifying..." : "Unlock Access"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
