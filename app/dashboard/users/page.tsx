"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Search, Edit, Save, Trash2, X, ChevronDown, Check, Briefcase, Mail, Shield } from "lucide-react";
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

export default function UserManagementPage() {
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "users"));

            console.log('📊 Total users in Firestore:', snapshot.docs.length);

            // Leadership roles to exclude from user management
            const leadershipRoles = ['owner', 'administrator', 'superadmin', 'admin'];

            const userData: UserData[] = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data } as UserData;
                })
                .filter(u => {
                    // Only exclude leadership roles, show everyone else
                    const userRole = (u.role || 'user').toLowerCase();
                    const isLeadership = leadershipRoles.includes(userRole);

                    if (isLeadership) {
                        console.log('🚫 Filtered out leadership role:', u.displayName || u.email, '- Role:', u.role);
                    }

                    return !isLeadership;
                });

            console.log('✅ Users after filtering:', userData.length);
            console.log('📋 User roles found:', [...new Set(userData.map(u => u.role || 'user'))]);

            setUsers(userData);
        } catch (error) {
            console.error("❌ Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, targetRole: string) => {
        // GET USER INFO BEFORE DELETION
        const targetUser = users.find(u => u.id === userId);
        const userName = targetUser?.displayName || targetUser?.email || userId;

        Notiflix.Confirm.show(
            'Delete User',
            `Are you sure you want to delete ${userName}? This action cannot be undone.`,
            'Yes, Delete',
            'Cancel',
            async () => {
                if (!canDeleteUser(currentUserRole || '', targetRole)) {
                    notify("Permission Denied", "Insufficient permissions to delete this user.", "error");
                    return;
                }

                try {
                    await deleteDoc(doc(db, "users", userId));

                    // LOG ACTIVITY WITH USER NAME (CONSISTENT FORMAT WITH BACKEND)
                    await addDoc(collection(db, "activity_logs"), {
                        action: "DELETE_USER",
                        description: `Deleted user: ${userName} (Role: ${targetRole})`,
                        timestamp: new Date().toISOString(), // ISO string like backend
                        adminName: user?.displayName || user?.email || "Admin", // Use adminName like backend
                        performedBy: user?.displayName || user?.email || "Admin", // Keep for compatibility
                        targetId: userId,
                        targetType: "user",
                        type: 'admin_action' // Add type field like backend
                    });

                    fetchUsers();
                    notify("Success", "User deleted successfully.", "success");
                } catch (error) {
                    console.error("Error deleting user:", error);
                    notify("Error", "Failed to delete user.", "error");
                }
            }
        );
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        const targetUser = users.find(u => u.id === userId);
        const oldRole = targetUser?.role || 'user';

        // STRICT RBAC CHECK
        if (!canModifyRole(currentUserRole || '', oldRole, newRole)) {
            notify("Permission Denied", "Insufficient permissions to perform this action.", "error");
            return;
        }

        try {
            await updateDoc(doc(db, "users", userId), {
                role: newRole
            });

            // LOG ACTIVITY (CONSISTENT FORMAT WITH BACKEND)
            await addDoc(collection(db, "activity_logs"), {
                action: "UPDATE_ROLE",
                description: `Changed role of ${targetUser?.displayName || targetUser?.email} from '${oldRole}' to '${newRole}'`,
                timestamp: new Date().toISOString(), // ISO string like backend
                adminName: user?.displayName || user?.email || "Admin", // Use adminName like backend
                performedBy: user?.displayName || user?.email || "Admin", // Keep for compatibility
                targetId: userId,
                targetType: "user",
                type: 'admin_action' // Add type field like backend
            });

            setEditingId(null);
            fetchUsers(); // Refresh
            notify("Success", "Role updated successfully!", "success");
        } catch (error) {
            console.error("Error updating role:", error);
            notify("Error", "Failed to update role.", "error");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = getAvailableRolesForActor(currentUserRole || '');

    const getRoleBadge = (role: string) => {
        const badges = {
            staff: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: Shield },
            manager: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: Briefcase },
            user: { bg: 'bg-fdvp-text/5', text: 'text-fdvp-text/50', border: 'border-fdvp-text/10', icon: null }
        };
        const badge = badges[role as keyof typeof badges] || badges.user;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text} border ${badge.border}`}>
                {Icon && <Icon size={12} />}
                {role || 'user'}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-fdvp-text-light tracking-tight">User Management</h1>
                    <p className="text-fdvp-text text-sm mt-1">Manage standard users and staff members access.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Developer Tools */}
                    {['owner', 'superadmin', 'administrator'].includes(currentUserRole || '') && (
                        <div className="flex gap-2 mr-4 border-r border-fdvp-text/10 pr-4">
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    notify("Processing", "Generating 100 dummy users...", "info");
                                    try {
                                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/seed/users?count=100`, { method: 'POST' });
                                        notify("Success", "Generated 100 users!", "success");
                                        fetchUsers();
                                    } catch (e) {
                                        notify("Error", "Failed to seed users", "error");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="px-3 py-1.5 bg-fdvp-text/5 hover:bg-fdvp-primary/10 text-[10px] font-bold uppercase tracking-wider text-fdvp-text hover:text-fdvp-primary rounded border border-fdvp-text/10 transition-colors"
                            >
                                + 100 Dummies
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm("Delete all dummy users?")) return;
                                    setLoading(true);
                                    notify("Processing", "Deleting dummy users...", "info");
                                    try {
                                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/seed/users`, { method: 'DELETE' });
                                        notify("Success", "Deleted dummy users!", "success");
                                        fetchUsers();
                                    } catch (e) {
                                        notify("Error", "Failed to delete users", "error");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="px-3 py-1.5 bg-fdvp-text/5 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider text-fdvp-text hover:text-red-500 rounded border border-fdvp-text/10 transition-colors"
                            >
                                Clear Dummies
                            </button>
                        </div>
                    )}

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/40 group-focus-within:text-fdvp-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="pl-12 pr-6 py-3 bg-fdvp-text/5 border border-fdvp-text/10 rounded-full text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:bg-fdvp-text/10 focus:border-fdvp-primary/50 transition-all w-full md:w-72 shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* MODERN CARD/TABLE HYBRID */}
            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[...Array(5)].map((_, i) => (
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
                        <div className="w-16 h-16 rounded-full bg-fdvp-text/10 mx-auto mb-4 flex items-center justify-center">
                            <Search className="text-fdvp-text/30" size={32} />
                        </div>
                        <p className="text-fdvp-text/40 text-lg">No users found matching your search.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden lg:block bg-fdvp-text/5 border border-fdvp-text/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-fdvp-text/5">
                                        <th className="px-8 py-5 text-left text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">User</th>
                                        <th className="px-6 py-5 text-left text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Role</th>
                                        <th className="px-6 py-5 text-left text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Position</th>
                                        <th className="px-8 py-5 text-right text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-fdvp-text/5">
                                    {filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(u => (
                                        <tr key={u.id} className="group hover:bg-fdvp-text/5 transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fdvp-primary/20 to-fdvp-accent/20 flex items-center justify-center text-fdvp-text-light font-bold overflow-hidden border-2 border-fdvp-text/10 group-hover:border-fdvp-primary/30 transition-all">
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-lg">{u.displayName?.substring(0, 1) || "U"}</span>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-fdvp-bg"></div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-fdvp-text-light group-hover:text-fdvp-primary transition-colors truncate">
                                                            {u.displayName || "Unknown User"}
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
                                                            className="w-full min-w-[140px] bg-fdvp-card border border-fdvp-primary rounded-xl px-4 py-2.5 text-sm text-fdvp-text-light flex items-center justify-between hover:bg-fdvp-primary/5 transition-all"
                                                        >
                                                            <span className="capitalize font-medium">
                                                                {selectedRole === 'manager' ? 'Manager' : selectedRole}
                                                            </span>
                                                            <ChevronDown size={14} className={`text-fdvp-primary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                                                                        minWidth: '160px'
                                                                    }}
                                                                >
                                                                    {availableRoles.map(roleOption => (
                                                                        <button
                                                                            key={roleOption}
                                                                            onClick={() => {
                                                                                setSelectedRole(roleOption);
                                                                                setDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${selectedRole === roleOption
                                                                                ? 'bg-fdvp-primary/10 text-fdvp-primary font-bold'
                                                                                : 'text-fdvp-text hover:bg-fdvp-text/5 hover:text-fdvp-text-light'
                                                                                }`}
                                                                        >
                                                                            <span className="capitalize">
                                                                                {roleOption === 'manager' ? 'Manager' : roleOption}
                                                                            </span>
                                                                            {selectedRole === roleOption && <Check size={14} />}
                                                                        </button>
                                                                    ))}
                                                                    {!availableRoles.includes('user') && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedRole('user');
                                                                                setDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${selectedRole === 'user'
                                                                                ? 'bg-fdvp-primary/10 text-fdvp-primary font-bold'
                                                                                : 'text-fdvp-text hover:bg-fdvp-text/5 hover:text-fdvp-text-light'
                                                                                }`}
                                                                        >
                                                                            <span>User</span>
                                                                            {selectedRole === 'user' && <Check size={14} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </>,
                                                            document.body
                                                        )}
                                                    </div>
                                                ) : (
                                                    getRoleBadge(u.role || 'user')
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-sm text-fdvp-text">
                                                    <Briefcase size={14} className="text-fdvp-text/40" />
                                                    <span>{u.job || "—"}</span>
                                                </div>
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
                                                            {user?.uid !== u.id && canModifyRole(currentUserRole || '', u.role || 'user', 'user') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(u.id);
                                                                        setSelectedRole(u.role || 'user');
                                                                        setDropdownOpen(false);
                                                                    }}
                                                                    className="p-2.5 hover:bg-fdvp-primary/10 rounded-xl text-fdvp-text/40 hover:text-fdvp-primary transition-all"
                                                                    title="Edit Role"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}

                                                            {user?.uid !== u.id && canDeleteUser(currentUserRole || '', u.role || 'user') && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id, u.role || 'user')}
                                                                    className="p-2.5 hover:bg-red-500/10 rounded-xl text-fdvp-text/40 hover:text-red-400 transition-all"
                                                                    title="Delete User"
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
                            {filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(u => (
                                <div key={u.id} className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-2xl p-6 hover:bg-fdvp-text/10 transition-all duration-300 backdrop-blur-md shadow-lg">
                                    {/* Header with Avatar */}
                                    <div className="flex items-start gap-4 mb-5 pb-5 border-b border-fdvp-text/5">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fdvp-primary/20 to-fdvp-accent/20 flex items-center justify-center text-fdvp-text-light font-bold overflow-hidden border-2 border-fdvp-text/10">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl">{u.displayName?.substring(0, 1) || "U"}</span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-fdvp-bg"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-fdvp-text-light truncate">{u.displayName || "Unknown"}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Mail size={12} className="text-fdvp-text/40" />
                                                <p className="text-xs text-fdvp-text/60 truncate">{u.email}</p>
                                            </div>
                                            <div className="mt-2">{getRoleBadge(u.role || 'user')}</div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Briefcase size={16} className="text-fdvp-primary" />
                                            <span className="text-fdvp-text-light font-medium">Position:</span>
                                            <span className="text-fdvp-text">{u.job || "Not specified"}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-5 border-t border-fdvp-text/5">
                                        {editingId === u.id ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="flex-1">
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                                                            setDropdownOpen(!dropdownOpen);
                                                        }}
                                                        className="w-full bg-fdvp-card border border-fdvp-primary rounded-xl px-4 py-3 text-sm text-fdvp-text-light flex items-center justify-between"
                                                    >
                                                        <span className="capitalize font-medium">{selectedRole}</span>
                                                        <ChevronDown size={14} className={`text-fdvp-primary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                                                {user?.uid !== u.id && canModifyRole(currentUserRole || '', u.role || 'user', 'user') && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(u.id);
                                                            setSelectedRole(u.role || 'user');
                                                        }}
                                                        className="flex-1 px-4 py-3 bg-fdvp-primary/10 text-fdvp-primary rounded-xl hover:bg-fdvp-primary hover:text-white transition-all font-medium text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Edit size={16} />
                                                        Edit Role
                                                    </button>
                                                )}
                                                {user?.uid !== u.id && canDeleteUser(currentUserRole || '', u.role || 'user') && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.role || 'user')}
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

            {/* PAGINATION CONTROLS */}
            {!loading && filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-lg">
                    <div className="text-xs text-fdvp-text/50">
                        Showing <span className="font-bold text-fdvp-text-light">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-fdvp-text-light">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> of <span className="font-bold text-fdvp-text-light">{filteredUsers.length}</span> users
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-xs font-bold rounded-lg border border-fdvp-text/10 hover:bg-fdvp-text/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            PREVIOUS
                        </button>

                        {Array.from({ length: Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                            .slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), currentPage + 2))
                            .map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${currentPage === page
                                        ? 'bg-fdvp-primary text-white shadow-lg shadow-fdvp-primary/20'
                                        : 'border border-fdvp-text/10 hover:bg-fdvp-text/5'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
                            className="px-4 py-2 text-xs font-bold rounded-lg border border-fdvp-text/10 hover:bg-fdvp-text/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
