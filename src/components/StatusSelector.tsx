"use client";
import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";

interface StatusSelectorProps {
    status: string;
    onChange: (status: string) => void;
}

const EVENT_STATUSES = [
    { value: "upcoming", label: "Upcoming", color: "bg-green-500", text: "text-green-400", border: "border-green-500/30", bgSoft: "bg-green-500/10" },
    { value: "ongoing", label: "Ongoing (Now)", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bgSoft: "bg-blue-500/10" },
    { value: "on_hold", label: "On Hold", color: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", bgSoft: "bg-yellow-500/10" },
    { value: "completed", label: "Completed", color: "bg-gray-500", text: "text-gray-400", border: "border-gray-500/30", bgSoft: "bg-gray-500/10" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bgSoft: "bg-red-500/10" },
];

export default function StatusSelector({ status, onChange }: StatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Find current status object
    const currentStatus = EVENT_STATUSES.find(s => s.value === status) || EVENT_STATUSES[0];

    return (
        <div className="relative w-full">
            {/* TRIGGER BUTTON */}
            <div
                className={`w-full bg-fdvp-text/5 border transition-all rounded-xl p-4 cursor-pointer flex items-center justify-between ${isOpen ? 'border-fdvp-accent ring-1 ring-fdvp-accent' : 'border-fdvp-text/10 hover:border-fdvp-text/30 hover:bg-fdvp-text/10'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${currentStatus.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                    <span className={`font-bold ${currentStatus.text}`}>{currentStatus.label}</span>
                </div>

                <ChevronRight size={18} className={`transition-transform duration-300 text-fdvp-text/50 ${isOpen ? 'rotate-90 text-fdvp-accent' : ''}`} />
            </div>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <>
                    {/* BACKDROP */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute top-full left-0 w-full mt-2 bg-fdvp-card border border-fdvp-text/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 space-y-1">
                            {EVENT_STATUSES.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all group ${status === item.value
                                        ? `${item.bgSoft} ${item.border} border`
                                        : 'hover:bg-fdvp-text/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} ${status === item.value ? 'ring-2 ring-white/20' : 'opacity-50 group-hover:opacity-100'}`} />
                                        <span className={`font-medium ${status === item.value ? item.text : 'text-fdvp-text-light group-hover:text-white'}`}>
                                            {item.label}
                                        </span>
                                    </div>

                                    {status === item.value && (
                                        <Check size={16} className={item.text} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
