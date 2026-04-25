 const fileInput = document.getElementById('fileInput');
const pdfForm = document.getElementById('pdfForm');
const splitInputField = document.querySelector('input[name="page"]');
const lockInputField = document.querySelector('input[name="password"]');

function toggleExtras() {
    const isSplit = document.getElementById('split').checked;
    const isLock = document.getElementById('lock').checked;

    document.getElementById('splitInput').style.display = isSplit ? 'block' : 'none';
    document.getElementById('lockInput').style.display = isLock ? 'block' : 'none';

    splitInputField.required = isSplit;
    lockInputField.required = isLock;
}

toggleExtras();

fileInput.onchange = (e) => {
    const count = e.target.files.length;
    if (count > 0) {
        document.getElementById('fileLabel').innerText = count > 1 ? `${count} PDFs Selected` : e.target.files[0].name;
    }
}

pdfForm.onsubmit = async (e) => {
    e.preventDefault();

    if (!fileInput.files.length) {
        showToast("Please select a file!", "warning");
        return;
    }

    const fileName = fileInput.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension !== 'pdf') {
        showToast(`Wrong file uploaded: "${extension}"`, "error");
        return;
    }
    
    const btn = document.getElementById('submitBtn');
    btn.innerText = "Processing..."; 
    btn.disabled = true;

    const formData = new FormData(pdfForm);
    
    try {
        const response = await fetch(`${window.BACKEND_URL}/pdf_tool`, { 
            method: 'POST', 
            body: formData 
        });
        
        const data = await response.json();

        if (response.ok) {
            showToast("Processed successful!", "success");
            document.getElementById('resultArea').style.display = 'block';
            document.getElementById('downloadBtn').href = `${window.BACKEND_URL}/download/${data.filename}`;
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            showToast("Error: " + (data.error || "Processing failed"), "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Could not connect to Backend!", "error");
    } finally {
        btn.innerText = "Process PDF"; 
        btn.disabled = false;
    }
};
    
const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#pdfPassword');

if (togglePassword && password) {
    togglePassword.addEventListener('click', function () {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
}

// --- Drag & Drop logic ---
const uploadBox = document.querySelector('.upload-box');
const fileInput = document.getElementById('fileInput');

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
        fileInput.dispatchEvent(new Event('change'));
    }
});