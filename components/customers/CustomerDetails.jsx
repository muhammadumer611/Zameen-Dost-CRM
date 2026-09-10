import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  Phone,
  CreditCard,
  CalendarDays,
  Wallet,
  ShieldCheck,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import RentHistory from "@/components/customers/RentHistory";
import SecurityHistory from "@/components/customers/SecurityHistory";
import { getImageUrl } from "@/lib/imageHelper";

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={15} />
        {label}
      </div>

      <p className="mt-2 text-sm font-medium text-foreground">
        {value || "Not Set"}
      </p>
    </div>
  );
}

function RentStatus({ customer }) {
  if (customer.status === "Paid") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <p className="font-semibold text-emerald-400">
              Rent Paid
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Current rent is clear.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 ${
        customer.status === "Overdue"
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2.5 ${
              customer.status === "Overdue"
                ? "bg-red-500/10 text-red-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            <AlertCircle size={20} />
          </div>

          <div>
            <p
              className={`font-semibold ${
                customer.status === "Overdue"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {customer.status === "Overdue"
                ? "Rent Overdue"
                : "Rent Pending"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {customer.pendingMonths}{" "}
              {customer.pendingMonths === 1
                ? "month"
                : "months"}{" "}
              outstanding
            </p>
          </div>
        </div>

        <p className="text-lg font-bold text-foreground">
          Rs.{" "}
          {Number(
            customer.outstanding || 0
          ).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function CustomerDetails({
  customer,
}) {
  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to Customers
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-500/10 text-indigo-400">
            {customer.image ? (
              <img
                src={getImageUrl(customer.image)}
                alt={customer.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={28} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {customer.name}
              </h1>

              {customer.status === "Paid" ? (
                <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  Rent Paid
                </span>
              ) : (
                <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                  Rent Pending
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {customer.reference}
            </p>
          </div>
        </div>
      </div>

      {/* Top Information */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Personal */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-5 font-semibold">
            Personal Information
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoItem
              icon={CreditCard}
              label="CNIC"
              value={customer.cnic}
            />

            <InfoItem
              icon={Phone}
              label="Phone"
              value={customer.phone}
            />

            <InfoItem
              icon={User}
              label="Reference"
              value={customer.reference}
            />
          </div>
        </div>

        {/* Rental */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-5 font-semibold">
            Current Rental
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoItem
              icon={Building2}
              label="Building"
              value={`${customer.buildingNo} — ${customer.buildingReference}`}
            />

            <InfoItem
              icon={DoorOpen}
              label="Unit"
              value={`${customer.unitType} ${customer.unitNo}`}
            />

            <InfoItem
              icon={FileText}
              label="Purpose"
              value={customer.purpose}
            />
          </div>
        </div>

        {/* Financial */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-5 font-semibold">
            Financial Information
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoItem
              icon={Wallet}
              label="Monthly Rent"
              value={`Rs. ${Number(customer.monthlyRent || 0).toLocaleString()}`}
            />

            <InfoItem
              icon={ShieldCheck}
              label="Security Held"
              value={`Rs. ${Number(customer.security || 0).toLocaleString()}`}
            />

            <InfoItem
              icon={CalendarDays}
              label="Rent Started"
              value={customer.rentStartDate}
            />
          </div>
        </div>
      </div>

      {/* Rent Status */}
      <div className="mt-6">
        <RentStatus customer={customer} />
      </div>

      {/* History */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <RentHistory customer={customer} />

        <SecurityHistory
          customer={customer}
          filterCurrent={true}
        />
      </div>
    </div>
  );
}