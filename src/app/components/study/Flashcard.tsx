"use client";
import { useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import Image from "next/image";
import { Card, getDifficultyLabel } from "@/utils/study/studyUtils";
import { X, SearchCode } from "lucide-react";

interface FlashcardProps {
    card: Card;
    isFlipped: boolean;
    label: string; // e.g. "Card 1 of 10" or "Endless Mode"
    feedbackType: "correct" | "incorrect" | null;
    feedbackExtra?: string; // e.g. penalty text like "(-3)"
    userAnswer?: string;
    onEnlargeChange?: (isEnlarged: boolean) => void;
}

export default function Flashcard({
    card,
    isFlipped,
    label,
    feedbackType,
    feedbackExtra,
    userAnswer,
    onEnlargeChange,
}: FlashcardProps) {
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [magnifier, setMagnifier] = useState({ x: 0, y: 0, show: false });
    const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
    const imgContainerRef = useRef<HTMLDivElement>(null);

    const updateEnlargedImage = (url: string | null) => {
        setEnlargedImage(url);
        onEnlargeChange?.(!!url);
        if (!url) {
            setImgNaturalSize({ width: 0, height: 0 });
            setMagnifier(m => ({ ...m, show: false }));
        }
    };

    const handleMouseMove = (e: ReactMouseEvent) => {
        if (!imgContainerRef.current || !imgNaturalSize.width) return;

        const { left, top, width: containerWidth, height: containerHeight } = imgContainerRef.current.getBoundingClientRect();
        
        // Calculate the actual image dimensions within the object-contain container
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imgNaturalSize.width / imgNaturalSize.height;

        let actualWidth, actualHeight, offsetX = 0, offsetY = 0;

        if (imageRatio > containerRatio) {
            // Image is wider than container (relative to its height)
            actualWidth = containerWidth;
            actualHeight = containerWidth / imageRatio;
            offsetY = (containerHeight - actualHeight) / 2;
        } else {
            // Image is taller than container (relative to its width)
            actualHeight = containerHeight;
            actualWidth = containerHeight * imageRatio;
            offsetX = (containerWidth - actualWidth) / 2;
        }

        const relativeX = e.clientX - left;
        const relativeY = e.clientY - top;

        // Check if cursor is within the actual image bounds
        const isWithinBounds = 
            relativeX >= offsetX && 
            relativeX <= offsetX + actualWidth &&
            relativeY >= offsetY && 
            relativeY <= offsetY + actualHeight;

        if (isWithinBounds) {
            // Calculate percentage position relative to ONLY the actual image
            const x = ((relativeX - offsetX) / actualWidth) * 100;
            const y = ((relativeY - offsetY) / actualHeight) * 100;

            // Also need container-relative percentages for lens positioning
            const containerX = (relativeX / containerWidth) * 100;
            const containerY = (relativeY / containerHeight) * 100;

            setMagnifier({ x: containerX, y: containerY, show: true, imgX: x, imgY: y } as any);
        } else {
            setMagnifier(m => ({ ...m, show: false }));
        }
    };

    return (
        <div className="perspective-1000 mb-12">
            <div
                className={`relative w-full h-[28rem] transition-transform preserve-3d shadow-2xl ${!isFlipped ? "duration-0" : "duration-700 rotate-x-180"
                    }`}
            >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center z-10 overflow-y-auto">
                    <span className="absolute top-6 left-6 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                        {label}
                    </span>

                    {card.ease_factor !== undefined && (() => {
                        const { label: diffLabel, color } = getDifficultyLabel(card.ease_factor!, card.interval ?? 0);
                        return (
                            <span className={`absolute top-6 right-6 text-xs font-bold uppercase tracking-widest ${color}`}>
                                {diffLabel}
                            </span>
                        );
                    })()}

                    {card.front_image_url && (
                        <div 
                            onClick={() => updateEnlargedImage(card.front_image_url!)}
                            className="group relative min-w-[250px] min-h-[200px] w-full max-h-[336px] flex items-center justify-center mb-6 overflow-hidden rounded-lg cursor-zoom-in transition-all active:scale-95"
                        >
                            <Image
                                src={card.front_image_url}
                                alt="Front"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <SearchCode className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                        </div>
                    )}

                    <h2 className="text-3xl font-semibold text-white leading-tight">
                        {card.front}
                    </h2>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-x-180 bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center overflow-y-auto">
                    <span className="absolute top-6 left-6 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                        Target Answer
                    </span>

                    {card.back_image_url && (
                        <div 
                            onClick={() => updateEnlargedImage(card.back_image_url!)}
                            className="group relative min-w-[250px] min-h-[200px] w-full max-h-[336px] flex items-center justify-center mb-6 overflow-hidden rounded-lg cursor-zoom-in transition-all active:scale-95"
                        >
                            <Image
                                src={card.back_image_url}
                                alt="Back"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <SearchCode className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                        </div>
                    )}

                    <h2 className="text-3xl font-semibold text-[#f9c111] leading-tight mb-8">
                        {card.back}
                    </h2>

                    {feedbackType === "correct" && (
                        <div className="text-green-500 text-xl font-bold bg-green-500/10 px-8 py-3 rounded-full border border-green-500/20 animate-in slide-in-from-bottom-4 duration-300">
                            Correct!
                        </div>
                    )}
                    {feedbackType === "incorrect" && (
                        <div className="text-red-500 text-xl font-bold bg-red-500/10 px-8 py-3 rounded-full border border-red-500/20 animate-in slide-in-from-bottom-4 duration-300 flex flex-col items-center">
                            <span>Incorrect{feedbackExtra ? ` ${feedbackExtra}` : ""}</span>
                            {userAnswer && (
                                <span className="text-sm font-normal text-neutral-400 mt-1">
                                    You wrote: &quot;{userAnswer}&quot;
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => updateEnlargedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full z-[210] shadow-xl backdrop-blur-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateEnlargedImage(null);
                        }}
                    >
                        <X size={28} />
                    </button>
                    
                    <div 
                        ref={imgContainerRef}
                        className="relative w-full h-full max-w-5xl max-h-[90vh] animate-in zoom-in-95 duration-300 flex items-center justify-center overflow-hidden cursor-none"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setMagnifier(m => ({ ...m, show: true }))}
                        onMouseLeave={() => setMagnifier(m => ({ ...m, show: false }))}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={enlargedImage}
                            alt="Enlarged"
                            fill
                            className="object-contain select-none pointer-events-none"
                            priority
                            onLoadingComplete={(img) => {
                                setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                            }}
                        />

                        {/* Magnifier Lens */}
                        {magnifier.show && (
                            <div 
                                className="absolute pointer-events-none w-48 h-48 border-4 border-[#f9c111]/80 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[205] overflow-hidden"
                                style={{
                                    left: `${magnifier.x}%`,
                                    top: `${magnifier.y}%`,
                                    transform: "translate(-50%, -50%)",
                                    backgroundImage: `url(${enlargedImage})`,
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "400% 400%", // 4x Zoom
                                    backgroundPosition: `${(magnifier as any).imgX}% ${(magnifier as any).imgY}%`,
                                    backgroundColor: "black"
                                }}
                            >
                                {/* Inner lens glow/reflection */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
