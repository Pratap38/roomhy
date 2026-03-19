let userEmailForSignup = '';
        let guestProceedCallback = null;

        // Show signup modal
        function showSignupModal(email, guestCallback) {
            userEmailForSignup = email;
            guestProceedCallback = guestCallback;
            document.getElementById('modalEmailDisplay').textContent = email;
            document.getElementById('signupModalOverlay').classList.remove('hidden');
            lucide.createIcons();
        }

        // Close signup modal
        function closeSignupModal() {
            document.getElementById('signupModalOverlay').classList.add('hidden');
        }

        // Redirect to signup with email
        function redirectToSignup() {
            const email = userEmailForSignup;
            const returnUrl = window.location.href;
            window.location.href = './signup?email=' + encodeURIComponent(email) + '&return=' + encodeURIComponent(returnUrl);
        }

        // Continue as guest
        function continueAsGuest() {
            closeSignupModal();
            if (guestProceedCallback && typeof guestProceedCallback === 'function') {
                guestProceedCallback();
            }
        }

        // Close modal on overlay click
        document.getElementById('signupModalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'signupModalOverlay') {
                closeSignupModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSignupModal();
            }
        });
