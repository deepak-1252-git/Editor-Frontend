let currentRequiredType = ""; // Global variable
const fileInput = document.getElementById('fileInput');

fileInput.onchange = () => {
    const count = fileInput.files.length;
    const label1 = document.getElementById('fileLabel1'); 
    if (count > 0) {
        label1.innerText = count > 1 ? `${count} Files Selected` : fileInput.files[0].name;
    }
};

document.getElementById('dropZone').addEventListener('click', function(e) {
    const fileInput = document.getElementById('fileInput');
    
    if (this.classList.contains('is-disabled')) {
        alert("Please select format first");
    } else {
        fileInput.click();
    }
});

// --- Optimize Enable Function ---
function enableUpload(allowedType) {
    currentRequiredType = allowedType;

    const dropZone = document.getElementById('dropZone');
    const fileLabel = document.getElementById('fileLabel');
    const label1 = document.getElementById('fileLabel1');

    fileInput.value = ""; //???
    label1.innerText="Select or Drag & Drop another file";

    document.getElementById('resultArea').style.display = 'none';
    dropZone.classList.remove('is-disabled');
    dropZone.style.opacity = "1";
    dropZone.style.pointerEvents = "auto";  
    fileInput.disabled = false;

    if (allowedType === 'image') {
        fileInput.accept = "image/*"; 
        fileLabel.innerText = "Select PNG, JPG, WebP, BMP, GIF Files";  
    } 
    else if (allowedType === 'html') {
        fileInput.accept = ".html";
        fileLabel.innerText = "Please select .html Files";   
    } 
    else if (allowedType === 'pdf') {
        fileInput.accept = ".pdf";
        fileLabel.innerText = "Please select .pdf Files";   
    }
}

document.getElementById('convertForm').onsubmit = async (e) => {
    e.preventDefault();

    const freshFileInput = document.getElementById('fileInput');
    if (!freshFileInput.files || freshFileInput.files.length === 0) {
        alert("Plese select file first!");
        return;
    }

    const fileName = fileInput.files[0].name;
    const extension = fileName.split('.').pop().toLowerCase();

    let isValid = false;
    if (currentRequiredType === 'image') {
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension)) isValid = true;
    } else if (currentRequiredType === 'html') {
        if (extension === 'html') isValid = true;
    } else if (currentRequiredType === 'pdf') {
        if (extension === 'pdf') isValid = true;
    }

    if (!isValid){
        alert(`Wrong file! You selected "${currentRequiredType.toUpperCase()}" but file uploaded "${extension}" `);
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.innerText = "Converting..."; 
    btn.disabled = true;
    
    const formData = new FormData(e.target);
    
    try {
        // FIXED: Backticks (`) ka use kiya gaya hai
        const response = await fetch(`${window.BACKEND_URL}/convertor`, { 
            method: 'POST', 
            body: formData 
        });
        
        const data = await response.json();

        if (response.ok) {
            const list = document.getElementById('fileList');
            list.innerHTML = '';
            
            data.files.forEach(file => {
                // FIXED: Download link mein Backend URL add kiya hai loop ke andar
                const isZip = file.name.toLowerCase().endsWith('.zip');
                const buttonText = isZip ? 'Download All (ZIP)' : 'Download';
                list.innerHTML += `
                    <div class="result-item">
                        <div class="d-flex align-items:center">
                            <span class="badge bg-primary me-3">${file.type}</span>
                            <span style="font-size:0.9rem">${file.name}</span>
                        </div>
                        <a href="${window.BACKEND_URL}/download/${file.name}" class="btn-dl" id="download-link">${buttonText}</a>

                    </div>`;
            });
            
            document.getElementById('resultArea').style.display = 'block';
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            alert("Conversion failed: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error(error);
        alert("Backend connect nahi ho raha.");
    }
    finally {
        btn.innerText = "Convert Files"; 
        btn.disabled = false;
    } 
};

// --- Drag & Drop Logic (Same as before) ---
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
        fileInput.dispatchEvent(new Event('change'));
    }
});