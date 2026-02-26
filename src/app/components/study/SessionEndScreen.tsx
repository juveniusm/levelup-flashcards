import EndScreenButtons from "./EndScreenButtons";
import { ReactNode } from "react";

export default function SessionEndScreen({
    title,
    titleColorClass,
    subtitle,
    children,
    primaryButtonLabel,
    onPrimaryClick,
}: {
    title: string;
    titleColorClass: string;
    subtitle?: ReactNode;
    children?: ReactNode; // Typically the SessionMetrics component
    primaryButtonLabel: string;
    onPrimaryClick: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto w-full text-center py-24 animate-in zoom-in duration-500">
            <h2 className={`text-5xl md:text-6xl font-black ${titleColorClass} mb-4 tracking-tight drop-shadow-lg`}>
                {title}
            </h2>
            {subtitle && (
                <p className="text-lg text-neutral-400 mb-12">
                    {subtitle}
                </p>
            )}
            {children}
            <EndScreenButtons primaryLabel={primaryButtonLabel} onPrimaryClick={onPrimaryClick} />
        </div>
    );
}
