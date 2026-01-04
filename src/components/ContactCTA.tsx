"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, ArrowRight, ShieldCheck, Crown, Lock, Send, X, AlertCircle, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ContactCTA() {
    const { user, role } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Form State
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // Custom Dropdown State
    const [targetDepartment, setTargetDepartment] = useState("General Administration");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isStaffMethod = ['admin', 'staff', 'superadmin', 'owner'].includes(role || '');

    const departments = [
        { id: "General Administration", label: "General Administration", desc: "For general inquiries and staff support", icon: <ShieldCheck size={14} /> },
        { id: "Superadmin (System Ops)", label: "Superadmin (System Ops)", desc: "Technical system issues and escalations", icon: <Activity className="text-blue-400" size={14} /> },
        { id: "Executive Office (Owner)", label: "Executive Office (Owner)", desc: "Confidential matters for the Owner", icon: <Crown className="text-yellow-400" size={14} /> }
    ];

    // Helper to get current selected department object
    const selectedDept = departments.find(d => d.id === targetDepartment) || departments[0];

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    message,
                    targetDepartment,
                    userId: user?.uid,
                    email: user?.email,
                    displayName: user?.displayName
                })
            });

            if (res.ok) {
                setSent(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSent(false);
                    setSubject("");
                    setMessage("");
                    setTargetDepartment("General Administration");
                }, 2000);
            } else {
                alert("Failed to send ticket. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending ticket.");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <section className="py-24 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-gradient-to-r from-fdvp-primary/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 max-w-5xl mx-auto px-6">
                    <div className="bg-[#0b0c10]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 md:p-16 text-center transform hover:scale-[1.005] transition-transform duration-500 shadow-2xl relative overflow-hidden group">

                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:left-[100%] transition-all duration-1000 ease-in-out"></div>

                        {/* Icon Header */}
                        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-fdvp-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-fdvp-primary border border-fdvp-primary/20 shadow-glow">
                            {isStaffMethod ? <Crown size={40} className="text-yellow-500" /> : <ShieldCheck size={40} />}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            {isStaffMethod ? "Executive Command" : "Connect with Leadership"}
                        </h2>

                        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            {isStaffMethod
                                ? "Access comprehensive controls to oversee community operations, manage secure channels, and review escalated tickets."
                                : "An exclusive channel for sensitive inquiries, strategic proposals, and high-priority feedback. Directly reach our Administrators and Executives."}
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-20">
                            {isStaffMethod ? (
                                <Link href="/dashboard">
                                    <button className="group px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all shadow-xl flex items-center gap-2 justify-center w-full sm:w-auto">
                                        <MessageSquare size={20} />
                                        <span>Open Dashboard</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="group px-8 py-4 bg-gradient-to-r from-fdvp-primary to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 flex items-center gap-2 justify-center w-full sm:w-auto"
                                >
                                    <Lock size={18} />
                                    <span>Open Secure Channel</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}

                            {!isStaffMethod && (
                                <Link href="/about">
                                    <button className="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all w-full sm:w-auto backdrop-blur-sm">
                                        Community FAQ
                                    </button>
                                </Link>
                            )}
                        </div>

                        {/* Privacy Note */}
                        {!isStaffMethod && (
                            <p className="mt-8 text-xs text-gray-500 flex items-center justify-center gap-1.5 opacity-60">
                                <Lock size={10} />
                                Your identity and message are encrypted end-to-end.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* SECURE CHANNEL MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-[#14141e] border border-white/10 rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6 pt-2">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-3 border border-purple-500/20">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Secure Executive Channel</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-xs">
                                Route your message directly to the appropriate leadership division.
                            </p>
                        </div>

                        {!sent ? (
                            <form onSubmit={handleSend} className="space-y-4 overflow-y-auto px-1 scrollbar-hide">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Target Department</label>

                                    {/* CUSTOM DROPDOWN */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-white/20 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-fdvp-primary bg-fdvp-primary/10 p-1.5 rounded-lg border border-fdvp-primary/20">
                                                    {selectedDept.icon}
                                                </div>
                                                <span className="text-white text-sm font-bold truncate">
                                                    {selectedDept.label}
                                                </span>
                                            </div>
                                            <ArrowRight size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-90 text-fdvp-primary' : ''}`} />
                                        </button>

                                        {isDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                                <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    {departments.map((dept) => (
                                                        <button
                                                            key={dept.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setTargetDepartment(dept.id);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 text-sm flex items-start gap-3 transition-colors ${targetDepartment === dept.id
                                                                    ? 'bg-fdvp-primary/10 border-l-2 border-fdvp-primary'
                                                                    : 'hover:bg-white/5 border-l-2 border-transparent'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 ${targetDepartment === dept.id ? 'text-fdvp-primary' : 'text-gray-500'}`}>
                                                                {dept.icon}
                                                            </div>
                                                            <div>
                                                                <div className={`font-bold ${targetDepartment === dept.id ? 'text-fdvp-primary' : 'text-gray-200'}`}>
                                                                    {dept.label}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{dept.desc}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Brief summary..."
                                        className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Message</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Write your confidential message here..."
                                        className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="pt-2 pb-2">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full py-4 bg-gradient-to-r from-fdvp-primary to-purple-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <>Processing Encryption...</>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Securely
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 border border-green-500/20">
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Message Encrypted & Sent</h4>
                                <p className="text-gray-400 text-sm max-w-xs text-center">
                                    Our leadership team has received your secure transmission. You will be contacted via your registered email if a response is required.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
