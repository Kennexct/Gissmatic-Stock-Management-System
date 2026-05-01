import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

const logoImage = "/logo.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetupMode, setNeedsSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter both email and password"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return; }
    
    setIsLoading(true);
    const response = await login(email, password);
    setIsLoading(false);

    if (!response.success) {
      setError(response.error || "No account found with that email.");
    } else if (response.needsSetup) {
      setNeedsSetupMode(true);
      toast.info("Account found! Please set your permanent password.");
    } else {
      toast.success("Welcome back!");
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { setError(updateError.message); return; }
      
      const { error: dbError } = await supabase.from('users').update({ requires_password_change: false }).eq('email', email);
      if (dbError) { setError("Database update failed: " + dbError.message); return; }
      
      const response = await login(email, newPassword);
      if (!response.success) {
        setError(response.error || "Failed to finalize login.");
        return;
      }
      
      toast.success("Password secured! Welcome.");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during setup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #070e42 0%, #0a1565 40%, #0d5c1a 80%, #16c60c 100%)" }}
      >
        {/* Background noise/texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #16c60c 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1229b3 0%, transparent 50%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <img src={logoImage} alt="GISSMATIC Automatisierung" className="h-16 w-auto object-contain" />
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-white font-semibold leading-tight" style={{ fontSize: "2.5rem" }}>
              Smart Inventory.<br />
              <span style={{ color: "#16c60c" }}>Total Control.</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Track stock, manage suppliers, record sales, and generate live reports — all in one powerful platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { label: "Barcode Scanning", icon: "📷" },
              { label: "Real-time Reports", icon: "📊" },
              { label: "Customer Tracking", icon: "👥" },
              { label: "PDF / Excel Export", icon: "📁" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 bg-white/8 rounded-xl px-3 py-2.5 border border-white/10">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/80 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-sm">© 2026 GISSMATIC Automatisierung</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#f0f5ff]">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={logoImage} alt="GISSMATIC" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-[#0a1565]">GISSMATIC</p>
              <p className="text-slate-400 text-xs">Automatisierung</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-slate-900" style={{ fontSize: "1.75rem", fontWeight: 600 }}>Welcome back</h1>
            <p className="text-slate-500">Sign in to access your inventory system</p>
          </div>

          {!needsSetupMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:border-[#0a1565]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-10 pr-10 h-11 bg-white border-slate-200 rounded-xl focus:border-[#0a1565]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <span>⚠</span>{error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-white font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </div>
                ) : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h3 className="text-amber-800 font-semibold mb-1">Set up required</h3>
                <p className="text-amber-700 text-sm">Please choose a permanent password for your account to continue.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-slate-700">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    className="pl-10 pr-10 h-11 bg-white border-slate-200 rounded-xl focus:border-[#0a1565]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <span>⚠</span>{error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-white font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)" }}
              >
                {isLoading ? "Saving..." : "Save & Continue"}
              </Button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
