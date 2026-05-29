export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <main className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <header className="border-b border-border pb-6">
                    <div className="h-10 w-64 bg-muted rounded-lg"></div>
                    <div className="h-4 w-32 bg-muted rounded-lg mt-2"></div>
                </header>

                <div className="flex gap-4">
                    <div className="h-12 w-48 bg-muted rounded-lg"></div>
                    <div className="h-12 flex-1 bg-muted rounded-lg"></div>
                </div>

                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted rounded-xl w-full"></div>
                    ))}
                </div>
            </main>
        </div>
    );
}
