"use client";

import { useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Wallet, Search, Calendar, Filter } from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";

export default function TransactionsModal({ isOpen, onClose, transactions }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.toLowerCase().includes(search.toLowerCase()) ||
      tx.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.unitNo?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "All" || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="font-semibold">All Transactions</h2>
                <p className="text-xs text-muted-foreground">{transactions.length} total transactions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-border bg-input py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-indigo-500"
                />
              </div>
              <div className="relative sm:w-48">
                <Filter
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input py-2.5 pl-11 pr-4 text-sm text-card-foreground outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="All">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Security">Security</option>
                  <option value="Security Returned">Security Returned</option>
                  <option value="Security Forfeited">Security Forfeited</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-y-auto p-4 max-h-[55vh]">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet size={48} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No transactions found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-3 transition hover:bg-muted"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`rounded-lg p-2 shrink-0 ${
                        tx.type === "Income" || tx.type === "Security Forfeited"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tx.type === "Expense" || tx.type === "Security Returned"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {tx.type === "Income" || tx.type === "Security Forfeited" ? (
                          <ArrowUpRight size={16} />
                        ) : tx.type === "Expense" || tx.type === "Security Returned" ? (
                          <ArrowDownRight size={16} />
                        ) : (
                          <Wallet size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.description || tx.category || tx.type}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{tx.category || tx.type}</span>
                          {tx.tenantName && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>{tx.tenantName}</span>
                            </>
                          )}
                          {tx.employeeName && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>{tx.employeeName}</span>
                            </>
                          )}
                          {tx.unitNo && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>Unit {tx.unitNo}</span>
                            </>
                          )}
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</span>
                          <span className="text-muted-foreground">
                            {new Date(tx.date || tx.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-sm font-bold ${
                        tx.type === "Income" || tx.type === "Security Forfeited"
                          ? "text-emerald-400"
                          : tx.type === "Expense" || tx.type === "Security Returned"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}>
                        {tx.type === "Expense" || tx.type === "Security Returned" ? "-" : "+"} Rs. {tx.amount?.toLocaleString() || 0}
                      </p>
                      {tx.status && (
                        <p className="text-xs text-muted-foreground">{tx.status}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}