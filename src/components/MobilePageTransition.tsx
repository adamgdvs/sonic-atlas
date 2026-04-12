"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const mobileVariants = {
    initial: { opacity: 0, x: 30, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 0.98 },
};

const mobileTransition = {
    type: "spring" as const,
    damping: 28,
    stiffness: 280,
    mass: 0.8,
};

export default function MobilePageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // On desktop, render children directly — no animation wrapper
    if (!isMobile) return <>{children}</>;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                variants={mobileVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={mobileTransition}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
