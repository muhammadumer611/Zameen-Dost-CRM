const Building = require('../models/Building');
const { recordIncome, recordSecurityReceived } = require('../utils/revenueLedger');

async function syncRoomPaymentsToRevenue(building, room, previousRoom = null) {
  try {
    if (!room || room.status !== 'Rented') return;

    // ✅ Detect fresh rental or tenant change (Refinement 2)
    const isFreshRental =
      !previousRoom ||
      (previousRoom.status !== 'Rented' && room.status === 'Rented') ||
      (previousRoom.tenant?.cnic && room.tenant?.cnic && previousRoom.tenant.cnic !== room.tenant.cnic);

    if (isFreshRental) {
      const securityAmount = Number(room.initialPayment?.securityReceived || 0);
      console.log(`🔒 Fresh Rental Security: ${securityAmount}`);

      if (securityAmount > 0) {
        await recordSecurityReceived({
          tenantName: room.tenant?.name || 'Tenant',
          unitNo: room.unitNo,
          buildingNo: building.buildingNo,
          buildingId: building._id,
          unitId: room._id || room.id,
          amount: securityAmount,
          description: `Security received from ${room.tenant?.name || 'Tenant'} - Unit ${room.unitNo}`,
          remarks: 'Initial security received',
          createdAt: room.initialPayment?.paymentDateTime || new Date().toISOString(),
        });
      }

      const rentAmount = Number(room.initialPayment?.rentPaid || 0);
      console.log(`💰 Fresh Rental Rent: ${rentAmount}`);

      if (rentAmount > 0) {
        await recordIncome({
          type: 'Rent',
          category: 'Monthly Rent',
          description: `Rent received from ${room.tenant?.name || 'Tenant'} - Unit ${room.unitNo}`,
          amount: rentAmount,
          source: 'Rent',
          buildingId: building._id,
          unitId: room._id || room.id,
          unitNo: room.unitNo,
          tenantName: room.tenant?.name || 'Tenant',
          status: 'Received',
          receivedAt: room.initialPayment?.paymentDateTime || new Date().toISOString(),
        });
      }
      return;
    }

    // ✅ Security Delta (initialPayment se) for existing active rental update
    const prevSecurity = Number(previousRoom?.initialPayment?.securityReceived || 0);
    const nextSecurity = Number(room.initialPayment?.securityReceived || 0);
    const securityDelta = nextSecurity - prevSecurity;
    console.log(`🔒 Security Delta: ${securityDelta} (prev: ${prevSecurity}, next: ${nextSecurity})`);

    if (securityDelta > 0) {
      await recordSecurityReceived({
        tenantName: room.tenant?.name || 'Tenant',
        unitNo: room.unitNo,
        buildingNo: building.buildingNo,
        buildingId: building._id,
        unitId: room._id || room.id,
        amount: securityDelta,
        description: `Security received from ${room.tenant?.name || 'Tenant'} - Unit ${room.unitNo}`,
        remarks: 'Additional security received',
        createdAt: room.initialPayment?.paymentDateTime || new Date().toISOString(),
      });
    }

    // ✅ Rent Delta (pehle rentHistory, phir initialPayment.rentPaid fallback)
    const prevRentFromHistory = (previousRoom?.rentHistory || [])
      .filter(item => item.status === 'Paid')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const nextRentFromHistory = (room.rentHistory || [])
      .filter(item => item.status === 'Paid')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    let rentDelta = nextRentFromHistory - prevRentFromHistory;

    if (rentDelta <= 0) {
      const prevRentPaid = Number(previousRoom?.initialPayment?.rentPaid || 0);
      const nextRentPaid = Number(room.initialPayment?.rentPaid || 0);
      rentDelta = nextRentPaid - prevRentPaid;
      console.log(`💰 Rent Delta (fallback): ${rentDelta} (prev: ${prevRentPaid}, next: ${nextRentPaid})`);
    } else {
      console.log(`💰 Rent Delta (history): ${rentDelta}`);
    }

    if (rentDelta > 0) {
      await recordIncome({
        type: 'Rent',
        category: 'Monthly Rent',
        description: `Rent received from ${room.tenant?.name || 'Tenant'} - Unit ${room.unitNo}`,
        amount: rentDelta,
        source: 'Rent',
        buildingId: building._id,
        unitId: room._id || room.id,
        unitNo: room.unitNo,
        tenantName: room.tenant?.name || 'Tenant',
        status: 'Received',
        receivedAt: room.initialPayment?.paymentDateTime || new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to sync room payments to revenue:', error);
  }
}
// ✅ Get all buildings
exports.getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find();
    res.status(200).json({
      success: true,
      count: buildings.length,
      data: buildings,
    });
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get single building
exports.getBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format. ID must be 24 characters.',
      });
    }

    const building = await Building.findById(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: building,
    });
  } catch (error) {
    console.error('Get building error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Create building
exports.createBuilding = async (req, res) => {
  try {
    const buildingData = req.body;

    if (buildingData.rooms && typeof buildingData.rooms === 'string') {
      buildingData.rooms = JSON.parse(buildingData.rooms);
    }

    const building = await Building.create(buildingData);

    res.status(201).json({
      success: true,
      message: 'Building created successfully.',
      data: building,
    });
  } catch (error) {
    console.error('Create building error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update building
exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format.',
      });
    }

    const building = await Building.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Building updated successfully.',
      data: building,
    });
  } catch (error) {
    console.error('Update building error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete building
exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format.',
      });
    }

    const building = await Building.findByIdAndDelete(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Building deleted successfully.',
    });
  } catch (error) {
    console.error('Delete building error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get single room
exports.getRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format.',
      });
    }

    const building = await Building.findById(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    const room = building.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Add room with file upload support
exports.addRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse roomData from FormData
    const roomData = typeof req.body.roomData === 'string'
      ? JSON.parse(req.body.roomData)
      : req.body;

    // Handle uploaded files
    if (req.files) {
      // Unit Image
      if (req.files.unitImage && req.files.unitImage[0]) {
        roomData.unitImage = `/uploads/unit-images/${req.files.unitImage[0].filename}`;
      }

      // Tenant Image
      if (req.files.tenantImage && req.files.tenantImage[0]) {
        if (!roomData.tenant) roomData.tenant = {};
        roomData.tenant.image = `/uploads/tenant-images/${req.files.tenantImage[0].filename}`;
      }

      // Agreement Files
      if (req.files.agreementFiles && req.files.agreementFiles.length > 0) {
        const newAgreements = req.files.agreementFiles.map(file => ({
          name: file.originalname,
          url: `/uploads/agreements/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype,
        }));
        const existing = roomData.tenant?.agreement || [];
        roomData.tenant = roomData.tenant || {};
        roomData.tenant.agreement = [...existing, ...newAgreements];
      }
    }

    // Validate building exists
    const building = await Building.findById(id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    // Add room
    building.rooms.push(roomData);
    building.totalUnits = building.rooms.length;
    await building.save();

    const savedRoom = building.rooms[building.rooms.length - 1];
    await syncRoomPaymentsToRevenue(building, savedRoom, null);

    res.status(201).json({
      success: true,
      message: 'Room added successfully.',
      data: building,
    });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update room with file upload support
// ✅ Update room - Fixed to handle roomData
// ✅ Update room - Fixed to handle null properly
// ✅ Update room - Preserve existing data
exports.updateRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format.',
      });
    }

    const building = await Building.findById(id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    const room = building.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    const previousRoom = room.toObject();

    // ✅ Parse roomData
    let updates = {};
    if (req.body.roomData) {
      try {
        updates = typeof req.body.roomData === 'string' 
          ? JSON.parse(req.body.roomData) 
          : req.body.roomData;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for roomData.',
        });
      }
    } else {
      updates = req.body;
    }

    // ✅ Handle file uploads
    if (req.files) {
      if (req.files.unitImage && req.files.unitImage[0]) {
        updates.unitImage = `/uploads/unit-images/${req.files.unitImage[0].filename}`;
      }
      if (req.files.tenantImage && req.files.tenantImage[0]) {
        if (!updates.tenant) updates.tenant = {};
        updates.tenant.image = `/uploads/tenant-images/${req.files.tenantImage[0].filename}`;
      }
      if (req.files.agreementFiles && req.files.agreementFiles.length > 0) {
        const newAgreements = req.files.agreementFiles.map(file => ({
          name: file.originalname,
          url: `/uploads/agreements/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype,
        }));
        const existing = updates.tenant?.agreement || room.tenant?.agreement || [];
        if (!updates.tenant) updates.tenant = {};
        updates.tenant.agreement = [...existing, ...newAgreements];
      }
    }

    // ✅ Preserve history fields if not being updated
    const historyFields = ['rentHistory', 'securityHistory', 'clearanceHistory', 'transactionHistory'];
    historyFields.forEach(field => {
      if (!updates[field] && room[field]) {
        updates[field] = room[field];
      }
    });

    // ✅ Preserve tenant data if not being overwritten
    if (!updates.tenant && room.tenant) {
      updates.tenant = room.tenant;
    }

    // ✅ Preserve initialPayment if not being overwritten
    if (!updates.initialPayment && room.initialPayment) {
      updates.initialPayment = room.initialPayment;
    }

    // ✅ Apply updates with null handling
    Object.keys(updates).forEach(key => {
      if (key === 'tenant') {
        if (updates[key] === null) {
          room.tenant = null;
        } else if (typeof updates[key] === 'object') {
          room.tenant = { ...(room.tenant || {}), ...updates[key] };
        }
      } else if (key === 'initialPayment') {
        if (updates[key] === null) {
          room.initialPayment = null;
        } else if (typeof updates[key] === 'object') {
          room.initialPayment = { ...(room.initialPayment || {}), ...updates[key] };
        }
      } else {
        room[key] = updates[key];
      }
    });

    await building.save();

    if (!updates.skipRevenueSync) {
      await syncRoomPaymentsToRevenue(building, building.rooms.id(roomId), previousRoom);
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully.',
      data: building,
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid building ID format.',
      });
    }

    const building = await Building.findById(id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    building.rooms.pull({ _id: roomId });
    building.totalUnits = building.rooms.length;
    await building.save();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully.',
      data: building,
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};