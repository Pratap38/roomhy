lucide.createIcons();
        function loadRejected() {
            const tbody = document.getElementById('rejectedBody');
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]').filter(v => v.status === 'rejected');
            if(!visits.length) { tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">No rejected visits found.</td></tr>'; return; }
            tbody.innerHTML = visits.map(v => `
                <tr>
                    <td class="px-6 py-4 font-bold text-slate-700">${v.propertyInfo.name}</td>
                    <td class="px-6 py-4 text-sm text-red-600 font-medium">${v.rejectionReason || 'No reason provided.'}</td>
                    <td class="px-6 py-4 text-center"><span class="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded">REJECTED</span></td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="restore('${v._id}')" class="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition">Restore to Hold</button>
                    </td>
                </tr>`).join('');
            lucide.createIcons();
        }
        function restore(id) {
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                visits[idx].status = 'hold';
                localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                loadRejected();
            }
        }
        document.addEventListener('DOMContentLoaded', loadRejected);