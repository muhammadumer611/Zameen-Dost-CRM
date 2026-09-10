const Building = require('../models/Building');
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const Revenue = require('../models/Revenue');
const Customer = require('../models/Customer');
const { isSecurityDepositIncome, isSecurityRefundExpense } = require('../utils/revenueLedger');

// ============================================================
// PROFIT & LOSS REPORT
// ============================================================
exports.getProfitLossReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    // ✅ Set date range based on period
    switch (period) {
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      case 'annual':
        start = new Date(start.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(start.getFullYear(), start.getMonth(), 1);
    }

    const revenue = await Revenue.findOne();

    let income = [];
    let expenses = [];
    let securities = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSecurities = 0;

    if (revenue) {
      // ✅ Filter income by date range
      income = (revenue.income || []).filter(inc => {
        const incDate = new Date(inc.createdAt);
        return incDate >= start && incDate <= end && !isSecurityDepositIncome(inc);
      });
      totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);

      // ✅ Filter expenses by date range
      expenses = (revenue.expenses || []).filter(exp => {
        const expDate = new Date(exp.createdAt);
        return expDate >= start && expDate <= end && !isSecurityRefundExpense(exp);
      });
      totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // ✅ Filter securities by date range
      securities = (revenue.securities || [])
        .filter(s => s.status === 'Held')
        .filter(s => {
          const secDate = new Date(s.createdAt);
          return secDate >= start && secDate <= end;
        });
      totalSecurities = securities.reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    const profit = totalIncome - totalExpenses;
    const totalRevenue = revenue?.includeSecurities ? totalIncome + totalSecurities : totalIncome;

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        summary: {
          totalIncome,
          totalExpenses,
          totalSecurities,
          totalRevenue,
          netProfit: profit,
          profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
          includeSecurities: revenue?.includeSecurities || false,
        },
        income,
        expenses,
        securities,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GENERAL BUSINESS REPORT
// ============================================================
exports.getGeneralReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      case 'annual':
        start = new Date(start.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(start.getFullYear(), start.getMonth(), 1);
    }

    // ✅ Buildings Data
    const buildings = await Building.find();
    const totalBuildings = buildings.length;
    const activeBuildings = buildings.filter(b => b.status === 'Active').length;

    let totalRooms = 0;
    let rentedRooms = 0;
    let availableRooms = 0;
    let buildingsAdded = 0;
    let buildingsRemoved = 0;

    buildings.forEach(b => {
      totalRooms += (b.rooms || []).length;
      rentedRooms += (b.rooms || []).filter(r => r.status === 'Rented').length;
      availableRooms += (b.rooms || []).filter(r => r.status === 'Available').length;

      // Check if added in period
      if (b.createdAt && new Date(b.createdAt) >= start && new Date(b.createdAt) <= end) {
        buildingsAdded++;
      }
      if (b.status === 'Inactive' && b.updatedAt && new Date(b.updatedAt) >= start && new Date(b.updatedAt) <= end) {
        buildingsRemoved++;
      }
    });

    // ✅ Units Added/Rented/Available in period
    let unitsAdded = 0;
    let unitsRentedInPeriod = 0;
    let unitsAvailableInPeriod = 0;

    buildings.forEach(b => {
      (b.rooms || []).forEach(r => {
        if (r.createdAt && new Date(r.createdAt) >= start && new Date(r.createdAt) <= end) {
          unitsAdded++;
        }
        if (r.status === 'Rented' && r.rentStartDate && new Date(r.rentStartDate) >= start && new Date(r.rentStartDate) <= end) {
          unitsRentedInPeriod++;
        }
        if (r.status === 'Available' && r.updatedAt && new Date(r.updatedAt) >= start && new Date(r.updatedAt) <= end) {
          unitsAvailableInPeriod++;
        }
      });
    });

    // ✅ Employees Data
    const employees = await Employee.find();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const employeesAdded = employees.filter(e => e.createdAt && new Date(e.createdAt) >= start && new Date(e.createdAt) <= end).length;
    const employeesRemoved = employees.filter(e => e.status === 'Inactive' && e.updatedAt && new Date(e.updatedAt) >= start && new Date(e.updatedAt) <= end).length;

    // ✅ Revenue Data
    const revenue = await Revenue.findOne();
    let periodExpenses = [];
    let totalPeriodExpenses = 0;
    let majorExpenses = [];

    if (revenue) {
      periodExpenses = (revenue.expenses || []).filter(exp => {
        const expDate = new Date(exp.createdAt);
        return expDate >= start && expDate <= end;
      });
      totalPeriodExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // ✅ Top 5 Major Expenses
      majorExpenses = periodExpenses
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5);
    }

    // ✅ Customers Data
    const customers = await Customer.find();
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.currentRental?.status === 'Active').length;

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        buildings: {
          added: buildingsAdded,
          removed: buildingsRemoved,
          total: totalBuildings,
          active: activeBuildings,
        },
        units: {
          added: unitsAdded,
          rented: unitsRentedInPeriod,
          available: unitsAvailableInPeriod,
          total: totalRooms,
          rentedTotal: rentedRooms,
          availableTotal: availableRooms,
          occupancyRate: totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0,
        },
        employees: {
          added: employeesAdded,
          removed: employeesRemoved,
          total: totalEmployees,
          active: activeEmployees,
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
        },
        expenses: {
          total: totalPeriodExpenses,
          count: periodExpenses.length,
          major: majorExpenses,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// EMPLOYEE PERFORMANCE REPORT
// ============================================================
exports.getEmployeePerformanceReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate, search = '' } = req.query;

    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      case 'annual':
        start = new Date(start.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(start.getFullYear(), start.getMonth(), 1);
    }

    // ✅ Get all employees
    let employees = await Employee.find();

    // ✅ Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      employees = employees.filter(emp =>
        searchRegex.test(emp.name) ||
        searchRegex.test(emp.designation) ||
        searchRegex.test(emp.department) ||
        searchRegex.test(emp.email)
      );
    }

    // ✅ Calculate performance metrics for each employee
    const performanceData = employees.map(emp => {
      // ✅ Filter attendance by date range
      const attendance = (emp.attendance || []).filter(a => {
        const aDate = new Date(a.date);
        return aDate >= start && aDate <= end;
      });

      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      const leaves = attendance.filter(a => a.status === 'Leave').length;
      const totalDays = attendance.length;
      const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      // ✅ Filter tasks by date range
      const tasks = (emp.tasks || []).filter(t => {
        const tDate = new Date(t.assignedDate);
        return tDate >= start && tDate <= end;
      });

      const completed = tasks.filter(t => t.status === 'Completed').length;
      const failed = tasks.filter(t => t.status === 'Failed').length;
      const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
      const totalTasks = tasks.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      // ✅ Calculate deductions
      const leaveDeduction = leaves * (emp.attendanceSettings?.leaveDeduction || 500);
      const lateMinutes = attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
      const lateDeduction = lateMinutes * (emp.attendanceSettings?.lateDeduction || 10);
      const taskFailureDeduction = failed * (emp.attendanceSettings?.taskFailureDeduction || 1000);

      // ✅ Custom task failure deductions
      const failedTasksWithDeduction = tasks.filter(t => t.status === 'Failed' && t.failureDeduction);
      const customTaskDeductions = failedTasksWithDeduction.reduce((sum, t) => sum + (t.failureDeduction || 0), 0);
      const totalTaskDeduction = customTaskDeductions > 0 ? customTaskDeductions : taskFailureDeduction;

      const totalDeduction = leaveDeduction + lateDeduction + totalTaskDeduction;
      const efficiency = (attendanceRate + taskCompletionRate) / 2;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        salary: emp.salary,
        status: emp.status,
        image: emp.image,
        attendance: {
          present,
          absent,
          leaves,
          total: totalDays,
          rate: attendanceRate,
        },
        tasks: {
          completed,
          failed,
          pending,
          total: totalTasks,
          rate: taskCompletionRate,
        },
        deductions: {
          leaves: leaveDeduction,
          late: lateDeduction,
          taskFailure: totalTaskDeduction,
          total: totalDeduction,
        },
        performance: {
          attendanceRate,
          taskCompletionRate,
          efficiency: Math.round(efficiency),
        },
      };
    });

    // ✅ Sort by efficiency (highest first)
    performanceData.sort((a, b) => b.performance.efficiency - a.performance.efficiency);

    // ✅ Summary stats
    const summary = {
      totalEmployees: performanceData.length,
      avgAttendance: performanceData.reduce((sum, e) => sum + e.attendance.rate, 0) / (performanceData.length || 1),
      avgTaskCompletion: performanceData.reduce((sum, e) => sum + e.tasks.rate, 0) / (performanceData.length || 1),
      avgEfficiency: performanceData.reduce((sum, e) => sum + e.performance.efficiency, 0) / (performanceData.length || 1),
      totalDeductions: performanceData.reduce((sum, e) => sum + e.deductions.total, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        summary,
        employees: performanceData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// EXPORT ALL REPORTS (Combined)
// ============================================================

exports.exportAllReports = async (req, res) => {
  try {
    const { period = 'monthly' } = req.body;

    // ✅ Direct helper functions call karo (self-reference fix)
    const profitLoss = await getProfitLossReportData(period);
    const general = await getGeneralReportData(period);
    const employee = await getEmployeePerformanceReportData(period);

    res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        period,
        profitLoss,
        general,
        employee,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Helper functions for export
async function getProfitLossReportData(period) {
  const revenue = await Revenue.findOne();
  return {
    totalIncome: revenue?.income?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
    totalExpenses: revenue?.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
    totalSecurities: revenue?.securities?.filter(s => s.status === 'Held').reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
  };
}

async function getGeneralReportData(period) {
  const buildings = await Building.find();
  const employees = await Employee.find();
  const customers = await Customer.find();

  return {
    buildings: buildings.length,
    employees: employees.length,
    customers: customers.length,
  };
}

async function getEmployeePerformanceReportData(period) {
  const employees = await Employee.find();
  return {
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
  };
}