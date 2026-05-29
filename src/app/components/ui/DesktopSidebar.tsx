"use client";

import { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface DesktopSidebarProps {
    isCollapsed: boolean;
    isGameSession: boolean;
    setIsHoverCollapsed: (collapsed: boolean) => void;
    showCollapseToggle: boolean;
    onToggleCollapse: () => void;
    navContent: ReactNode;
    footerContent: ReactNode;
}

export default function DesktopSidebar({
    isCollapsed,
    isGameSession,
    setIsHoverCollapsed,
    showCollapseToggle,
    onToggleCollapse,
    navContent,
    footerContent,
}: DesktopSidebarProps) {
    return (
        <aside
            onMouseEnter={() => isGameSession && setIsHoverCollapsed(false)}
            onMouseLeave={() => isGameSession && setIsHoverCollapsed(true)}
            className={`hidden lg:flex bg-background border-r border-border transition-all duration-300 ease-in-out flex-col sticky top-0 h-screen flex-shrink-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"
                }`}
        >
            <div className={`p-6 border-b border-border flex items-center shrink-0 h-[73px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
                {isCollapsed ? (
                    showCollapseToggle ? (
                        <button
                            onClick={onToggleCollapse}
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                        >
                            <PanelLeftOpen size={22} />
                        </button>
                    ) : (
                        <span className="text-2xl font-display font-bold text-foreground">L</span>
                    )
                ) : (
                    <>
                        <span className="text-2xl font-display font-bold text-foreground">LevelUp<span className="text-gold">.</span></span>
                        {showCollapseToggle && (
                            <button
                                onClick={onToggleCollapse}
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <PanelLeftClose size={20} />
                            </button>
                        )}
                    </>
                )}
            </div>
            {navContent}
            {footerContent}
        </aside>
    );
}
