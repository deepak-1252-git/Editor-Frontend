// Initialize Quill
var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            // Heading aur Font Styles
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            // Text Formatting
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            // Blocks aur Quotes
            ['blockquote', 'code-block'],
            // Lists aur Indents
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            // Alignment
            [{ 'align': [] }],
            // Links, Images, aur Videos
            ['link', 'image', 'video'],
            // Clean
            ['clean']
        ]
    }
});

const templates = {
    letter: "<h1>OFFICIAL LETTER</h1><p>To,<br>Recipient Name</p><p>Subject: [Write Subject]</p><p>Dear Sir/Madam,</p><p>[Write your content here]</p>",
    resume: "<h1>RESUME</h1><h3>Contact Info</h3><p>Email: example@mail.com | Phone: 123456789</p><h3>Experience</h3><p>[Write Job History]</p>"
};

function applyTemplate(type) {
    quill.root.innerHTML = templates[type];
}

async function importWordFile() {
    const file = document.getElementById('uploadDoc').files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${window.BACKEND_URL}/load-word`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.html) quill.root.innerHTML = data.html;
}

async function saveDocument() {
    const content = quill.root.innerHTML;
    const res = await fetch(`${window.BACKEND_URL}/save-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_content: content })
    });
    const data = await res.json();
    if (data.filename) {
        window.location.href = `${window.BACKEND_URL}/download/${data.filename}`;
    }
}