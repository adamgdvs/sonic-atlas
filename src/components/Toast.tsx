"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string | null;
  onDone: () => void;
  duration?: number;
}

export default function Toast({ message, onDone, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDone]);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-4 py-2.5 bg-[#1D1D1F] text-white text-xs font-medium shadow-lg"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? "0" : "8px"})`,
        transition: "opacity 0.2s ease, transform 0.2s ease",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
