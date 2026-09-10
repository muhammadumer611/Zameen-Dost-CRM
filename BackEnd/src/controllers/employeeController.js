const Employee = require('../models/Employee');

// ✅ Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get single employee
exports.getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Create employee
exports.createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;

    // ✅ If image uploaded, set path
    if (req.file) {
      employeeData.image = `/uploads/employees/${req.file.filename}`;
    }

    // ✅ Convert shiftTiming and attendanceSettings from string to object
    if (typeof employeeData.shiftTiming === 'string') {
      employeeData.shiftTiming = JSON.parse(employeeData.shiftTiming);
    }
    if (typeof employeeData.attendanceSettings === 'string') {
      employeeData.attendanceSettings = JSON.parse(employeeData.attendanceSettings);
    }

    // ✅ Convert booleans
    if (employeeData.canManageLeads === 'true' || employeeData.canManageLeads === true) {
      employeeData.canManageLeads = true;
    } else {
      employeeData.canManageLeads = false;
    }
    
    if (employeeData.hasLogin === 'true' || employeeData.hasLogin === true) {
      employeeData.hasLogin = true;
    } else {
      employeeData.hasLogin = false;
    }

    // ✅ Remove empty strings
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] === "" || employeeData[key] === null || employeeData[key] === undefined) {
        delete employeeData[key];
      }
    });

    const employee = await Employee.create(employeeData);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ If new image uploaded, update path
    if (req.file) {
      updates.image = `/uploads/employees/${req.file.filename}`;
    }

    // ✅ Convert shiftTiming and attendanceSettings from string to object
    if (typeof updates.shiftTiming === 'string') {
      updates.shiftTiming = JSON.parse(updates.shiftTiming);
    }
    if (typeof updates.attendanceSettings === 'string') {
      updates.attendanceSettings = JSON.parse(updates.attendanceSettings);
    }

    // ✅ Convert booleans
    if (updates.canManageLeads === 'true' || updates.canManageLeads === true) {
      updates.canManageLeads = true;
    } else if (updates.canManageLeads === 'false' || updates.canManageLeads === false) {
      updates.canManageLeads = false;
    }
    
    if (updates.hasLogin === 'true' || updates.hasLogin === true) {
      updates.hasLogin = true;
    } else if (updates.hasLogin === 'false' || updates.hasLogin === false) {
      updates.hasLogin = false;
    }

    // ✅ Remove empty strings
    Object.keys(updates).forEach(key => {
      if (updates[key] === "" || updates[key] === null || updates[key] === undefined) {
        delete updates[key];
      }
    });

    const employee = await Employee.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ✅ Mark attendance - Prevent duplicate date
// ✅ Mark attendance - Complete Fixed
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendanceData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const date = attendanceData.date || new Date().toISOString().split('T')[0];
    const status = attendanceData.status || 'Present';
    
    // ✅ Check duplicate attendance
    const existingAttendance = employee.attendance.find(a => a.date === date);
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date.',
      });
    }

    // ✅ Check if Friday
    const dayOfWeek = new Date(date).getDay();
    const isFriday = dayOfWeek === 5;

    let finalStatus = status;
    let chargeableLateMinutes = 0;
    let lateDeductionAmount = 0;
    let leaveDeductionAmount = 0;

    if (isFriday && status !== 'Present') {
      finalStatus = 'Friday Off';
    } else if (status === 'Present') {
      const lateMinutes = Number(attendanceData.lateMinutes || 0);
      const graceMinutes = employee.shiftTiming?.graceMinutes || 30;
      const lateDeductionRate = employee.attendanceSettings?.lateDeduction || 10;
      
      chargeableLateMinutes = Math.max(lateMinutes - graceMinutes, 0);
      lateDeductionAmount = chargeableLateMinutes * lateDeductionRate;
    } else if (status === 'Leave' || status === 'Absent') {
      const currentMonth = date.slice(0, 7);
      const monthlyLeaves = employee.attendance.filter(a => 
        a.date?.startsWith(currentMonth) && 
        (a.status === 'Leave' || a.status === 'Absent')
      ).length;
      
      const freeLeavesPerMonth = employee.shiftTiming?.monthlyLeaves || 1;
      const leaveDeductionRate = employee.attendanceSettings?.leaveDeduction || 500;
      
      if (monthlyLeaves >= freeLeavesPerMonth) {
        leaveDeductionAmount = leaveDeductionRate;
      }
    }

    // ✅ Define attendanceRecord BEFORE pushing
    const attendanceRecord = {
      date: date,
      status: finalStatus,
      checkIn: finalStatus === 'Present' ? attendanceData.checkIn : null,
      checkOut: finalStatus === 'Present' ? attendanceData.checkOut : null,
      lateMinutes: finalStatus === 'Present' ? Number(attendanceData.lateMinutes || 0) : 0,
      chargeableLateMinutes: chargeableLateMinutes,
      lateDeductionAmount: lateDeductionAmount,
      leaveDeductionAmount: leaveDeductionAmount,
    };

    employee.attendance.push(attendanceRecord);
    await employee.save();



    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add task
exports.addTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    employee.tasks.push(taskData);
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update task
exports.updateTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const updates = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const isSelf = employee.email?.toLowerCase() === req.user.email?.toLowerCase();
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own tasks.',
      });
    }

    const task = employee.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    if (!isAdmin) {
      delete updates.failureDeduction;
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        task[key] = updates[key];
      }
    });

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ Pay salary - Updated logic
exports.paySalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, month, deductions } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const monthlySalary = Number(employee.salary || 0);
    const paidAmount = Number(amount || monthlySalary);
    
    // ✅ Calculate total deductions (from provided object or sum of parts)
    const totalDeductions = deductions?.total || 
      (deductions?.leaves || 0) + (deductions?.late || 0) + (deductions?.taskFailure || 0) || 0;

    // ✅ Expected amount after deductions
    const expectedAmount = monthlySalary - totalDeductions;

    // ✅ Status logic: Paid if paidAmount >= expectedAmount, else Partial
    const status = paidAmount >= expectedAmount ? 'Paid' : 'Partial';

    const salaryRecord = {
      month: month || new Date().toISOString().slice(0, 7),
      amount: paidAmount,
      status: status,
      paidAt: new Date().toISOString(),
      remarks: 'Salary payment',
      deductions: deductions || { leaves: 0, late: 0, taskFailure: 0, total: 0 },
    };

    employee.salaryHistory.push(salaryRecord);
    await employee.save();

    try {
  const Revenue = require('../models/Revenue');
  let revenue = await Revenue.findOne();
  if (!revenue) {
    revenue = await Revenue.create({ income: [], expenses: [], securities: [] });
  }
  
  revenue.expenses.push({
    type: 'Expense',
    transactionType: 'Expense',
    category: 'Salary',
    description: `Salary payment to ${employee.name}`,
    amount: paidAmount,
    paidTo: employee.name,
    employeeId: employee._id,
    employeeName: employee.name,
    fullSalary: monthlySalary,
    month: salaryRecord.month,
    status: 'Paid',
    deductions: salaryRecord.deductions,
    salaryPayment: salaryRecord,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  
  await revenue.save();
} catch (revenueError) {
  console.error('Failed to add salary to revenue:', revenueError);
  // Don't block salary payment if revenue update fails
}

    res.status(200).json({
      success: true,
      message: 'Salary paid successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('Pay salary error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};