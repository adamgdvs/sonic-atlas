"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";

interface Toast {
    id: string;
    message: string;
    type?: "info" | "warning" | "error" | "auth";
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    duration?: number;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    const borderColor = toast.type === "error" ? "border-red-500/30" :
        toast.type === "warning" ? "border-yellow-500/30" :
            toast.type === "auth" ? "border-shift5-orange/30" :
                "border-white/10";

    const accentColor = toast.type === "error" ? "bg-red-500" :
        toast.type === "warning" ? "bg-yellow-500" :
            toast.type === "auth" ? "bg-shift5-orange" :
                "bg-white/20";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto max-w-sm bg-shift5-dark/95 backdrop-blur-xl border ${borderColor} shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden`}
        >
            {/* Top accent bar */}
            <div className={`h-[2px] w-full ${accentColor}`} />

            <div className="px-4 py-3 flex items-start gap-3">
                {/* Icon area */}
                {toast.type === "auth" && (
                    <div className="mt-0.5 shrink-0">
                        <div className="w-6 h-6 border border-shift5-orange/40 flex items-center justify-center">
                            <span className="text-shift5-orange text-[10px] font-mono font-bold">!</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-white/80 uppercase tracking-wide leading-relaxed">
                        {toast.message}
                    </p>

                    {toast.action && (
                        <div className="mt-2">
                            {toast.action.href ? (
                                <Link
                                    href={toast.action.href}
                                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-shift5-orange hover:text-white border border-shift5-orange/30 hover:border-shift5-orange bg-shift5-orange/10 hover:bg-shift5-orange px-3 py-1.5 transition-all"
                                >
                                    {toast.action.label}
                                    <span className="text-[9px]">→</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={toast.action.onClick}
                                    className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-shift5-orange hover:text-white border border-shift5-orange/30 hover:border-shift5-orange bg-shift5-orange/10 hover:bg-shift5-orange px-3 py-1.5 transition-all"
                                >
                                    {toast.action.label}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onDismiss(toast.id)}
                    className="shrink-0 mt-0.5 text-white/20 hover:text-white/60 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </motion.div>
    );
}
