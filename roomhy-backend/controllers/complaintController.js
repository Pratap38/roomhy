const Complaint = require('../models/Complaint');

// ── GET complaints for a specific tenant ──────────────────────────────────────
exports.getTenantComplaints = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const complaints = await Complaint.find({ tenantId }).sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (err) {
        console.error("Get Tenant Complaints Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET all complaints (superadmin) OR owner's complaints via query param ─────
// Usage:
//   /api/complaints              → all (superadmin)
//   /api/complaints?ownerLoginId=ROOMHY12345  → owner panel
exports.getAllComplaints = async (req, res) => {
    try {
        const { ownerLoginId } = req.query;

        // If ownerLoginId provided → filter for that owner only
        const filter = ownerLoginId ? { ownerLoginId } : {};

        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (err) {
        console.error("Get All Complaints Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── POST create new complaint (from tenant) ───────────────────────────────────
exports.createComplaint = async (req, res) => {
    try {
        const {
            tenantId,
            tenantLoginId,
            tenantName,
            tenantPhone,
            tenantEmail,
            property,
            propertyId,
            ownerLoginId,   // ← NEW: needed for owner panel filtering
            roomNo,
            bedNo,
            category,
            description,
            priority
        } = req.body;

        const complaint = new Complaint({
            tenantId,
            tenantLoginId:  tenantLoginId  || '',
            tenantName:     tenantName     || 'Unknown',
            tenantPhone:    tenantPhone    || 'N/A',
            tenantEmail:    tenantEmail    || '',
            property:       property       || 'N/A',
            propertyId:     propertyId     || '',
            ownerLoginId:   ownerLoginId   || '',   // ← saved for filtering
            roomNo:         roomNo         || 'N/A',
            bedNo:          bedNo          || 'N/A',
            category:       category       || 'Other',
            description,
            priority:       priority       || 'Low',
            status:         'Open',
            escalated:      false,
            createdAt:      new Date()
        });

        await complaint.save();

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            complaint
        });
    } catch (err) {
        console.error("Create Complaint Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── PUT update complaint status (owner + superadmin) ─────────────────────────
// Also handles escalation flag clearing when resolved
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolvedAt, escalated } = req.body;

        const updateFields = {
            status,
            updatedAt: new Date()
        };

        // Set resolvedAt when marking as Resolved
        if (status === 'Resolved') {
            updateFields.resolvedAt = resolvedAt || new Date();
            updateFields.escalated  = false; // clear escalation on resolve
        }

        // Allow superadmin to manually set/clear escalated flag
        if (typeof escalated !== 'undefined') {
            updateFields.escalated = escalated;
            if (escalated === true) {
                updateFields.escalatedAt = new Date();
            }
        }

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, message: 'Complaint updated', complaint });
    } catch (err) {
        console.error("Update Complaint Status Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── PUT owner response ────────────────────────────────────────────────────────
// NEW: Owner can reply to a complaint — tenant sees this response
exports.updateOwnerResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerResponse } = req.body;

        if (!ownerResponse || !ownerResponse.trim()) {
            return res.status(400).json({ success: false, message: 'Response text is required' });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { $set: { ownerResponse: ownerResponse.trim(), updatedAt: new Date() } },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, message: 'Response saved', complaint });
    } catch (err) {
        console.error("Update Owner Response Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE complaint ──────────────────────────────────────────────────────────
exports.deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        const complaint = await Complaint.findByIdAndDelete(id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, message: 'Complaint deleted successfully' });
    } catch (err) {
        console.error("Delete Complaint Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── AUTO ESCALATION JOB (call this from server.js on startup) ────────────────
// Runs every 6 hours, flags complaints older than 5 days as escalated
const ESCALATION_DAYS = 5;
const CHECK_INTERVAL_HOURS = 6;

exports.startEscalationJob = () => {
    const run = async () => {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - ESCALATION_DAYS);

            const result = await Complaint.updateMany(
                {
                    status:    { $nin: ['Resolved', 'Rejected'] },
                    escalated: { $ne: true },
                    createdAt: { $lte: cutoff }
                },
                {
                    $set: {
                        escalated:   true,
                        escalatedAt: new Date()
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[EscalationJob] ✅ Escalated ${result.modifiedCount} complaint(s) at ${new Date().toISOString()}`);
            }
        } catch (err) {
            console.error('[EscalationJob] ❌ Error:', err.message);
        }
    };

    run(); // run once on startup
    setInterval(run, CHECK_INTERVAL_HOURS * 60 * 60 * 1000);
    console.log(`[EscalationJob] Started — every ${CHECK_INTERVAL_HOURS}h, threshold ${ESCALATION_DAYS} days`);
};