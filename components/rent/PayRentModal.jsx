"use client";

import { useMemo, useState, useEffect } from "react";
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { useBuildings } from "@/context/BuildingContext";
import { useRevenue } from "@/context/RevenueContext";

export default function PayRentModal({
  buildingId,
  room,
  onClose,
}) {
  const { payRent } = useBuildings();
  let addIncome;
  try {
    const revenue = useRevenue();
    addIncome = revenue.addIncome;
  } catch (error) {
    addIncome = (data) => console.log("Income would be added:", data);
    console.warn("RevenueProvider not available. Revenue won't be tracked.");
  }

  const [months, setMonths] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");

  const monthlyRent = Number(room?.monthlyRent || 0);
  
  // ✅ Calculate total based on custom amount or months
  const calculatedAmount = useMemo(() => {
    if (useCustomAmount && customAmount) {
      return Number(customAmount);
    }
    return monthlyRent * Number(months || 0);
  }, [monthlyRent, months, customAmount, useCustomAmount]);

  // ✅ Calculate how many months this payment covers
  const paymentMonths = useMemo(() => {
    if (useCustomAmount && customAmount) {
      return Math.floor(Number(customAmount) / monthlyRent);
    }
    return Number(months || 0);
  }, [monthlyRent, customAmount, months, useCustomAmount]);




  // ✅ Calculate pending months and due amount
const getPendingAmount = useMemo(() => {
  if (!room?.rentStartDate) {
    return { months: 0, amount: 0 };
  }

  const rentHistory = room.rentHistory || [];
  const paidMonths = rentHistory.filter((item) => item.status === "Paid").length;

  const startDate = new Date(room.rentStartDate);
  const today = new Date();

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthsPassed =
    (currentYear - startYear) * 12 +
    (currentMonth - startMonth) +
    1;

  const pendingMonths = Math.max(monthsPassed - paidMonths, 0);
  const pendingAmount = pendingMonths * monthlyRent;

  return { months: pendingMonths, amount: pendingAmount };
}, [room, monthlyRent]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close on outside click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (calculatedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!remarks.trim()) {
      setError("Please add remarks for this payment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const now = new Date().toISOString();
      const transactionId = `rent-${Date.now()}`;

      // ✅ Pay rent with calculated months
      const roomId = room._id || room.id;

      const result = await payRent(
        buildingId,
        roomId,
        paymentMonths || 1,
        remarks.trim()
      );

      // ✅ Add income to revenue with advance payment note
      const paymentDescription = useCustomAmount 
        ? `Advance payment of ${paymentMonths} months - Rs. ${calculatedAmount.toLocaleString()}`
        : `Rent payment for ${months} month(s)`;

      await addIncome({
        id: transactionId,
        type: "Rent",
        category: "Monthly Rent",
        description: `${paymentDescription} from ${room?.tenant?.name} - Unit ${room?.unitNo}`,
        amount: calculatedAmount,
        source: "Rent",
        buildingId: buildingId,
        unitId: room.id,
        unitNo: room?.unitNo,
        tenantName: room?.tenant?.name,
        months: paymentMonths || 1,
        remarks: remarks.trim(),
        status: "Received",
        receivedAt: now,
        createdAt: now,
      });

      console.log("Rent paid:", {
        id: transactionId,
        buildingId,
        unitId: room.id,
        unitNo: room?.unitNo,
        tenantName: room?.tenant?.name,
        amount: calculatedAmount,
        months: paymentMonths || 1,
        isAdvance: useCustomAmount,
        remarks: remarks.trim(),
        paidAt: now,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message || "Unable to process rent payment.");
      console.error("Pay rent error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Pay Rent</h2>
                <p className="text-xs text-muted-foreground">
                  {room.unitNo} • {room.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            {/* Customer */}
            <div className="rounded-xl border border-border bg-input/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="mt-1 font-medium">{room.tenant?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{room.tenant?.phone || "No phone"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Building</p>
                  <p className="mt-1 text-sm font-medium text-foreground">Building #{buildingId}</p>
                </div>
              </div>
            </div>

            {/* Unit Info */}
            <div className="rounded-xl border border-border bg-input/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unit</span>
                <span className="text-sm font-medium text-foreground">{room.unitNo}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm text-card-foreground">{room.type}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Purpose</span>
                <span className="text-sm text-card-foreground">{room.purpose || "N/A"}</span>
              </div>
            </div>

            {/* Monthly Rent */}
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Monthly Rent
              </label>
              <div className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground">
                Rs. {monthlyRent.toLocaleString()}
              </div>
            </div>


                      {/* ✅ Due Amount */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Due</span>
              <span className={`text-lg font-bold ${getPendingAmount.amount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {getPendingAmount.amount > 0 ? `Rs. ${getPendingAmount.amount.toLocaleString()}` : "All Paid"}
              </span>
            </div>
            {getPendingAmount.months > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {getPendingAmount.months} month{getPendingAmount.months > 1 ? 's' : ''} pending
              </p>
            )}
          </div>

            {/* ✅ Payment Mode Toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setUseCustomAmount(false);
                  setCustomAmount("");
                  setError("");
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  !useCustomAmount
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/40"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseCustomAmount(true);
                  setError("");
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  useCustomAmount
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/40"
                }`}
              >
                Custom Amount
              </button>
            </div>

            {/* Months or Custom Amount */}
            {!useCustomAmount ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Months to Pay
                </label>
                <input
                  type="number"
                  min="1"
                  value={months}
                  onChange={(e) => {
                    setMonths(Number(e.target.value));
                    setError("");
                  }}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Number of months to pay rent for
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Custom Amount (Rs.)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter custom amount"
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
                {customAmount && monthlyRent > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Covers ~{Math.floor(Number(customAmount) / monthlyRent)} month(s)
                  </p>
                )}
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                Remarks *
              </label>
              <textarea
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setError("");
                }}
                placeholder="Add remarks about this rent payment..."
                rows="2"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-indigo-500"
              />
            </div>

            {/* Total */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Payment</span>
                <span className="text-xl font-bold text-emerald-400">
                  Rs. {calculatedAmount.toLocaleString()}
                </span>
              </div>
              {useCustomAmount && customAmount && monthlyRent > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.floor(Number(customAmount) / monthlyRent)} month(s) @ Rs. {monthlyRent.toLocaleString()}/month
                </p>
              )}
              {!useCustomAmount && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {months} month{months > 1 ? 's' : ''} × Rs. {monthlyRent.toLocaleString()}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 size={17} />
                  Rent payment recorded successfully!
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success || calculatedAmount <= 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <Wallet size={17} />
                {loading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}