"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { settingsAPI } from "@/lib/api";
import { useTheme } from "next-themes";
import {
  Settings,
  Save,
  RefreshCw,
  Building2,
  Users,
  Wallet,
  Bell,
  Shield,
  FileText,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [settings, setSettings] = useState({
    general: {
      companyName: "Zameen Dost Marketing",
      companyPhone: "",
      companyEmail: "",
      companyAddress: "",
      currency: "Rs.",
      dateFormat: "DD/MM/YYYY",
      timeZone: "Asia/Karachi",
      theme: "system",
    },
    employee: {
      defaultLeaveDeduction: 500,
      defaultLateDeduction: 10,
      defaultTaskFailureDeduction: 1000,
      graceMinutes: 30,
      monthlyPaidLeaves: 1,
      weeklyOffDay: "Friday",
      attendanceRequired: true,
      defaultCheckIn: "09:00",
      defaultCheckOut: "17:00",
    },
    building: {
      defaultUnitType: "Room",
      defaultUnitStatus: "Available",
      roomNumberPrefix: "",
      enableMaintenanceMode: false,
    },
    revenue: {
      defaultRentDueDate: 5,
      lateRentPenalty: 100,
      securityMonths: 2,
      includeSecurities: false,
      enableAutoCalc: true,
    },
    notification: {
      emailEnabled: true,
      rentReminderDays: 3,
      salaryReminderDays: 5,
      leadFollowUpDays: 7,
      maintenanceAlert: true,
    },
    leads: {
      defaultStatus: "New",
      followUpDays: 7,
      autoAssign: false,
    },
  });

  // ✅ Fetch settings from backend
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await settingsAPI.get();
      if (response.data && response.data.data) {
        const fetched = response.data.data;
        setSettings(prev => ({
          ...prev,
          ...fetched,
          general: { ...prev.general, ...fetched.general },
          employee: { ...prev.employee, ...fetched.employee },
          building: { ...prev.building, ...fetched.building },
          revenue: { ...prev.revenue, ...fetched.revenue },
          notification: { ...prev.notification, ...fetched.notification },
          leads: { ...prev.leads, ...fetched.leads },
        }));

        if (fetched.general?.theme) {
          setTheme(fetched.general.theme);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err?.response?.data?.message || "Failed to load settings from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleChange("general", "theme", newTheme);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await settingsAPI.update(settings);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        setSettings(prev => ({
          ...prev,
          ...updated,
        }));
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all settings to default values?")) return;

    try {
      setSaving(true);
      setError("");
      await settingsAPI.reset();
      await fetchSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to reset settings:", err);
      setError(err?.response?.data?.message || "Failed to reset settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading system settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: "all", label: "All Settings" },
    { id: "general", label: "General & Theme" },
    { id: "employee", label: "Employee & Deductions" },
    { id: "building", label: "Buildings & Units" },
    { id: "revenue", label: "Revenue & Finance" },
    { id: "notification", label: "Notifications & Leads" },
  ];

  const currentTheme = settings.general?.theme || theme || "system";

  return (
    <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                Administration
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              System Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure system-wide defaults, deductions, theme, building parameters, and financial rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={16} className={saving ? "animate-spin" : ""} />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>Settings updated and saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400 animate-in fade-in duration-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* SECTION 1: General & Theme */}
          {(activeTab === "all" || activeTab === "general") && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">General & Theme</h2>
                  <p className="text-xs text-muted-foreground">Application branding and display mode</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Theme Selector */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Default Interface Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Laptop },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = currentTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleThemeChange(item.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500"
                              : "border-border bg-input/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
                          }`}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                          {isSelected && <Check size={12} className="text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.general?.companyName || ""}
                    onChange={(e) => handleChange("general", "companyName", e.target.value)}
                    placeholder="e.g. Zameen Dost Marketing"
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={settings.general?.currency || "Rs."}
                      onChange={(e) => handleChange("general", "currency", e.target.value)}
                      placeholder="Rs. / $"
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Date Format
                    </label>
                    <select
                      value={settings.general?.dateFormat || "DD/MM/YYYY"}
                      onChange={(e) => handleChange("general", "dateFormat", e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    value={settings.general?.companyPhone || ""}
                    onChange={(e) => handleChange("general", "companyPhone", e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={settings.general?.companyEmail || ""}
                    onChange={(e) => handleChange("general", "companyEmail", e.target.value)}
                    placeholder="info@zameendost.com"
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Company Address
                  </label>
                  <input
                    type="text"
                    value={settings.general?.companyAddress || ""}
                    onChange={(e) => handleChange("general", "companyAddress", e.target.value)}
                    placeholder="Main Boulevard, Lahore"
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Employee & Deductions Defaults */}
          {(activeTab === "all" || activeTab === "employee") && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Employee & Deductions</h2>
                  <p className="text-xs text-muted-foreground">Default deduction rates and shifts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Leave Deduction (Rs./day)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.employee?.defaultLeaveDeduction ?? 500}
                      onChange={(e) => handleChange("employee", "defaultLeaveDeduction", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Late Deduction (Rs./min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.employee?.defaultLateDeduction ?? 10}
                      onChange={(e) => handleChange("employee", "defaultLateDeduction", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Task Failure (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.employee?.defaultTaskFailureDeduction ?? 1000}
                      onChange={(e) => handleChange("employee", "defaultTaskFailureDeduction", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Grace Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.employee?.graceMinutes ?? 30}
                      onChange={(e) => handleChange("employee", "graceMinutes", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Monthly Paid Leaves
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.employee?.monthlyPaidLeaves ?? 1}
                      onChange={(e) => handleChange("employee", "monthlyPaidLeaves", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Weekly Off Day
                    </label>
                    <select
                      value={settings.employee?.weeklyOffDay || "Friday"}
                      onChange={(e) => handleChange("employee", "weeklyOffDay", e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    >
                      <option value="Friday">Friday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Monday">Monday</option>
                      <option value="Thursday">Thursday</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Default Check-In
                    </label>
                    <input
                      type="time"
                      value={settings.employee?.defaultCheckIn || "09:00"}
                      onChange={(e) => handleChange("employee", "defaultCheckIn", e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Default Check-Out
                    </label>
                    <input
                      type="time"
                      value={settings.employee?.defaultCheckOut || "17:00"}
                      onChange={(e) => handleChange("employee", "defaultCheckOut", e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Attendance Enforcement</p>
                    <p className="text-[11px] text-muted-foreground">Mandatory daily punch-in requirement</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.employee?.attendanceRequired}
                      onChange={(e) => handleChange("employee", "attendanceRequired", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Buildings & Units Defaults */}
          {(activeTab === "all" || activeTab === "building") && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Buildings & Units</h2>
                  <p className="text-xs text-muted-foreground">Default unit types, states and prefixes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Default Unit Type
                  </label>
                  <select
                    value={settings.building?.defaultUnitType || "Room"}
                    onChange={(e) => handleChange("building", "defaultUnitType", e.target.value)}
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  >
                    <option value="Room">Room</option>
                    <option value="Hall">Hall</option>
                    <option value="Office">Office</option>
                    <option value="Shop">Shop</option>
                    <option value="Desk">Desk</option>
                    <option value="Flat">Flat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Default Initial Unit Status
                  </label>
                  <select
                    value={settings.building?.defaultUnitStatus || "Available"}
                    onChange={(e) => handleChange("building", "defaultUnitStatus", e.target.value)}
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Room / Unit Number Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.building?.roomNumberPrefix || ""}
                    onChange={(e) => handleChange("building", "roomNumberPrefix", e.target.value)}
                    placeholder="e.g. U- or R-"
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Optional prefix auto-prepended to newly generated units.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Global Maintenance Mode</p>
                    <p className="text-[11px] text-muted-foreground">Mark all vacant units into maintenance</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.building?.enableMaintenanceMode}
                      onChange={(e) => handleChange("building", "enableMaintenanceMode", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Revenue & Finance Defaults */}
          {(activeTab === "all" || activeTab === "revenue") && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Revenue & Finance</h2>
                  <p className="text-xs text-muted-foreground">Rent cycles, penalties, and security rules</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Monthly Rent Due Date
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={settings.revenue?.defaultRentDueDate ?? 5}
                      onChange={(e) => handleChange("revenue", "defaultRentDueDate", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">Day of month (1-31)</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Late Rent Penalty (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.revenue?.lateRentPenalty ?? 100}
                      onChange={(e) => handleChange("revenue", "lateRentPenalty", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">Charge after due date</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Default Security Deposit Months
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={settings.revenue?.securityMonths ?? 2}
                    onChange={(e) => handleChange("revenue", "securityMonths", Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Multiplier for calculating recommended advance security deposit.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Include Securities in Revenue</p>
                    <p className="text-[11px] text-muted-foreground">Count held deposits as total income</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.revenue?.includeSecurities}
                      onChange={(e) => handleChange("revenue", "includeSecurities", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Automatic Calculations</p>
                    <p className="text-[11px] text-muted-foreground">Auto recalculate balances on payment</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.revenue?.enableAutoCalc}
                      onChange={(e) => handleChange("revenue", "enableAutoCalc", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Notifications & Leads */}
          {(activeTab === "all" || activeTab === "notification") && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Notifications & Leads</h2>
                  <p className="text-xs text-muted-foreground">Automated alert days and lead follow-up</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Rent Reminder (Days Before)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.notification?.rentReminderDays ?? 3}
                      onChange={(e) => handleChange("notification", "rentReminderDays", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Salary Reminder (Days Before)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.notification?.salaryReminderDays ?? 5}
                      onChange={(e) => handleChange("notification", "salaryReminderDays", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Lead Follow-Up Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.leads?.followUpDays ?? 7}
                      onChange={(e) => handleChange("leads", "followUpDays", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Default Lead Status
                    </label>
                    <select
                      value={settings.leads?.defaultStatus || "New"}
                      onChange={(e) => handleChange("leads", "defaultStatus", e.target.value)}
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-indigo-500"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Allow system email dispatch</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.notification?.emailEnabled}
                      onChange={(e) => handleChange("notification", "emailEnabled", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Maintenance Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Notify managers on new tickets</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.notification?.maintenanceAlert}
                      onChange={(e) => handleChange("notification", "maintenanceAlert", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-input/20 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Auto Assign Leads</p>
                    <p className="text-[11px] text-muted-foreground">Distribute incoming leads round-robin</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!settings.leads?.autoAssign}
                      onChange={(e) => handleChange("leads", "autoAssign", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}