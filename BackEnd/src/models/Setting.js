const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  general: {
    companyName: { type: String, default: 'Zameen Dost Marketing' },
    companyLogo: { type: String, default: null },
    companyAddress: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    timeZone: { type: String, default: 'Asia/Karachi' },
    currency: { type: String, default: 'Rs.' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },
  employee: {
    defaultLeaveDeduction: { type: Number, default: 500 },
    defaultLateDeduction: { type: Number, default: 10 },
    defaultTaskFailureDeduction: { type: Number, default: 1000 },
    graceMinutes: { type: Number, default: 30 },
    weeklyOffDay: { type: String, default: 'Friday' },
    monthlyPaidLeaves: { type: Number, default: 1 },
    attendanceRequired: { type: Boolean, default: true },
    defaultCheckIn: { type: String, default: '09:00' },
    defaultCheckOut: { type: String, default: '17:00' },
  },
  revenue: {
    includeSecurities: { type: Boolean, default: false },
    defaultRentDueDate: { type: Number, default: 5 },
    lateRentPenalty: { type: Number, default: 100 },
    securityMonths: { type: Number, default: 2 },
    enableAutoCalc: { type: Boolean, default: true },
  },
  building: {
    defaultUnitType: { type: String, default: 'Room' },
    defaultUnitStatus: { type: String, default: 'Available' },
    roomNumberPrefix: { type: String, default: '' },
    enableMaintenanceMode: { type: Boolean, default: false },
  },
  notification: {
    emailEnabled: { type: Boolean, default: true },
    rentReminderDays: { type: Number, default: 3 },
    salaryReminderDays: { type: Number, default: 5 },
    leadFollowUpDays: { type: Number, default: 7 },
    maintenanceAlert: { type: Boolean, default: true },
  },
  security: {
    sessionTimeout: { type: Number, default: 60 },
    maxLoginAttempts: { type: Number, default: 5 },
    twoFactorAuth: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    allowRegistration: { type: Boolean, default: false },
  },
  invoice: {
    prefix: { type: String, default: 'INV-' },
    footer: { type: String, default: 'Thank you for your business' },
    reportHeader: { type: String, default: 'Business Report' },
    defaultReportPeriod: { type: String, default: 'Monthly' },
    showLogo: { type: Boolean, default: true },
    showSignatures: { type: Boolean, default: true },
  },
  leads: {
    defaultStatus: { type: String, default: 'New' },
    followUpDays: { type: Number, default: 7 },
    leadSources: { type: [String], default: ['Referral', 'Website', 'Walk-in', 'Social Media', 'Phone', 'Other'] },
    leadTypes: { type: [String], default: ['Hostel', 'Office', 'Shop', 'Room', 'Desk', 'Other'] },
    autoAssign: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);