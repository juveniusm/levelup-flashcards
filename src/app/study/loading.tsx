export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <main className="max-w-6xl mx-auto space-y-12 animate-pulse">
                <header className="flex justify-between items-center border-b border-border pb-6">
                    <div className="h-12 w-48 bg-muted rounded-lg"></div>
                    <div className="h-10 w-32 bg-muted rounded-lg"></div>
                </header>

                <section className="max-w-4xl mx-auto flex flex-col items-center space-y-4 py-6">
                    <div className="h-12 w-3/4 bg-muted rounded-lg"></div>
                    <div className="h-6 w-1/2 bg-muted rounded-lg"></div>
                </section>

                <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 bg-muted rounded-2xl"></div>
                    ))}
                </section>
            </main>
        </div>
    );
}
