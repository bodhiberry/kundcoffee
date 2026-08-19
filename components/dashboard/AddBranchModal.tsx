"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBranchModal({ isOpen, onClose }: AddBranchModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("NPR");
  const [copyMenu, setCopyMenu] = useState(true);
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a branch name");
      return;
    }

    if (managerEmail && !managerPassword) {
      toast.error("Please provide a password for the branch manager login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/add-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          currency,
          copyMenu,
          managerName,
          managerEmail,
          managerPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Branch created successfully!");
        onClose();
        // Reload dashboard to apply the newly switched branch context
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to create branch");
      }
    } catch (error) {
      console.error("Create branch error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Branch" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Branch / Store Name *"
          placeholder="e.g. Uptown Branch, Lake Side Store"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Location (Optional)"
          placeholder="e.g. Kathmandu, Nepal"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-1">
          <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
            Currency Code *
          </label>
          <select
            required
            className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11 px-3"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={loading}
          >
            <option value="NPR">NPR (Rs.)</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Initial Menu Duplication Option */}
        <div className="pt-2">
          <label
            onClick={() => setCopyMenu(!copyMenu)}
            className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/70 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={copyMenu}
              onChange={(e) => setCopyMenu(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900">
                Copy Menu & Dishes to New Branch
              </span>
              <span className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                Copies all categories, dishes, prices, and add-ons from your main branch so they are ready on day one. You can customize, add, or delete items later.
              </span>
            </div>
          </label>
        </div>

        {/* Optional Branch Manager Login Setup */}
        <div className="pt-3 border-t border-zinc-100 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider block">
              Branch Login Account (Optional)
            </span>
            <span className="text-[11px] text-zinc-400">
              Create a dedicated username/password for this branch.
            </span>
          </div>

          <Input
            label="Manager / Staff Name"
            placeholder="e.g. Branch Manager"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Email / Username (For Login)"
            type="email"
            placeholder="e.g. branch2@restaurant.com"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create password"
            value={managerPassword}
            onChange={(e) => setManagerPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-2xl h-11 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 font-bold"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-2xl h-11 bg-zinc-900 hover:bg-zinc-800 border-none text-white font-bold flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Branch
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
