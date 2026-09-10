"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Wallet, Building2, DoorOpen, Users, CreditCard, CheckCircle2 } from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { useBuildings } from "@/context/BuildingContext";
import { useCustomers } from "@/context/CustomerContext";
import { getCustomersFromBuildings } from "@/lib/customerUtils";

const INCOME_TYPES = ["Rent", "Security", "Other"];

export default function AddIncomeModal({ onClose, onSave }) {
  const { buildings, payRent, updateRoom } = useBuildings();
  const { customers } = useCustomers();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    type: "Rent",
    amount: "",
    description: "",
    source: "",
    buildingId: "",
    unitId: "",
    deskId: "",
    customerId: "",
  });

  const [customType, setCustomType] = useState("");

  // ✅ Get selected building
  const selectedBuilding = useMemo(() => {
    if (!form.buildingId) return null;
    return buildings.find(
      (b) => String(b._id) === String(form.buildingId) || 
             String(b.id) === String(form.buildingId) || 
             b.id === Number(form.buildingId)
    );
  }, [form.buildingId, buildings]);

  // ✅ Get units of selected building
  const availableUnits = useMemo(() => {
    if (!selectedBuilding) return [];
    return selectedBuilding.rooms || [];
  }, [selectedBuilding]);

  // ✅ Get selected unit
  const selectedUnit = useMemo(() => {
    if (!form.unitId) return null;
    return availableUnits.find(
      (u) => String(u._id) === String(form.unitId) || 
             String(u.id) === String(form.unitId) || 
             u.id === Number(form.unitId)
    );
  }, [form.unitId, availableUnits]);

  // ✅ Get desks of selected unit
  const availableDesks = useMemo(() => {
    if (!selectedUnit) return [];
    return selectedUnit.desks || selectedUnit.workstations || [];
  }, [selectedUnit]);

  // ✅ Rent card preview
  const rentCard = useMemo(() => {
    if (!selectedUnit || form.type !== "Rent") return null;
    const tenant = selectedUnit.tenant;
    return {
      unitNo: selectedUnit.unitNo || selectedUnit.roomNo || "N/A",
      tenantName: tenant?.name || "No tenant assigned",
      monthlyRent: selectedUnit.monthlyRent || 0,
      security: selectedUnit.initialPayment?.securityReceived || selectedUnit.securityReceived || 0,
      status: selectedUnit.status,
    };
  }, [selectedUnit, form.type]);

  // ✅ Customer list for Security type (Active customers from buildings & customers collection)
  const customerList = useMemo(() => {
    if (form.type !== "Security") return [];

    const activeFromBuildings = getCustomersFromBuildings(buildings || []).map((c) => ({
      _id: c.id,
      id: c.id,
      name: c.name,
      phone: c.phone,
      cnic: c.cnic,
      buildingId: c.buildingId,
      buildingNo: c.buildingNo,
      buildingReference: c.buildingReference,
      unitId: c.unitId,
      unitNo: c.unitNo,
      unitType: c.unitType,
      monthlyRent: c.monthlyRent,
      security: c.security || 0,
      currentRental: {
        buildingId: c.buildingId,
        buildingNo: c.buildingNo,
        unitId: c.unitId,
        unitNo: c.unitNo,
        unitType: c.unitType,
        monthlyRent: c.monthlyRent,
        security: c.security || 0,
        status: "Active",
      },
    }));

    const standalone = (customers || []).filter(
      (c) => c.status === "Active" || c.currentRental?.status === "Active"
    );

    const merged = [...activeFromBuildings];
    standalone.forEach((sc) => {
      const exists = merged.some(
        (m) => String(m.id) === String(sc._id || sc.id) || (m.phone && m.phone === sc.phone)
      );
      if (!exists) {
        merged.push(sc);
      }
    });

    return merged;
  }, [buildings, customers, form.type]);

  // ✅ Selected customer for security
  const selectedCustomer = useMemo(() => {
    if (!form.customerId) return null;
    return customerList.find(
      (c) => String(c._id) === String(form.customerId) || 
             String(c.id) === String(form.customerId) || 
             c.id === Number(form.customerId)
    );
  }, [form.customerId, customerList]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleBuildingChange = (e) => {
    setForm(prev => ({ ...prev, buildingId: e.target.value, unitId: "", deskId: "" }));
  };

  const handleUnitChange = (e) => {
    setForm(prev => ({ ...prev, unitId: e.target.value, deskId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (form.type === "Rent" && !form.unitId) {
      setError("Please select a unit for rent payment.");
      return;
    }

    if (form.type === "Security" && !form.customerId) {
      setError("Please select a customer for security payment.");
      return;
    }

    if (form.type === "Other" && !customType.trim()) {
      setError("Please enter a custom category.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let incomeData = {
        type: "Income",
        transactionType: "Income",
        category: form.type === "Other" ? customType : form.type,
        description: form.description || form.category,
        amount: Number(form.amount),
        source: form.source || "N/A",
        status: "Received",
        createdAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        buildingId: form.buildingId || null,
        unitId: form.unitId || null,
        deskId: form.deskId || null,
      };

      // ✅ Rent Payment - Update unit and add to revenue
      if (form.type === "Rent" && selectedUnit) {
        const rentResult = await payRent(
          form.buildingId,
          form.unitId,
          1, // 1 month
          form.description || "Rent payment via revenue"
        );

        incomeData = {
          ...incomeData,
          unitNo: rentResult.unitNo || selectedUnit.unitNo,
          tenantName: rentResult.tenantName || selectedUnit.tenant?.name,
          rentPayment: rentResult,
        };
      }

      // ✅ Security Payment - Update customer's unit security and prepare revenue transaction
      if (form.type === "Security" && selectedCustomer) {
        const addedAmount = Number(form.amount);
        const bId = selectedCustomer.buildingId || selectedCustomer.currentRental?.buildingId;
        const uId = selectedCustomer.unitId || selectedCustomer.currentRental?.unitId;

        if (bId && uId && updateRoom) {
          const building = buildings.find(
            (b) => String(b._id) === String(bId) || String(b.id) === String(bId)
          );
          const room = building?.rooms?.find(
            (r) => String(r._id) === String(uId) || String(r.id) === String(uId)
          );

          if (room) {
            const currentSec = Number(room.initialPayment?.securityReceived || 0);
            const updatedSec = currentSec + addedAmount;
            const now = new Date().toISOString();

            const updatedRoomData = {
              ...room,
              skipRevenueSync: true, // Caller records in revenue ledger via onSave
              initialPayment: {
                ...(room.initialPayment || {}),
                securityReceived: updatedSec,
                securityStatus: "Held",
              },
              securityHistory: [
                ...(room.securityHistory || []),
                {
                  type: "received",
                  amount: addedAmount,
                  date: now,
                  note: form.description || "Additional security deposit received",
                },
              ],
              transactionHistory: [
                ...(room.transactionHistory || []),
                {
                  id: `sec-${Date.now()}`,
                  type: "Security",
                  category: "Security Deposit",
                  amount: addedAmount,
                  description: form.description || `Security received from ${selectedCustomer.name} - Unit ${room.unitNo}`,
                  status: "Received",
                  receivedAt: now,
                },
              ],
            };

            const roomFormData = new FormData();
            roomFormData.append("roomData", JSON.stringify(updatedRoomData));
            await updateRoom(bId, uId, roomFormData);
          }
        }

        incomeData = {
          ...incomeData,
          type: "Security",
          category: "Security",
          amount: addedAmount,
          customerId: selectedCustomer._id || selectedCustomer.id,
          customerName: selectedCustomer.name,
          tenantName: selectedCustomer.name,
          unitNo: selectedCustomer.unitNo || selectedCustomer.currentRental?.unitNo || "",
          buildingId: bId || null,
          unitId: uId || null,
          description: form.description || `Security received from ${selectedCustomer.name}${selectedCustomer.unitNo ? ` - Unit ${selectedCustomer.unitNo}` : ""}`,
          status: "Held",
          source: form.source || "Security",
          remarks: form.description || "Security deposit received",
          securityPayment: {
            customerId: selectedCustomer._id || selectedCustomer.id,
            customerName: selectedCustomer.name,
            amount: addedAmount,
            remarks: form.description || "Security payment",
          },
        };
      }

      await onSave(incomeData);
      setSuccess("Income added successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Failed to add income:", error);
      setError(error.response?.data?.message || error.message || "Failed to add income.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Add Income</h2>
                <p className="text-xs text-muted-foreground">Record received payment</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Income Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">Income Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                {INCOME_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Custom Type */}
            {form.type === "Other" && (
              <div>
                <label className="mb-2 block text-sm font-medium">Custom Category *</label>
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g., Commission"
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}

            {/* Building/Unit/Desk for Rent */}
            {form.type === "Rent" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">Building</label>
                  <div className="relative">
                    <Building2 size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={form.buildingId}
                      onChange={handleBuildingChange}
                      className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 appearance-none"
                    >
                      <option value="">Select Building</option>
                      {buildings.map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.buildingNo || b.name} {b.reference ? `- ${b.reference}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedBuilding && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Unit</label>
                    <div className="relative">
                      <DoorOpen size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={form.unitId}
                        onChange={handleUnitChange}
                        className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 appearance-none"
                      >
                        <option value="">Select Unit</option>
                        {availableUnits.map((u) => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.unitNo || u.roomNo} - {u.type} {u.status === "Rented" ? "(Rented)" : "(Available)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Desk Selection */}
                {selectedUnit && availableDesks.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Desk</label>
                    <div className="relative">
                      <CreditCard size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={form.deskId}
                        onChange={(e) => setForm(prev => ({ ...prev, deskId: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 appearance-none"
                      >
                        <option value="">Select Desk</option>
                        {availableDesks.map((d) => (
                          <option key={d._id || d.id} value={d._id || d.id}>
                            Desk {d.deskNo || d.id} {d.status === "Occupied" ? "(Occupied)" : "(Available)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Rent Card Preview */}
                {rentCard && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs text-muted-foreground">Rent Payment Details</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit</span>
                        <span>{rentCard.unitNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenant</span>
                        <span>{rentCard.tenantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="text-emerald-400">Rs. {Number(rentCard.monthlyRent).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={rentCard.status === "Rented" ? "text-emerald-400" : "text-amber-400"}>{rentCard.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Customer Selection for Security */}
            {form.type === "Security" && (
              <div>
                <label className="mb-2 block text-sm font-medium">Select Customer</label>
                <div className="relative">
                  <Users size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select Customer</option>
                    {customerList.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name} - {c.phone} {c.unitNo ? `(${c.buildingNo ? `${c.buildingNo} - ` : ''}Unit ${c.unitNo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCustomer && (
                  <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-xs text-muted-foreground">Customer Details</p>
                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">Phone: {selectedCustomer.phone}</p>
                    {(selectedCustomer.unitNo || selectedCustomer.currentRental?.unitNo) && (
                      <p className="text-xs text-muted-foreground">
                        Unit: {selectedCustomer.unitNo || selectedCustomer.currentRental?.unitNo} {selectedCustomer.buildingNo ? `(${selectedCustomer.buildingNo})` : ''}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-amber-400 font-medium">
                      Current Security Held: Rs. {(selectedCustomer.security || selectedCustomer.currentRental?.security || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium">Amount (Rs.) *</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium">Description / Remarks</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Source */}
            <div>
              <label className="mb-2 block text-sm font-medium">Source</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Customer/Unit"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                <Plus size={17} />
                {loading ? "Adding..." : "Add Income"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}