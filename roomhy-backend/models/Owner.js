const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    loginId: { type: String, required: true, unique: true },
    // Top-level fields for backward compatibility
    name: String,
    email: String,
    phone: String,
    address: String,
    locationCode: String, // e.g. area code like 'KO', 'IN'
    area: String, // human-friendly area name (Koramangala, Indiranagar)
    // Nested profile object (preferred structure)
    profile: {
        name: String,
        email: String,
        phone: String,
        address: String,
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
