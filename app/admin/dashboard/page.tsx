"use client";
import { useEffect, useState } from "react";
import {
  Users, Calendar, Ticket, Activity,
  ArrowUpRight, Clock, AlertCircle, CheckCircle2
} from "lucide-react";
// Import Firestore Client SDK langsung agar Realtime
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

export default function DashboardPage() {
  // STATE STATISTIK
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0 // Ceritanya kalau ada event berbayar
  });

  // STATE LOG AKTIVITAS
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE SYSTEM HEALTH
  const [systemHealth, setSystemHealth] = useState({ percent: 0, status: 'Checking...' });

  useEffect(() => {
    // FUNCTION CEK HEALTH
    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/health`);
        const data = await res.json();
        if (data.status === 'UP') {
          setSystemHealth({ percent: 100, status: `Operational` });
        } else {
          setSystemHealth({ percent: 0, status: 'System Down' });
        }
      } catch (e) {
        setSystemHealth({ percent: 0, status: 'Server Unreachable' });
      }
    };

    // Cek setiap 30 detik
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    // --- 1. LISTENER REALTIME: MEMBERS ---
    const unsubMembers = onSnapshot(collection(db, "users"), (snap) => {
      setStats(prev => ({ ...prev, totalMembers: snap.size }));
    });

    // --- 2. LISTENER REALTIME: EVENTS (Hanya yang statusnya upcoming/ongoing) ---
    // Note: Query sederhana client-side (ambil semua lalu filter panjang array)
    // Untuk app besar, gunakan server-side aggregation. Untuk MVP ini OK.
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      const activeCount = snap.docs.filter(d =>
        ['upcoming', 'ongoing'].includes(d.data().status)
      ).length;
      setStats(prev => ({ ...prev, activeEvents: activeCount }));
    });

    // --- 3. LISTENER REALTIME: REGISTRATIONS ---
    const unsubRegs = onSnapshot(collection(db, "registrations"), (snap) => {
      setStats(prev => ({ ...prev, totalRegistrations: snap.size }));
    });

    // --- 4. LISTENER REALTIME: RECENT ACTIVITY (Logs) ---
    const logsQuery = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(5) // Ambil 5 aktivitas terakhir
    );

    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    });

    // CLEANUP LISTENER SAAT PINDAH HALAMAN (Wajib agar tidak memory leak)
    return () => {
      clearInterval(interval);
      unsubMembers();
      unsubEvents();
      unsubRegs();
      unsubLogs();
    };
  }, []);

  // Helper Icon untuk Log
  const getLogIcon = (action: string) => {
    if (action.includes("CREATE")) return <CheckCircle2 size={16} className="text-green-400" />;
    if (action.includes("UPDATE")) return <Activity size={16} className="text-blue-400" />;
    if (action.includes("DELETE")) return <AlertCircle size={16} className="text-red-400" />;
    return <Clock size={16} className="text-gray-400" />;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-fdvp-text-light tracking-tight">
          Live <span className="text-fdvp-accent">Overview</span>
        </h2>
        <p className="text-fdvp-text text-sm flex items-center gap-2 mt-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Sistem terhubung secara real-time. Data akan berubah otomatis.
        </p>
      </div>

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* CARD 1: TOTAL MEMBERS */}
        <div className="bg-fdvp-card p-6 rounded-2xl border border-fdvp-text/10 shadow-lg relative overflow-hidden group hover:border-fdvp-accent transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded flex items-center gap-1">
              <ArrowUpRight size={10} /> Live
            </span>
          </div>
          <h3 className="text-3xl font-bold text-fdvp-text-light mb-1">{stats.totalMembers}</h3>
          <p className="text-fdvp-text text-sm">Total Member Bergabung</p>
        </div>

        {/* CARD 2: ACTIVE EVENTS */}
        <div className="bg-fdvp-card p-6 rounded-2xl border border-fdvp-text/10 shadow-lg relative overflow-hidden group hover:border-fdvp-accent transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-fdvp-text-light mb-1">{stats.activeEvents}</h3>
          <p className="text-fdvp-text text-sm">Event Aktif / Upcoming</p>
        </div>

        {/* CARD 3: REGISTRATIONS */}
        <div className="bg-fdvp-card p-6 rounded-2xl border border-fdvp-text/10 shadow-lg relative overflow-hidden group hover:border-fdvp-accent transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Ticket size={24} />
            </div>
            {/* Simulasi kenaikan */}
            <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">+New</span>
          </div>
          <h3 className="text-3xl font-bold text-fdvp-text-light mb-1">{stats.totalRegistrations}</h3>
          <p className="text-fdvp-text text-sm">Total Pendaftaran Tiket</p>
        </div>

        {/* CARD 4: SYSTEM STATUS (Static/Dummy) */}
        <div className="bg-fdvp-card p-6 rounded-2xl border border-fdvp-text/10 shadow-lg relative overflow-hidden group hover:border-fdvp-accent transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
          </div>
          <h3 className={`text-3xl font-bold mb-1 ${systemHealth.percent === 100 ? 'text-green-400' : 'text-red-400'}`}>
            {systemHealth.percent}%
          </h3>
          <p className="text-fdvp-text text-sm">{systemHealth.status}</p>
        </div>

      </div>

      {/* RECENT ACTIVITY LOGS */}
      <div className="bg-fdvp-card rounded-2xl border border-fdvp-text/10 p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-fdvp-text-light flex items-center gap-2">
            <Clock size={20} className="text-fdvp-accent" /> Recent Activity
          </h3>
          <span className="text-xs text-fdvp-text bg-fdvp-bg px-3 py-1 rounded-full border border-fdvp-text/20">
            Monitoring Admin Actions
          </span>
        </div>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-fdvp-text opacity-50 border border-dashed border-fdvp-text/10 rounded-xl">
              Belum ada aktivitas admin tercatat.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start p-4 rounded-xl bg-fdvp-bg/30 hover:bg-fdvp-bg transition-colors border-l-4 border-fdvp-accent/50 animate-in slide-in-from-left-2">

                {/* ICON */}
                <div className="mt-1">{getLogIcon(log.action)}</div>

                <div className="flex-1">
                  {/* BARIS 1: NAMA ADMIN & ACTION */}
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-fdvp-accent uppercase tracking-wider">
                      {log.adminName || "Unknown Admin"} {/* TAMPILKAN NAMA */}
                    </p>
                    <span className="text-[10px] text-fdvp-text bg-white/5 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </div>

                  {/* BARIS 2: DESKRIPSI */}
                  <p className="text-sm text-fdvp-text-light mb-1">
                    {log.description}
                  </p>

                  {/* BARIS 3: WAKTU */}
                  <p className="text-[10px] text-fdvp-text font-mono opacity-70">
                    {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}