// backend-sync.js
// Syncs visit data with backend API instead of relying on localStorage quota
(function(window){
    const API_URL = window.API_URL ? window.API_URL + '/api/visits' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api/visits' : 'https://api.roomhy.com/api/visits');
    
    // Load visits from backend, with fallback to localStorage
    async function loadVisits(useCache = true) {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const visits = await response.json();
                // Cache to localStorage for offline access
                if (useCache) {
                    try {
                        localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                        localStorage.setItem('roomhy_visits_synced_at', new Date().toISOString());
                    } catch(e) {
                        console.warn('backend-sync: Could not cache to localStorage:', e.message);
                    }
                }
                return visits;
            }
        } catch (err) {
            console.warn('backend-sync: API fetch failed, using cache:', err.message);
        }
        
        // Fallback to localStorage cache
        try {
            const cached = localStorage.getItem('roomhy_visits');
            return cached ? JSON.parse(cached) : [];
        } catch(e) {
            return [];
        }
    }
    
    // Save visits to backend (primary) and localStorage (cache)
    async function saveVisits(visits) {
        if (!Array.isArray(visits)) visits = [];
        
        // Try backend first
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visits: visits })
            });
            
            if (response.ok) {
                console.log('backend-sync: Visits saved to backend successfully');
                // Also update cache
                try {
                    localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                } catch(e) {
                    console.warn('backend-sync: Could not update cache:', e.message);
                }
                return true;
            }
        } catch (err) {
            console.warn('backend-sync: API save failed, attempting localStorage fallback:', err.message);
        }
        
        // Fallback to localStorage if backend fails
        try {
            localStorage.setItem('roomhy_visits', JSON.stringify(visits));
            console.log('backend-sync: Visits saved to localStorage (offline mode)');
            return true;
        } catch(e) {
            console.error('backend-sync: Failed to save visits:', e.message);
            return false;
        }
    }
    
    // Add a new visit
    async function addVisit(visit) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(visit)
            });
            
            if (response.ok) {
                const savedVisit = await response.json();
                console.log('backend-sync: Visit added to backend:', savedVisit._id);
                return savedVisit;
            }
        } catch (err) {
            console.warn('backend-sync: Could not add to backend, falling back to localStorage:', err.message);
        }
        
        // Fallback: add to localStorage
        const visits = await loadVisits(false);
        visit._id = 'local_' + Date.now();
        visits.push(visit);
        await saveVisits(visits);
        return visit;
    }
    
    // Update a visit
    async function updateVisit(visitId, updates) {
        try {
            const response = await fetch(`${API_URL}/${visitId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (response.ok) {
                const updated = await response.json();
                console.log('backend-sync: Visit updated on backend:', visitId);
                return updated;
            }
        } catch (err) {
            console.warn('backend-sync: Could not update on backend:', err.message);
        }
        
        // Fallback: update in localStorage
        const visits = await loadVisits(false);
        const idx = visits.findIndex(v => v._id === visitId);
        if (idx !== -1) {
            visits[idx] = { ...visits[idx], ...updates };
            await saveVisits(visits);
            return visits[idx];
        }
        throw new Error('Visit not found');
    }
    
    // Delete a visit
    async function deleteVisit(visitId) {
        try {
            const response = await fetch(`${API_URL}/${visitId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('backend-sync: Visit deleted from backend:', visitId);
                return true;
            }
        } catch (err) {
            console.warn('backend-sync: Could not delete from backend:', err.message);
        }
        
        // Fallback: delete from localStorage
        const visits = await loadVisits(false);
        const filtered = visits.filter(v => v._id !== visitId);
        await saveVisits(filtered);
        return true;
    }
    
    // Check if backend is available
    async function isBackendAvailable() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                timeout: 3000
            });
            return response.ok;
        } catch (err) {
            return false;
        }
    }
    
    window.backendSync = {
        loadVisits: loadVisits,
        saveVisits: saveVisits,
        addVisit: addVisit,
        updateVisit: updateVisit,
        deleteVisit: deleteVisit,
        isBackendAvailable: isBackendAvailable
    };
})(window);
