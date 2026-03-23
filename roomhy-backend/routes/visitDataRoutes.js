const express = require('express');
const router = express.Router();
const VisitData = require('../models/VisitData');
const User = require('../models/user');
const Owner = require('../models/Owner');
const CheckinRecord = require('../models/CheckinRecord');
const Property = require('../models/Property');
const mailer = require('../utils/mailer');
const { notifySuperadmin } = require('../utils/superadminNotifier');

const APP_URL = process.env.APP_URL || process.env.APP_BASE_URL || process.env.WEB_APP_URL || 'https://app.roomhy.com';
const DIGITAL_CHECKIN_URL = process.env.DIGITAL_CHECKIN_URL || process.env.FRONTEND_URL || 'https://admin.roomhy.com';

// Helper function to convert string to boolean
function stringToBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'yes';
    }
    return false;
}

// Owner login ID format: ROOMHY + 4 digits (e.g., ROOMHY1234)
const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4}$/i;

function buildOwnerLoginId() {
    const n = Math.floor(Math.random() * 10000); // 0-9999
    return `ROOMHY${String(n).padStart(4, '0')}`;
}

function normalizeOwnerLoginId(raw) {
    const id = (raw || '').toString().trim().toUpperCase();
    if (!OWNER_LOGIN_ID_REGEX.test(id)) return '';
    return id;
}

async function isOwnerLoginIdTaken(loginId) {
    const id = (loginId || '').toString().trim().toUpperCase();
    if (!id) return true;

    const [owner, user, visit] = await Promise.all([
        Owner.findOne({ loginId: id }).select('_id').lean(),
        User.findOne({ loginId: id }).select('_id').lean(),
        VisitData.findOne({ 'generatedCredentials.loginId': id }).select('_id').lean()
    ]);

    return !!(owner || user || visit);
}

async function generateUniqueOwnerLoginId(maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const candidate = buildOwnerLoginId();
        // eslint-disable-next-line no-await-in-loop
        const taken = await isOwnerLoginIdTaken(candidate);
        if (!taken) return candidate;
    }
    throw new Error('Unable to generate unique owner login ID');
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// POST: Save visit data (used by visit.html)
// ============================================================
router.post('/', async (req, res) => {
    try {
        const visitData = req.body;
        console.log('?? [visits/POST] Received data visitId:', visitData._id || visitData.visitId);

        // Process the data to handle type conversions
        const processedData = { ...visitData };
        
        // Remove _id if present (MongoDB will generate it)
        delete processedData._id;

        // Convert boolean fields from strings to booleans
        processedData.visitorsAllowed = stringToBoolean(processedData.visitorsAllowed);
        processedData.cookingAllowed = stringToBoolean(processedData.cookingAllowed);
        processedData.smokingAllowed = stringToBoolean(processedData.smokingAllowed);
        processedData.petsAllowed = stringToBoolean(processedData.petsAllowed);

        // Generate visitId if not provided
        // Use _id from frontend as visitId (it comes as _id from visit.html)
        const visitId = processedData.visitId || visitData._id || ('v_' + Date.now());

        // Create new visit document - let MongoDB generate _id, use visitId for consistency
        const newVisit = new VisitData({
            ...processedData,
            visitId: visitId,  // Use visitId as custom field (not _id)
            submittedAt: new Date(),
            status: processedData.status || 'submitted'
        });

        console.log('?? [visits/POST] Saving visit with visitId:', visitId);
        console.log('?? [visits/POST] Visit fields:', Object.keys(newVisit.toObject()).slice(0, 10).join(', '));
        await newVisit.save();

        try {
            await notifySuperadmin({
                type: 'new_enquiry',
                from: 'area_manager',
                subject: `New Visit Enquiry - ${newVisit.propertyName || 'Property'}`,
                message: 'A new visit enquiry was submitted and is pending review.',
                meta: {
                    enquiryId: newVisit.visitId || String(newVisit._id || ''),
                    userName: newVisit.ownerName || newVisit.visitorName || '',
                    userEmail: newVisit.ownerEmail || newVisit.visitorEmail || '',
                    propertyName: newVisit.propertyName || '',
                    city: newVisit.city || '',
                    area: newVisit.area || ''
                }
            });
        } catch (notifyErr) {
            console.warn('visit create notification failed:', notifyErr.message);
        }

        console.log('? [visits/POST] Visit saved to MongoDB:', newVisit._id, 'visitId:', visitId);

        res.status(201).json({
            success: true,
            message: 'Visit saved successfully',
            visit: newVisit
        });

    } catch (error) {
        console.error('? [visits/POST] Error saving visit:', error.message);
        console.error('? [visits/POST] Error stack:', error.stack);
        
        // Check for duplicate visitId error
        if (error.code === 11000) {
            console.error('? [visits/POST] Duplicate key error. Field:', Object.keys(error.keyValue || {}));
            return res.status(409).json({
                success: false,
                message: 'Visit with this ID already exists',
                error: 'Duplicate visitId'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error saving visit',
            error: error.message
        });
    }
});

// ============================================================
// GET: Root endpoint - returns all visits (alias for /all)
// Used by Area Manager dashboard
// Supports optional ?staffId parameter to filter by staff
// ============================================================
router.get('/', async (req, res) => {
    try {
        const staffId = req.query.staffId;
        const staffName = (req.query.staffName || '').toString().trim();

        let query = {};
        if (staffId || staffName) {
            const or = [];
            if (staffId) {
                const escapedId = String(staffId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const idRegex = new RegExp(`^${escapedId}$`, 'i');
                or.push(
                    { staffId: idRegex },
                    { submittedById: idRegex },
                    { submittedByLoginId: idRegex },
                    { ownerLoginId: idRegex }
                );
            }
            if (staffName) {
                const escapedName = staffName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const nameRegex = new RegExp(`^${escapedName}$`, 'i');
                or.push(
                    { staffName: nameRegex },
                    { submittedBy: nameRegex },
                    { visitorName: nameRegex }
                );
            }
            query = or.length ? { $or: or } : {};
            console.log('[visits/GET] Fetching visits for staff filter:', { staffId, staffName });
        } else {
            console.log('[visits/GET] Fetching all visits');
        }
        
        const visits = await VisitData.find(query).sort({ submittedAt: -1 });
        
        console.log(`? [visits/GET] Returning ${visits.length} visits`);
        
        res.json({
            success: true,
            count: visits.length,
            visits: visits
        });
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching visits',
            error: error.message
        });
    }
});

// ============================================================
// GET: Pending visits (for superadmin enquiry)
// ============================================================
router.get('/pending', async (req, res) => {
    try {
        const visits = await VisitData.find({
            status: { $in: ['submitted', 'pending_review'] }
        }).sort({ submittedAt: -1 });

        console.log(`? [visits/pending] Returning ${visits.length} pending visits`);

        res.json({
            success: true,
            count: visits.length,
            visits: visits
        });
    } catch (error) {
        console.error('Error fetching pending visits:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending visits',
            error: error.message
        });
    }
});

// ============================================================
// POST: Approve a visit
// ============================================================
router.post('/approve', async (req, res) => {
    try {
        const { visitId, status, isLiveOnWebsite, loginId, tempPassword } = req.body;
        console.log('?? [visits/approve] Received request:', { visitId, status, isLiveOnWebsite });

        if (!visitId) {
            console.error('? [visits/approve] Missing visitId in request body');
            return res.status(400).json({
                success: false,
                message: 'Missing visitId'
            });
        }

        // Enforce login ID format ROOMHY + 4 digits and ensure uniqueness
        const requestedLoginId = normalizeOwnerLoginId(loginId);
        let finalLoginId = requestedLoginId;
        if (!finalLoginId || await isOwnerLoginIdTaken(finalLoginId)) {
            finalLoginId = await generateUniqueOwnerLoginId();
        }
        const finalPassword = tempPassword || Math.random().toString(36).slice(-8);

        console.log('?? [visits/approve] Finding visit by visitId:', visitId);
        
        // Build query - check if visitId is a valid MongoDB ObjectId or a timestamp-based ID
        const mongoose = require('mongoose');
        let query;
        if (mongoose.Types.ObjectId.isValid(visitId) && visitId.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a valid ObjectId
            query = { $or: [{ _id: visitId }, { visitId: visitId }] };
        } else {
            // It's a timestamp-based ID like v_1234567890, search by visitId field only
            query = { visitId: visitId };
        }
        
        // Find and update visit status to approved
        const visit = await VisitData.findOneAndUpdate(
            query,
            {
                status: status || 'approved',
                approvedAt: new Date(),
                isLiveOnWebsite: isLiveOnWebsite !== undefined ? isLiveOnWebsite : false,
                generatedCredentials: {
                    loginId: finalLoginId,
                    tempPassword: finalPassword
                }
            },
            { new: true }
        );

        if (!visit) {
            console.error('? [visits/approve] Visit not found:', visitId);
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        console.log('? [visits/approve] Visit found and updated:', visit._id);

        const ownerName =
            visit.ownerName ||
            (visit.propertyInfo && visit.propertyInfo.ownerName) ||
            'Owner';
        const ownerEmailFromVisit =
            visit.ownerEmail ||
            (visit.propertyInfo && (visit.propertyInfo.ownerEmail || visit.propertyInfo.ownerGmail)) ||
            '';
        const ownerPhone =
            visit.ownerPhone ||
            visit.contactPhone ||
            (visit.propertyInfo && visit.propertyInfo.contactPhone) ||
            '';
        const ownerAddress =
            visit.address ||
            (visit.propertyInfo && visit.propertyInfo.address) ||
            '';
        const ownerArea =
            visit.area ||
            (visit.propertyInfo && visit.propertyInfo.area) ||
            '';
        const propertyTitle =
            visit.propertyName ||
            (visit.propertyInfo && visit.propertyInfo.name) ||
            'Property';
        const propertyAddress =
            visit.address ||
            (visit.propertyInfo && visit.propertyInfo.address) ||
            '';
        const propertyLocationCode = String(
            visit.locationCode ||
            (visit.propertyInfo && visit.propertyInfo.locationCode) ||
            ownerArea ||
            visit.city ||
            finalLoginId
        ).trim().toUpperCase();

        await Owner.findOneAndUpdate(
            { loginId: finalLoginId },
            {
                $set: {
                    loginId: finalLoginId,
                    name: ownerName,
                    email: ownerEmailFromVisit,
                    phone: ownerPhone,
                    address: ownerAddress,
                    locationCode: propertyLocationCode,
                    area: ownerArea,
                    profile: {
                        name: ownerName,
                        email: ownerEmailFromVisit,
                        phone: ownerPhone,
                        address: ownerAddress,
                        locationCode: propertyLocationCode,
                        updatedAt: new Date()
                    },
                    credentials: {
                        password: finalPassword,
                        firstTime: true
                    },
                    checkinPassword: finalPassword,
                    isActive: true
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        let ownerProperty = await Property.findOne({
            ownerLoginId: finalLoginId,
            title: { $regex: `^${escapeRegex(propertyTitle)}$`, $options: 'i' }
        });

        if (!ownerProperty) {
            ownerProperty = await Property.create({
                title: propertyTitle,
                description: visit.description || '',
                address: propertyAddress,
                locationCode: propertyLocationCode || 'GEN',
                ownerLoginId: finalLoginId,
                status: 'active',
                isPublished: true
            });
        } else {
            ownerProperty.description = visit.description || ownerProperty.description || '';
            ownerProperty.address = propertyAddress || ownerProperty.address || '';
            ownerProperty.locationCode = propertyLocationCode || ownerProperty.locationCode || 'GEN';
            ownerProperty.ownerLoginId = finalLoginId;
            ownerProperty.status = 'active';
            ownerProperty.isPublished = true;
            await ownerProperty.save();
        }

        // Always save/update approved visit to ApprovedProperty collection
        try {
            const ApprovedProperty = require('../models/ApprovedProperty');
            const propData = {
                visitId: visit._id || visit.visitId,
                propertyInfo: {
                    name: visit.propertyName || (visit.propertyInfo && visit.propertyInfo.name) || 'Property',
                    address: visit.address || (visit.propertyInfo && visit.propertyInfo.address) || '',
                    city: visit.city || (visit.propertyInfo && visit.propertyInfo.city) || '',
                    area: visit.area || (visit.propertyInfo && visit.propertyInfo.area) || '',
                    locationCode: propertyLocationCode,
                    photos: visit.photos || (visit.propertyInfo && visit.propertyInfo.photos) || [],
                    ownerName: visit.ownerName || (visit.propertyInfo && visit.propertyInfo.ownerName) || '',
                    ownerPhone: visit.ownerPhone || visit.contactPhone || (visit.propertyInfo && visit.propertyInfo.contactPhone) || '',
                    ownerEmail: visit.ownerEmail || (visit.propertyInfo && visit.propertyInfo.ownerEmail) || '',
                    ownerLoginId: finalLoginId,
                    rent: visit.monthlyRent || 0,
                    deposit: visit.deposit || '',
                    description: visit.description || '',
                    amenities: visit.amenities || [],
                    genderSuitability: visit.gender || (visit.propertyInfo && visit.propertyInfo.genderSuitability) || '',
                    propertyType: visit.propertyType || (visit.propertyInfo && visit.propertyInfo.propertyType) || ''
                },
                professionalPhotos: visit.professionalPhotos || [],
                generatedCredentials: {
                    loginId: finalLoginId,
                    tempPassword: finalPassword
                },
                propertyRef: ownerProperty._id,
                isLiveOnWebsite: isLiveOnWebsite || false,
                status: isLiveOnWebsite ? 'live' : 'approved',
                approvedAt: new Date(),
                submittedAt: visit.submittedAt || new Date(),
                approvedBy: 'superadmin'
            };
            
            const approvedProp = await ApprovedProperty.findOneAndUpdate(
                { visitId: visit._id || visit.visitId },
                propData,
                { upsert: true, new: true }
            );
            console.log('? [visits/approve] Saved to ApprovedProperty collection:', approvedProp._id);
        } catch (approvedErr) {
            console.warn('?? [visits/approve] Warning saving to ApprovedProperty:', approvedErr.message);
            // Don't fail the approval if ApprovedProperty save fails
        }

        console.log('? [visits/approve] Visit approved successfully:', visitId);

        // Send owner credentials email with owner login page and digital KYC links.
        let emailAttempted = false;
        let emailSent = false;
        try {
            const ownerFromDb = await Owner.findOne({ loginId: finalLoginId })
                .select('email profile.email')
                .lean();
            const checkinRecord = await CheckinRecord.findOne({ loginId: finalLoginId, role: 'owner' })
                .select('ownerProfile.email')
                .lean();
            const ownerEmail =
                ownerEmailFromVisit ||
                (ownerFromDb && (ownerFromDb.email || (ownerFromDb.profile && ownerFromDb.profile.email))) ||
                (checkinRecord && checkinRecord.ownerProfile && checkinRecord.ownerProfile.email) ||
                '';

            if (ownerEmail) {
                emailAttempted = true;
                const loginPageLink = `${APP_URL}/propertyowner/ownerlogin`;
                const mainCheckinLink = `${DIGITAL_CHECKIN_URL}/digital-checkin/index`;
                const directCheckinLink = `${DIGITAL_CHECKIN_URL}/digital-checkin/ownerprofile?loginId=${encodeURIComponent(finalLoginId)}&email=${encodeURIComponent(ownerEmail)}&area=${encodeURIComponent(ownerArea || '')}&password=${encodeURIComponent(finalPassword)}`;
                const subject = 'RoomHy Property Approved - Owner Login and Digital KYC';
                const text = `Property approved\nProperty: ${propertyTitle}\nLogin ID: ${finalLoginId}\nTemporary Password: ${finalPassword}\nArea: ${ownerArea || 'N/A'}\nDigital KYC: ${mainCheckinLink}\nDirect Digital KYC: ${directCheckinLink}\nOwner Login Page: ${loginPageLink}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
                        <h2>Property Approved</h2>
                        <p>Hi ${ownerName},</p>
                        <p>Your property has been approved on RoomHy and added under your owner account.</p>
                        <p><strong>Property:</strong> ${propertyTitle}</p>
                        <p><strong>Login ID:</strong> ${finalLoginId}</p>
                        <p><strong>Temporary Password:</strong> ${finalPassword}</p>
                        <p><strong>Area:</strong> ${ownerArea || 'N/A'}</p>
                        <p><strong>Digital KYC (Main):</strong><br><a href="${mainCheckinLink}">${mainCheckinLink}</a></p>
                        <p><strong>Owner Digital KYC (Direct):</strong><br><a href="${directCheckinLink}">${directCheckinLink}</a></p>
                        <p><strong>Owner Login Page:</strong><br><a href="${loginPageLink}">${loginPageLink}</a></p>
                    </div>
                `;
                emailSent = await mailer.sendMail(ownerEmail, subject, text, html);
            }
        } catch (emailErr) {
            console.warn('[visits/approve] Email send failed:', emailErr.message);
        }

        res.json({
            success: true,
            message: 'Visit approved successfully',
            visit: visit,
            credentials: {
                loginId: finalLoginId,
                tempPassword: finalPassword
            },
            ownerProperty,
            email: {
                attempted: emailAttempted,
                sent: emailSent
            }
        });
    } catch (error) {
        console.error('? [visits/approve] Error approving visit:', error.message);
        console.error('? [visits/approve] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error approving visit',
            error: error.message
        });
    }
});

// ============================================================
// POST: Hold a visit
// ============================================================
router.post('/hold', async (req, res) => {
    try {
        const { visitId, holdReason } = req.body;

        if (!visitId) {
            return res.status(400).json({
                success: false,
                message: 'Missing visitId'
            });
        }

        // Find and update visit status to hold
        const visit = await VisitData.findOneAndUpdate(
            { $or: [{ _id: visitId }, { visitId: visitId }] },
            {
                status: 'hold',
                holdReason: holdReason || '',
                holdAt: new Date()
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        console.log('? [visits/hold] Visit held:', visitId);

        res.json({
            success: true,
            message: 'Visit held successfully',
            visit: visit
        });
    } catch (error) {
        console.error('? [visits/hold] Error holding visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error holding visit',
            error: error.message
        });
    }
});

// ============================================================
// POST: Submit a new visit
// Supports both old (Area Manager) and new (clean form) formats
// ============================================================
router.post('/submit', async (req, res) => {
    try {
        let {
            visitorName,
            visitorEmail,
            visitorPhone,
            propertyName,
            propertyType,
            city,
            area,
            address,
            pincode,
            description,
            amenities,
            genderSuitability,
            monthlyRent,
            deposit,
            ownerName,
            ownerEmail,
            ownerPhone,
            ownerCity,
            photos,
            professionalPhotos,
            // Old format support
            staffName,
            staffId,
            propertyInfo,
            name,
            contactPhone,
            ownerGmail,
            landmark,
            nearbyLocation,
            cleanlinessRating,
            studentReviewsRating,
            studentReviews,
            furnishing,
            ventilation,
            minStay,
            entryExit,
            visitorsAllowed,
            cookingAllowed,
            smokingAllowed,
            petsAllowed,
            internalRemarks,
            cleanlinessNote,
            ownerBehaviour,
            latitude,
            longitude
        } = req.body;

        // Support both old and new formats
        if (propertyInfo) {
            // Old Area Manager format
            propertyName = propertyName || propertyInfo.name || name;
            propertyType = propertyType || propertyInfo.propertyType;
            city = city || propertyInfo.city;
            area = area || propertyInfo.area;
            ownerName = ownerName || propertyInfo.ownerName;
            ownerEmail = ownerEmail || propertyInfo.ownerGmail || propertyInfo.ownerEmail;
            ownerPhone = ownerPhone || propertyInfo.contactPhone;
            address = address || propertyInfo.address;
            pincode = pincode || propertyInfo.pincode;
        } else {
            // New format - ensure propertyName is set
            propertyName = propertyName || name;
        }

        // Validate required fields
        // propertyName is required. city is optional if area is provided.
        if (!propertyName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: propertyName'
            });
        }
        
        // If city is not provided, use area as city (for Area Manager visits)
        if (!city && area) {
            city = area;
        } else if (!city) {
            city = 'Unknown'; // Fallback city
        }

        // Create unique visit ID (use existing _id if provided)
        const visitId = req.body._id || (Date.now() + '_' + Math.random().toString(36).substr(2, 9));

        // Create new visit
        const visit = new VisitData({
            visitId,
            visitorName: visitorName || staffName,
            visitorEmail,
            visitorPhone,
            propertyName,
            propertyType,
            city,
            area,
            address,
            pincode,
            description,
            amenities: (amenities && Array.isArray(amenities)) ? amenities : (amenities ? [amenities] : []),
            genderSuitability,
            monthlyRent: parseInt(monthlyRent) || 0,
            deposit,
            ownerName,
            ownerEmail,
            ownerPhone,
            ownerCity: ownerCity || city,
            photos: (photos && Array.isArray(photos)) ? photos : (photos ? [photos] : []),
            professionalPhotos: (professionalPhotos && Array.isArray(professionalPhotos)) ? professionalPhotos : (professionalPhotos ? [professionalPhotos] : []),
            status: 'submitted',
            // Additional fields from old format
            ...(staffId && { staffId }),
            ...(staffName && { staffName }),
            ...(latitude && { latitude }),
            ...(longitude && { longitude }),
            ...(landmark && { landmark }),
            ...(nearbyLocation && { nearbyLocation }),
            ...(cleanlinessRating && { cleanlinessRating }),
            ...(studentReviewsRating && { studentReviewsRating }),
            ...(studentReviews && { studentReviews }),
            ...(furnishing && { furnishing }),
            ...(ventilation && { ventilation }),
            ...(minStay && { minStay }),
            ...(entryExit && { entryExit }),
            ...(visitorsAllowed !== undefined && { visitorsAllowed: stringToBoolean(visitorsAllowed) }),
            ...(cookingAllowed !== undefined && { cookingAllowed: stringToBoolean(cookingAllowed) }),
            ...(smokingAllowed !== undefined && { smokingAllowed: stringToBoolean(smokingAllowed) }),
            ...(petsAllowed !== undefined && { petsAllowed: stringToBoolean(petsAllowed) }),
            ...(internalRemarks && { internalRemarks }),
            ...(cleanlinessNote && { cleanlinessNote }),
            ...(ownerBehaviour && { ownerBehaviour })
        });

        // Save to MongoDB
        await visit.save();

        try {
            await notifySuperadmin({
                type: 'new_enquiry',
                from: 'area_manager',
                subject: `New Visit Submission - ${propertyName || 'Property'}`,
                message: 'A new visit submission is waiting for superadmin approval.',
                meta: {
                    enquiryId: visitId,
                    userName: ownerName || visitorName || staffName || '',
                    userEmail: ownerEmail || visitorEmail || '',
                    propertyName: propertyName || '',
                    city: city || '',
                    area: area || ''
                }
            });
        } catch (notifyErr) {
            console.warn('visit submit notification failed:', notifyErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Visit submitted successfully',
            visitId: visitId,
            data: visit
        });

    } catch (error) {
        console.error('Error submitting visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting visit',
            error: error.message
        });
    }
});

// ============================================================
// GET: Get all visits
// ============================================================
router.get('/all', async (req, res) => {
    try {
        const visits = await VisitData.find({}).sort({ submittedAt: -1 });
        res.json({
            success: true,
            count: visits.length,
            visits: visits
        });
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching visits',
            error: error.message
        });
    }
});

// ============================================================
// GET: Get approved visits
// ============================================================
// GET: Get approved visits (for public display on ourproperty.html)
// ============================================================
router.get('/public/approved', async (req, res) => {
    try {
        const visits = await VisitData.find({ 
            status: 'approved'
        }).sort({ submittedAt: -1 });
        res.json({
            success: true,
            count: visits.length,
            visits: visits,
            properties: visits  // Alias for compatibility
        });
    } catch (error) {
        console.error('Error fetching public approved visits:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approved visits',
            error: error.message
        });
    }
});

// ============================================================
router.get('/approved', async (req, res) => {
    try {
        const visits = await VisitData.find({ 
            status: 'approved'
        }).sort({ submittedAt: -1 });
        res.json({
            success: true,
            count: visits.length,
            visits: visits
        });
    } catch (error) {
        console.error('Error fetching approved visits:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approved visits',
            error: error.message
        });
    }
});

// ============================================================
// GET: Get a single visit by ID
// ============================================================
router.get('/:visitId', async (req, res) => {
    try {
        const visit = await VisitData.findOne({ visitId: req.params.visitId });
        
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            visit: visit
        });
    } catch (error) {
        console.error('Error fetching visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching visit',
            error: error.message
        });
    }
});

// ============================================================
// PUT: Update full visit details
// ============================================================
router.put('/:visitId', async (req, res) => {
    try {
        const {
            propertyName,
            propertyType,
            propertyId,
            address,
            area,
            areaLocality,
            city,
            landmark,
            nearbyLocation,
            ownerName,
            ownerEmail,
            contactPhone,
            gender,
            monthlyRent,
            deposit,
            electricityCharges,
            foodCharges,
            maintenanceCharges,
            minStay,
            entryExit,
            amenities,
            cleanlinessRating,
            ownerBehaviourPublic,
            studentReviewsRating,
            employeeRating,
            visitorsAllowed,
            cookingAllowed,
            smokingAllowed,
            petsAllowed,
            internalRemarks,
            studentReviews,
            cleanlinessNote,
            ownerBehaviour,
            latitude,
            longitude,
            photos,
            professionalPhotos,
            locationCode
        } = req.body;

        const visit = await VisitData.findOneAndUpdate(
            { visitId: req.params.visitId },
            {
                ...(propertyName !== undefined && { propertyName }),
                ...(propertyType !== undefined && { propertyType }),
                ...(propertyId !== undefined && { propertyId }),
                ...(address !== undefined && { address }),
                ...(area !== undefined && { area }),
                ...(areaLocality !== undefined && { areaLocality }),
                ...(city !== undefined && { city }),
                ...(landmark !== undefined && { landmark }),
                ...(nearbyLocation !== undefined && { nearbyLocation }),
                ...(ownerName !== undefined && { ownerName }),
                ...(ownerEmail !== undefined && { ownerEmail }),
                ...(contactPhone !== undefined && { contactPhone, ownerPhone: contactPhone }),
                ...(gender !== undefined && { gender }),
                ...(monthlyRent !== undefined && { monthlyRent: parseInt(monthlyRent, 10) || 0 }),
                ...(deposit !== undefined && { deposit: parseInt(deposit, 10) || 0 }),
                ...(electricityCharges !== undefined && { electricityCharges: parseInt(electricityCharges, 10) || 0 }),
                ...(foodCharges !== undefined && { foodCharges: parseInt(foodCharges, 10) || 0 }),
                ...(maintenanceCharges !== undefined && { maintenanceCharges: parseInt(maintenanceCharges, 10) || 0 }),
                ...(minStay !== undefined && { minStay: parseInt(minStay, 10) || 0 }),
                ...(entryExit !== undefined && { entryExit }),
                ...(amenities !== undefined && { amenities: Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []) }),
                ...(cleanlinessRating !== undefined && { cleanlinessRating: parseInt(cleanlinessRating, 10) || 0 }),
                ...(ownerBehaviourPublic !== undefined && { ownerBehaviourPublic }),
                ...(studentReviewsRating !== undefined && { studentReviewsRating: parseInt(studentReviewsRating, 10) || 0 }),
                ...(employeeRating !== undefined && { employeeRating: parseInt(employeeRating, 10) || 0 }),
                ...(visitorsAllowed !== undefined && { visitorsAllowed: stringToBoolean(visitorsAllowed) }),
                ...(cookingAllowed !== undefined && { cookingAllowed: stringToBoolean(cookingAllowed) }),
                ...(smokingAllowed !== undefined && { smokingAllowed: stringToBoolean(smokingAllowed) }),
                ...(petsAllowed !== undefined && { petsAllowed: stringToBoolean(petsAllowed) }),
                ...(internalRemarks !== undefined && { internalRemarks }),
                ...(studentReviews !== undefined && { studentReviews }),
                ...(cleanlinessNote !== undefined && { cleanlinessNote }),
                ...(ownerBehaviour !== undefined && { ownerBehaviour }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(photos !== undefined && { photos: Array.isArray(photos) ? photos : (photos ? [photos] : []) }),
                ...(professionalPhotos !== undefined && { professionalPhotos: Array.isArray(professionalPhotos) ? professionalPhotos : (professionalPhotos ? [professionalPhotos] : []) }),
                ...(locationCode !== undefined && { locationCode }),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit updated successfully',
            visit
        });
    } catch (error) {
        console.error('Error updating visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating visit',
            error: error.message
        });
    }
});

// ============================================================
// PUT: Update visit status
// ============================================================
router.put('/:visitId/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'status is required'
            });
        }

        const visit = await VisitData.findOneAndUpdate(
            { visitId: req.params.visitId },
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit status updated',
            visit: visit
        });
    } catch (error) {
        console.error('Error updating visit status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating visit status',
            error: error.message
        });
    }
});

// ============================================================
// POST: Approve a visit (from enquiry.html)
// ============================================================
router.post('/:visitId/approve', async (req, res) => {
    try {
        const { approvalNotes, approvedBy } = req.body;
        
        const visit = await VisitData.findOneAndUpdate(
            { visitId: req.params.visitId },
            {
                status: 'approved',
                approvedAt: new Date(),
                approvalNotes,
                approvedBy,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        // Now also create/update in ApprovedProperty collection
        const ApprovedProperty = require('../models/ApprovedProperty');
        
        const approvedProperty = await ApprovedProperty.findOneAndUpdate(
            { propertyId: visit.visitId },
            {
                propertyId: visit.visitId,
                visitDataId: visit.visitId,
                propertyName: visit.propertyName,
                propertyType: visit.propertyType,
                city: visit.city,
                area: visit.area,
                address: visit.address,
                pincode: visit.pincode,
                description: visit.description,
                amenities: visit.amenities,
                genderSuitability: visit.genderSuitability,
                monthlyRent: visit.monthlyRent,
                deposit: visit.deposit,
                ownerName: visit.ownerName,
                ownerEmail: visit.ownerEmail,
                ownerPhone: visit.ownerPhone,
                ownerCity: visit.ownerCity,
                photos: visit.photos,
                professionalPhotos: visit.professionalPhotos,
                approvedAt: new Date(),
                approvalNotes: approvalNotes,
                approvedBy: approvedBy,
                submittedAt: visit.submittedAt
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Visit approved and added to approved properties',
            visit: visit,
            approvedProperty: approvedProperty
        });

    } catch (error) {
        console.error('Error approving visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving visit',
            error: error.message
        });
    }
});

// ============================================================
// POST: Reject a visit
// ============================================================
router.post('/:visitId/reject', async (req, res) => {
    try {
        const { approvalNotes, approvedBy } = req.body;
        
        const visit = await VisitData.findOneAndUpdate(
            { visitId: req.params.visitId },
            {
                status: 'rejected',
                approvalNotes,
                approvedBy,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit rejected',
            visit: visit
        });

    } catch (error) {
        console.error('Error rejecting visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting visit',
            error: error.message
        });
    }
});

// ============================================================
// DELETE: Delete a visit
// ============================================================
router.delete('/:visitId', async (req, res) => {
    try {
        const visit = await VisitData.findOneAndDelete({ visitId: req.params.visitId });
        
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit deleted successfully',
            visit: visit
        });
    } catch (error) {
        console.error('Error deleting visit:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting visit',
            error: error.message
        });
    }
});

module.exports = router;
