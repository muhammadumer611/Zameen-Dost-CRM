"use client";

import { useState } from "react";
import { useUsers } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AddUserModal from "@/components/users/AddUserModal";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Trash2,
  Edit,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";

export default function UsersPage() {
  const { users, deleteUser, updateUser, addUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: "bg-purple-500/10 text-purple-400",
      admin: "bg-indigo-500/10 text-indigo-400",
      lead_manager: "bg-emerald-500/10 text-emerald-400",
      moderator: "bg-amber-500/10 text-amber-400",
      employee: "bg-blue-500/10 text-blue-400",
    };
    return colors[role] || colors.employee;
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-400">Administration</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Users
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage user accounts and roles.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
          >
            <UserPlus size={17} />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user._id === currentUser?._id;

                  return (
                    <tr
                      key={user._id}
                      className="border-b border-border/70 transition hover:bg-muted"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${user.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                            }`}
                        >
                          {user.status === "active" ? (
                            <UserCheck size={12} />
                          ) : (
                            <UserX size={12} />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {user.employeeName || user.employeeId || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="View"
                          >
                            <Eye size={17} />
                          </button>
                          {!isCurrentUser && (
                            <>
                              <button
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                title="Edit"
                              >
                                <Edit size={17} />
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <Users size={32} className="mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={addUser}
        />
      )}
    </ProtectedRoute>
  );
}