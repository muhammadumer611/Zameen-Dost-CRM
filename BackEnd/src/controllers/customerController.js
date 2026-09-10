const Customer = require('../models/Customer');

// ✅ Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Filter by status
    if (status && status !== 'All') {
      query['currentRental.status'] = status;
    }

    // Search by name, phone, cnic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { 'currentRental.unitNo': { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get single customer
exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Create customer
exports.createCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    
    // Check if customer already exists with same CNIC
    const existingCustomer = await Customer.findOne({ cnic: customerData.cnic });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this CNIC.',
      });
    }

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const customer = await Customer.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add rent payment
exports.addRentPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    customer.rentHistory.push(paymentData);
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Rent payment added successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add security transaction
exports.addSecurityTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transactionData = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // ✅ Push new transaction
    customer.securityHistory.push(transactionData);
    
    // ✅ Update currentRental security status based on transaction
    if (transactionData.type === 'received') {
      customer.currentRental.security = (customer.currentRental.security || 0) + Number(transactionData.amount || 0);
      customer.currentRental.status = 'Active';
    } else if (transactionData.type === 'returned') {
      customer.currentRental.security = Math.max((customer.currentRental.security || 0) - Number(transactionData.amount || 0), 0);
      customer.currentRental.status = 'Inactive';
    } else if (transactionData.type === 'forfeited') {
      customer.currentRental.security = Math.max((customer.currentRental.security || 0) - Number(transactionData.amount || 0), 0);
      customer.currentRental.status = 'Inactive';
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Security transaction added successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add document
exports.addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const documentData = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    customer.documents.push(documentData);
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Document added successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update document
exports.updateDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const updates = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const docIndex = customer.documents.findIndex(d => d.id === docId);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    customer.documents[docIndex] = { ...customer.documents[docIndex], ...updates };
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    customer.documents = customer.documents.filter(d => d.id !== docId);
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add note
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const noteData = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    customer.notes.push(noteData);
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get customers by status
exports.getCustomersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const customers = await Customer.find({ 'currentRental.status': status });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get customer by unit
exports.getCustomerByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const customer = await Customer.findOne({ 'currentRental.unitId': Number(unitId) });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found for this unit.',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};