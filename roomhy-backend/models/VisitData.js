const mongoose = require('mongoose');

const VisitDataSchema = new mongoose.Schema({
    visitId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    
    // Visitor/Staff Information
    visitorName: String,
    visitorEmail: String,
    visitorPhone: String,
    staffName: String,
    staffId: String,
    
    // Property Information
    propertyName: String,
    propertyType: String,
    city: String,
    area: String,
    address: String,
    pincode: String,
    landmark: String,
    nearbyLocation: String,
    
    // Details
    description: String,
    amenities: [String],
    genderSuitability: String,
    gender: String,
    monthlyRent: Number,
    deposit: String,
    
    // Owner Information
    ownerName: String,
    ownerEmail: String,
    ownerPhone: String,
    ownerCity: String,
    contactPhone: String,
    
    // Photos
    photos: [String],
    professionalPhotos: [String],
    
    // Ratings and Reviews
    studentReviewsRating: Number,
    studentReviews: String,
    employeeRating: Number,
    cleanlinessRating: Number,
    cleanliness: String,
    ownerBehaviour: String,
    ownerBehaviourPublic: String,
    
    // Property Features
    furnishing: String,
    ventilation: String,
    minStay: String,
    entryExit: String,
    visitorsAllowed: Boolean,
    cookingAllowed: Boolean,
    smokingAllowed: Boolean,
    petsAllowed: Boolean,
    
    // Internal Notes
    internalRemarks: String,
    cleanlinessNote: String,
    
    // Location
    latitude: Number,
    longitude: Number,
    
    // Status
    status: {
        type: String,
        enum: ['submitted', 'pending_review', 'pending', 'approved', 'rejected', 'hold'],
        default: 'submitted',
        index: true
    },
    
    // Approval Information
    approvedAt: Date,
    approvalNotes: String,
    approvedBy: String,
    holdReason: String,
    holdAction: {
        type: String,
        enum: ['edit', 'none', ''],
        default: ''
    },
    holdAt: Date,
    rejectReason: String,
    rejectAction: {
        type: String,
        enum: ['reupload', 'cancel', ''],
        default: ''
    },
    rejectedAt: Date,
    generatedCredentials: {
        loginId: String,
        tempPassword: String
    },
    isLiveOnWebsite: {
        type: Boolean,
        default: false
    },
    
    // Property Info Object (for backward compatibility)
    propertyInfo: mongoose.Schema.Types.Mixed,
    
    // Metadata
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-update updatedAt on save
VisitDataSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('VisitData', VisitDataSchema);
