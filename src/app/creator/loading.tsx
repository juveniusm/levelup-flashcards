export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-6xl mx-auto space-y-12 animate-pulse">
                <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
                    <div className="space-y-4">
                        <div className="h-10 w-64 bg-neutral-900 rounded-lg"></div>
                        <div className="h-6 w-80 bg-neutral-900 rounded-lg"></div>
                    </div>
                </header>

                <section className="space-y-6">
                    <div className="h-12 w-48 bg-neutral-900 rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-neutral-900 rounded-2xl"></div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
