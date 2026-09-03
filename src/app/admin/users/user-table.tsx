"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthorAvatar } from "@/components/author-avatar";
import {
  adminToggleUserRole,
  adminRevokeUserSessions,
  AdminActionResult,
} from "@/app/admin/actions";
import {
  banUser,
  unbanUser,
  adminUpdateUser,
} from "@/app/users/[username]/actions";
import {
  Search,
  Ban,
  ShieldCheck,
  Award,
  Star,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export interface UserRow {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  image: string | null;
  titles: string[];
  score: number;
  role: string;
  banned: boolean;
  bannedReason: string | null;
  createdAt: string;
  _count: {
    guides: number;
    diagnostics: number;
    deviceSessions: number;
  };
}

export function UserTable({
  users,
  availableTitles,
  currentAdminId,
}: {
  users: UserRow[];
  availableTitles: { id: string; name: string }[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");

  const [activeModalUser, setActiveModalUser] = useState<UserRow | null>(null);
  const [modalType, setModalType] = useState<"edit" | "ban" | null>(null);

  const [banReason, setBanReason] = useState("");
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [scoreInput, setScoreInput] = useState(0);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !u.banned) ||
      (statusFilter === "banned" && u.banned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleRole = async (targetId: string) => {
    setActionError(null);
    setLoadingId(targetId);
    const res: AdminActionResult = await adminToggleUserRole(targetId);
    setLoadingId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  };

  const handleUnban = async (targetId: string) => {
    setActionError(null);
    setLoadingId(targetId);
    const res = await unbanUser(targetId);
    setLoadingId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  };

  const handleRevokeSessions = async (targetId: string) => {
    setActionError(null);
    setLoadingId(targetId);
    const res = await adminRevokeUserSessions(targetId);
    setLoadingId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  };

  const openEditModal = (user: UserRow) => {
    setActiveModalUser(user);
    setSelectedTitles([...user.titles]);
    setScoreInput(user.score);
    setCustomTitleInput("");
    setModalType("edit");
    setActionError(null);
  };

  const openBanModal = (user: UserRow) => {
    setActiveModalUser(user);
    setBanReason("");
    setModalType("ban");
    setActionError(null);
  };

  const submitBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalUser) return;
    setLoadingId(activeModalUser.id);
    setActionError(null);
    const res = await banUser(activeModalUser.id, banReason);
    setLoadingId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else {
      setModalType(null);
      setActiveModalUser(null);
      router.refresh();
    }
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalUser) return;
    setLoadingId(activeModalUser.id);
    setActionError(null);

    const formData = new FormData();
    formData.set("titles", JSON.stringify(selectedTitles));
    formData.set("score", String(scoreInput));

    const res = await adminUpdateUser(activeModalUser.id, formData);
    setLoadingId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else {
      setModalType(null);
      setActiveModalUser(null);
      router.refresh();
    }
  };

  const toggleTitleSelection = (titleName: string) => {
    if (selectedTitles.includes(titleName)) {
      setSelectedTitles(selectedTitles.filter((t) => t !== titleName));
    } else {
      if (selectedTitles.length >= 5) return;
      setSelectedTitles([...selectedTitles, titleName]);
    }
  };

  const addCustomTitle = () => {
    const clean = customTitleInput.trim();
    if (!clean) return;
    if (selectedTitles.includes(clean)) return;
    if (selectedTitles.length >= 5) return;
    setSelectedTitles([...selectedTitles, clean]);
    setCustomTitleInput("");
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, @username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 focus:border-zinc-950 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "banned")}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 focus:border-zinc-950 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Titles</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <AuthorAvatar
                          author={{ name: u.name, username: u.username, avatarUrl: u.avatarUrl, image: u.image }}
                          size="md"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-zinc-950 truncate">{u.name || u.username || "User"}</p>
                          <p className="font-mono text-[11px] text-zinc-400 truncate">@{u.username || "no-username"} · {u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Titles */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {u.titles && u.titles.length > 0 ? (
                          u.titles.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-700"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">No titles</span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-4 font-mono font-bold text-zinc-900">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {u.score}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 text-white px-2.5 py-0.5 text-[10px] font-bold">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-0.5 text-[10px] font-medium">
                          User
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {u.banned ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold">
                            <Ban className="h-3 w-3" /> Banned
                          </span>
                          {u.bannedReason && (
                            <p className="mt-1 text-[10px] text-zinc-400 max-w-[140px] truncate" title={u.bannedReason}>
                              {u.bannedReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {/* Edit Title & Score */}
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 transition-colors"
                          title="Manage Titles & Score"
                        >
                          <Award className="h-3.5 w-3.5" />
                        </button>

                        {/* Force Logout Sessions */}
                        <button
                          type="button"
                          disabled={loadingId === u.id}
                          onClick={() => handleRevokeSessions(u.id)}
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 transition-colors disabled:opacity-50"
                          title="Revoke All Sessions (Force Logout)"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle Role */}
                        {u.id !== currentAdminId && (
                          <button
                            type="button"
                            disabled={loadingId === u.id}
                            onClick={() => handleToggleRole(u.id)}
                            className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors disabled:opacity-50"
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Ban / Unban */}
                        {u.id !== currentAdminId && u.role !== "admin" && (
                          u.banned ? (
                            <button
                              type="button"
                              disabled={loadingId === u.id}
                              onClick={() => handleUnban(u.id)}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openBanModal(u)}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                              title="Ban User"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Title & Score */}
      {modalType === "edit" && activeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-950">Edit Titles & Score</h3>
                <p className="text-xs text-zinc-500">
                  {activeModalUser.name || activeModalUser.username} (@{activeModalUser.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitEditUser} className="space-y-4">
              {/* Selected Titles */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Assigned Titles (Max 5)
                </label>
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 min-h-[48px]">
                  {selectedTitles.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-950 text-white px-2.5 py-1 text-xs font-semibold"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => toggleTitleSelection(t)}
                        className="hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedTitles.length === 0 && (
                    <span className="text-xs text-zinc-400 self-center">Select from master titles below...</span>
                  )}
                </div>
              </div>

              {/* Master Title Chips */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Catalog Titles
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-zinc-100 rounded-xl">
                  {availableTitles.map((t) => {
                    const isSelected = selectedTitles.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTitleSelection(t.name)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-zinc-950 text-white font-bold"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {t.name} {isSelected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Title Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Or Add Custom Title
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Master Diagnostic Specialist"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomTitle}
                    className="rounded-xl bg-zinc-100 border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Score Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Contribution Score
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-mono font-bold focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === activeModalUser.id}
                  className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loadingId === activeModalUser.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ban User */}
      {modalType === "ban" && activeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                  <Ban className="h-4 w-4" /> Ban Account
                </h3>
                <p className="text-xs text-zinc-500">
                  {activeModalUser.name || activeModalUser.username} (@{activeModalUser.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitBan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                  Reason for Ban
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe policy violation..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-3 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === activeModalUser.id}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingId === activeModalUser.id ? "Processing..." : "Ban Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
