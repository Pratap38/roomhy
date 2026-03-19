/**
 * Website Property Data Storage - Data Migration Helper
 * This script helps migrate data from localStorage to MongoDB
 */

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com'; // Change to your backend URL

/**
 * Migrate all localStorage properties to MongoDB
 * Run this once to move all existing data
 */
async function migrateLocalStorageToDatabase() {
    console.log('Starting migration from localStorage to MongoDB...');
    
    try {
        // Get all data from localStorage
        const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
        const websitePhoto = localStorage.getItem('roomhy_website_photo');
        
        if (visits.length === 0) {
            console.log('No properties found in localStorage to migrate');
            return;
        }

        // Prepare properties for database
        const propertiesToSave = visits.map(v => ({
            propertyId: v._id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            propertyInfo: v.propertyInfo || {},
            gender: v.gender,
            status: v.status || 'pending',
            isLiveOnWebsite: v.isLiveOnWebsite || false,
            photos: v.photos || [],
            professionalPhotos: v.professionalPhotos || [],
            monthlyRent: v.monthlyRent,
            submittedAt: v.submittedAt || new Date().toISOString()
        }));

        // Save all properties
        const response = await fetch(`${API_URL}/api/website-property-data/bulk/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties: propertiesToSave })
        });

        if (!response.ok) {
            throw new Error(`Failed to save properties: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✓ Successfully migrated ${result.saved} properties to MongoDB`);

        // Save website banner photo if exists
        if (websitePhoto) {
            try {
                const photoResponse = await fetch(`${API_URL}/api/website-property-data/banner/photo`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ websiteBannerPhoto: websitePhoto })
                });
                
                if (photoResponse.ok) {
                    console.log('✓ Website banner photo migrated successfully');
                }
            } catch (err) {
                console.warn('Warning: Could not migrate website banner photo:', err.message);
            }
        }

        console.log('✓ Migration completed successfully!');
        console.log('All data is now stored in MongoDB and will persist across page reloads.');
        
        return { success: true, propertiesMigrated: result.saved };

    } catch (error) {
        console.error('✗ Migration failed:', error);
        throw error;
    }
}

/**
 * Save a single property to the database
 */
async function savePropertyToDatabase(property) {
    try {
        const response = await fetch(`${API_URL}/api/website-property-data/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propertyId: property.propertyId || property._id || `prop_${Date.now()}`,
                propertyInfo: property.propertyInfo,
                gender: property.gender,
                status: property.status,
                isLiveOnWebsite: property.isLiveOnWebsite,
                photos: property.photos,
                professionalPhotos: property.professionalPhotos,
                monthlyRent: property.monthlyRent,
                notes: property.notes
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save property: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving property:', error);
        throw error;
    }
}

/**
 * Load all properties from database
 */
async function loadPropertiesFromDatabase(filter = 'approved') {
    try {
        let url = `${API_URL}/api/website-property-data/all`;
        
        if (filter === 'approved') {
            url = `${API_URL}/api/website-property-data/approved`;
        } else if (filter === 'live') {
            url = `${API_URL}/api/website-property-data/live`;
        } else if (filter === 'offline') {
            url = `${API_URL}/api/website-property-data/offline`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load properties: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.properties || [];
    } catch (error) {
        console.error('Error loading properties:', error);
        throw error;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        migrateLocalStorageToDatabase,
        savePropertyToDatabase,
        loadPropertiesFromDatabase
    };
}
