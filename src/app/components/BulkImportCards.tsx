"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
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
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // Raw JSON data from sheet
            const rawJson = XLSX.utils.sheet_to_json(worksheet);

            // Map rows back to expectations ({ front, back })
            const rawRows = rawJson as Array<Record<string, unknown>>;
            const cardsToImport = rawRows.map((row) => ({
                front: String(row["Front (Prompt)"] || ""),
                back: String(row["Back (Target Answer)"] || "")
            })).filter((card) => card.front.trim() !== "" && card.back.trim() !== "");

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
            setSuccessMessage(`Successfully imported ${result.count} cards!`);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            router.refresh();
        } catch (err: unknown) {
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
