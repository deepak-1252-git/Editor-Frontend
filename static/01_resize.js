const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');

// Pre-fill width/height on selection
fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        document.getElementById('fileLabel').innerText = file.name;
        const img = new Image();
        img.onload = function() {
            document.getElementById('fileSizeDisplay').innerText = `Original: ${img.width}x${img.height}px`;
            document.getElementById('targetWidth').value = Math.round(img.width * 0.5);
            document.getElementById('targetHeight').value = Math.round(img.height * 0.5);
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
        }.bind(this); // 'this' yahan targetWidth input hai
        img.src = URL.createObjectURL(file);
    }
});

// Handle Form Submission
uploadForm.onsubmit = async (e) => {
    e.preventDefault();
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
            document.getElementById('resultArea').style.display = 'block';
            document.getElementById('resImg').src = `${window.BACKEND_URL}/outputs/${data.filename}`;
            document.getElementById('resRes').innerText = `${data.resolution[0]} x ${data.resolution[1]} px`;
            document.getElementById('resSize').innerText = `${data.file_size} KB`;
            document.getElementById('resDownload').href = `${window.BACKEND_URL}/download/${data.filename}`;
            
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            alert("Backend error: " + (data.error || "Something went wrong!"));
        }
    } catch (err) {
        console.error(err);
        alert("Could not connect to Backend. Make sure Render is awake!");
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