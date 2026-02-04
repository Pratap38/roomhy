const mongoose = require('mongoose');

const ApprovedPropertySchema = new mongoose.Schema({
    visitId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    propertyInfo: {
        name: { type: String, required: true },
        address: { type: String },
        city: { type: String, index: true },
        area: { type: String },
        photos: [{ type: String }],
        ownerGmail: { type: String },
        ownerName: { type: String },
        ownerPhone: { type: String },
        ownerEmail: { type: String },
        rent: { type: Number },
        deposit: { type: String },
        description: { type: String },
        amenities: [{ type: String }],
        genderSuitability: { type: String },
        propertyType: { type: String }
    },
    professionalPhotos: [{ type: String }],
    generatedCredentials: {
        loginId: { type: String },
        tempPassword: { type: String }
    },
    isLiveOnWebsite: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        enum: ['approved', 'live', 'offline'],
        default: 'approved',
        index: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    approvedBy: { type: String },
    bannerPhoto: { type: String },
    websiteBannerPhoto: { type: String },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ApprovedPropertySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('ApprovedProperty', ApprovedPropertySchema);
