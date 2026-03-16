"use client";

import { ReactNode } from "react";

interface DesktopSidebarProps {
    isCollapsed: boolean;
    isGameSession: boolean;
    setIsHoverCollapsed: (collapsed: boolean) => void;
    navContent: ReactNode;
    footerContent: ReactNode;
}

export default function DesktopSidebar({
    isCollapsed,
    isGameSession,
    setIsHoverCollapsed,
    navContent,
    footerContent,
}: DesktopSidebarProps) {
    return (
        <aside
            onMouseEnter={() => isGameSession && setIsHoverCollapsed(false)}
            onMouseLeave={() => isGameSession && setIsHoverCollapsed(true)}
            className={`hidden lg:flex bg-[#111111] border-r border-[#333] transition-all duration-300 ease-in-out flex-col sticky top-0 h-screen flex-shrink-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"
                }`}
        >
            <div className={`p-6 border-b border-[#333] flex items-center shrink-0 h-[73px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
                {isCollapsed ? (
                    <span className="text-xl font-black text-[#f9c111]">M</span>
                ) : (
                    <span className="text-xl font-black text-[#f9c111]">MENU</span>
                )}
            </div>
            {navContent}
            {footerContent}
        </aside>
    );
}
