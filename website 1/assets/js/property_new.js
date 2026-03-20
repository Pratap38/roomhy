lucide.createIcons();

        // Update UI based on property type
        function detectPropertyType() {
            const propertyType = document.getElementById('property-type').textContent;
            const isBidToAll = propertyType.includes('Hostel') || propertyType.includes('PG');
            
            const bidTitle = document.getElementById('bid-info-title');
            const bidDesc = document.getElementById('bid-info-desc');
            const bidBtnText = document.getElementById('bid-btn-text');
            const sidebarBidText = document.getElementById('sidebar-bid-text');
            const ctaTitle = document.getElementById('cta-title');
            const ctaDesc = document.getElementById('cta-description');
            
            if (isBidToAll) {
                bidTitle.textContent = 'Bid to All';
                bidDesc.textContent = 'Your bid will be sent to all matching hostels in this area';
                bidBtnText.textContent = 'Bid to All';
                sidebarBidText.textContent = 'Bid to All';
                ctaTitle.textContent = 'Ready to Join?';
                ctaDesc.textContent = 'Send your bid to all hostels in this area';
            } else {
                bidTitle.textContent = 'Bid Now';
                bidDesc.textContent = 'Your bid will be sent only to this property';
                bidBtnText.textContent = 'Bid Now';
                sidebarBidText.textContent = 'Bid Now';
                ctaTitle.textContent = 'Interested?';
                ctaDesc.textContent = 'Place your bid for this property';
            }
        }

        function openPaymentModal() {
            document.getElementById('payment-modal').classList.remove('hidden');
            document.getElementById('payment-modal').classList.add('flex');
        }

        function closePaymentModal() {
            document.getElementById('payment-modal').classList.add('hidden');
            document.getElementById('payment-modal').classList.remove('flex');
        }

        // Image Carousel
        const carousel = document.getElementById('carousel');
        let currentIndex = 0;
        const slides = carousel?.children?.length || 0;

        // Mobile menu functionality
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const closeMobile = document.getElementById('close-mobile-menu');

        function toggleMobile() {
            mobileSidebar.classList.toggle('translate-x-full');
            mobileOverlay.classList.toggle('hidden');
        }

        mobileBtn.onclick = toggleMobile;
        closeMobile.onclick = toggleMobile;
        mobileOverlay.onclick = toggleMobile;

        // Initialize
        detectPropertyType();