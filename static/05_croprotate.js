let cropper;
const image = document.getElementById('image');
const inputImage = document.getElementById('inputImage');
const label1 = document.getElementById('filelabel');

inputImage.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file){
        showToast("Please  a file first!"); 
        return;
    }

    label1.querySelector('.custom-file-upload').innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(event) {
        if (cropper) cropper.destroy();
        
        image.src = event.target.result;

        image.onload = () => {
            cropper = new Cropper(image, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                responsive: true,
                restore: false,
                checkOrientation: false,
            });
        };
    };
    reader.readAsDataURL(file);
});

async function cropImage(btn) {
    if (!cropper) {
        showToast("Please upload an image first!", "warning");
        return;
    }

    const fileName = inputImage.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    let isValid = false;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension)){
        isValid = true;
    }
    if (!isValid){
        showToast(`wrong file format "${extension}" `);
        return;
    }

    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    btn.disabled = true;
    btn.innerText = "Processing...";

    let canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    canvas.toBlob(async (blob) => {
        if (!blob) {
            showToast("Canvas Error!", "error");
            hideLoading(overlay, btn);
            return;
        }

        let formData = new FormData();
        formData.append("image", blob, "edited_image.jpg");

        try {
            let res = await fetch(`${window.BACKEND_URL}/crop_rotate`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                let data = await res.json();
                showToast("Success! Starting Download...", "success");
 
                const link = document.createElement('a');
                link.href = `${window.BACKEND_URL}/download/${data.filename}`;
                link.download = data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } else {
                showToast("Server Error: Could not save image", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Connection to Backend Failed", "error");
        } finally {
            setTimeout(() => hideLoading(overlay, btn), 1000);
        }
    }, 'image/jpeg', 0.95);
}

function hideLoading(overlay, btn) {
    overlay.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-download me-2"></i> Save & Download';
}
 
function rotateRight() { if (cropper) cropper.rotate(90); }
function rotateLeft() { if (cropper) cropper.rotate(-90); }
function setAspectRatio(ratio) { if (cropper) cropper.setAspectRatio(parseFloat(ratio)); }
function resetEditor() { if (cropper) cropper.reset(); }

let flipH = 1, flipV = 1;
function flipHorizontal() {
    if (!cropper) return;
    flipH = flipH === 1 ? -1 : 1;
    cropper.scaleX(flipH);
}
function flipVertical() {
    if (!cropper) return;
    flipV = flipV === 1 ? -1 : 1;
    cropper.scaleY(flipV);
}

// --- Drag & Drop logic ---
const uploadBox = document.querySelector('.image-box');

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
