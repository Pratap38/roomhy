// safe-storage.js
// Helper to safely write large arrays to localStorage with trimming and fallbacks.
(function(window){
    function trySet(key, str) {
        try {
            localStorage.setItem(key, str);
            return true;
        } catch (e) {
            return false;
        }
    }

    function safeStringify(v){
        try { return JSON.stringify(v); } catch(e) { return null; }
    }

    function clearOldData() {
        // Remove old, non-critical data to free up space
        var keysToTrim = ['roomhy_photos_cache', 'roomhy_temp_data', 'roomhy_backup'];
        for(var i = 0; i < keysToTrim.length; i++) {
            try { localStorage.removeItem(keysToTrim[i]); } catch(e) {}
        }
    }

    function setVisits(visits){
        if(!Array.isArray(visits)) visits = [];
        var key = 'roomhy_visits';
        var str = safeStringify(visits);
        if(str === null) return false;

        // First try a straight write
        if(trySet(key, str)) return true;

        // If quota exceeded, clear old data first
        clearOldData();
        if(trySet(key, str)) return true;

        // Still failing? Aggressively trim visits array (keep only last 30 items)
        var copy = visits.slice();
        var maxItems = 30;
        while(copy.length > maxItems) {
            copy.shift(); // remove oldest
            str = safeStringify(copy);
            if(str === null) break;
            if(trySet(key, str)) {
                console.warn('safe-storage: trimmed to ' + copy.length + ' items');
                return true;
            }
        }

        // Last resort: try sessionStorage (ephemeral)
        try {
            sessionStorage.setItem(key, safeStringify(visits.slice(-20)));
            console.warn('safe-storage: wrote ' + Math.min(20, visits.length) + ' recent visits to sessionStorage.');
            return true;
        } catch(e) {
            console.error('safe-storage: failed to persist visits to storage', e);
            return false;
        }
    }

    window.safeStorage = {
        setVisits: setVisits,
        clearOldData: clearOldData
    };
})(window);
