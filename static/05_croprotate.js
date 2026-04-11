let cropper;
const image = document.getElementById('image');

document.getElementById('inputImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        if (cropper) { cropper.destroy(); }
        image.src = event.target.result;

        cropper = new Cropper(image, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1, 
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            checkOrientation: false,
            responsive: true,
        });
    };
    reader.readAsDataURL(file);
});

// --- Editor Functions ---
function rotateRight() { if (cropper) cropper.rotate(90); }
function rotateLeft() { if (cropper) cropper.rotate(-90); }
function setAspectRatio(ratio) { if (cropper) cropper.setAspectRatio(parseFloat(ratio)); }

let flipH = 1, flipV = 1;
function flipHorizontal() {
    flipH = flipH === 1 ? -1 : 1;
    cropper.scaleX(flipH);
}
function flipVertical() {
    flipV = flipV === 1 ? -1 : 1;
    cropper.scaleY(flipV);
}
function resetEditor() { if (cropper) cropper.reset(); }

async function cropImage(btn) {
    if (!cropper) return;

    const overlay = document.getElementById('loadingOverlay');
    const downloadBtn = btn;

    overlay.style.display = 'flex';
    downloadBtn.disabled = true;
    downloadBtn.innerText = "Processing...";

    let canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    canvas.toBlob(async (blob) => {
        if (!blob) {
            console.error("Canvas empty hai!");
            hideLoading(overlay, downloadBtn);
            return;
        }

        let formData = new FormData();
        formData.append("image", blob, "cropped.jpg");

        try {
            // FIXED: Backticks use kiye hain
            let res = await fetch(`${window.BACKEND_URL}/crop_rotate`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                let data = await res.json();
                
                // FIXED: Download link mein Backend URL add kiya hai
                window.location.href = `${window.BACKEND_URL}/download/${data.filename}`;

                setTimeout(() => hideLoading(overlay, downloadBtn), 900);
            } else {
                throw new Error("Server error!");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Upload fail ho gaya! Check backend connection.");
            hideLoading(overlay, downloadBtn);
        }
    }, 'image/jpeg', 0.95);
}

function hideLoading(overlay, btn) {
    overlay.style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Download";
}

// --- Drag & Drop logic ---
const uploadBox = document.querySelector('.image-box');
const inputImage = document.getElementById('inputImage');

if (uploadBox) {
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            inputImage.files = files;
            inputImage.dispatchEvent(new Event('change'));
        }
    });
}