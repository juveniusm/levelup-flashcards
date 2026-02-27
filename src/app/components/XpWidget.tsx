"use client";

import { useEffect, useState } from "react";

interface XpData {
    totalXp: number;
    level: number;
    currentXp: number;
    xpForNextLevel: number;
    title: string;
}

export default function XpWidget() {
    const [xpData, setXpData] = useState<XpData | null>(null);

    useEffect(() => {
        fetch("/api/xp")
            .then((res) => res.json())
            .then((data) => setXpData(data))
            .catch(() => { });
    }, []);

    if (!xpData) return (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-12 bg-neutral-800 rounded"></div>
                    <div className="h-3 w-16 bg-neutral-800 rounded"></div>
                </div>
                <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 bg-neutral-800 rounded-full h-2"></div>
                    <div className="h-3 w-8 bg-neutral-800 rounded"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-[#f9c111]">LV {xpData.level}</span>
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{xpData.title}</span>
                </div>
                <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-[#f9c111] h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(249,193,17,0.4)]"
                            style={{ width: `${(xpData.currentXp / xpData.xpForNextLevel) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 whitespace-nowrap">{xpData.currentXp}/{xpData.xpForNextLevel}</span>
                </div>
            </div>
        </div>
    );
}
