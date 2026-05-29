"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import SidebarNav from "./ui/SidebarNav";
import SidebarFooter from "./ui/SidebarFooter";
import MobileSidebar from "./ui/MobileSidebar";
import DesktopSidebar from "./ui/DesktopSidebar";

export default function Sidebar() {
    const [isHoverCollapsed, setIsHoverCollapsed] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    if (pathname === "/login" || pathname === "/admin/login" || pathname === "/") return null;

    const isAdmin = session?.user && (session.user as any).role === "ADMIN";

    // The desktop sidebar rests as a collapsed icon rail and expands on hover.
    const isCollapsed = isHoverCollapsed;

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
                setIsHoverCollapsed={setIsHoverCollapsed}
                navContent={navContent}
                footerContent={footerContent}
            />
        </>
    );
}
