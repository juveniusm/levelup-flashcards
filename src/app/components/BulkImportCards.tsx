"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Loader2 } from "lucide-react";

export default function BulkImportCards({ deckId }: { deckId: string }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/Flashcards_Template.xlsx');
            if (!response.ok) throw new Error("Failed to fetch template");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Flashcards_Template.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading template:", error);
            setError("Failed to download template. Please try again.");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            console.group(`Bulk Import: ${file.name}`);
            console.log(`File info: size=${file.size}, type=${file.type}`);
            
            const ExcelJS = await import("exceljs");
            const data = await file.arrayBuffer();
            
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            
            // Intentionally read ONLY the first sheet. The downloadable template
            // uses sheet 2 for instructions, so scanning all sheets would try to
            // import those as cards.
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error("No worksheets found in the file.");
            }

            const cardsToImport: { front: string; back: string; acceptedAnswers: string[] }[] = [];
            
            let headerRowIndex = 1;
            let frontColIndex = -1;
            let backColIndex = -1;
            let acceptedAnswersColIndex = -1;

            worksheet.eachRow((row: any, rowNumber: number) => {
                const values = row.values as any[];
                
                if (frontColIndex === -1 && backColIndex === -1) {
                    // Search for headers dynamically
                    for (let i = 1; i < values.length; i++) {
                        const cellValue = String(values[i] || "").trim();
                        if (cellValue === "Front (Prompt)") frontColIndex = i;
                        if (cellValue === "Back (Target Answer)") backColIndex = i;
                        if (cellValue === "Accepted Answers") acceptedAnswersColIndex = i;
                    }
                    if (frontColIndex !== -1 || backColIndex !== -1) {
                        headerRowIndex = rowNumber;
                    }
                } else if (rowNumber > headerRowIndex) {
                    const front = String(values[frontColIndex] || "").trim();
                    const back = String(values[backColIndex] || "").trim();
                    
                    let acceptedAnswers: string[] = [];
                    if (acceptedAnswersColIndex !== -1) {
                        const rawAcceptedAnswers = String(values[acceptedAnswersColIndex] || "").trim();
                        if (rawAcceptedAnswers) {
                            acceptedAnswers = rawAcceptedAnswers.split(";").map(a => a.trim()).filter(a => a !== "");
                        }
                    }

                    if (front !== "" && back !== "") {
                        cardsToImport.push({ front, back, acceptedAnswers });
                    }
                }
            });

            console.log(`Total valid cards parsed: ${cardsToImport.length}`);
            if (cardsToImport.length > 0) {
                console.log(`First card sample:`, cardsToImport[0]);
            }

            if (cardsToImport.length === 0) {
                throw new Error("No valid cards found. Ensure the template has 'Front (Prompt)' and 'Back (Target Answer)' columns.");
            }

            // Post to backend
            const response = await fetch(`/api/decks/${deckId}/cards/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cardsToImport),
            });

            if (!response.ok) {
                const resData = await response.json();
                throw new Error(resData.error || "Failed to import cards.");
            }

            const result = await response.json();
            const parts = [`Successfully imported ${result.count} card(s).`];
            if (result.skipped > 0) parts.push(`${result.skipped} duplicate(s) were skipped.`);
            setSuccessMessage(parts.join(" "));

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            try {
                const { db } = await import("@/lib/indexedDB");
                await db?.offlineDecks?.delete(deckId);
            } catch { /* ignore */ }

            router.refresh();
            console.groupEnd();
        } catch (err: unknown) {
            console.error(`Import failed:`, err);
            setError(err instanceof Error ? err.message : "An error occurred during import.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Bulk Import</h3>

            <div className="space-y-4">
                <p className="text-sm text-neutral-400">
                    Add multiple cards quickly using an Excel file.
                </p>

                <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isUploading}
                    className={`w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors border border-neutral-700 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <Download className="w-4 h-4" />
                    Download Template
                </button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        ref={fileInputRef}
                        className="hidden"
                        id="excel-upload"
                    />
                    <label
                        htmlFor="excel-upload"
                        className={`w-full flex items-center justify-center gap-2 bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? "Importing..." : "Upload Excel File"}
                    </label>
                </div>

                {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                {successMessage && <p className="text-green-500 text-sm mt-2 font-medium">{successMessage}</p>}
            </div>
        </div>
    );
}
