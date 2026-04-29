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
    
    const count = e.target.files.length;
    if (count > 0) {
        label1.querySelector('.custom-file-upload').innerText = e.target.files[0].name;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        if (cropper) { 
            cropper.destroy(); 
        }
        
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

function rotateRight() { if (cropper) cropper.rotate(90); }
function rotateLeft() { if (cropper) cropper.rotate(-90); }
function setAspectRatio(ratio) { if (cropper) cropper.setAspectRatio(parseFloat(ratio)); }

let flipH = 1, flipV = 1;
function flipHorizontal() {
    if (!cropper) return;
    flipH = (flipH === 1) ? -1 : 1;
    cropper.scaleX(flipH);
}
function flipVertical() {
    if (!cropper) return;
    flipV = (flipV === 1) ? -1 : 1;
    cropper.scaleY(flipV);
}
function resetEditor() { if (cropper) cropper.reset(); }

async function cropImage(btn) {
    if (!cropper)
        showToast("Please select a file first!","warning");
        return;

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
                let data = await res.json();
                
                showToast("Edit successful!", "success");
                
                window.location.href = `${window.BACKEND_URL}/download/${data.filename}`;

            } else {
                showToast("Server error!","error");
            }
        } catch (error) {
            showToast("Connection failed", "error");
        } finally {
            setTimeout(() => hideLoading(overlay, btn), 1000);
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