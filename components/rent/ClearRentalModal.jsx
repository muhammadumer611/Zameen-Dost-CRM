"use client";

import { useMemo, useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { useBuildings } from "@/context/BuildingContext";
import { useRevenue } from "@/context/RevenueContext";

export default function ClearRentalModal({
  buildingId,
  room,
  onClose,
}) {
  const { clearRental } = useBuildings();
  const { settleSecurity } = useRevenue(); // ✅ Proper hook call

  const securityHeld = Number(
    room?.initialPayment?.securityReceived || 0
  );

  const [returnAmount, setReturnAmount] = useState(securityHeld);
  const [forfeitAmount, setForfeitAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(
    () => Number(returnAmount || 0) + Number(forfeitAmount || 0),
    [returnAmount, forfeitAmount]
  );

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

  const handleReturnChange = (e) => {
    const value = Number(e.target.value || 0);
    setReturnAmount(value);
    setForfeitAmount(Math.max(securityHeld - value, 0));
    setError("");
  };

  const handleForfeitChange = (e) => {
    const value = Number(e.target.value || 0);
    setForfeitAmount(value);
    setReturnAmount(Math.max(securityHeld - value, 0));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (total !== securityHeld) {
      setError(
        "Return and forfeit amounts must equal the security held."
      );
      return;
    }

    if (!remarks.trim()) {
      setError("Please add remarks for this transaction.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const now = new Date().toISOString();
      const transactionId = `clear-${Date.now()}`;

      // ✅ Get the room ID properly (supports both _id and id)
      const roomId = room._id || room.id;
      const buildingNo = room.buildingNo || buildingId;

      console.log("🔄 Clearing rental for room:", {
        buildingId,
        roomId,
        roomNo: room.unitNo,
        securityHeld,
        returnAmount,
        forfeitAmount,
        remarks: remarks.trim(),
      });

      // ✅ Step 1: Settle security in revenue (return/forfeit)
      if (returnAmount > 0 || forfeitAmount > 0) {
        await settleSecurity({
          buildingId,
          unitId: roomId,
          unitNo: room?.unitNo,
          buildingNo: buildingNo,
          tenantName: room?.tenant?.name || "Unknown",
          returnAmount,
          forfeitAmount,
          remarks: remarks.trim(),
          createdAt: now,
        });
        console.log("✅ Security settled in revenue");
      }

      // ✅ Step 2: Clear rental in building (update room status)
      await clearRental(buildingId, roomId, {
        returnAmount,
        forfeitAmount,
        remarks: remarks.trim(),
        clearedAt: now,
      });

      console.log("✅ Rental Cleared Successfully:", {
        id: transactionId,
        type: "Rental Clearance",
        buildingId,
        unitId: roomId,
        unitNo: room?.unitNo,
        tenantName: room?.tenant?.name,
        securityHeld,
        returnAmount,
        forfeitAmount,
        remarks: remarks.trim(),
        clearedAt: now,
      });

      onClose();
    } catch (error) {
      console.error("❌ Clear rental error:", error);
      setError(error.message || "Unable to clear rental.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        {/* Modal - Viewport ke center mein */}
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Clear Rental</h2>
                <p className="text-xs text-muted-foreground">Unit {room?.unitNo}</p>
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

          <form onSubmit={handleSubmit} className="p-5">
            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Customer */}
                <div className="rounded-xl border border-border bg-input/70 p-4">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="mt-1 font-medium">{room?.tenant?.name || "No tenant"}</p>
                  <p className="text-xs text-muted-foreground">
                    {room?.unitNo} • {room?.type || "N/A"}
                  </p>
                </div>

                {/* Security Held */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Security Held</span>
                    <span className="text-xl font-bold text-emerald-400">
                      Rs. {securityHeld.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Return Amount */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                    <RotateCcw size={15} />
                    Security Returned
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={securityHeld}
                    value={returnAmount}
                    onChange={handleReturnChange}
                    className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Amount to return to customer
                  </p>
                </div>

                {/* Forfeit Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">
                    Security Forfeited
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={securityHeld}
                    value={forfeitAmount}
                    onChange={handleForfeitChange}
                    className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-amber-400">
                    Forfeited amount will be added to revenue
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Remarks */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                    <FileText size={15} />
                    Remarks *
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => {
                      setRemarks(e.target.value);
                      setError("");
                    }}
                    placeholder="Add remarks about the rental clearance..."
                    rows="4"
                    className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    e.g., Security returned due to rental ending, damage deductions, etc.
                  </p>
                </div>

                {/* Validation */}
                <div className="rounded-xl border border-border bg-input/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Settlement</span>
                    <span
                      className={`text-sm font-semibold ${
                        total === securityHeld ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      Rs. {total.toLocaleString()} / {securityHeld.toLocaleString()}
                    </span>
                  </div>
                  {total === securityHeld && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 size={14} />
                      Settlement amount matches security held
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons - Full Width */}
            <div className="mt-6 flex gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || total !== securityHeld}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <CheckCircle2 size={17} />
                {loading ? "Clearing..." : "Clear Rental"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}