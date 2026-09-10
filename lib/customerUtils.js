export function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getCustomerRentStatus(room) {
  if (!room?.tenant || room.status !== "Rented") {
    return {
      status: "Inactive",
      pendingMonths: 0,
      outstanding: 0,
      lastPaidAt: null,
    };
  }

  // Isolate payments belonging to the active rental (after last clearance)
  const lastClearance = (room.clearanceHistory || [])[room.clearanceHistory?.length - 1];
  const lastClearedTime = lastClearance?.clearedAt ? new Date(lastClearance.clearedAt).getTime() : 0;

  const rawHistory = room.rentHistory || [];
  const history = rawHistory.filter((item) => {
    if (lastClearedTime && item.paidAt) {
      const paidTime = new Date(item.paidAt).getTime();
      if (!isNaN(paidTime) && paidTime <= lastClearedTime) return false;
    }
    return true;
  });

  const currentMonth = getCurrentMonth();

  const currentMonthPayment = history.find(
    (item) =>
      item.month === currentMonth &&
      item.status === "Paid"
  );

  const lastPaidPayment = [...history]
    .filter((item) => item.status === "Paid")
    .sort(
      (a, b) =>
        new Date(b.paidAt) -
        new Date(a.paidAt)
    )[0];

  const startDate = room.rentStartDate
    ? new Date(room.rentStartDate)
    : new Date();

  const now = new Date();

  let monthsExpected =
    (now.getFullYear() - startDate.getFullYear()) *
      12 +
    (now.getMonth() - startDate.getMonth()) +
    1;

  if (monthsExpected < 1) {
    monthsExpected = 1;
  }

  const paidMonths = history.filter(
    (item) => item.status === "Paid"
  ).length;

  const pendingMonths = Math.max(
    monthsExpected - paidMonths,
    0
  );

  const outstanding =
    pendingMonths *
    Number(room.monthlyRent || 0);

  let status = "Paid";

  if (pendingMonths >= 2) {
    status = "Overdue";
  } else if (pendingMonths === 1) {
    status = "Pending";
  }

  return {
    status,
    pendingMonths,
    outstanding,
    lastPaidAt:
      lastPaidPayment?.paidAt || null,
  };
}

export function getCustomersFromBuildings(buildings) {
  const customers = [];

  buildings.forEach((building) => {
    (building.rooms || []).forEach((room) => {
      if (
        room.status !== "Rented" ||
        !room.tenant
      ) {
        return;
      }

      // Isolate records belonging to the current active tenant
      const lastClearance = (room.clearanceHistory || [])[room.clearanceHistory?.length - 1];
      const lastClearedTime = lastClearance?.clearedAt ? new Date(lastClearance.clearedAt).getTime() : 0;

      // Filter security history: exclude archived, clearances (returned/forfeited), and past tenancy records
      const currentSecurityHistory = (room.securityHistory || []).filter((item) => {
        if (item.archived) return false;
        if (item.type === "returned" || item.type === "forfeited") return false;
        if (lastClearedTime && item.date) {
          const itemTime = new Date(item.date).getTime();
          if (!isNaN(itemTime) && itemTime <= lastClearedTime) return false;
        }
        return true;
      });

      // If securityReceived exists on active rental but securityHistory had no active entry, ensure initial entry exists
      if (currentSecurityHistory.length === 0 && Number(room.initialPayment?.securityReceived || 0) > 0) {
        currentSecurityHistory.push({
          type: "received",
          amount: Number(room.initialPayment.securityReceived),
          date: room.initialPayment?.paymentDateTime || room.rentStartDate || new Date().toISOString(),
          note: "Initial security received",
        });
      }

      // Filter rent history: exclude payments made prior to or at last clearance
      const currentRentHistory = (room.rentHistory || []).filter((item) => {
        if (lastClearedTime && item.paidAt) {
          const paidTime = new Date(item.paidAt).getTime();
          if (!isNaN(paidTime) && paidTime <= lastClearedTime) return false;
        }
        return true;
      });

      const rentStatus =
        getCustomerRentStatus(room);

      customers.push({
        id: `${building._id || building.id}-${room._id || room.id}`,

        name: room.tenant.name || "Not Set",

        cnic: room.tenant.cnic || "Not Set",

        phone: room.tenant.phone || "Not Set",

        image: room.tenant.image || null,

        reference:
          room.tenant.reference || "Not Set",

        buildingId: building._id || building.id,

        buildingNo:
          building.buildingNo,

        buildingReference:
          building.reference,

        unitId: room._id || room.id,

        unitNo: room.unitNo,

        unitType: room.type,

        purpose:
          room.purpose || "Not Set",

        monthlyRent:
          Number(room.monthlyRent || 0),

        rentStartDate:
          room.rentStartDate || null,

        initialPayment: room.initialPayment || null,

        security:
          Number(
            room.initialPayment
              ?.securityReceived || 0
          ),

        securityStatus:
          room.initialPayment
            ?.securityStatus || "None",

        rentHistory: currentRentHistory,

        securityHistory: currentSecurityHistory,

        clearanceHistory: room.clearanceHistory || [],

        ...rentStatus,
      });
    });
  });

  return customers;
}