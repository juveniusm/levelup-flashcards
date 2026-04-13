import { useState, useRef } from "react";

interface CardImageDropState {
    frontImageFile: File | null;
    backImageFile: File | null;
    isFrontDragging: boolean;
    isBackDragging: boolean;
    clearFrontImage: boolean;
    clearBackImage: boolean;
    frontInputRef: React.RefObject<HTMLInputElement | null>;
    backInputRef: React.RefObject<HTMLInputElement | null>;
    setImageFile: (side: "front" | "back", file: File | null) => void;
    setClearFrontImage: (v: boolean) => void;
    setClearBackImage: (v: boolean) => void;
    handlePaste: (e: React.ClipboardEvent, side: "front" | "back") => void;
    handleDragOver: (e: React.DragEvent, side: "front" | "back") => void;
    handleDragLeave: (e: React.DragEvent, side: "front" | "back") => void;
    handleDrop: (e: React.DragEvent, side: "front" | "back") => void;
    resetImages: () => void;
}

export function useCardImageDrop(): CardImageDropState {
    const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
    const [backImageFile, setBackImageFile] = useState<File | null>(null);
    const [isFrontDragging, setIsFrontDragging] = useState(false);
    const [isBackDragging, setIsBackDragging] = useState(false);
    const [clearFrontImage, setClearFrontImage] = useState(false);
    const [clearBackImage, setClearBackImage] = useState(false);
    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);

    const setImageFile = (side: "front" | "back", file: File | null) => {
        if (side === "front") { setFrontImageFile(file); if (file) setClearFrontImage(false); }
        else { setBackImageFile(file); if (file) setClearBackImage(false); }
    };

    const handlePaste = (e: React.ClipboardEvent, side: "front" | "back") => {
        for (const item of e.clipboardData?.items ?? []) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) setImageFile(side, file);
                break;
            }
        }
    };

    const handleDragOver = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(true); else setIsBackDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(false); else setIsBackDragging(false);
    };

    const handleDrop = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault(); e.stopPropagation();
        if (side === "front") setIsFrontDragging(false); else setIsBackDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith("image/")) setImageFile(side, file);
    };

    const resetImages = () => {
        setFrontImageFile(null);
        setBackImageFile(null);
        if (frontInputRef.current) frontInputRef.current.value = "";
        if (backInputRef.current) backInputRef.current.value = "";
    };

    return {
        frontImageFile, backImageFile,
        isFrontDragging, isBackDragging,
        clearFrontImage, clearBackImage,
        frontInputRef, backInputRef,
        setImageFile, setClearFrontImage, setClearBackImage,
        handlePaste, handleDragOver, handleDragLeave, handleDrop,
        resetImages,
    };
}
