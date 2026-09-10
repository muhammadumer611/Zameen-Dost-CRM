"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { customerAPI } from "@/lib/api";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Load customers from API on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // ✅ Load all active customers
  const loadCustomers = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = { status: "Active", ...params };
      const response = await customerAPI.getAll(queryParams);
      const list = response.data.data || [];
      const activeOnly = params.status && params.status !== "Active"
        ? list
        : list.filter((c) => !c.currentRental || c.currentRental.status === "Active");
      setCustomers(activeOnly);
      setError(null);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setError(error.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load customers by status
  const loadCustomersByStatus = async (status) => {
    try {
      setLoading(true);
      const response = await customerAPI.getByStatus(status);
      setCustomers(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error("Failed to load customers by status:", error);
      setError(error.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get customer by ID
  const getCustomerById = async (id) => {
    try {
      const response = await customerAPI.getById(id);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get customer:", error);
      throw error;
    }
  };

  // ✅ Get customer by unit
  const getCustomerByUnit = async (unitId) => {
    try {
      const response = await customerAPI.getByUnit(unitId);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get customer by unit:", error);
      throw error;
    }
  };

  // ✅ Create customer
  const createCustomer = async (customerData) => {
    try {
      const response = await customerAPI.create(customerData);
      const newCustomer = response.data.data;
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  };

  // ✅ Update customer
  const updateCustomer = async (id, customerData) => {
    try {
      const response = await customerAPI.update(id, customerData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === id ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  };

  // ✅ Delete customer
  const deleteCustomer = async (id) => {
    try {
      await customerAPI.delete(id);
      setCustomers(prev => prev.filter(c => c._id !== id));
    } catch (error) {
      console.error("Failed to delete customer:", error);
      throw error;
    }
  };

  // ✅ Add rent payment
  const addRentPayment = async (customerId, paymentData) => {
    try {
      const response = await customerAPI.addRentPayment(customerId, paymentData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to add rent payment:", error);
      throw error;
    }
  };

  // ✅ Add security transaction
  const addSecurityTransaction = async (customerId, transactionData) => {
    try {
      const response = await customerAPI.addSecurityTransaction(customerId, transactionData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to add security transaction:", error);
      throw error;
    }
  };

  // ✅ Add document
  const addDocument = async (customerId, documentData) => {
    try {
      const response = await customerAPI.addDocument(customerId, documentData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to add document:", error);
      throw error;
    }
  };

  // ✅ Update document
  const updateDocument = async (customerId, docId, documentData) => {
    try {
      const response = await customerAPI.updateDocument(customerId, docId, documentData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    }
  };

  // ✅ Delete document
  const deleteDocument = async (customerId, docId) => {
    try {
      const response = await customerAPI.deleteDocument(customerId, docId);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

  // ✅ Add note
  const addNote = async (customerId, noteData) => {
    try {
      const response = await customerAPI.addNote(customerId, noteData);
      const updatedCustomer = response.data.data;
      setCustomers(prev => prev.map(c => c._id === customerId ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error("Failed to add note:", error);
      throw error;
    }
  };

  // ✅ Get customers summary
  const getCustomerSummary = () => {
    const total = customers.length;
    const active = customers.filter(c => c.currentRental?.status === "Active").length;
    const inactive = customers.filter(c => c.currentRental?.status === "Inactive").length;
    const pending = customers.filter(c => c.currentRental?.status === "Pending").length;

    // Calculate total security held
    const totalSecurity = customers
      .filter(c => c.currentRental?.status === "Active")
      .reduce((sum, c) => sum + (c.currentRental?.security || 0), 0);

    return { total, active, inactive, pending, totalSecurity };
  };

  const value = useMemo(
    () => ({
      customers,
      setCustomers,
      loading,
      error,
      loadCustomers,
      loadCustomersByStatus,
      getCustomerById,
      getCustomerByUnit,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      addRentPayment,
      addSecurityTransaction,
      addDocument,
      updateDocument,
      deleteDocument,
      addNote,
      getCustomerSummary,
    }),
    [customers, loading, error]
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomers must be used inside CustomerProvider");
  }
  return context;
};