async function generateQR() {
    const text = document.getElementById('qrText').value;
    const color = document.getElementById('qrColor').value;
    const bgColor = document.getElementById('qrBgColor').value;
    const btn = document.querySelector('.resize-btn');

    if (!text) {
        showToast("Please enter text or a URL");
        return;
    }

    btn.innerText = "GENERATING...";
    btn.style.opacity = "0.7";

    try {
        const response = await fetch('${window.BACKEND_URL}/generate_qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                color: color,
                bg_color: bgColor
            })
        });

        const data = await response.json();

        if (data.filename) {
            
            const imgPath = `${window.BACKEND_URL}/download/${data.filename}`;
            document.getElementById('qrPreview').src = imgPath;
            document.getElementById('qrDownload').href = imgPath;
            document.getElementById('resultArea').style.display = 'block';
            
            // Scroll to result
            document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        showToast("Something went wrong!");
    } finally {
        btn.innerText = "GENERATE QR CODE";
        btn.style.opacity = "1";
    }
}