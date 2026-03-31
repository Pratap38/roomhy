const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String },
	address: { type: String },
	city: { type: String },
	area: { type: String },
	propertyType: { type: String },
	monthlyRent: { type: Number, default: 0 },
	roomCount: { type: Number, default: 0 },
	bedCount: { type: Number, default: 0 },
	vacantRooms: { type: Number, default: 0 },
	occupiedRooms: { type: Number, default: 0 },
	occupiedBeds: { type: Number, default: 0 },
	ownerName: { type: String },
	ownerEmail: { type: String },
	ownerPhone: { type: String },
	locationCode: { type: String, required: true },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	ownerLoginId: { type: String },
	status: { type: String, enum: ['inactive','active','blocked'], default: 'inactive' },
	isPublished: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
