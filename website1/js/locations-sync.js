// locations-sync.js
// Exposes simple helpers to read roomhy_cities/areas from localStorage
(function(window){
    function safeParse(key){
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; }
    }

    function mapCities(raw){
        if(!Array.isArray(raw)) return [];
        return raw.map(c => ({
            name: c.name || c.city || c.title || 'Unknown',
            img: c.image || c.img || ('images/OIP.webp'),
            icon: c.icon || 'building-2'
        }));
    }

    const listeners = [];

    function notifyAll(cities){
        listeners.forEach(fn => { try { fn(cities); } catch(e){} });
    }

    // BroadcastChannel and storage event hooks
    if (typeof BroadcastChannel !== 'undefined') {
        try{
            const ch = new BroadcastChannel('roomhy_locations');
            ch.addEventListener('message', () => {
                const cities = mapCities(safeParse('roomhy_cities'));
                notifyAll(cities);
            });
        }catch(e){}
    }

    window.addEventListener('storage', (ev) => {
        if(ev.key === 'roomhy_locations_updated_at' || ev.key === 'roomhy_cities' || ev.key === 'roomhy_areas'){
            const cities = mapCities(safeParse('roomhy_cities'));
            notifyAll(cities);
        }
    });

    window.roomhyLocations = {
        getCities: function(){ return mapCities(safeParse('roomhy_cities')); },
        getAreas: function(){ return safeParse('roomhy_areas'); },
        onChange: function(cb){ if(typeof cb === 'function'){ listeners.push(cb); } }
    };

})(window);
