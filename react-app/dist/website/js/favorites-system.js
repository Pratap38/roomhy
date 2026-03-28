// Favorites Management System
// Stores favorites in localStorage and provides UI management

class FavoritesSystem {
    constructor() {
        this.storageKey = 'roomhy_favorites';
        this.favorites = this.loadFavorites();
    }

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    // Save favorites to localStorage
    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    // Add a property to favorites
    addFavorite(property) {
        // Check if already favorited
        const exists = this.favorites.find(fav => fav._id === property._id || fav.enquiry_id === property.enquiry_id);
        if (exists) return false;

        this.favorites.push({
            _id: property._id || property.enquiry_id,
            enquiry_id: property.enquiry_id || property._id,
            property_name: property.property_name,
            property_image: property.property_image,
            city: property.city,
            location: property.location || property.city,
            locality: property.locality,
            rent: property.rent,
            price: property.price || property.rent,
            property_type: property.property_type,
            photos: property.photos || property.professionalPhotos || [],
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            isVerified: property.isVerified,
            rating: property.rating,
            reviewsCount: property.reviewsCount,
            addedAt: new Date().toISOString()
        });
        this.saveFavorites();
        return true;
    }

    // Remove a property from favorites
    removeFavorite(propertyId) {
        this.favorites = this.favorites.filter(fav => fav._id !== propertyId && fav.enquiry_id !== propertyId);
        this.saveFavorites();
    }

    // Check if a property is favorited
    isFavorited(propertyId) {
        return this.favorites.some(fav => fav._id === propertyId || fav.enquiry_id === propertyId);
    }

    // Get all favorites
    getAllFavorites() {
        return this.favorites;
    }

    // Clear all favorites
    clearAll() {
        this.favorites = [];
        this.saveFavorites();
    }
}

// Create global instance
const favoritesManager = new FavoritesSystem();

// Heart icon toggle function
function toggleFavorite(event, propertyData) {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget || event.target.closest('.favorite-btn');
    const heartIcon = btn.querySelector('i[data-lucide="heart"]');
    const propertyId = propertyData._id || propertyData.enquiry_id;

    if (favoritesManager.isFavorited(propertyId)) {
        // Remove from favorites
        favoritesManager.removeFavorite(propertyId);
        if (heartIcon) {
            heartIcon.classList.remove('fill-current', 'fill-red-500', 'text-red-500');
        }
        btn.classList.remove('bg-red-500', 'text-white');
        btn.classList.add('bg-white', 'text-gray-600');
        showNotification('Removed from favorites', 'info');
    } else {
        // Add to favorites
        const success = favoritesManager.addFavorite(propertyData);
        if (success) {
            if (heartIcon) {
                heartIcon.classList.add('fill-current');
            }
            btn.classList.remove('bg-white', 'text-gray-600');
            btn.classList.add('bg-red-500', 'text-white');
            showNotification('Added to favorites', 'success');
        }
    }

    // Dispatch custom event for other listeners
    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { propertyId } }));
}

// Update heart icon appearance based on favorite state
function updateHeartIcon(heartButton, propertyId) {
    if (!heartButton) return;

    const heartIcon = heartButton.querySelector('i[data-lucide="heart"]');
    if (favoritesManager.isFavorited(propertyId)) {
        if (heartIcon) {
            heartIcon.classList.add('fill-current');
        }
        heartButton.classList.remove('bg-white', 'text-gray-600');
        heartButton.classList.add('bg-red-500', 'text-white');
    } else {
        if (heartIcon) {
            heartIcon.classList.remove('fill-current');
        }
        heartButton.classList.remove('bg-red-500', 'text-white');
        heartButton.classList.add('bg-white', 'text-gray-600');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-50 transition-all ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize favorites system on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listen for heart icon clicks on property cards
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.favorite-btn');
        if (heartBtn && heartBtn.dataset.propertyId) {
            const propertyData = JSON.parse(heartBtn.dataset.property || '{}');
            toggleFavorite(e, propertyData);
        }
    });

    // Update all heart icons on page based on current favorites
    updateAllHeartIcons();
});

// Update all heart icons on the page
function updateAllHeartIcons() {
    const heartButtons = document.querySelectorAll('.favorite-btn');
    heartButtons.forEach(btn => {
        const propertyId = btn.dataset.propertyId;
        updateHeartIcon(btn, propertyId);
    });
}

// Listen for favorites changes across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'roomhy_favorites') {
        favoritesManager.favorites = favoritesManager.loadFavorites();
        updateAllHeartIcons();
    }
});
