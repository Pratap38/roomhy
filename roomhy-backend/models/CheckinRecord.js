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

const fileSchema = new mongoose.Schema(
    {
        name: String,
        type: String,
        size: Number,
        dataUrl: String
    },
    { _id: false }
);

const bedSchema = new mongoose.Schema(
    {
        status: { type: String, enum: ['available', 'occupied'], default: 'available' },
        tenantId: String,
        tenantName: String
    },
    { _id: false }
);

const roomInventorySchema = new mongoose.Schema(
    {
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
        beds: [bedSchema]
    },
    { _id: false }
);

const checkinRecordSchema = new mongoose.Schema(
    {
        loginId: { type: String, required: true, trim: true, uppercase: true },
        role: { type: String, enum: ['owner', 'tenant'], required: true },

        ownerProfile: {
            name: String,
            dob: String,
            email: String,
            phone: String,
            address: String,
            area: String,
            password: String,
            payment: {
                bankAccountNumber: String,
                ifscCode: String,
                accountHolderName: String,
                bankName: String,
                branchName: String,
                upiId: String,
                cancelledCheque: fileSchema
            },
            vacantRooms: { type: Number, default: 0 },
            vacantBeds: { type: Number, default: 0 },
            occupiedRooms: { type: Number, default: 0 },
            occupiedBeds: { type: Number, default: 0 },
            roomCount: { type: Number, default: 0 },
            bedCount: { type: Number, default: 0 },
            roomInventory: {
                type: [roomInventorySchema],
                default: [],
                set: parseArrayInput
            }
        },
        ownerKyc: {
            aadhaarLinkedPhone: String,
            aadhaarNumber: String,
            otpVerified: { type: Boolean, default: false }
        },
        ownerTermsAcceptedAt: Date,
        ownerAgreement: {
            provider: String,
            aadhaarNumber: String,
            requestId: String,
            signUrl: String,
            status: String,
            initiatedAt: Date,
            signedAt: Date,
            completedAt: Date,
            callbackPayload: mongoose.Schema.Types.Mixed
        },
        ownerFinalVerified: { type: Boolean, default: false },
        ownerSubmittedAt: Date,

        tenantProfile: {
            name: String,
            dob: String,
            guardianNumber: String,
            moveInDate: String,
            email: String
        },
        tenantKyc: {
            aadhaarLinkedPhone: String,
            aadhaarNumber: String,
            aadhaarFront: fileSchema,
            aadhaarBack: fileSchema,
            otpVerified: { type: Boolean, default: false }
        },
        tenantAgreement: {
            eSignName: String,
            acceptedAt: Date,
            provider: String,
            requestId: String,
            signUrl: String,
            status: String,
            initiatedAt: Date,
            signedAt: Date,
            completedAt: Date,
            callbackPayload: mongoose.Schema.Types.Mixed
        },
        tenantSubmittedAt: Date
    },
    { timestamps: true }
);

checkinRecordSchema.index({ loginId: 1, role: 1 }, { unique: true });

// Pre-save hook to ensure roomInventory is properly formatted
checkinRecordSchema.pre('save', function(next) {
    try {
        // Ensure ownerProfile.roomInventory is an array
        if (this.ownerProfile && this.ownerProfile.roomInventory) {
            const roomInv = this.ownerProfile.roomInventory;
            // If it's a string, parse it
            if (typeof roomInv === 'string') {
                this.ownerProfile.roomInventory = parseArrayInput(roomInv);
            }
            // If it's an array, ensure each element is valid
            else if (Array.isArray(roomInv)) {
                this.ownerProfile.roomInventory = roomInv.map(room => {
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

module.exports = mongoose.model('CheckinRecord', checkinRecordSchema);
