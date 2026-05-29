export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Loading experience...</p>
            </div>
        </div>
    );
}
