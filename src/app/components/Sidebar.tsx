"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import SidebarNav from "./ui/SidebarNav";
import SidebarFooter from "./ui/SidebarFooter";
import MobileSidebar from "./ui/MobileSidebar";
import DesktopSidebar from "./ui/DesktopSidebar";

const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar() {
    const [isHoverCollapsed, setIsHoverCollapsed] = useState(true);
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    // Restore the user's saved collapse preference (desktop only).
    useEffect(() => {
        if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") {
            setIsManuallyCollapsed(true);
        }
    }, []);

    const toggleManualCollapse = () => {
        setIsManuallyCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
            return next;
        });
    };

    if (pathname === "/login" || pathname === "/admin/login" || pathname === "/") return null;

    // Game sessions are /:deckId/study — collapse sidebar there
    const isGameSession = /^\/[^/]+\/study/.test(pathname);
    const isAdmin = session?.user && (session.user as any).role === "ADMIN";

    // During game sessions the sidebar auto-collapses and expands on hover;
    // everywhere else the user controls it via the header toggle (persisted).
    const isCollapsed = isGameSession ? isHoverCollapsed : isManuallyCollapsed;

    const navContent = (
        <SidebarNav
            isCollapsed={isCollapsed}
            isMobileMenuOpen={isMobileMenuOpen}
            isAdmin={!!isAdmin}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
    );

    const footerContent = (
        <SidebarFooter
            session={session}
            isCollapsed={isCollapsed}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
    );

    return (
        <>
            <MobileSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                navContent={navContent}
                footerContent={footerContent}
            />
            <DesktopSidebar
                isCollapsed={isCollapsed}
                isGameSession={isGameSession}
                setIsHoverCollapsed={setIsHoverCollapsed}
                showCollapseToggle={!isGameSession}
                onToggleCollapse={toggleManualCollapse}
                navContent={navContent}
                footerContent={footerContent}
            />
        </>
    );
}
