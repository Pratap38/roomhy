const Room = require('../models/Room');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const User = require('../models/user');

// Owner adds a room to their property. Room is created with status 'inactive'.
exports.createRoom = async (req, res) => {
    try {
        const propertyId = req.body.propertyId || req.body.property;
        const title = req.body.title || req.body.number || req.body.roomNo;
        const type = req.body.type || req.body.roomType || 'AC';
        const beds = Number(req.body.beds || req.body.capacity || 1);
        const price = Number(req.body.price || req.body.rent || req.body.roomRent || 0);
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Auth required' });
        if (user.role !== 'owner') return res.status(403).json({ message: 'Only owners can add rooms' });
        if (!propertyId) return res.status(400).json({ message: 'Property ID is required' });
        if (!title || !String(title).trim()) return res.status(400).json({ message: 'Room title is required' });

        const property = await Property.findById(propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        const ownerMatches =
            (property.owner && property.owner.toString() === user._id.toString()) ||
            (property.ownerLoginId && String(property.ownerLoginId).toUpperCase() === String(user.loginId || '').toUpperCase());
        if (!ownerMatches) {
            return res.status(403).json({ message: 'You can only add rooms to your assigned property' });
        }

        const room = await Room.create({
            property: propertyId,
            title: String(title).trim(),
            type: String(type).trim() || 'AC',
            beds: Number.isFinite(beds) && beds > 0 ? beds : 1,
            price: Number.isFinite(price) && price >= 0 ? price : 0,
            createdBy: user._id,
            status: 'inactive'
        });

        // Notify superadmins and area manager
        const notifications = [];
        const superAdmins = await User.find({ role: 'superadmin' }).lean();
        superAdmins.forEach(sa => notifications.push(Notification.create({ recipient: sa._id, type: 'room_added', message: `New room added to ${property.title}`, meta: { roomId: room._id, propertyId } })));
        if (property.owner) {
            // Also notify area manager(s) via VisitReport areaManager if available (best effort)
            // For simplicity, notify property.owner as well (owner will see their own action)
            notifications.push(Notification.create({ recipient: property.owner, type: 'room_added_owner', message: `Room added: ${title}`, meta: { roomId: room._id } }));
        }
        await Promise.all(notifications);

        return res.status(201).json({ success: true, room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
