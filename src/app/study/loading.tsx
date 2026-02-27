export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-6xl mx-auto space-y-12 animate-pulse">
                <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <div className="h-12 w-48 bg-neutral-900 rounded-lg"></div>
                    <div className="h-10 w-32 bg-neutral-900 rounded-lg"></div>
                </header>

                <section className="max-w-4xl mx-auto flex flex-col items-center space-y-4 py-6">
                    <div className="h-12 w-3/4 bg-neutral-900 rounded-lg"></div>
                    <div className="h-6 w-1/2 bg-neutral-900 rounded-lg"></div>
                </section>

                <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 bg-neutral-900 rounded-2xl"></div>
                    ))}
                </section>
            </main>
        </div>
    );
}
