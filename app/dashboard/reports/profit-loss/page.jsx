"use client";

import { useState, useMemo, useRef } from "react";
import { useRevenue } from "@/context/RevenueContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ReportFilters from "@/components/reports/ReportFilters";
import ExportButton from "@/components/reports/ExportButton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Building2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function ProfitLossReport() {
  const { revenueData, getRevenueStats } = useRevenue();
  const { user } = useAuth();
  const printRef = useRef(null);

  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Filter data by date range
  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const isSecurityDeposit = (item) => {
      const type = String(item?.type || '').toLowerCase();
      const category = String(item?.category || '').toLowerCase();
      if (type.includes('forfeit') || category.includes('forfeit')) return false;
      return type === 'security' || category === 'security';
    };
    const isSecurityRefund = (item) => {
      const text = `${item?.type || ''} ${item?.category || ''}`.toLowerCase();
      return text.includes('security refund') || text.includes('security returned');
    };

    const filteredIncome = (revenueData.income || []).filter(
      (i) => new Date(i.createdAt) >= start && new Date(i.createdAt) <= end && !isSecurityDeposit(i)
    );
    
    const filteredExpenses = (revenueData.expenses || []).filter(
      (e) => new Date(e.createdAt) >= start && new Date(e.createdAt) <= end && !isSecurityRefund(e)
    );

    const filteredSecurities = (revenueData.securities || [])
      .filter((s) => s.status === "Held")
      .filter((s) => new Date(s.createdAt) >= start && new Date(s.createdAt) <= end);

    const securityMovements = (revenueData.securities || []).filter(
      (s) => new Date(s.createdAt) >= start && new Date(s.createdAt) <= end
    );

    const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSecurities = filteredSecurities.reduce((sum, s) => sum + s.amount, 0);
    const profit = totalIncome - totalExpenses;

    return {
      filteredIncome,
      filteredExpenses,
      filteredSecurities,
      securityMovements,
      totalIncome,
      totalExpenses,
      totalSecurities,
      profit,
      profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
      totalRevenue: totalIncome + (revenueData.includeSecurities ? totalSecurities : 0),
    };
  }, [revenueData, startDate, endDate]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      const content = document.getElementById('report-content');
      if (content) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Profit & Loss Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; background: #fff; color: #1e293b; }
                .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { font-size: 28px; margin: 0; }
                .header p { color: #64748b; margin: 5px 0; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
                .stat-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; }
                .stat-card .value { font-size: 24px; font-weight: bold; }
                .stat-card .label { font-size: 12px; color: #64748b; margin-top: 4px; }
                .profit { color: #10b981; }
                .loss { color: #ef4444; }
                .section { margin: 20px 0; }
                .section h2 { font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
                .row.total { font-weight: bold; border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 8px; }
                .row .label { color: #475569; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                .securities-note { font-size: 14px; color: #f59e0b; margin-top: 4px; }
                .revenue-note { font-size: 13px; color: #64748b; margin-top: 2px; }
                @media print { body { padding: 20px; } .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${content.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  return (
    <ProtectedRoute requiredRoles={["admin", "lead_manager", "moderator", "super_admin"]}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-400">Reports</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profit & Loss Report</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Detailed profit and loss statement for the selected period.
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton onPrint={handlePrint} onExportPDF={handleExportPDF} />
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          period={period}
          setPeriod={setPeriod}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onApply={() => {}}
        />

        {/* Report Content */}
        <div id="report-content" ref={printRef}>
          {/* Header */}
          <div className="header">
            <h1>Profit & Loss Report</h1>
            <p>
              Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
            <p className="securities-note">
              Securities Amount: Rs. {filteredData.totalSecurities.toLocaleString()}
            </p>
            <p className="revenue-note">
              Total Revenue {revenueData.includeSecurities ? '(Securities Included)' : '(Securities Excluded)'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value profit">Rs. {filteredData.totalRevenue.toLocaleString()}</div>
              <div className="label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="value loss">Rs. {filteredData.totalExpenses.toLocaleString()}</div>
              <div className="label">Total Expenses</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ color: filteredData.profit >= 0 ? '#10b981' : '#ef4444' }}>
                {filteredData.profit >= 0 ? '+' : '-'} Rs. {Math.abs(filteredData.profit).toLocaleString()}
              </div>
              <div className="label">Net Profit / Loss</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ color: '#f59e0b' }}>Rs. {filteredData.totalSecurities.toLocaleString()}</div>
              <div className="label">Securities Amount</div>
            </div>
          </div>

          {/* Income Details */}
          <div className="section">
            <h2>Income Details</h2>
            {filteredData.filteredIncome.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No income records found</p>
            ) : (
              filteredData.filteredIncome.map((inc, i) => (
                <div key={i} className="row">
                  <span className="label">{inc.category || inc.type} - {inc.description || ''}</span>
                  <span>Rs. {inc.amount.toLocaleString()}</span>
                </div>
              ))
            )}
            <div className="row total">
              <span>Total Income</span>
              <span>Rs. {filteredData.totalIncome.toLocaleString()}</span>
            </div>
            {revenueData.includeSecurities && filteredData.totalSecurities > 0 && (
              <div className="row" style={{ borderBottom: '1px solid #fef3c7', color: '#f59e0b' }}>
                <span>Securities (Held)</span>
                <span>Rs. {filteredData.totalSecurities.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Expense Details */}
          <div className="section">
            <h2>Expense Details</h2>
            {filteredData.filteredExpenses.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No expense records found</p>
            ) : (
              filteredData.filteredExpenses.map((exp, i) => (
                <div key={i} className="row">
                  <span className="label">{exp.category || exp.type} - {exp.description || ''}</span>
                  <span>Rs. {exp.amount.toLocaleString()}</span>
                </div>
              ))
            )}
            <div className="row total">
              <span>Total Expenses</span>
              <span>Rs. {filteredData.totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className="section">
            <h2>Security Transactions</h2>
            {filteredData.securityMovements.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No security records found</p>
            ) : (
              filteredData.securityMovements.map((sec, i) => (
                <div key={i} className="row">
                  <span className="label">{sec.eventType || sec.status} - {sec.description || sec.tenantName || ''}</span>
                  <span>Rs. {Number(sec.amount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
            <div className="row total">
              <span>Securities Currently Held</span>
              <span>Rs. {filteredData.totalSecurities.toLocaleString()}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="section">
            <h2>Summary</h2>
            <div className="row total">
              <span>Net Profit / Loss</span>
              <span className={filteredData.profit >= 0 ? 'profit' : 'loss'}>
                {filteredData.profit >= 0 ? '+' : '-'} Rs. {Math.abs(filteredData.profit).toLocaleString()}
              </span>
            </div>
            <div className="row">
              <span className="label">Profit Margin</span>
              <span>{filteredData.profitMargin.toFixed(1)}%</span>
            </div>
            <div className="row">
              <span className="label">Securities Amount</span>
              <span>Rs. {filteredData.totalSecurities.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground">
          Generated by Zameen Dost Marketing BMS • {new Date().toLocaleString()}
        </div>
      </div>
    </ProtectedRoute>
  );
}