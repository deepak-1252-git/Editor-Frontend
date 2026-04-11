const fileInput = document.getElementById('fileInput');

fileInput.onchange = () => {
    const count = fileInput.files.length;
    if (count > 0) {
        document.getElementById('fileLabel').innerText = count > 1 ? `${count} Files Selected` : fileInput.files[0].name;
    }
};

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
                list.innerHTML += `
                    <div class="result-item">
                        <div class="d-flex align-items:center">
                            <span class="badge bg-primary me-3">${file.type}</span>
                            <span style="font-size:0.9rem">${file.name}</span>
                        </div>
                        <a href="${window.BACKEND_URL}/download/${file.name}" class="btn-dl">Download</a>
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