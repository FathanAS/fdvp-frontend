"use client";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

/**
 * DEBUG COMPONENT
 * Komponen ini untuk debug dan melihat struktur data activity_logs di Firestore
 * Tambahkan ke dashboard page untuk melihat raw data
 */
export default function ActivityLogDebugger() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const logsRef = collection(db, 'activity_logs');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(10));
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setLogs(data);
            console.log('📊 ACTIVITY LOGS RAW DATA:', data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 bg-yellow-500/10 text-yellow-500">Loading debug data...</div>;

    return (
        <div className="p-6 bg-gray-900 rounded-2xl border border-gray-700 my-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">🔍 Activity Log Debugger</h3>
                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                >
                    Refresh
                </button>
            </div>

            {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    No activity logs found in Firestore
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log, idx) => (
                        <div key={log.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-gray-500">#{idx + 1}</span>
                                <span className="text-sm font-bold text-green-400">{log.action}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {log.timestamp?.toDate?.() ? log.timestamp.toDate().toLocaleString() : 'No timestamp'}
                                </span>
                            </div>

                            <div className="text-sm text-gray-300 mb-2">{log.description}</div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Performed By:</span>
                                    <span className="text-blue-400 ml-2">{log.performedBy || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Target Type:</span>
                                    <span className="text-purple-400 ml-2">{log.targetType || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Target ID:</span>
                                    <span className="text-orange-400 ml-2 font-mono">{log.targetId || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Type:</span>
                                    <span className="text-pink-400 ml-2">{log.type || 'N/A'}</span>
                                </div>
                            </div>

                            <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer">Raw JSON</summary>
                                <pre className="mt-2 p-2 bg-black rounded text-xs overflow-auto">
                                    {JSON.stringify(log, null, 2)}
                                </pre>
                            </details>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-400">
                    <strong>💡 TIP:</strong> Check console for full log data.
                    If logs appear here but not in Recent Activity, check the icon detection logic in dashboard/page.tsx
                </p>
            </div>
        </div>
    );
}
