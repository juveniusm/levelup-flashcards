"use client";

import { ReactNode } from "react";

interface DesktopSidebarProps {
    isCollapsed: boolean;
    setIsHoverCollapsed: (collapsed: boolean) => void;
    navContent: ReactNode;
    footerContent: ReactNode;
}

export default function DesktopSidebar({
    isCollapsed,
    setIsHoverCollapsed,
    navContent,
    footerContent,
}: DesktopSidebarProps) {
    return (
        <aside
            onMouseEnter={() => setIsHoverCollapsed(false)}
            onMouseLeave={() => setIsHoverCollapsed(true)}
            className={`hidden lg:flex bg-background border-r border-border transition-all duration-300 ease-in-out flex-col sticky top-0 h-screen flex-shrink-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"
                }`}
        >
            <div className={`p-6 border-b border-border flex items-center shrink-0 h-[73px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
                {isCollapsed ? (
                    <span className="text-2xl font-display font-bold text-foreground">L</span>
                ) : (
                    <span className="text-2xl font-display font-bold text-foreground">LevelUp<span className="text-gold">.</span></span>
                )}
            </div>
            {navContent}
            {footerContent}
        </aside>
    );
}
