import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Zap } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-gold selection:text-foreground font-sans">

            {/* Header / Navbar */}
            <header className="fixed top-0 w-full z-50">
                <div className="w-full px-6 h-20 flex items-center justify-end">
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login?signup=true"
                            className="text-sm font-bold bg-gold text-foreground px-5 py-2.5 rounded-full hover:bg-gold/90 transition-transform hover:scale-105 active:scale-95"
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight">
                            LevelUp<span className="text-gold">.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Advanced spaced repetition algorithm guarantees you never forget what you&apos;ve learnt. Start studying today!
                        </p>

                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?signup=true"
                                className="group flex items-center gap-2 bg-gold text-foreground font-bold text-lg px-8 py-4 rounded-full hover:bg-gold/90 transition-all hover:scale-105"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6 border-t border-border bg-card">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">

                            <div className="bg-background border border-border p-8 rounded-3xl hover:border-gold/40 transition-colors">
                                <div className="w-12 h-12 bg-gold/15 rounded-2xl flex items-center justify-center mb-6 text-gold">
                                    <Brain size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Spaced Repetition</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Our SM-2 algorithm calculates the precise moment you need to review a card before you forget it, guaranteeing maximum retention.
                                </p>
                            </div>

                            <div className="bg-background border border-border p-8 rounded-3xl hover:border-gold/40 transition-colors">
                                <div className="w-12 h-12 bg-gold/15 rounded-2xl flex items-center justify-center mb-6 text-gold">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    A distraction-free interface built for speed. Use keyboard shortcuts to flip cards and rate your memory instantly.
                                </p>
                            </div>

                            <div className="bg-background border border-border p-8 rounded-3xl hover:border-gold/40 transition-colors">
                                <div className="w-12 h-12 bg-gold/15 rounded-2xl flex items-center justify-center mb-6 text-gold">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Custom Decks</h3>
                                <p className="text-muted-foreground leading-relaxed">
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
