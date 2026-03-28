lucide.createIcons();
        function loadHold() {
            const tbody = document.getElementById('holdBody');
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]').filter(v => v.status === 'hold');
            tbody.innerHTML = visits.map(v => `
                <tr>
                    <td class="px-6 py-4"><div class="font-bold">${v.propertyInfo.name}</div><div class="text-[10px] text-gray-400">${v.propertyInfo.area}</div></td>
                    <td class="px-6 py-4 text-sm text-orange-600 font-medium">${v.holdReason || 'Review Pending'}</td>
                    <td class="px-6 py-4">
                        <span class="text-[10px] font-bold ${v.professionalPhotos?.length ? 'text-green-600' : 'text-orange-600'}">
                            ${v.professionalPhotos?.length ? 'Ready' : 'Waiting for Prof. Shots'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="approve('${v._id}')" class="bg-green-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                    </td>
                </tr>`).join('');
            lucide.createIcons();
        }
        function approve(id) {
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                visits[idx].status = 'approved';
                localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                loadHold();
            }
        }
        document.addEventListener('DOMContentLoaded', loadHold);