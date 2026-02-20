const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    loginId: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        sparse: true
    },
    phone: String,
    password: String,
    role: {
        type: String,
        enum: ['Marketing Team', 'Accounts Department', 'Maintenance Team', 'Customer Support', 'Custom'],
        default: 'Custom'
    },
    customRole: String, // For custom roles
    area: String,
    areaCode: String,
    city: String,
    locationCode: String,
    permissions: [String], // Array of permission strings
    parentLoginId: String, // For sub-employees
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for quick lookups
// Note: email and loginId already have indexes from unique constraint
employeeSchema.index({ area: 1, areaCode: 1 });
employeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
