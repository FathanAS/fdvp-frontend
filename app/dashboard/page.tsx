"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, UserPlus, Activity, ShieldCheck, Clock, Calendar, Zap, ScanLine, ArrowRight, Shield, Trash2, Edit, UserX, UserCog, FilePlus, FileEdit, FileX, CalendarPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, getDocs, limit, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { io } from 'socket.io-client';
import Link from 'next/link';

interface ActivityLog {
    id: string;
    action: string;
    description: string;
    timestamp: any;
    performedBy?: string;
    adminName?: string;
}

export default function DashboardOverview() {
    const { user, role } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        serverHealth: "Checking...",
        totalStaff: 0,
        totalEvents: 0,
        status: "Checking..."
    });
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    // -- 1. STATS & ACTIVITIES FETCH (ONCE) --
    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersColl = collection(db, 'users');
                const eventsColl = collection(db, 'events');

                const allSnap = await getCountFromServer(usersColl);
                const staffSnap = await getCountFromServer(query(usersColl, where('role', '==', 'staff')));
                const eventsSnap = await getCountFromServer(eventsColl);

                // Fetch Activities
                const logsRef = collection(db, 'activity_logs');
                const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(10));
                const logsSnap = await getDocs(qLogs);
                const currentLogs = logsSnap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        performedBy: data.performedBy || data.adminName || 'System'
                    } as ActivityLog;
                });

                setActivities(currentLogs);
                setStats(prev => ({
                    ...prev,
                    totalUsers: allSnap.data().count,
                    totalStaff: staffSnap.data().count,
                    totalEvents: eventsSnap.data().count
                }));

            } catch (err) {
                console.error("Error fetching dashboard data", err);
            } finally {
                setLoadingActivities(false);
            }
        };

        fetchData();
    }, []);

    // -- 2. REALTIME SERVER HEALTH (POLLING 5s) --
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const start = Date.now();
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/health`);
                const data = await res.json();

                setStats(prev => ({
                    ...prev,
                    serverHealth: data.latency || `${Date.now() - start}ms`,
                    status: data.status || (res.ok ? "UP" : "DOWN")
                }));
            } catch (error) {
                setStats(prev => ({ ...prev, serverHealth: "ERR", status: "DOWN" }));
            }
        };

        checkHealth(); // Initial check
        const interval = setInterval(checkHealth, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // -- 3. HANDLE BROADCAST VIA SOCKET --
    const handleBroadcast = async () => {
        const message = prompt("📢 BROADCAST MESSAGE\n\nEnter the message to send to ALL online users:");
        if (!message) return;

        const confirmSend = confirm(`Are you sure you want to broadcast this to EVERYONE?\n\n"${message}"`);
        if (!confirmSend) return;

        try {
            // Force new connection to ensure clean state and avoid race conditions
            const socket = io(process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:3001', {
                transports: ['websocket'],
                forceNew: true,
                query: { userId: user?.uid || 'admin-broadcaster' }
            });

            socket.on('connect', () => {
                console.log("Broadcast socket connected ID:", socket.id);

                socket.emit('broadcastMessage', {
                    message: message,
                    senderName: user?.displayName || "Admin"
                });

                alert("✅ Broadcast Sent! (Check other windows)");

                // Cleanup after 2 seconds to ensure transmission
                setTimeout(() => {
                    socket.disconnect();
                }, 2000);
            });

            socket.on('connect_error', (err) => {
                console.error("Broadcast socket connection error:", err);
                alert("❌ Connection Error: " + (err.message || "Unknown error"));
                socket.disconnect();
            });

        } catch (error: any) {
            console.error("Broadcast setup failed:", error);
            alert("❌ Failed to initiate broadcast: " + error.message);
        }
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">

            {/* Header & Date */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-fdvp-text-light tracking-tight">Dashboard Overview</h1>
                    <p className="text-fdvp-text mt-1">Manage your community and events efficiently.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-fdvp-text-light">{currentDate}</p>
                    <p className="text-xs text-fdvp-text uppercase tracking-wider">System Status: <span className={stats.status === "UP" ? "text-green-500" : "text-red-500"}>{stats.status}</span></p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                <Link href="/dashboard/events/create" className="group p-4 bg-fdvp-primary text-fdvp-bg rounded-2xl flex flex-col items-start gap-3 hover:shadow-lg hover:shadow-fdvp-primary/20 transition-all hover:-translate-y-1">
                    <div className="p-2 bg-white/20 rounded-lg"><Calendar size={20} /></div>
                    <span className="font-bold text-sm">Create Event</span>
                </Link>
                <Link href="/dashboard/scan" className="group p-4 bg-fdvp-card border border-fdvp-text/10 rounded-2xl flex flex-col items-start gap-3 hover:border-fdvp-primary/50 transition-all hover:-translate-y-1">
                    <div className="p-2 bg-fdvp-text/5 rounded-lg text-fdvp-primary"><ScanLine size={20} /></div>
                    <span className="font-bold text-sm text-fdvp-text-light">Scan Ticket</span>
                </Link>
                <Link href="/dashboard/users" className="group p-4 bg-fdvp-card border border-fdvp-text/10 rounded-2xl flex flex-col items-start gap-3 hover:border-fdvp-primary/50 transition-all hover:-translate-y-1">
                    <div className="p-2 bg-fdvp-text/5 rounded-lg text-fdvp-primary"><UserPlus size={20} /></div>
                    <span className="font-bold text-sm text-fdvp-text-light">User Management</span>
                </Link>
                <Link href="/dashboard/tickets" className="group p-4 bg-fdvp-card border border-fdvp-text/10 rounded-2xl flex flex-col items-start gap-3 hover:border-fdvp-primary/50 transition-all hover:-translate-y-1 relative">
                    <div className="p-2 bg-fdvp-text/5 rounded-lg text-fdvp-primary"><ShieldCheck size={20} /></div>
                    <span className="font-bold text-sm text-fdvp-text-light">Inbox Support</span>
                    <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </Link>
                <button onClick={handleBroadcast} className="group p-4 bg-fdvp-card border border-fdvp-text/10 rounded-2xl flex flex-col items-start gap-3 hover:border-fdvp-primary/50 transition-all hover:-translate-y-1">
                    <div className="p-2 bg-fdvp-text/5 rounded-lg text-fdvp-text"><Zap size={20} /></div>
                    <span className="font-bold text-sm text-fdvp-text-light">Quick Broadcast</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={20} />} color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/20" />
                <StatCard title="Total Events" value={stats.totalEvents} icon={<Calendar size={20} />} color="text-violet-500" bg="bg-violet-500/10" border="border-violet-500/20" />
                <StatCard title="Active Staff" value={stats.totalStaff} icon={<ShieldCheck size={20} />} color="text-emerald-500" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                <StatCard title="Server Latency" value={stats.serverHealth} icon={<Activity size={20} />} color={stats.status === "UP" ? "text-green-500" : "text-red-500"} bg={stats.status === "UP" ? "bg-green-500/10" : "bg-red-500/10"} border={stats.status === "UP" ? "border-green-500/20" : "border-red-500/20"} />
            </div>

            {/* Recent Activity Section - Enhanced */}
            <div className="bg-fdvp-card border border-fdvp-text/10 rounded-3xl overflow-hidden shadow-lg">
                <div className="p-4 md:p-6 border-b border-fdvp-text/5 bg-gradient-to-r from-fdvp-text/5 to-transparent">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-fdvp-primary/10 rounded-xl border border-fdvp-primary/20">
                                <Clock size={18} className="text-fdvp-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-fdvp-text-light flex items-center gap-2">
                                    Recent Activity
                                </h3>
                                <p className="text-[10px] text-fdvp-text/50 mt-0.5">Track all system changes and user actions</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-fdvp-bg border border-fdvp-primary/20 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] uppercase font-bold text-fdvp-primary tracking-wider">Live</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-fdvp-text/5">
                    {loadingActivities ? (
                        <div className="p-8 text-center text-sm text-fdvp-text/50 animate-pulse">Loading logs...</div>
                    ) : activities.length === 0 ? (
                        <div className="p-8 text-center text-sm text-fdvp-text/50">No recent activity.</div>
                    ) : (
                        activities.map((log) => {
                            // Determine icon and colors based on action type
                            let IconComponent = Activity;
                            let iconColor = "text-blue-500";
                            let iconBg = "bg-blue-500/10";
                            let dotColor = "bg-blue-500";

                            // USER OPERATIONS
                            if (log.action.includes('DELETE_USER')) {
                                IconComponent = UserX;
                                iconColor = "text-red-500";
                                iconBg = "bg-red-500/10";
                                dotColor = "bg-red-500";
                            } else if (log.action.includes('UPDATE_ROLE') || log.action.includes('UPDATE_PRIVILEGE')) {
                                IconComponent = UserCog;
                                iconColor = "text-amber-500";
                                iconBg = "bg-amber-500/10";
                                dotColor = "bg-amber-500";
                            } else if (log.action.includes('CREATE_USER') || log.action.includes('ADD_USER')) {
                                IconComponent = UserPlus;
                                iconColor = "text-green-500";
                                iconBg = "bg-green-500/10";
                                dotColor = "bg-green-500";
                            }
                            // EVENT OPERATIONS
                            else if (log.action.includes('DELETE') && (log.action.includes('EVENT') || log.description.toLowerCase().includes('event'))) {
                                IconComponent = FileX;
                                iconColor = "text-red-500";
                                iconBg = "bg-red-500/10";
                                dotColor = "bg-red-500";
                            } else if (log.action.includes('CREATE') && (log.action.includes('EVENT') || log.description.toLowerCase().includes('event'))) {
                                IconComponent = CalendarPlus;
                                iconColor = "text-green-500";
                                iconBg = "bg-green-500/10";
                                dotColor = "bg-green-500";
                            } else if (log.action.includes('UPDATE') && (log.action.includes('EVENT') || log.description.toLowerCase().includes('event'))) {
                                IconComponent = FileEdit;
                                iconColor = "text-blue-500";
                                iconBg = "bg-blue-500/10";
                                dotColor = "bg-blue-500";
                            }
                            // GENERIC OPERATIONS
                            else if (log.action.includes('DELETE')) {
                                IconComponent = Trash2;
                                iconColor = "text-red-500";
                                iconBg = "bg-red-500/10";
                                dotColor = "bg-red-500";
                            } else if (log.action.includes('UPDATE')) {
                                IconComponent = Edit;
                                iconColor = "text-amber-500";
                                iconBg = "bg-amber-500/10";
                                dotColor = "bg-amber-500";
                            } else if (log.action.includes('CREATE') || log.action.includes('ADD')) {
                                IconComponent = FilePlus;
                                iconColor = "text-green-500";
                                iconBg = "bg-green-500/10";
                                dotColor = "bg-green-500";
                            }

                            return (
                                <div key={log.id} className="p-4 hover:bg-fdvp-text/5 transition-colors group">
                                    <div className="flex gap-4 items-start">
                                        {/* Icon */}
                                        <div className={`mt-0.5 w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${iconColor} group-hover:scale-110 transition-transform`}>
                                            <IconComponent size={16} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1.5 gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-fdvp-text-light">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                                                </div>
                                                <span className="text-[10px] text-fdvp-text/40 font-mono">
                                                    {(() => {
                                                        const ts = log.timestamp;
                                                        const date = ts?.toDate ? ts.toDate() : new Date(ts);
                                                        return !isNaN(date.getTime())
                                                            ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                            : 'Just now';
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-fdvp-text/70 line-clamp-2 leading-relaxed">{log.description}</p>

                                            {log.performedBy && (
                                                <div className="flex items-center gap-2 mt-2.5">
                                                    <span className="text-[10px] text-fdvp-text/40 uppercase tracking-wider font-bold">Performed by</span>
                                                    <span className="text-xs font-bold text-fdvp-primary bg-fdvp-primary/10 px-2.5 py-1 rounded-full border border-fdvp-primary/20">
                                                        {log.performedBy}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// Simplified Stat Card
function StatCard({ title, value, icon, color, bg, border }: any) {
    return (
        <div className={`p-5 rounded-2xl border ${border} ${bg} transition-all hover:scale-[1.02]`}>
            <div className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 ${color} backdrop-blur-sm`}>
                {icon}
            </div>
            <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-wider mix-blend-plus-lighter">{title}</p>
        </div>
    );
}
