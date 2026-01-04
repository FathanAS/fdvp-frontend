"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Search, Edit, Save, Trash2, X, ShieldAlert, ChevronDown, Check, Shield, Crown, Key, Mail } from "lucide-react";
import { canModifyRole, canDeleteUser, getAvailableRolesForActor } from "@/lib/rbac";
import Notiflix from "notiflix";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    role: string;
    photoURL?: string;
    job?: string;
}

export default function AdminManagementPage() {
    const { user, role: currentUserRole } = useAuth();
    const { notify } = useNotification();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "users"));

            const userData: UserData[] = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as UserData))
                .filter(u => ['admin', 'superadmin', 'administrator', 'owner'].includes(u.role || ''));

            setUsers(userData);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAdmin = async (userId: string, targetRole: string) => {
        Notiflix.Confirm.show(
            'CRITICAL ACTION',
            'You are about to delete an administrator context user. Access will be permanently revoked. Continue?',
            'Yes, Delete Admin',
            'Cancel',
            async () => {
                if (!canDeleteUser(currentUserRole || '', targetRole)) {
                    notify("Permission Denied", "Insufficient permissions to delete this administrator.", "error");
                    return;
                }

                try {
                    await deleteDoc(doc(db, "users", userId));

                    // LOG ACTIVITY
                    await addDoc(collection(db, "activity_logs"), {
                        action: "DELETE_PRIVILEGE",
                        description: `Deleted PRIVILEGED user ${userId} (Role: ${targetRole})`,
                        timestamp: serverTimestamp(),
                        performedBy: user?.displayName || user?.email || "Superadmin"
                    });

                    fetchAdmins();
                    notify("Success", "Administrator account deleted.", "success");
                } catch (error) {
                    console.error("Error deleting admin:", error);
                    notify("Error", "Failed to delete account.", "error");
                }
            },
            () => { },
            {
                titleColor: '#e11d48', // Red
                okButtonBackground: '#e11d48',
                okButtonColor: '#FFFFFF'
            }
        );
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        const targetUser = users.find(u => u.id === userId);
        const oldRole = targetUser?.role || 'admin';

        // STRICT RBAC CHECK
        if (!canModifyRole(currentUserRole || '', oldRole, newRole)) {
            notify("Permission Denied", "Insufficient permissions to perform this action.", "error");
            return;
        }

        try {
            await updateDoc(doc(db, "users", userId), {
                role: newRole
            });

            // LOG ACTIVITY
            await addDoc(collection(db, "activity_logs"), {
                action: "UPDATE_PRIVILEGE",
                description: `Changed privileges of ${targetUser?.displayName || targetUser?.email} from '${oldRole}' to '${newRole}'`,
                timestamp: serverTimestamp(),
                performedBy: user?.displayName || user?.email || "Superadmin"
            });

            setEditingId(null);
            fetchAdmins();
            notify("Success", "Admin privileges updated successfully!", "success");
        } catch (error) {
            console.error("Error updating admin role:", error);
            notify("Error", "Failed to update.", "error");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = getAvailableRolesForActor(currentUserRole || '');

    const getRoleBadge = (role: string) => {
        const badges = {
            owner: { bg: 'bg-purple-600/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: Crown },
            superadmin: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', icon: Key },
            administrator: { bg: 'bg-red-600/10', text: 'text-red-500', border: 'border-red-500/20', icon: ShieldAlert },
            admin: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: Shield }
        };
        const badge = badges[role as keyof typeof badges] || badges.admin;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text} border ${badge.border}`}>
                <Icon size={12} />
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <ShieldAlert className="text-red-500" size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-fdvp-text-light tracking-tight">Admin Management</h1>
                    </div>
                    <p className="text-fdvp-text text-sm mt-2 ml-1">Superadmin Zone: Manage privileges and high-level roles.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/40 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-fdvp-text/5 border border-fdvp-text/10 rounded-full text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:bg-fdvp-text/10 focus:border-red-500/50 transition-all w-full md:w-72 shadow-lg"
                    />
                </div>
            </div>

            {/* MODERN CARD/TABLE HYBRID */}
            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-fdvp-text/10"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-fdvp-text/10 rounded w-1/4"></div>
                                        <div className="h-3 bg-fdvp-text/10 rounded w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-3xl p-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
                            <ShieldAlert className="text-red-500" size={32} />
                        </div>
                        <p className="text-fdvp-text/40 text-lg">No administrators found.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden lg:block bg-fdvp-text/5 border border-fdvp-text/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-fdvp-text/5">
                                        <th className="px-8 py-5 text-left text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Administrator</th>
                                        <th className="px-6 py-5 text-left text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Privilege Level</th>
                                        <th className="px-8 py-5 text-right text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-fdvp-text/5">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="group hover:bg-fdvp-text/5 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center text-red-500 font-bold overflow-hidden border-2 border-red-500/20 group-hover:border-red-500/50 transition-all">
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-lg">{u.displayName?.substring(0, 1) || "A"}</span>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-fdvp-bg flex items-center justify-center">
                                                            <Shield size={8} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-fdvp-text-light group-hover:text-red-400 transition-colors truncate">
                                                            {u.displayName || "Unknown Admin"}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Mail size={12} className="text-fdvp-text/40" />
                                                            <p className="text-xs text-fdvp-text/60 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {editingId === u.id ? (
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                                                                setDropdownOpen(!dropdownOpen);
                                                            }}
                                                            className="w-full min-w-[160px] bg-fdvp-card border border-red-500 rounded-xl px-4 py-2.5 text-sm text-fdvp-text-light flex items-center justify-between hover:bg-red-500/5 transition-all"
                                                        >
                                                            <span className="capitalize font-medium">
                                                                {selectedRole === 'user' ? 'Demote to User' : selectedRole}
                                                            </span>
                                                            <ChevronDown size={14} className={`text-red-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {mounted && dropdownOpen && createPortal(
                                                            <>
                                                                <div className="fixed inset-0 z-[9999]" onClick={() => setDropdownOpen(false)}></div>
                                                                <div
                                                                    className="fixed bg-fdvp-card border border-fdvp-text/10 rounded-xl shadow-2xl z-[10000] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                                                    style={{
                                                                        top: dropdownPos.top,
                                                                        left: dropdownPos.left,
                                                                        width: dropdownPos.width,
                                                                        minWidth: '180px'
                                                                    }}
                                                                >
                                                                    {availableRoles
                                                                        .filter(r => ['admin', 'superadmin', 'administrator', 'user'].includes(r))
                                                                        .map(roleOption => (
                                                                            <button
                                                                                key={roleOption}
                                                                                onClick={() => {
                                                                                    setSelectedRole(roleOption);
                                                                                    setDropdownOpen(false);
                                                                                }}
                                                                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${selectedRole === roleOption
                                                                                    ? 'bg-red-500/10 text-red-500 font-bold'
                                                                                    : 'text-fdvp-text hover:bg-fdvp-text/5 hover:text-fdvp-text-light'
                                                                                    }`}
                                                                            >
                                                                                <span className="capitalize">
                                                                                    {roleOption === 'user' ? 'Demote to User' : roleOption}
                                                                                </span>
                                                                                {selectedRole === roleOption && <Check size={14} />}
                                                                            </button>
                                                                        ))}

                                                                    {availableRoles.filter(r => ['admin', 'superadmin', 'administrator', 'user'].includes(r)).length === 0 && (
                                                                        <div className="px-4 py-3 text-xs text-fdvp-text/50 italic">No Actions Available</div>
                                                                    )}
                                                                </div>
                                                            </>,
                                                            document.body
                                                        )}
                                                    </div>
                                                ) : (
                                                    getRoleBadge(u.role)
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {editingId === u.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateRole(u.id, selectedRole)}
                                                                className="p-2.5 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                                                title="Save Changes"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                                title="Cancel"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {user?.uid !== u.id && canModifyRole(currentUserRole || '', u.role || 'admin', 'admin') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(u.id);
                                                                        setSelectedRole(u.role);
                                                                        setDropdownOpen(false);
                                                                    }}
                                                                    className="p-2.5 hover:bg-fdvp-text/10 rounded-xl text-fdvp-text/40 hover:text-fdvp-text-light transition-all"
                                                                    title="Modify Access"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}

                                                            {user?.uid !== u.id && canDeleteUser(currentUserRole || '', u.role || 'admin') && (
                                                                <button
                                                                    onClick={() => handleDeleteAdmin(u.id, u.role || 'admin')}
                                                                    className="p-2.5 hover:bg-red-500/20 rounded-xl text-fdvp-text/40 hover:text-red-400 transition-all"
                                                                    title="Revoke and Delete Access"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet: Card View */}
                        <div className="lg:hidden grid grid-cols-1 gap-4">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-2xl p-6 hover:bg-fdvp-text/10 transition-all duration-300 backdrop-blur-md shadow-lg border-l-4 border-l-red-500">
                                    {/* Header with Avatar */}
                                    <div className="flex items-start gap-4 mb-5 pb-5 border-b border-fdvp-text/5">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center text-red-500 font-bold overflow-hidden border-2 border-red-500/20">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl">{u.displayName?.substring(0, 1) || "A"}</span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-fdvp-bg flex items-center justify-center">
                                                <Shield size={12} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-fdvp-text-light truncate">{u.displayName || "Unknown"}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Mail size={12} className="text-fdvp-text/40" />
                                                <p className="text-xs text-fdvp-text/60 truncate">{u.email}</p>
                                            </div>
                                            <div className="mt-3">{getRoleBadge(u.role)}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {editingId === u.id ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="flex-1">
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                                                            setDropdownOpen(!dropdownOpen);
                                                        }}
                                                        className="w-full bg-fdvp-card border border-red-500 rounded-xl px-4 py-3 text-sm text-fdvp-text-light flex items-center justify-between"
                                                    >
                                                        <span className="capitalize font-medium">{selectedRole === 'user' ? 'Demote' : selectedRole}</span>
                                                        <ChevronDown size={14} className={`text-red-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateRole(u.id, selectedRole)}
                                                    className="p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {user?.uid !== u.id && canModifyRole(currentUserRole || '', u.role || 'admin', 'admin') && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(u.id);
                                                            setSelectedRole(u.role);
                                                        }}
                                                        className="flex-1 px-4 py-3 bg-fdvp-text/10 text-fdvp-text-light rounded-xl hover:bg-fdvp-text/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Edit size={16} />
                                                        Modify
                                                    </button>
                                                )}
                                                {user?.uid !== u.id && canDeleteUser(currentUserRole || '', u.role || 'admin') && (
                                                    <button
                                                        onClick={() => handleDeleteAdmin(u.id, u.role || 'admin')}
                                                        className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
