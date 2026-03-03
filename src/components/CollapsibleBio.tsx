"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { truncateBio, stripHtml } from "@/lib/utils";

interface CollapsibleBioProps {
    bio: string;
    maxLen?: number;
    className?: string;
    theme?: "dark" | "hero";
}

export default function CollapsibleBio({
    bio: rawBio,
    maxLen = 260,
    className = "",
    theme = "dark",
}: CollapsibleBioProps) {
    const bio = stripHtml(rawBio);
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = bio.length > maxLen;

    if (!isLong) {
        return (
            <p className={`text-[11px] sm:text-[12px] font-mono leading-relaxed uppercase tracking-tight font-medium ${className} ${theme === "hero" ? "text-shift5-dark/80" : "text-white/40"
                }`}>
                {bio}
            </p>
        );
    }

    return (
        <div
            className={`group/bio cursor-pointer transition-colors ${className}`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    <motion.p
                        key="truncated"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`text-[11px] sm:text-[12px] font-mono leading-relaxed uppercase tracking-tight font-medium ${theme === "hero" ? "text-shift5-dark/80 group-hover/bio:text-shift5-dark" : "text-white/40 group-hover/bio:text-white/60"
                            }`}
                    >
                        {truncateBio(bio, maxLen)}
                        <span className={`ml-2 text-[9px] font-bold tracking-widest ${theme === "hero" ? "text-shift5-dark/40" : "text-shift5-orange/60"
                            }`}>
                            [ CLICK_TO_EXPAND ]
                        </span>
                    </motion.p>
                ) : (
                    <motion.div
                        key="full"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <p className={`text-[11px] sm:text-[12px] font-mono leading-relaxed uppercase tracking-tight font-medium ${theme === "hero" ? "text-shift5-dark" : "text-white/80"
                            }`}>
                            {bio}
                        </p>
                        <div className={`mt-2 text-[9px] font-bold tracking-widest ${theme === "hero" ? "text-shift5-dark/40" : "text-shift5-orange/60"
                            }`}>
                            [ CLICK_TO_COLLAPSE ]
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
