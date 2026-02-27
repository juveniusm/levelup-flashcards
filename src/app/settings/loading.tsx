export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-2xl mx-auto space-y-10 animate-pulse">
                <header className="border-b border-neutral-800 pb-6">
                    <div className="h-10 w-48 bg-neutral-900 rounded-lg"></div>
                    <div className="h-4 w-64 bg-neutral-900 rounded-lg mt-2"></div>
                </header>

                <div className="space-y-10">
                    <section className="space-y-6">
                        <div className="h-6 w-24 bg-neutral-900 rounded-lg"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-12 bg-neutral-900 rounded-xl"></div>
                            <div className="h-12 bg-neutral-900 rounded-xl"></div>
                        </div>
                        <div className="h-12 bg-neutral-900 rounded-xl"></div>
                        <div className="h-12 bg-neutral-900 rounded-xl"></div>
                    </section>

                    <section className="space-y-6">
                        <div className="h-6 w-32 bg-neutral-900 rounded-lg"></div>
                        <div className="h-12 bg-neutral-900 rounded-xl"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-12 bg-neutral-900 rounded-xl"></div>
                            <div className="h-12 bg-neutral-900 rounded-xl"></div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
