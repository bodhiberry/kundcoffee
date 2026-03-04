"use client";

import { useEffect, useState } from "react";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  UserPlus,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  User,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Link from "next/link";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/staff-roles"),
      ]);
      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();

      if (staffData.success) setStaff(staffData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (error) {
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentStaffId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      roleId: "",
      isActive: true,
    });
    setImageFile(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (s: any) => {
    setIsEditing(true);
    setCurrentStaffId(s.id);
    setFormData({
      name: s.name,
      email: s.email || "",
      phone: s.phone || "",
      roleId: s.roleId || "",
      isActive: s.isActive,
    });
    setImageFile(s.image || null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    try {
      let imageUrl = typeof imageFile === "string" ? imageFile : "";

      if (imageFile instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("folder", "staff");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) imageUrl = uploadData.url;
      }

      const payload = { ...formData, image: imageUrl };
      const url = isEditing ? `/api/staff/${currentStaffId}` : "/api/staff";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Staff updated" : "Staff added");
        setIsAddModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Staff member removed");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete staff");
    }
  };

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <PageHeaderAction
        title="Team Directory"
        description="Manage your staff members, roles, and system access."
        onSearch={() => {}}
        actionButton={
          <Button
            onClick={handleOpenAddModal}
            className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200"
          >
            <UserPlus size={18} className="mr-2" /> Add Staff Member
          </Button>
        }
      />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-zinc-50 border border-zinc-100 rounded-3xl animate-pulse"
            />
          ))
        ) : staff.length > 0 ? (
          staff.map((s) => (
            <div
              key={s.id}
              className="group relative bg-white border border-zinc-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={28} className="text-zinc-300" />
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-4 border-white flex items-center justify-center ${s.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                  >
                    {s.isActive ? (
                      <CheckCircle2 size={10} className="text-white" />
                    ) : (
                      <XCircle size={10} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Link
                    href={`/dashboard/staff/${s.id}`}
                    className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <History size={16} />
                  </Link>
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  {s.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-800 bg-red-50 px-2 py-0.5 rounded-md">
                    {s.roleRef?.name || s.role || "Staff"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-50 space-y-3">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Mail size={14} />
                  <span className="text-xs font-medium">
                    {s.email || "No email"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <Phone size={14} />
                  <span className="text-xs font-medium">
                    {s.phone || "No phone"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
            <User size={48} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
              No staff members found
            </h3>
            <Button
              onClick={handleOpenAddModal}
              variant="secondary"
              className="mt-4"
            >
              Add your first member
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isEditing ? "Edit Profile" : "New Team Member"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col items-center mb-8">
            <ImageUpload
              label="Profile Photo"
              value={typeof imageFile === "string" ? imageFile : undefined}
              onChange={setImageFile}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Full Name *
              </label>
              <input
                type="text"
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Staff Role
              </label>
              <select
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold appearance-none"
                value={formData.roleId}
                onChange={(e) =>
                  setFormData({ ...formData, roleId: e.target.value })
                }
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <input
                type="text"
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none transition-all font-semibold"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isActive: !formData.isActive })
              }
              className={`w-10 h-5 rounded-full transition-all relative ${formData.isActive ? "bg-emerald-500" : "bg-zinc-300"}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isActive ? "left-6" : "left-1"}`}
              />
            </button>
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
              {formData.isActive ? "Active Member" : "Memeber Inactive"}
            </span>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-zinc-200 mt-4"
          >
            {isEditing ? "Save Profile Changes" : "Confirm Staff Addition"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
