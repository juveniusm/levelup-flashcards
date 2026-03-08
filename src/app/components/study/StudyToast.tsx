"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function StudyToast() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (searchParams?.get("toast") === "verified") {
            setShowToast(true);
            // Scrub the query parameters to prevent the toast from showing again on refresh
            router.replace("/study");
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    if (!showToast) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-[#0f291e] border border-green-500/50 text-[#86efac] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-semibold text-base tracking-wide">Email successfully verified!</span>
            </div>
        </div>
    );
}
