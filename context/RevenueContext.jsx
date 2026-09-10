"use client";

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { revenueAPI } from "@/lib/api";

const RevenueContext = createContext(null);

export function RevenueProvider({ children }) {
  const [revenueData, setRevenueData] = useState({
    income: [],
    expenses: [],
    securities: [],
    includeSecurities: false,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Load revenue from API
  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      setLoading(true);
      const response = await revenueAPI.get();
      setRevenueData(response.data.data || response.data);
      
      // ✅ Load transactions after revenue
      await loadTransactions();
      setError(null);
    } catch (error) {
      console.error("❌ Failed to load revenue:", error);
      setError(error.response?.data?.message || "Failed to load revenue");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load transactions separately
  const loadTransactions = async () => {
    try {
      const response = await revenueAPI.getTransactions();
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error("❌ Failed to load transactions:", error);
      setTransactions([]);
    }
  };

  // ✅ Toggle securities
  const toggleSecurities = async () => {
    try {
      const response = await revenueAPI.toggleSecurities();
      setRevenueData(response.data.data || response.data);
      await loadTransactions();
      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to toggle securities:", error);
      throw error;
    }
  };

  // ✅ Add income
  const addIncome = async (incomeData) => {
    try {
      console.log("💰 Adding income:", incomeData);
      const response = await revenueAPI.addIncome(incomeData);
      setRevenueData(response.data.data || response.data);
      await loadTransactions();
      console.log("✅ Income added successfully");
      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to add income:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
    }
  };

  // ✅ Add expense
  const addExpense = async (expenseData) => {
    try {
      console.log("💸 Adding expense:", expenseData);
      const response = await revenueAPI.addExpense(expenseData);
      setRevenueData(response.data.data || response.data);
      await loadTransactions();
      console.log("✅ Expense added successfully");
      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to add expense:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
    }
  };

  // ✅ Add security
  const addSecurity = async (securityData) => {
    try {
      const response = await revenueAPI.addSecurity(securityData);
      setRevenueData(response.data.data || response.data);
      await loadTransactions();
      return response.data.data;
    } catch (error) {
      console.error("Failed to add security:", error);
      throw error;
    }
  };

  // ✅ Settle security
  const settleSecurity = async (settlementData) => {
    try {
      const response = await revenueAPI.settleSecurity(settlementData);
      setRevenueData(response.data.data || response.data);
      await loadTransactions();
      return response.data.data;
    } catch (error) {
      console.error("Failed to settle security:", error);
      throw error;
    }
  };

  // ✅ Get transactions (sync - returns state)
  const getTransactions = useCallback(() => {
    return transactions;
  }, [transactions]);

  // ✅ Get revenue stats
  const getRevenueStats = useCallback(() => {
    const isSecurityDeposit = (item) => {
      const type = String(item?.type || "").toLowerCase();
      const category = String(item?.category || "").toLowerCase();
      if (type.includes("forfeit") || category.includes("forfeit")) return false;
      return type === "security" || category === "security";
    };
    const isSecurityRefund = (item) => {
      const text = `${item?.type || ""} ${item?.category || ""}`.toLowerCase();
      return text.includes("security refund") || text.includes("security returned");
    };

    const totalIncome = (revenueData.income || [])
      .filter((item) => !isSecurityDeposit(item))
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpenses = (revenueData.expenses || [])
      .filter((item) => !isSecurityRefund(item))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const securitiesTotal = (revenueData.securities || [])
      .filter((s) => s.status === "Held")
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalRevenue = revenueData.includeSecurities ? totalIncome + securitiesTotal : totalIncome;
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      baseRevenue: totalIncome,
      securitiesTotal,
      netProfit,
      includeSecurities: revenueData.includeSecurities || false,
    };
  }, [revenueData]);

  // ✅ Reset revenue data
  const resetRevenue = async () => {
    await loadRevenue();
  };

  const value = useMemo(
    () => ({
      revenueData,
      setRevenueData,
      transactions,
      loading,
      error,
      loadRevenue,
      loadTransactions,
      toggleSecurities,
      addIncome,
      addExpense,
      addSecurity,
      settleSecurity, // ✅ Added settleSecurity to context
      getTransactions,
      getRevenueStats,
      resetRevenue,
    }),
    [revenueData, transactions, loading, error, getTransactions, getRevenueStats] // ✅ Added missing dependencies
  );

  return <RevenueContext.Provider value={value}>{children}</RevenueContext.Provider>;
}

export function useRevenue() {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error("useRevenue must be used inside RevenueProvider");
  }
  return context;
}