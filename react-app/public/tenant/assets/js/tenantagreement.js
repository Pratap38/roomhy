lucide.createIcons();
        const user = JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'tenant') try { window.location.href = '/tenant/tenantlogin'; } catch(e) {}

        document.addEventListener("DOMContentLoaded", function() {
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const me = tenants.find(t => t.loginId === user.loginId);
            if(me) {
                document.getElementById('rent-amount').innerText = '?' + (me.agreedRent || '0');
                document.getElementById('move-in').innerText = me.moveInDate ? new Date(me.moveInDate).toLocaleDateString() : '-';
            }
        });

        function signAgreement() {
            if(!document.getElementById('agree-check').checked) return alert("Please accept the terms.");

            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId === user.loginId);
            
            if(idx > -1) {
                tenants[idx].agreementSigned = true;
                tenants[idx].agreementSignedAt = new Date().toISOString();
                tenants[idx].status = 'active'; // FINALLY ACTIVE
                
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                
                alert("?? Onboarding Complete! Redirecting to Dashboard...");
                window.location.href = '/tenant/tenantdashboard';
            }
        }