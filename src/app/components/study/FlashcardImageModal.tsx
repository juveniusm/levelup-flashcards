import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface FlashcardImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

export default function FlashcardImageModal({ imageUrl, onClose }: FlashcardImageModalProps) {
    const [magnifier, setMagnifier] = useState({ x: 0, y: 0, show: false, imgX: 0, imgY: 0 });
    const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
    const imgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const requestRef = useRef<number>(0);

    const handleMouseMove = (e: ReactMouseEvent) => {
        if (!imgContainerRef.current || !imgNaturalSize.width) return;

        const { clientX, clientY } = e;

        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        requestRef.current = requestAnimationFrame(() => {
            if (!imgContainerRef.current) return;
            const { left, top, width: containerWidth, height: containerHeight } = imgContainerRef.current.getBoundingClientRect();
            
            const containerRatio = containerWidth / containerHeight;
            const imageRatio = imgNaturalSize.width / imgNaturalSize.height;

            let actualWidth, actualHeight, offsetX = 0, offsetY = 0;

            if (imageRatio > containerRatio) {
                actualWidth = containerWidth;
                actualHeight = containerWidth / imageRatio;
                offsetY = (containerHeight - actualHeight) / 2;
            } else {
                actualHeight = containerHeight;
                actualWidth = containerHeight * imageRatio;
                offsetX = (containerWidth - actualWidth) / 2;
            }

            const relativeX = clientX - left;
            const relativeY = clientY - top;

            const isWithinBounds = 
                relativeX >= offsetX && 
                relativeX <= offsetX + actualWidth &&
                relativeY >= offsetY && 
                relativeY <= offsetY + actualHeight;

            if (isWithinBounds) {
                const x = ((relativeX - offsetX) / actualWidth) * 100;
                const y = ((relativeY - offsetY) / actualHeight) * 100;

                const containerX = (relativeX / containerWidth) * 100;
                const containerY = (relativeY / containerHeight) * 100;

                setMagnifier(m => {
                    if (m.x === containerX && m.y === containerY && m.imgX === x && m.imgY === y) return m;
                    return { x: containerX, y: containerY, show: true, imgX: x, imgY: y };
                });
            } else {
                setMagnifier(m => m.show ? { ...m, show: false } : m);
            }
        });
    };

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <button 
                className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full z-[210] shadow-xl backdrop-blur-md"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
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
            >
                <Image
                    src={imageUrl}
                    alt="Enlarged"
                    fill
                    className="object-contain select-none pointer-events-none"
                    priority
                    onLoadingComplete={(img) => {
                        setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                    }}
                />

                {magnifier.show && (
                    <div 
                        className="absolute pointer-events-none w-48 h-48 border-4 border-gold/80 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[205] overflow-hidden"
                        style={{
                            left: `${magnifier.x}%`,
                            top: `${magnifier.y}%`,
                            transform: "translate(-50%, -50%)",
                            backgroundImage: `url(${imageUrl})`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "400% 400%",
                            backgroundPosition: `${magnifier.imgX}% ${magnifier.imgY}%`,
                            backgroundColor: "black"
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                    </div>
                )}
            </div>
        </div>
    );
}
