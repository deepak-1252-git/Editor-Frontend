async function generateQR() {
    const formData = new FormData();
    formData.append('text', document.getElementById('qrText').value);
    formData.append('color', document.getElementById('qrColor').value);
    formData.append('gradient_color', document.getElementById('qrGradient').value);
    formData.append('bg_color', document.getElementById('qrBgColor').value);
    formData.append('qr_type', document.getElementById('qrType').value);
    
    const logoFile = document.getElementById('qrLogo').files[0];
    const btn = document.querySelector('.qr-btn');

    if (logoFile) {
        formData.append('logo', logoFile);
    }

    if (!document.getElementById('qrText').value) return showToast("Text or URL is required!");

    btn.innerText = "Generating...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    try {
        const response = await fetch(`${window.BACKEND_URL}/generate_qr`, {
            method: 'POST',
            body: formData   
        });

        const data = await response.json();

        if (data.filename) {
            
            const imgPath = `${window.BACKEND_URL}/download/${data.filename}`;
            const timestamp = new Date().getTime();

            const qrPreview = document.getElementById('qrPreview');
            qrPreview.src = `${imgPath}?t=${timestamp}`;
            
            document.getElementById('qrDownload').href = imgPath;
            document.getElementById('resultArea').style.display = 'block';
            
            // Scroll to result
            setTimeout(() => {
                document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        else if (data.error) {
            showToast("Server Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        showToast("Something went wrong!");
    } finally {
        btn.innerText = "GENERATE QR CODE";
        btn.style.opacity = "1";
        btn.disabled = false;
    }
}