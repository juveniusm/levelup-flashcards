import EndScreenButtons from "./EndScreenButtons";
import { ReactNode, memo } from "react";

const SessionEndScreen = memo(function SessionEndScreen({
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
            <h2 className={`text-5xl md:text-6xl font-display font-bold ${titleColorClass} mb-4 tracking-tight`}>
                {title}
            </h2>
            {subtitle && (
                <p className="text-lg text-muted-foreground mb-12">
                    {subtitle}
                </p>
            )}
            {children}
            <EndScreenButtons primaryLabel={primaryButtonLabel} onPrimaryClick={onPrimaryClick} />
        </div>
    );
});

export default SessionEndScreen;
