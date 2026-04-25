const imageInput = document.getElementById('imageInput');
const compressForm = document.getElementById('compressForm');

// Pre-fill target size (50% of original)
imageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const sizeKB = file.size / 1024;
        document.getElementById('fileLabel').innerText = file.name;
        document.getElementById('fileSizeInfo').innerText = `Current Size: ${sizeKB.toFixed(2)} KB`;
        document.getElementById('targetSize').value = Math.round(sizeKB * 0.5);
    }
});

compressForm.onsubmit = async (e) => {
    e.preventDefault();

    const freshFileInput = document.getElementById('imageInput');
    if (!freshFileInput.files || freshFileInput.files.length === 0) {
        showToast("Please select a file first!","warning");
        return;
    }

    const fileName = imageInput.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    let isValid = false;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension)){
        isValid = true;
    }
    if (!isValid){
        showToast(`wrong file uploaded "${extension}" `,"error");
        return;
    }

    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

    btnText.innerText = "Compressing... Please wait";
    btn.disabled = true;

    const formData = new FormData(compressForm);
    try {
        // FIXED: Backticks (`) ka use kiya hai URL ke liye
        const response = await fetch(`${window.BACKEND_URL}/compressor`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            showToast("Compressed successful!", "success");

            document.getElementById('resultArea').style.display = 'block';
            document.getElementById('resOrig').innerText = data.original_size;
            document.getElementById('resComp').innerText = data.compressed_size;
            document.getElementById('resRed').innerText = data.reduction;
            
            // FIXED: Download link mein Backend URL add kiya hai
            document.getElementById('resDownload').href = `${window.BACKEND_URL}/download/${data.filename}`;

            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            showToast("Server Error: " + data.error , "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Could not connect to Backend!","error");
    }

    btnText.innerText = "Compress Now";
    btn.disabled = false;
};

// --- Drag & Drop logic (Bilkul sahi hai) ---
const uploadBox = document.querySelector('.upload-box');
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
        imageInput.files = files;
        const event = new Event('change');
        imageInput.dispatchEvent(event);
    }
});