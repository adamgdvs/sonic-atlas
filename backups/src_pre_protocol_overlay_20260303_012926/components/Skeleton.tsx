"use client";

import { motion } from "framer-motion";

export function Skeleton({
    className = "",
    style = {},
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.div
            className={`bg-[#F0F0F0] overflow-hidden ${className}`}
            style={style}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
    );
}
