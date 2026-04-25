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
// ----------------------------------------------------------------
function toggleExtras() {
    document.getElementById('splitInput').style.display = document.getElementById('split').checked ? 'block' : 'none';
    document.getElementById('lockInput').style.display = document.getElementById('lock').checked ? 'block' : 'none';
}

document.getElementById('fileInput').onchange = (e) => {
    const count = e.target.files.length;
    if (count > 0) {
        document.getElementById('fileLabel').innerText = count > 1 ? `${count} PDFs Selected` : e.target.files[0].name;
    }
}

document.getElementById('pdfForm').onsubmit = async (e) => {
    e.preventDefault();

    const freshFileInput = document.getElementById('fileInput');
    if (!freshFileInput.files || freshFileInput.files.length === 0) {
        showToast("Please select a file first!","warning");
        return;
    }

    const fileName = fileInput.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    let isValid = false;
    if (extension==='pdf'){
        isValid = true;
    }
    if (!isValid){
        showToast(`wrong file uploaded "${extension}" `,"error");
        return;
    }
    
    const btn = document.getElementById('submitBtn');
    btn.innerText = "Processing..."; 
    btn.disabled = true;

    const formData = new FormData(e.target);
    
    try {
        // FIXED: Backticks (`) use kiye hain
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
            showToast("Error: " + (data.error || "Processing failed"),"error");
        }
    } catch (err) {
        console.error(err);
        showToast("Could not connect to Backend!","error");
    }
    
    btn.innerText = "Process PDF"; 
    btn.disabled = false;
};

// Password Toggle logic (Ekdam sahi hai)
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