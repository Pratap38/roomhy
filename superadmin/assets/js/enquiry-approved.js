lucide.createIcons();
        function loadApproved() {
            const tbody = document.getElementById('approvedBody');
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]').filter(v => v.status === 'approved');

            if(!visits.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-gray-400">No approved visits found.</td></tr>';
                return;
            }

            tbody.innerHTML = visits.map(v => {
                const prop = v.propertyInfo || {};
                const profPhotos = v.professionalPhotos || [];
                const fieldPhotos = v.photos || [];
                const isLive = v.isLiveOnWebsite || false;
                const thumb = profPhotos[0] || fieldPhotos[0] || 'https://via.placeholder.com/100';

                return `
                <tr>
                    <td class="px-6 py-4"><img src="${thumb}" class="w-12 h-12 rounded object-cover border"></td>
                    <td class="px-6 py-4">
                        <div class="font-bold text-gray-800">${prop.name}</div>
                        <div class="text-[10px] text-gray-500">${prop.area}</div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-[10px] font-bold ${profPhotos.length ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'} px-2 py-1 rounded">
                            ${profPhotos.length ? 'Uploaded' : 'Pending'}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="${isLive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'} text-[10px] font-bold px-2 py-1 rounded">
                            ${isLive ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-xs font-mono">${v.generatedCredentials?.loginId || '-'}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="revoke('${v._id}')" class="text-xs text-red-600 hover:underline">Revoke</button>
                    </td>
                </tr>`;
            }).join('');
            lucide.createIcons();
        }

        function revoke(id) {
            if(!confirm("Are you sure you want to move this back to pending/hold?")) return;
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                visits[idx].status = 'hold';
                localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                loadApproved();
            }
        }
        document.addEventListener('DOMContentLoaded', loadApproved);