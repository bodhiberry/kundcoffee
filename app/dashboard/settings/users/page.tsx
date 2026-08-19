"use client";

import { useEffect, useState } from "react";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CustomTable } from "@/components/ui/CustomTable";
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Lock,
  User as UserIcon 
} from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS } from "@/lib/rbac";

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
    storeId: "",
    permissions: [] as string[],
  });

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/user/stores");
      const data = await res.json();
      if (data.success && data.data?.stores) {
        setStores(data.data.stores);
        if (!formData.storeId && data.data.activeStoreId) {
          setFormData((prev) => ({ ...prev, storeId: data.data.activeStoreId }));
        }
      }
    } catch (error) {
      console.error("Failed to load stores", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url =
        selectedBranchFilter === "ALL"
          ? "/api/users"
          : `/api/users?branchId=${selectedBranchFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedBranchFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
      storeId: stores.length > 0 ? stores[0].id : "",
      permissions: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setIsEditing(true);
    setCurrentUserId(user.id);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "", // Don't show password
      role: user.role,
      storeId: user.storeId || (stores.length > 0 ? stores[0].id : ""),
      permissions: user.permissions || [],
    });
    setIsModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing ? `/api/users/${currentUserId}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";
      
      // Remove empty password on edit
      const payload = { ...formData };
      if (isEditing && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "User updated" : "User created");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const columns = [
    {
      header: "User",
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
            <UserIcon size={14} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900">{row.name || "Unnamed"}</span>
            <span className="text-[10px] text-zinc-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Branch",
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
          {row.store?.name || "Main Branch"}
        </span>
      ),
    },
    {
      header: "Role",
      accessor: (row: any) => (
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
          {row.role}
        </span>
      ),
    },
    {
      header: "Permissions",
      accessor: (row: any) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.permissions && row.permissions.length > 0 ? (
            row.permissions.map((p: string) => (
              <span key={p} className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                {p}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-zinc-400 italic">No special permissions</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.isSetupComplete ? (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={12} />
              <span className="text-[10px] font-bold">Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400">
              <XCircle size={12} />
              <span className="text-[10px] font-bold">Pending</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-300 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      align: "right" as const,
    },
  ];

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <PageHeaderAction
        title="System Access"
        description="Manage branch usernames, passwords, and permissions across all branches."
        onSearch={() => {}}
        actionButton={
          <Button
            onClick={handleOpenAddModal}
            className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200"
          >
            <UserPlus size={18} className="mr-2" /> Create User
          </Button>
        }
      />

      {/* Branch Filter Tabs if multiple stores exist */}
      {stores.length > 1 && (
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedBranchFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBranchFilter === "ALL"
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            All Branches ({users.length})
          </button>
          {stores.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedBranchFilter(s.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedBranchFilter === s.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CustomTable columns={columns} data={users} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit User & Password" : "Create New User / Branch Manager"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe, Branch Manager"
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Username / Email Address
              </label>
              <input
                type="email"
                disabled={isEditing}
                placeholder="e.g. branch2@restaurant.com"
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold disabled:opacity-50"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Password {isEditing && "(Leave blank to keep current)"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                  className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isEditing}
                />
                <Lock size={16} className="absolute right-4 top-4 text-zinc-300" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Assigned Branch
              </label>
              <select
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                System Role
              </label>
              <select
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="ADMIN">ADMIN (Full Access across branches)</option>
                <option value="MANAGER">MANAGER (Branch Level Manager)</option>
                <option value="CASHIER">CASHIER (POS & Orders only)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">
                Granular Permissions
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(PERMISSIONS).map(([key, value]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePermission(value)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    formData.permissions.includes(value)
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {key.replace(/_/g, " ")}
                  </span>
                  {formData.permissions.includes(value) && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-zinc-200 mt-4"
          >
            {isEditing ? "Update User Permissions" : "Confirm User Creation"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
