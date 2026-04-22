const fileInput = document.getElementById('fileInput');

fileInput.onchange = () => {
    const count = fileInput.files.length;
    if (count > 0) {
        document.getElementById('fileLabel').innerText = count > 1 ? `${count} Files Selected` : fileInput.files[0].name;
    }
};


// Is event listener ko script ke end mein add karein
document.getElementById('dropZone').addEventListener('click', function(e) {
    const fileInput = document.getElementById('fileInput');
    
    if (this.classList.contains('is-disabled')) {
        alert("Pehle format select kijiye!");
    } else {
        // Sirf tab trigger karein jab box enabled ho
        fileInput.click();
    }
});

// --- Optimize Enable Function ---
function enableUpload(allowedType) {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileLabel = document.getElementById('fileLabel');

    // 1. Box ko active karein
    dropZone.classList.remove('is-disabled');
    dropZone.style.opacity = "1";
    dropZone.style.pointerEvents = "auto"; // CSS override ko force karein
    
    fileInput.disabled = false;

    if (allowedType === 'image') {
        fileInput.accept = "image/*"; 
        fileLabel.innerText = "Select PNG, JPG, WebP, BMP, GIF Files";  
    } 
    else if (allowedType === 'html') {
        fileInput.accept = ".html";
        fileLabel.innerText = "You can select .html Files";   
    } 
    else if (allowedType === 'pdf') {
        fileInput.accept = ".pdf";
        fileLabel.innerText = "You can select .pdf Files";   
    } 
}

// // Function jo check karega ki format select hai ya nahi
// function triggerFileInput() {
//     const fileInput = document.getElementById('fileInput');
//     if (fileInput.disabled) {
//         alert("Pehle format select kijiye!");
//     } else {
//         fileInput.click();
//     }
// }

document.getElementById('convertForm').onsubmit = async (e) => {
    e.preventDefault();
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
        alert("Backend connect nahi ho raha. Check karo Render service up hai ya nahi.");
    }
    
    btn.innerText = "Convert Files"; 
    btn.disabled = false;
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