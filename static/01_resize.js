function showToast(message, type = "info") {
    let bgColor = "#333"; 
    if (type === "success") bgColor = "linear-gradient(to right, #00b09b, #96c93d)";
    if (type === "error") bgColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
    if (type === "warning") bgColor = "linear-gradient(to right, #c3aa07, #ff9800)";

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",  
        position: "right",  
        stopOnFocus: true, 
        style: { background: bgColor },
    }).showToast();
}
// ---------------------------------------------------
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');

fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        document.getElementById('fileLabel').innerText = file.name;
        const img = new Image();
        img.onload = function() {
            document.getElementById('fileSizeDisplay').innerText = `Original: ${img.width}x${img.height}px`;
            document.getElementById('targetWidth').value = Math.round(img.width * 0.5);
            document.getElementById('targetHeight').value = Math.round(img.height * 0.5);
            URL.revokeObjectURL(img.src)
        };
        img.src = URL.createObjectURL(file);
    }
});

document.getElementById('targetWidth').addEventListener('input', function() {
    const file = fileInput.files[0];
    if (file) {
        const img = new Image();
        img.onload = function() {
            const ratio = img.height / img.width;
            const newHeight = Math.round(this.value * ratio);
            document.getElementById('targetHeight').value = newHeight;
        }.bind(this);  
        img.src = URL.createObjectURL(file);
    }
});

uploadForm.onsubmit = async (e) => {
    e.preventDefault();

    const freshFileInput = document.getElementById('fileInput');
    if (!freshFileInput.files || freshFileInput.files.length === 0) {
        showToast("Plese select file first!","warning");
        return;
    }

    const fileName = fileInput.files[0].name;
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
    
    btnText.innerText = "Processing...";
    btn.disabled = true;

    const formData = new FormData(uploadForm);
    
    try {
        // FIXED: Backticks use kiye hain aur window.BACKEND_URL use kiya hai
        const response = await fetch(`${window.BACKEND_URL}/resizer`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Conversion successful!", "success");

            document.getElementById('resultArea').style.display = 'block';
            document.getElementById('resImg').src = `${window.BACKEND_URL}/outputs/${data.filename}`;
            document.getElementById('resRes').innerText = `${data.resolution[0]} x ${data.resolution[1]} px`;
            document.getElementById('resSize').innerText = `${data.file_size} KB`;
            document.getElementById('resDownload').href = `${window.BACKEND_URL}/download/${data.filename}`;
            
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            showToast("Backend error: " + (data.error || "Something went wrong!"),"error");
        }
    } catch (err) {
        console.error(err);
        showToast("Could not connect to Backend!","error");
    }
    
    btnText.innerText = "Process & Resize";
    btn.disabled = false;
    
};

// --- Drag and Drop Logic (No changes needed here) ---
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
        fileInput.files = files;
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
});