export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
            <div className="w-full max-w-6xl mx-auto space-y-8 animate-pulse">
                <header className="border-b border-neutral-800 pb-6">
                    <div className="h-10 w-48 bg-neutral-900 rounded-lg"></div>
                    <div className="h-6 w-64 bg-neutral-900 rounded-lg mt-4"></div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-neutral-900 rounded-xl"></div>
                    ))}
                </div>

                <div className="h-64 bg-neutral-900 rounded-xl w-full"></div>
            </div>
        </div>
    );
}
