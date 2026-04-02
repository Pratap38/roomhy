const mongoose = require('mongoose');

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
            roomInventory: [roomInventorySchema]
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

module.exports = mongoose.model('CheckinRecord', checkinRecordSchema);
