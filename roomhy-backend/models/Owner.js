const mongoose = require('mongoose');

const parseArrayInput = (value) => {
    // If already an array, return as-is
    if (Array.isArray(value)) return value;
    
    // If string, try to parse it
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        
        try {
            // Try JSON.parse first
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (parseErr) {
            // If JSON.parse fails, try to extract array from string representation
            // This handles cases where the array was converted to string via concatenation
            try {
                // Check if it looks like a stringified array representation
                if (trimmed.startsWith('[') || trimmed.includes('id:')) {
                    // Try to evaluate it (risky but necessary for some edge cases)
                    const match = trimmed.match(/^\[([\s\S]*)\]$/);
                    if (match) {
                        // Attempt to construct valid JSON from the content
                        const content = match[1];
                        // Look for object patterns and try to parse
                        const objMatches = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                        if (objMatches && objMatches.length > 0) {
                            try {
                                // Try to parse as array of objects
                                const reconstructed = '[' + objMatches.join(',') + ']';
                                const reParsed = JSON.parse(reconstructed);
                                return Array.isArray(reParsed) ? reParsed : [];
                            } catch (_) {}
                        }
                    }
                }
            } catch (_) {}
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

// Pre-save hook to ensure roomInventory is properly formatted
ownerSchema.pre('save', function(next) {
    try {
        // Ensure roomInventory is an array
        if (this.roomInventory) {
            const roomInv = this.roomInventory;
            // If it's a string, parse it
            if (typeof roomInv === 'string') {
                this.roomInventory = parseArrayInput(roomInv);
            }
            // If it's an array, ensure each element is valid
            else if (Array.isArray(roomInv)) {
                this.roomInventory = roomInv.map(room => {
                    if (typeof room === 'string') {
                        try {
                            return JSON.parse(room);
                        } catch (_) {
                            return room;
                        }
                    }
                    return room;
                });
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Owner', ownerSchema);
