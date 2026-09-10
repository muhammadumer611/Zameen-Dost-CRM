"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { buildingAPI } from "@/lib/api";
// ✅ REMOVED: import { useRevenue } from "./RevenueContext";

const BuildingContext = createContext(null);

export function BuildingProvider({ children }) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load buildings from API on mount
  useEffect(() => {
    loadBuildings();
  }, []);

  // Load buildings
  const loadBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingAPI.getAll();
      setBuildings(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error("Failed to load buildings:", error);
      setError(error.response?.data?.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  };

  // Create building
  const createBuilding = async (buildingData) => {
    try {
      const response = await buildingAPI.create(buildingData);
      const newBuilding = response.data.data;
      setBuildings((prev) => [...prev, newBuilding]);
      return newBuilding;
    } catch (error) {
      console.error("Failed to create building:", error);
      throw error;
    }
  };

  // Update building
  const updateBuilding = async (id, buildingData) => {
    try {
      const response = await buildingAPI.update(id, buildingData);
      const updatedBuilding = response.data.data;
      setBuildings((prev) =>
        prev.map((b) => (b._id === id ? updatedBuilding : b))
      );
      return updatedBuilding;
    } catch (error) {
      console.error("Failed to update building:", error);
      throw error;
    }
  };

  // Delete building
  const deleteBuilding = async (id) => {
    try {
      await buildingAPI.delete(id);
      setBuildings((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      console.error("Failed to delete building:", error);
      throw error;
    }
  };

  // Get building by ID
  const getBuildingById = useCallback(
    (id) => {
      if (!id) return null;
      return (
        buildings.find(
          (b) =>
            b._id === id ||
            b.id === id ||
            String(b._id) === String(id) ||
            String(b.id) === String(id)
        ) || null
      );
    },
    [buildings]
  );

  // ✅ Helper to get room ID
  const getRoomId = (room) => {
    return room._id || room.id;
  };

  // ✅ Helper to get building ID
  const getBuildingId = (building) => {
    return building._id || building.id;
  };

  // Add room to building
  const addRoom = async (buildingId, formData) => {
    try {
      const response = await buildingAPI.addRoom(buildingId, formData);
      const updatedBuilding = response.data.data;

      setBuildings((prev) =>
        prev.map((b) => (b._id === buildingId ? updatedBuilding : b))
      );

      return updatedBuilding;
    } catch (error) {
      console.error("Add room error:", error.response?.data || error.message);
      throw error;
    }
  };

  // Update room
 // ✅ Update room - Preserve rent history and related data
const updateRoom = async (buildingId, roomId, formData) => {
  try {
    // Get the existing room data
    const building = buildings.find((b) => b._id === buildingId);
    if (!building) throw new Error("Building not found");

    const existingRoom = building.rooms?.find(
      (r) => r._id === roomId || r.id === roomId
    );

    // ✅ Parse the update data from FormData
    let updates = {};
    const roomDataStr = formData.get('roomData');
    if (roomDataStr) {
      try {
        updates = JSON.parse(roomDataStr);
      } catch (e) {
        console.error("Failed to parse roomData:", e);
      }
    }

    // ✅ IMPORTANT: Preserve rent history if not being updated
    if (existingRoom && !updates.rentHistory) {
      updates.rentHistory = existingRoom.rentHistory || [];
    }
    if (existingRoom && !updates.rentStartDate) {
      updates.rentStartDate = existingRoom.rentStartDate;
    }
    if (existingRoom && !updates.securityHistory) {
      updates.securityHistory = existingRoom.securityHistory || [];
    }
    if (existingRoom && !updates.clearanceHistory) {
      updates.clearanceHistory = existingRoom.clearanceHistory || [];
    }
    if (existingRoom && !updates.transactionHistory) {
      updates.transactionHistory = existingRoom.transactionHistory || [];
    }

    // ✅ Preserve tenant agreement and documents if not provided
    if (existingRoom?.tenant && updates.tenant) {
      if (!updates.tenant.agreement) {
        updates.tenant.agreement = existingRoom.tenant.agreement || [];
      }
      if (!updates.tenant.documents) {
        updates.tenant.documents = existingRoom.tenant.documents || [];
      }
    }

    // ✅ Send update to API
    const response = await buildingAPI.updateRoom(buildingId, roomId, formData);
    const updatedBuilding = response.data.data;

    setBuildings((prev) =>
      prev.map((b) => (b._id === buildingId ? updatedBuilding : b))
    );

    return updatedBuilding;
  } catch (error) {
    console.error("Failed to update room:", error);
    throw error;
  }
};
  // Delete room
  const deleteRoom = async (buildingId, roomId) => {
    try {
      const response = await buildingAPI.deleteRoom(buildingId, roomId);
      const updatedBuilding = response.data.data;

      setBuildings((prev) =>
        prev.map((b) => (b._id === buildingId ? updatedBuilding : b))
      );

      return updatedBuilding;
    } catch (error) {
      console.error("Failed to delete room:", error);
      throw error;
    }
  };

  // ✅ Pay Rent - Fixed
 // ✅ Pay Rent - Fixed with proper status update
const payRent = async (buildingId, unitId, months, remarks = "") => {
  try {
    const building = buildings.find((b) => b._id === buildingId);
    if (!building) throw new Error("Building not found");

    const room = building.rooms?.find(
      (r) => r._id === unitId || r.id === unitId || String(r._id) === String(unitId)
    );
    if (!room) throw new Error("Room not found");

    const roomId = getRoomId(room);

    const numberOfMonths = Number(months);
    if (!numberOfMonths || numberOfMonths < 1) {
      throw new Error("Invalid number of months.");
    }

    const paymentDateTime = new Date().toISOString();
    const monthlyRent = Number(room.monthlyRent || 0);
    const amount = monthlyRent * numberOfMonths;

    // ✅ Prepare rent history
    const existingHistory = room.rentHistory || [];
    const newHistory = [];

    let nextDate = new Date(room.rentStartDate || paymentDateTime);

    // ✅ Find next pending month
    if (existingHistory.length > 0) {
      const lastPayment = existingHistory[existingHistory.length - 1];
      // Check if last payment was for a different month
      const lastMonth = lastPayment.month;
      const lastMonthDate = new Date(`${lastMonth}-01T00:00:00`);
      const nextMonthDate = new Date(lastMonthDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextDate = nextMonthDate;
    }

    // ✅ Create rent history entries for each month
    for (let i = 0; i < numberOfMonths; i++) {
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, "0");

      newHistory.push({
        month: `${year}-${month}`,
        amount: monthlyRent,
        status: "Paid",
        paidAt: paymentDateTime,
        remarks: remarks || "Monthly rent payment",
      });

      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    // ✅ Update room with rent history
    const updatedRoomData = {
      ...room,
      rentHistory: [...existingHistory, ...newHistory],
      lastRentPayment: {
        amount,
        months: numberOfMonths,
        paidAt: paymentDateTime,
        remarks: remarks || "Monthly rent payment",
      },
    };

    const formData = new FormData();
    formData.append("roomData", JSON.stringify(updatedRoomData));

    const response = await buildingAPI.updateRoom(buildingId, roomId, formData);
    const updatedBuilding = response.data.data;

    setBuildings((prev) =>
      prev.map((b) => (b._id === buildingId ? updatedBuilding : b))
    );

    return {
      type: "rent",
      buildingId,
      unitId,
      unitNo: room.unitNo,
      tenantName: room.tenant?.name,
      amount,
      months: numberOfMonths,
      paidAt: paymentDateTime,
      remarks: remarks || "Monthly rent payment",
    };
  } catch (error) {
    console.error("Failed to pay rent:", error);
    throw error;
  }
};

  // ✅ Clear Rental - Fixed WITHOUT useRevenue hook
  const clearRental = async (buildingId, unitId, settlement) => {
    try {
      const {
        returnAmount = 0,
        forfeitAmount = 0,
        remarks = "",
        clearedAt = new Date().toISOString(),
      } = settlement;

      const building = buildings.find((b) => b._id === buildingId);
      if (!building) throw new Error("Building not found");

      const room = building.rooms?.find(
        (r) => r._id === unitId || r.id === unitId || String(r._id) === String(unitId)
      );
      if (!room) throw new Error("Room not found");

      const roomId = getRoomId(room);

      const securityHeld = Number(room.initialPayment?.securityReceived || 0);
      const returned = Number(returnAmount || 0);
      const forfeited = Number(forfeitAmount || 0);

      if (returned + forfeited !== securityHeld) {
        throw new Error("Security settlement amount must equal the security held.");
      }

      const tenantData = room.tenant
        ? {
            name: room.tenant.name || "Unknown",
            cnic: room.tenant.cnic || "N/A",
            phone: room.tenant.phone || "N/A",
            reference: room.tenant.reference || "",
            image: room.tenant.image || null,
            agreement: room.tenant.agreement || [],
          }
        : null;

      // ✅ Prepare updated room data
      const updatedRoomData = {
        ...room,
        status: "Available",
        purpose: null,
        rentStartDate: null,
        tenant: null,
        initialPayment: null,
        clearanceHistory: [
          ...(room.clearanceHistory || []),
          {
            id: Date.now(),
            type: "Rental Clearance",
            tenantName: tenantData?.name || "Unknown",
            tenantCnic: tenantData?.cnic || "N/A",
            tenantPhone: tenantData?.phone || "N/A",
            tenantReference: tenantData?.reference || "",
            tenantImage: tenantData?.image || null,
            agreement: tenantData?.agreement || [],
            monthlyRent: room.monthlyRent || 0,
            securityHeld,
            returnAmount: returned,
            forfeitAmount: forfeited,
            remarks: remarks || "Rental cleared",
            clearedAt,
          },
        ],
        securityHistory: [
          ...(room.securityHistory || []).map((item) => ({ ...item, archived: true })),
          ...(returned > 0
            ? [
                {
                  type: "returned",
                  amount: returned,
                  date: clearedAt,
                  note: `Security returned to customer. ${remarks || "Rental ended"}`,
                  archived: true,
                },
              ]
            : []),
          ...(forfeited > 0
            ? [
                {
                  type: "forfeited",
                  amount: forfeited,
                  date: clearedAt,
                  note: `Security forfeited. ${remarks || "Rental ended"}`,
                  archived: true,
                },
              ]
            : []),
        ],
        transactionHistory: [
          ...(room.transactionHistory || []),
          ...(returned > 0
            ? [
                {
                  id: `clear-return-${Date.now()}`,
                  type: "Security Returned",
                  category: "Security Refund",
                  amount: returned,
                  description: `Security returned to ${room.tenant?.name || "Unknown"} - Unit ${room.unitNo}`,
                  status: "Completed",
                  paidAt: clearedAt,
                  remarks: remarks || "Security returned after rental ended",
                },
              ]
            : []),
          ...(forfeited > 0
            ? [
                {
                  id: `clear-forfeit-${Date.now()}`,
                  type: "Security Forfeited",
                  category: "Security Income",
                  amount: forfeited,
                  description: `Security forfeited from ${room.tenant?.name || "Unknown"} - Unit ${room.unitNo}`,
                  status: "Received",
                  receivedAt: clearedAt,
                  remarks: remarks || "Security forfeited after rental ended",
                },
              ]
            : []),
        ],
      };

      // ✅ Send update to backend
      const formData = new FormData();
      formData.append("roomData", JSON.stringify(updatedRoomData));

      const response = await buildingAPI.updateRoom(buildingId, roomId, formData);
      const updatedBuilding = response.data.data;

      // ✅ Update frontend state
      setBuildings((prev) =>
        prev.map((b) => (b._id === buildingId ? updatedBuilding : b))
      );

      // ✅ Return the result WITHOUT calling revenue hooks here
      // Revenue will be handled by ClearRentalModal
      return {
        type: "rental-cleared",
        buildingId,
        unitId,
        unitNo: room.unitNo,
        tenantName: tenantData?.name || "Unknown",
        securityHeld,
        returned,
        forfeited,
        remarks: remarks || "Rental cleared",
        clearedAt,
      };
    } catch (error) {
      console.error("Failed to clear rental:", error);
      throw error;
    }
  };

  // Get unit transactions
  const getUnitTransactions = (buildingId, unitId) => {
    const building = buildings.find((b) => b._id === buildingId);
    if (!building) return [];

    const room = building.rooms?.find(
      (r) => r._id === unitId || r.id === unitId || String(r._id) === String(unitId)
    );
    if (!room) return [];

    return room.transactionHistory || [];
  };

  // Reset
  const resetBuildings = async () => {
    try {
      await loadBuildings();
    } catch (error) {
      console.error("Failed to reset buildings:", error);
    }
  };

  const value = useMemo(
    () => ({
      buildings,
      setBuildings,
      loading,
      error,
      loadBuildings,
      createBuilding,
      updateBuilding,
      deleteBuilding,
      getBuildingById,
      addRoom,
      updateRoom,
      deleteRoom,
      payRent,
      clearRental,
      getUnitTransactions,
      resetBuildings,
    }),
    [buildings, loading, error]
  );

  return (
    <BuildingContext.Provider value={value}>
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuildings() {
  const context = useContext(BuildingContext);
  if (!context) {
    throw new Error("useBuildings must be used inside BuildingProvider");
  }
  return context;
}