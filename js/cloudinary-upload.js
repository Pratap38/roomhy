// cloudinary-upload.js
// Handles uploading profile photo to backend (which uploads to Cloudinary)

async function handleEmpPhotoUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    // Show loading indicator (optional)
    const preview = document.getElementById('empPhotoPreview');
    preview.innerHTML = '<span>Uploading...</span>';

    try {
        const res = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api/upload-profile-photo' : 'https://api.roomhy.com/api/upload-profile-photo', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.url) {
            // Show uploaded image
            const img = document.createElement('img');
            img.src = data.url;
            img.className = 'w-full h-full rounded-full object-cover';
            preview.innerHTML = '';
            preview.appendChild(img);
            // Store URL in hidden input for later save
            document.getElementById('empPhotoDataUrl').value = data.url;
        } else {
            preview.innerHTML = '<span>Failed to upload</span>';
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        preview.innerHTML = '<span>Failed to upload</span>';
        alert('Upload error: ' + err.message);
    }
}
