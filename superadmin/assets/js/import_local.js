document.getElementById('fileInput').addEventListener('change', async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const txt = await f.text();
            document.getElementById('payload').value = txt;
        });

        document.getElementById('preview').addEventListener('click', () => {
            const v = document.getElementById('payload').value.trim();
            if (!v) return alert('Paste JSON first');
            try {
                const parsed = JSON.parse(v);
                document.getElementById('result').innerText = JSON.stringify(parsed, null, 2);
            } catch (e) { alert('Invalid JSON: ' + e.message); }
        });

        document.getElementById('doImport').addEventListener('click', async () => {
            const v = document.getElementById('payload').value.trim();
            const secret = document.getElementById('importSecret').value.trim();
            if (!v) return alert('Paste JSON first');
            let parsed;
            try { parsed = JSON.parse(v); } catch (e) { return alert('Invalid JSON: ' + e.message); }

            document.getElementById('status').innerText = 'Importing...';
            try {
                const res = await fetch(API_URL + '/api/admin/import-local', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(secret ? { 'x-import-secret': secret } : {})
                    },
                    body: JSON.stringify(parsed)
                });

                const body = await res.json();
                document.getElementById('result').innerText = JSON.stringify(body, null, 2);
                document.getElementById('status').innerText = res.ok ? 'Import completed' : 'Import failed';
            } catch (err) {
                document.getElementById('result').innerText = 'Import error: ' + err.message;
                document.getElementById('status').innerText = 'Error';
            }
        });