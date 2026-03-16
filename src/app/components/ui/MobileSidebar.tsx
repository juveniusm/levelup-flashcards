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
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#111] border border-[#333] rounded-lg text-white shadow-xl hover:bg-[#222] transition-colors"
                aria-label="Open Menu"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Drawer Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar (Drawer) */}
            <aside
                className={`lg:hidden fixed top-0 left-0 bottom-0 z-[70] bg-[#111] border-r border-[#333] transition-transform duration-300 ease-in-out w-64 flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 border-b border-[#333] flex justify-between items-center shrink-0">
                    <span className="text-xl font-black text-[#f9c111]">MENU</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-[#222] rounded-lg text-neutral-500 transition-colors"
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
