"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { UNIVERSITIES } from "@/constants/universities";

interface UniversitySearchableDropdownProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function UniversitySearchableDropdown({
    value,
    onChange,
    disabled = false
}: UniversitySearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter universities based on search term (fuzzy matching)
    const filteredUniversities = useMemo(() => {
        if (!searchTerm.trim()) return UNIVERSITIES;
        const term = searchTerm.toLowerCase();
        return UNIVERSITIES.filter(uni =>
            uni.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (uni: string) => {
        onChange(uni);
        setIsOpen(false);
        setSearchTerm("");
    };

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Focus search input when opening
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-400">University</label>
                <div
                    onClick={toggleDropdown}
                    className={`w-full bg-black border ${isOpen ? 'border-[#f9c111]' : 'border-neutral-800'} text-white rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-700'}`}
                >
                    <span className={`block truncate ${!value ? 'text-neutral-500' : 'text-white'}`}>
                        {value || "Select University"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search Area */}
                    <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 sticky top-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search university..."
                                className="w-full bg-black border border-neutral-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#f9c111] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-neutral-800">
                        {filteredUniversities.length > 0 ? (
                            filteredUniversities.map((uni) => (
                                <button
                                    key={uni}
                                    type="button"
                                    onClick={() => handleSelect(uni)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-neutral-800 transition-colors ${value === uni ? 'text-[#f9c111] bg-neutral-800/40' : 'text-neutral-300'}`}
                                >
                                    <span className="truncate pr-4">{uni}</span>
                                    {value === uni && <Check className="w-4 h-4 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-neutral-500 text-sm">
                                No universities found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
