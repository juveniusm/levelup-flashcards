"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { Session } from "next-auth";

interface SidebarFooterProps {
    session: Session | null;
    isCollapsed: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export default function SidebarFooter({ session, isCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarFooterProps) {
    const pathname = usePathname();

    return (
        <div className={`p-4 border-t border-border flex flex-col gap-2 shrink-0 ${isCollapsed ? "lg:justify-center" : "justify-start"}`}>
            {session ? (
                <div className={`flex items-center gap-3 p-2 rounded-xl bg-card border border-border ${isCollapsed ? "lg:justify-center" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-gold text-foreground flex items-center justify-center font-bold font-mono text-sm shrink-0">
                        {(session.user?.name || session.user?.email || "?").charAt(0).toUpperCase()}
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-foreground truncate">{session.user?.name || "User"}</span>
                            <span className="text-xs text-muted-foreground truncate">{session.user?.role}</span>
                        </div>
                    )}
                </div>
            ) : null}

            <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${pathname === "/settings"
                    ? "bg-gold-soft text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${isCollapsed ? "lg:justify-center w-full" : "w-full"}`}
                title={isCollapsed ? "Settings" : undefined}
            >
                <Settings size={22} className="shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && <span>Settings</span>}
            </Link>

            <button
                onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (session) signOut({ callbackUrl: "/login" });
                }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all text-muted-foreground hover:bg-muted hover:text-foreground ${isCollapsed ? "lg:justify-center w-full" : "w-full"}`}
                title={isCollapsed ? "Sign Out" : undefined}
            >
                <LogOut size={22} className="shrink-0 text-destructive" />
                {(!isCollapsed || isMobileMenuOpen) && <span>Sign Out</span>}
            </button>
        </div>
    );
}
