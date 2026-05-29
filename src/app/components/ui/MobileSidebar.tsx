"use client";

import { Menu, X } from "lucide-react";
import { ReactNode } from "react";

interface MobileSidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    navContent: ReactNode;
    footerContent: ReactNode;
}

export default function MobileSidebar({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    navContent,
    footerContent,
}: MobileSidebarProps) {
    return (
        <>
            {/* Floating Hamburger (Mobile/Tablet Only) */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg text-foreground shadow-lg hover:bg-muted transition-colors"
                aria-label="Open Menu"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Drawer Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar (Drawer) */}
            <aside
                className={`lg:hidden fixed top-0 left-0 bottom-0 z-[70] bg-background border-r border-border transition-transform duration-300 ease-in-out w-64 flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
                    <span className="text-2xl font-display font-bold text-foreground">LevelUp<span className="text-gold">.</span></span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                {navContent}
                {footerContent}
            </aside>
        </>
    );
}
