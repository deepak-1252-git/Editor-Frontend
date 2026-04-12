const form = document.querySelector('.subscribe-form');
form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.innerText = "Sending...";
    
    const formData = new FormData(form);
    const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
        form.innerHTML = "<p style='color: #4ade80;'>✨ Thanks for subscribing! Check your email soon.</p>";
    } else {
        alert("Oops! Kuch gadbad ho gayi.");
        btn.innerText = "Subscribe";
    }
};