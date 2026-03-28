/**
 * Area Manager Profile Photo Loader
 * Loads profile photo from employee data for all area manager pages
 * Call this function after page load to update the header profile image
 */

function loadAreaManagerProfilePhoto() {
    try {
        // Get current logged-in user
        const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
        
        if (!user || !user.loginId) return;
        
        // Get employee data from localStorage
        const employees = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
        const currentEmp = employees.find(e => e.loginId === user.loginId);
        
        if (!currentEmp) return;
        
        // Find the profile image in header
        const profileImg = document.querySelector('header img[alt*="Admin"], header img[alt*="Manager"], header img[alt*="User"]');
        
        if (currentEmp.photoDataUrl && profileImg) {
            // Use stored profile photo
            profileImg.src = currentEmp.photoDataUrl;
        } else if (currentEmp && profileImg) {
            // Generate avatar with initials if no photo
            const initials = currentEmp.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '--';
            const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
            const colorIdx = currentEmp.loginId.charCodeAt(0) % colors.length;
            
            if (profileImg && profileImg.parentNode) {
                profileImg.style.display = 'none';
                const avatar = document.createElement('div');
                avatar.className = `w-8 h-8 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold border border-slate-200 flex-shrink-0`;
                avatar.innerText = initials;
                profileImg.parentNode.insertBefore(avatar, profileImg);
            }
        }
    } catch (err) {
        console.warn('Failed to load area manager profile photo:', err);
    }
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAreaManagerProfilePhoto);
} else {
    loadAreaManagerProfilePhoto();
}
