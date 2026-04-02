const mongoose = require('mongoose');

const parseArrayInput = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }
    return [];
};

const ownerSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true },
    // Top-level fields for backward compatibility
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    locationCode: String, // e.g. area code like 'KO', 'IN'
    area: String, // human-friendly area name (Koramangala, Indiranagar)
    // Nested profile object (preferred structure)
    profile: {
        name: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        locationCode: String,
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        branchName: String,
        updatedAt: Date 
    },
    credentials: {
        password: String,
        firstTime: { type: Boolean, default: false }
    },
    kyc: {
        status: { type: String, default: 'pending' },
        aadharNumber: String,
        documentImage: String,
        verifiedAt: Date,
        submittedAt: Date
    }, // Digital Check-In fields (with "checkin" prefix for frontend display)
    checkinDob: String,
    checkinPhone: String,
    checkinAddress: String,
    checkinArea: String,
    checkinPassword: String,
    checkinAadhaarLinkedPhone: String,
    checkinAadhaarNumber: String,
    checkinAccountHolderName: String,
    checkinUpiId: String,
    checkinBankAccountNumber: String,
    checkinIfscCode: String,
    checkinBankName: String,
    checkinBranchName: String,
    roomCount: { type: Number, default: 0 },
    bedCount: { type: Number, default: 0 },
    vacantRooms: { type: Number, default: 0 },
    vacantBeds: { type: Number, default: 0 },
    occupiedRooms: { type: Number, default: 0 },
    occupiedBeds: { type: Number, default: 0 },
    roomInventory: {
        type: [{
        id: String,
        propertyId: String,
        propertyTitle: String,
        number: String,
        roomNo: String,
        title: String,
        type: String,
        roomType: String,
        rent: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        gender: String,
        beds: [{
            status: { type: String, enum: ['available', 'occupied'], default: 'available' },
            tenantId: String,
            tenantName: String
        }]
    }],
        default: [],
        set: parseArrayInput
    },
    agreementRequestId: String,
    agreementStatus: String,
    agreementSignedAt: Date,
    checkinCancelledCheque: {
        name: String,
        mimeType: String,  // Changed from "type" to avoid Mongoose keyword conflict
        size: Number,
        dataUrl: String
    },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Owner', ownerSchema);
