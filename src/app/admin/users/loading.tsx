export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <header className="border-b border-neutral-800 pb-6">
                    <div className="h-10 w-64 bg-neutral-900 rounded-lg"></div>
                    <div className="h-4 w-32 bg-neutral-900 rounded-lg mt-2"></div>
                </header>

                <div className="flex gap-4">
                    <div className="h-12 w-48 bg-neutral-900 rounded-lg"></div>
                    <div className="h-12 flex-1 bg-neutral-900 rounded-lg"></div>
                </div>

                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-neutral-900 rounded-xl w-full"></div>
                    ))}
                </div>
            </main>
        </div>
    );
}
