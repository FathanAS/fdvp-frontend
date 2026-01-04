"use client";
import { useState, useMemo } from "react";
import { X, Search, Check, ChevronRight } from "lucide-react";
import { JOB_CATEGORIES } from "@/data/jobList";

interface RoleSelectorProps {
    selectedRoles: string[];
    onChange: (roles: string[]) => void;
    placeholder?: string;
    maxSelection?: number;
}

export default function RoleSelector({ selectedRoles = [], onChange, placeholder = "Select Role", maxSelection = 3 }: RoleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // FILTER JOBS (Flattening data first might be easier for search, but keeping structure for display)
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return JOB_CATEGORIES;

        return JOB_CATEGORIES.map(cat => ({
            ...cat,
            roles: cat.roles.filter(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
        })).filter(cat => cat.roles.length > 0);
    }, [searchTerm]);

    const toggleRole = (role: string) => {
        let newRoles = [...selectedRoles];
        if (newRoles.includes(role)) {
            newRoles = newRoles.filter(r => r !== role);
        } else {
            if (newRoles.length >= maxSelection) {
                // Should handle notification in parent or show styled alert content here
                // For now, prevent adding
                return;
            }
            newRoles.push(role);
        }
        onChange(newRoles);
    };

    return (
        <div className="relative w-full">
            {/* TRIGGER BUTTON (AREA TAGS) */}
            <div
                className={`w-full bg-fdvp-bg min-h-[50px] border transition-all rounded-xl p-2 cursor-pointer flex flex-wrap gap-2 items-center ${isOpen ? 'border-fdvp-accent ring-1 ring-fdvp-accent' : 'border-fdvp-text/20 hover:border-fdvp-text/50'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedRoles.length === 0 && (
                    <span className="text-fdvp-text/50 text-sm px-2 select-none">{placeholder} (Max {maxSelection})</span>
                )}

                {selectedRoles.map(role => (
                    <span key={role} className="bg-fdvp-accent/10 border border-fdvp-accent/30 text-fdvp-accent text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 animate-in zoom-in spin-in-3 duration-300">
                        {role}
                        <div
                            role="button"
                            onClick={(e) => { e.stopPropagation(); toggleRole(role); }}
                            className="bg-fdvp-accent/20 hover:bg-fdvp-accent hover:text-white rounded-full p-0.5 transition-colors"
                        >
                            <X size={10} />
                        </div>
                    </span>
                ))}

                <div className="ml-auto text-fdvp-text/50 pr-2">
                    <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-fdvp-accent' : ''}`} />
                </div>
            </div>

            {/* DROPDOWN MENU / POP OVER */}
            {isOpen && (
                <>
                    {/* BACKDROP UNTUK KLIK LUAR (TRANSPARAN) */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute top-full left-0 w-full mt-2 bg-fdvp-card border border-fdvp-text/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[400px]">

                        {/* SEARCH BAR (STICKY) */}
                        <div className="p-3 border-b border-fdvp-text/10 bg-fdvp-card sticky top-0 z-10">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fdvp-text/50" />
                                <input
                                    type="text"
                                    placeholder="Search specific role..."
                                    className="w-full bg-fdvp-bg border border-fdvp-text/10 rounded-lg py-2 pl-9 pr-3 text-sm text-fdvp-text-light focus:outline-none focus:border-fdvp-accent transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* LIST ROLES */}
                        <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-fdvp-text/20 scrollbar-track-transparent">
                            {filteredCategories.length === 0 ? (
                                <div className="p-4 text-center text-sm text-fdvp-text">No roles found matching "{searchTerm}"</div>
                            ) : (
                                filteredCategories.map(cat => (
                                    <div key={cat.category} className="mb-4 last:mb-0">
                                        <h4 className="text-[10px] font-bold text-fdvp-text/50 uppercase tracking-widest px-2 mb-2 sticky top-0 bg-fdvp-card/95 backdrop-blur-sm py-1 z-0">
                                            {cat.category}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {cat.roles.map(role => {
                                                const isSelected = selectedRoles.includes(role);
                                                return (
                                                    <button
                                                        key={role}
                                                        onClick={() => toggleRole(role)}
                                                        className={`text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all content-visibility-auto ${isSelected
                                                                ? 'bg-fdvp-primary/10 text-fdvp-primary font-bold shadow-sm'
                                                                : 'text-fdvp-text-light hover:bg-fdvp-bg hover:pl-4'
                                                            }`}
                                                    >
                                                        {role}
                                                        {isSelected && <Check size={14} className="text-fdvp-primary" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* FOOTER INFO */}
                        <div className="p-2 border-t border-fdvp-text/10 bg-fdvp-bg/50 text-center">
                            <span className="text-[10px] text-fdvp-text">
                                {selectedRoles.length}/{maxSelection} roles selected
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
