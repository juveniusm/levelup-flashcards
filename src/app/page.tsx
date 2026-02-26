import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Zap } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#f9c111] selection:text-black font-sans">

            {/* Header / Navbar */}
            <header className="fixed top-0 w-full z-50">
                <div className="w-full px-6 h-20 flex items-center justify-end">
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-transform hover:scale-105 active:scale-95"
                        >
                            Sign Up Free
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="relative pt-40 pb-32 px-6 overflow-hidden">

                    {/* Decorative glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f9c111]/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="flex justify-center w-full mb-8">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo4.png"
                                alt="Master any subject, faster than ever."
                                className="h-56 w-auto object-contain drop-shadow-2xl"
                            />
                        </div>

                        <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                            Advanced spaced repetition algorithm guarantees you never forget what you&apos;ve learnt. Start studying today!
                        </p>

                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login"
                                className="group flex items-center gap-2 bg-[#f9c111] text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-[#e0ad0e] transition-all hover:scale-105"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6 border-t border-white/5 bg-neutral-950">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">

                            <div className="bg-black border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors">
                                <div className="w-12 h-12 bg-[#f9c111]/10 rounded-2xl flex items-center justify-center mb-6 text-[#f9c111]">
                                    <Brain size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Spaced Repetition</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    Our SM-2 algorithm calculates the precise moment you need to review a card before you forget it, guaranteeing maximum retention.
                                </p>
                            </div>

                            <div className="bg-black border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors">
                                <div className="w-12 h-12 bg-[#f9c111]/10 rounded-2xl flex items-center justify-center mb-6 text-[#f9c111]">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    A distraction-free interface built for speed. Use keyboard shortcuts to flip cards and rate your memory instantly.
                                </p>
                            </div>

                            <div className="bg-black border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors">
                                <div className="w-12 h-12 bg-[#f9c111]/10 rounded-2xl flex items-center justify-center mb-6 text-[#f9c111]">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Custom Decks</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    Create rich flashcards with full formatting. Organize your knowledge into decks and study precisely what you want.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

        </div>
    );
}
