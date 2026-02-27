export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#f9c111]/20 border-t-[#f9c111] rounded-full animate-spin"></div>
                <p className="text-neutral-500 font-medium animate-pulse">Loading experience...</p>
            </div>
        </div>
    );
}
