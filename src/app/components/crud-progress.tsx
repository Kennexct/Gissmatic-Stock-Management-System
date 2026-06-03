import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ─────────────────────────────────────────────────────────
type CrudAction = "create" | "update" | "delete" | "sync" | "freeze" | "release" | "stock-in" | "stock-out";
type CrudStatus = "progress" | "success" | "error";

interface CrudOperation {
  id: string;
  action: CrudAction;
  label: string;
  status: CrudStatus;
  detail?: string;
}

interface CrudProgressContextType {
  /** Start a CRUD operation. Returns an ID to later resolve it. */
  startOperation: (action: CrudAction, label: string) => string;
  /** Mark an operation as successful */
  completeOperation: (id: string, detail?: string) => void;
  /** Mark an operation as failed */
  failOperation: (id: string, detail?: string) => void;
  /** Wrap an async fn with automatic start → complete / fail */
  withProgress: <T>(action: CrudAction, label: string, fn: () => Promise<T>) => Promise<T>;
}

const CrudProgressContext = createContext<CrudProgressContextType | null>(null);

export function useCrudProgress() {
  const ctx = useContext(CrudProgressContext);
  if (!ctx) throw new Error("useCrudProgress must be used within CrudProgressProvider");
  return ctx;
}

// ─── Action Config ─────────────────────────────────────────────────
const actionConfig: Record<CrudAction, { icon: string; gradient: string; glowColor: string; successIcon: string }> = {
  "create":    { icon: "📦", gradient: "linear-gradient(135deg, #0a1565, #1e3a8a)", glowColor: "rgba(10,21,101,0.3)", successIcon: "✅" },
  "update":    { icon: "✏️",  gradient: "linear-gradient(135deg, #0a1565, #1229b3)", glowColor: "rgba(18,41,179,0.3)", successIcon: "✅" },
  "delete":    { icon: "🗑️",  gradient: "linear-gradient(135deg, #dc2626, #991b1b)", glowColor: "rgba(220,38,38,0.3)", successIcon: "✅" },
  "sync":      { icon: "☁️",  gradient: "linear-gradient(135deg, #0a1565, #1229b3)", glowColor: "rgba(10,21,101,0.25)", successIcon: "☁️" },
  "freeze":    { icon: "❄️",  gradient: "linear-gradient(135deg, #0ea5e9, #0369a1)", glowColor: "rgba(14,165,233,0.3)", successIcon: "✅" },
  "release":   { icon: "🔓", gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)", glowColor: "rgba(124,58,237,0.3)", successIcon: "✅" },
  "stock-in":  { icon: "📥", gradient: "linear-gradient(135deg, #0a1565, #1229b3)", glowColor: "rgba(10,21,101,0.3)", successIcon: "✅" },
  "stock-out": { icon: "📤", gradient: "linear-gradient(135deg, #16c60c, #0d6604)", glowColor: "rgba(22,198,12,0.3)", successIcon: "✅" },
};

// ─── Animated Orbs (background decoration) ─────────────────────────
function FloatingOrbs({ gradient }: { gradient: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "inherit" }}>
      <motion.div
        className="absolute rounded-full opacity-20"
        style={{ width: 60, height: 60, background: gradient, filter: "blur(20px)", top: "-10px", right: "-10px" }}
        animate={{ x: [0, 10, -5, 0], y: [0, -8, 5, 0], scale: [1, 1.2, 0.95, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full opacity-15"
        style={{ width: 40, height: 40, background: gradient, filter: "blur(15px)", bottom: "-5px", left: "10px" }}
        animate={{ x: [0, -8, 5, 0], y: [0, 5, -8, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </div>
  );
}

// ─── Progress Ring ──────────────────────────────────────────────────
function ProgressRing({ gradient }: { gradient: string }) {
  return (
    <div className="relative" style={{ width: 48, height: 48 }}>
      {/* Outer spinning ring */}
      <motion.svg
        viewBox="0 0 48 48"
        className="absolute inset-0"
        style={{ width: 48, height: 48 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1565" />
            <stop offset="100%" stopColor="#16c60c" />
          </linearGradient>
        </defs>
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 45"
        />
      </motion.svg>
      {/* Inner pulsing dot */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-5 h-5 rounded-full"
          style={{ background: gradient, boxShadow: `0 0 12px rgba(10,21,101,0.3)` }}
        />
      </motion.div>
    </div>
  );
}

// ─── Success Burst ──────────────────────────────────────────────────
function SuccessBurst() {
  return (
    <div className="relative" style={{ width: 48, height: 48 }}>
      {/* Burst particles */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 4, height: 4, borderRadius: "50%",
            background: i % 2 === 0 ? "#16c60c" : "#0a1565",
            top: "50%", left: "50%",
            transformOrigin: "center",
          }}
          initial={{ x: "-50%", y: "-50%", scale: 0, opacity: 1 }}
          animate={{
            x: `calc(-50% + ${Math.cos((angle * Math.PI) / 180) * 22}px)`,
            y: `calc(-50% + ${Math.sin((angle * Math.PI) / 180) * 22}px)`,
            scale: [0, 1.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.03 }}
        />
      ))}
      {/* Check icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)", boxShadow: "0 4px 15px rgba(22,198,12,0.4)" }}
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 12l5 5L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
          </motion.svg>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Error Icon ─────────────────────────────────────────────────────
function ErrorIcon() {
  return (
    <motion.div
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 4px 15px rgba(220,38,38,0.4)" }}
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.15, 1] }}
      transition={{ duration: 0.4 }}
    >
      <motion.svg
        viewBox="0 0 24 24" className="w-5 h-5 text-white"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      >
        <motion.path d="M18 6L6 18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.15 }} />
        <motion.path d="M6 6l12 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.25 }} />
      </motion.svg>
    </motion.div>
  );
}

// ─── Single Toast Item ──────────────────────────────────────────────
function CrudToast({ op, onDone }: { op: CrudOperation; onDone: () => void }) {
  const config = actionConfig[op.action];

  useEffect(() => {
    if (op.status === "success" || op.status === "error") {
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
  }, [op.status, onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px) saturate(1.8)",
        WebkitBackdropFilter: "blur(16px) saturate(1.8)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.7)`,
        minWidth: 280,
        maxWidth: 380,
      }}
    >
      <FloatingOrbs gradient={config.gradient} />

      {/* Top accent bar */}
      <motion.div
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: config.gradient, borderRadius: "16px 16px 0 0" }}
        initial={{ scaleX: 0, transformOrigin: "left" }}
        animate={{ scaleX: op.status === "progress" ? [0, 0.7] : 1 }}
        transition={op.status === "progress"
          ? { duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
          : { duration: 0.3 }
        }
      />

      <div className="relative flex items-center gap-3 px-4 py-3.5">
        {/* Icon / Progress / Success */}
        <div className="shrink-0">
          {op.status === "progress" && <ProgressRing gradient={config.gradient} />}
          {op.status === "success" && <SuccessBurst />}
          {op.status === "error" && <ErrorIcon />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.icon}</span>
            <motion.p
              className="text-sm font-semibold truncate"
              style={{ color: "#0a1565" }}
              key={op.status}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {op.status === "progress" && op.label}
              {op.status === "success" && (op.detail || "Done!")}
              {op.status === "error" && (op.detail || "Failed")}
            </motion.p>
          </div>
          {op.status === "progress" && (
            <motion.p
              className="text-xs mt-0.5"
              style={{ color: "#64748b" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Syncing to cloud…
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────
export function CrudProgressProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<CrudOperation[]>([]);
  const idCounter = useRef(0);

  const startOperation = useCallback((action: CrudAction, label: string): string => {
    const id = `crud_${Date.now()}_${idCounter.current++}`;
    setOperations((prev) => [...prev, { id, action, label, status: "progress" }]);
    return id;
  }, []);

  const completeOperation = useCallback((id: string, detail?: string) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status: "success" as CrudStatus, detail } : op))
    );
  }, []);

  const failOperation = useCallback((id: string, detail?: string) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status: "error" as CrudStatus, detail } : op))
    );
  }, []);

  const removeOperation = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  }, []);

  const withProgress = useCallback(
    async <T,>(action: CrudAction, label: string, fn: () => Promise<T>): Promise<T> => {
      const id = startOperation(action, label);
      try {
        const result = await fn();
        completeOperation(id, `${label} — complete`);
        return result;
      } catch (err: any) {
        failOperation(id, err?.message || "Operation failed");
        throw err;
      }
    },
    [startOperation, completeOperation, failOperation]
  );

  return (
    <CrudProgressContext.Provider value={{ startOperation, completeOperation, failOperation, withProgress }}>
      {children}

      {/* Toast Stack — fixed bottom-right, above FAB */}
      <div
        className="fixed z-[100] flex flex-col-reverse gap-2.5 pointer-events-none"
        style={{ bottom: 100, right: 20, maxWidth: 400 }}
      >
        <AnimatePresence mode="popLayout">
          {operations.map((op) => (
            <div key={op.id} className="pointer-events-auto">
              <CrudToast op={op} onDone={() => removeOperation(op.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </CrudProgressContext.Provider>
  );
}
