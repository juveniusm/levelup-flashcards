import SessionEndScreen from "./SessionEndScreen";
import SessionMetrics from "./SessionMetrics";

interface ClassicModeEndScreenProps {
    gameStatus: "game_over" | "session_over" | "completed";
    score: number;
    correctAnswers: number;
    incorrectAnswers: number;
    xpEarned: number;
    onPrimaryClick: () => void;
}

export default function ClassicModeEndScreen({
    gameStatus,
    score,
    correctAnswers,
    incorrectAnswers,
    xpEarned,
    onPrimaryClick
}: ClassicModeEndScreenProps) {
    
    let title = "";
    let titleColorClass = "";
    let subtitle = "";
    let primaryButtonLabel = "";

    switch (gameStatus) {
        case "game_over":
            title = "Game Over";
            titleColorClass = "text-destructive";
            subtitle = "You ran out of lives!";
            primaryButtonLabel = "Try Again";
            break;
        case "session_over":
            title = "Session Over";
            titleColorClass = "text-foreground";
            subtitle = "You ended the session early.";
            primaryButtonLabel = "Try Again";
            break;
        case "completed":
            title = "Deck Complete!";
            titleColorClass = "text-foreground";
            primaryButtonLabel = "Study Again";
            break;
    }

    return (
        <SessionEndScreen
            title={title}
            titleColorClass={titleColorClass}
            subtitle={subtitle}
            primaryButtonLabel={primaryButtonLabel}
            onPrimaryClick={onPrimaryClick}
        >
            <SessionMetrics
                score={score}
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                xpEarned={xpEarned}
            />
        </SessionEndScreen>
    );
}
