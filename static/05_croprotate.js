function showToast(message, type = "info") {
    let bgColor = "rgba(255, 255, 255, 0.05)";  
    
    if (type === "success") bgColor = "rgba(40, 167, 69, 0.2)";
    if (type === "error") bgColor = "rgba(220, 53, 69, 0.2)";   
    if (type === "warning") bgColor = "rgba(172, 192, 23, 0.2)";   

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true, 
        // --- Custom Glass Effect Yahan Hai ---
        style: {
            background: bgColor,
            backdropFilter: "blur(12px)",
            webkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "#faf8f8",
            fontSize: "14px"
        },
    }).showToast();
}
// ------------------------------------
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

    const freshFileInput = document.getElementById('inputImage');
    if (!freshFileInput.files || freshFileInput.files.length === 0) {
        showToast("Please select a file first!","warning");
        return;
    }

    const fileName = inputImage.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    let isValid = false;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension)){
        isValid = true;
    }
    if (!isValid){
        showToast(`wrong file uploaded "${extension}" `,"warning");
        return;
    }

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
            showToast("Canvas empty hai!","error");
            hideLoading(overlay, downloadBtn);
            return;
        }

        let formData = new FormData();
        formData.append("image", blob, "cropped.jpg");

        try {
             
            let res = await fetch(`${window.BACKEND_URL}/crop_rotate`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                showToast("Edit successful!", "success");

                let data = await res.json();
                
                window.location.href = `${window.BACKEND_URL}/download/${data.filename}`;

                setTimeout(() => hideLoading(overlay, downloadBtn), 900);
            } else {
                showToast("Server error!","error");
            }

        } catch (error) {
            console.error("Error:", error);
            showToast("Could not connect to Backend","error");
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