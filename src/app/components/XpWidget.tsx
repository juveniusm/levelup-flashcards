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
                    <div className="h-6 w-12 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 bg-muted rounded-full h-2"></div>
                    <div className="h-3 w-8 bg-muted rounded"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-foreground">LV {xpData.level}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{xpData.title}</span>
                </div>
                <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gold h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(xpData.currentXp / xpData.xpForNextLevel) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{xpData.currentXp}/{xpData.xpForNextLevel}</span>
                </div>
            </div>
        </div>
    );
}
