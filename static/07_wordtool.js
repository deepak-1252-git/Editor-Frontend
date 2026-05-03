'use strict';

// ----------- STATE -------------------------------- 
let currentZoom = 100;
let isLandscape = false;
let autosaveTimer = null;
let findMatches = [];
let findIndex = 0;
const AUTOSAVE_KEY = 'toolnova_word_autosave';
const AUTOSAVE_DELAY = 1500; // ms

const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Start writing your document…',
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ script: 'sub' }, { script: 'super' }],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    }
});

// -------------autosave ------------
window.addEventListener('load', () => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
        try {
            const { content, ts } = JSON.parse(saved);
            if (content && content !== '<p><br></p>') {
                quill.root.innerHTML = content;
                const age = Math.round((Date.now() - ts) / 60000);
                showToast(`📄 Restored autosave from ${age < 1 ? 'just now' : age + ' min ago'}`, 'info');
            }
        } catch (_) { }
    }
    updateStats();
    buildTableGrid();
});

quill.on('text-change', () => {
    updateStats();
    triggerAutosave();
});

quill.on('selection-change', (range) => {
    const sel = document.getElementById('selectedCount');
    if (range && range.length > 0) {
        sel.style.display = 'inline';
        sel.textContent = `${range.length} selected`;
    } else {
        sel.style.display = 'none';
    }
});

// ------------ SHORTCUTS ------------------
document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 's') { e.preventDefault(); saveDocument(); }
    if (ctrl && e.key === 'h') { e.preventDefault(); openFindReplace(); }
    if (ctrl && e.key === 'p') { e.preventDefault(); printDocument(); }
    if (ctrl && e.key === '=') { e.preventDefault(); zoomIn(); }
    if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); }
    if (ctrl && e.key === '0') { e.preventDefault(); resetZoom(); }
    if (e.key === 'Escape') { closeFindReplace(); closeTableModal(); }
    if (e.key === 'Enter' && document.getElementById('findReplaceModal').classList.contains('open')) {
        e.preventDefault(); findNext();
    }
});

// ----------CHAR COUNT------------------
function updateStats() {
    const text = quill.getText().trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    document.getElementById('wordCount').innerHTML = `<i class="fa fa-font"></i> ${words.toLocaleString()} word${words !== 1 ? 's' : ''}`;
    document.getElementById('charCount').textContent = `${chars.toLocaleString()} char${chars !== 1 ? 's' : ''}`;

    // Rough page estimate (avg ~500 words/page)
    const pages = Math.max(1, Math.ceil(words / 500));
    document.getElementById('statusPage').textContent = `~${pages} Page${pages !== 1 ? 's' : ''}`;
}

function triggerAutosave() {
    clearTimeout(autosaveTimer);
    setAutosaveStatus('saving');
    autosaveTimer = setTimeout(() => {
        try {
            const content = quill.root.innerHTML;
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ content, ts: Date.now() }));
            setAutosaveStatus('saved');
        } catch (_) {
            setAutosaveStatus('error');
        }
    }, AUTOSAVE_DELAY);
}

function setAutosaveStatus(state) {
    const spinner = document.getElementById('autosaveSpinner');
    const text = document.getElementById('autosaveText');
    const indicator = document.getElementById('autosaveIndicator');

    spinner.style.display = state === 'saving' ? 'inline-block' : 'none';
    if (state === 'saving') { text.textContent = 'Saving…'; indicator.className = 'autosave-indicator saving'; }
    if (state === 'saved') { text.textContent = 'Auto-saved'; indicator.className = 'autosave-indicator saved'; }
    if (state === 'error') { text.textContent = 'Save failed'; indicator.className = 'autosave-indicator error'; }
}

// ------------------NEW / CLEAR DOCUMENT -------------------- 
function newDocument() {
    if (quill.getText().trim().length > 10) {
        if (!confirm('Clear the document and start fresh?')) return;
    }
    quill.setContents([]);
    localStorage.removeItem(AUTOSAVE_KEY);
    showToast('📄 New document started', 'success');
}

const templates = {
    letter: `
    <h2 style="text-align:center">OFFICIAL LETTER</h2>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p>To,<br><strong>Recipient Name</strong><br>Designation<br>Organization<br>City, State – PIN</p>
    <p><strong>Subject:</strong> [Write subject here]</p>
    <p>Dear Sir / Madam,</p>
    <p>I am writing this letter to bring to your kind attention that [write the main content of your letter here]. We hope this matter will be given due consideration.</p>
    <p>Thanking you,</p>
    <p><strong>Yours sincerely,</strong><br>[Your Name]<br>[Your Designation]<br>[Your Contact]</p>`,

    resume: `
    <h1 style="text-align:center">YOUR FULL NAME</h1>
    <p style="text-align:center">📧 email@example.com &nbsp;|&nbsp; 📞 +91 98765 43210 &nbsp;|&nbsp; 🌐 linkedin.com/in/yourname</p>
    <hr>
    <h3>Professional Summary</h3>
    <p>Motivated professional with X years of experience in [field]. Skilled in [skill 1], [skill 2], and [skill 3].</p>
    <h3>Work Experience</h3>
    <p><strong>Job Title</strong> — Company Name &nbsp;|&nbsp; <em>Jan 2022 – Present</em></p>
    <ul><li>Responsibility / Achievement 1</li><li>Responsibility / Achievement 2</li></ul>
    <h3>Education</h3>
    <p><strong>B.Tech / Degree Name</strong> — University Name &nbsp;|&nbsp; <em>2018 – 2022</em></p>
    <h3>Skills</h3>
    <p>Python, JavaScript, MS Office, Communication, Problem Solving</p>`,

    invoice: `
    <h2>INVOICE</h2>
    <p><strong>Invoice No:</strong> INV-001 &nbsp;&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <hr>
    <p><strong>From:</strong><br>Your Company Name<br>Address, City<br>GST: XXXXXXXXXXXX</p>
    <p><strong>To:</strong><br>Client Name<br>Client Address<br>GST: XXXXXXXXXXXX</p>
    <table border="1" style="width:100%;border-collapse:collapse">
      <tr style="background:#eee"><th style="padding:8px">Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
      <tr><td style="padding:8px">Service / Product 1</td><td>1</td><td>₹5,000</td><td>₹5,000</td></tr>
      <tr><td style="padding:8px">Service / Product 2</td><td>2</td><td>₹2,500</td><td>₹5,000</td></tr>
      <tr><td colspan="3" style="padding:8px;text-align:right"><strong>Total</strong></td><td style="padding:8px"><strong>₹10,000</strong></td></tr>
    </table>
    <p><em>Payment due within 15 days. Thank you for your business!</em></p>`,

    report: `
    <h1 style="text-align:center">BUSINESS REPORT</h1>
    <p style="text-align:center"><em>Prepared by: [Name] &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString()}</em></p>
    <hr>
    <h2>1. Executive Summary</h2>
    <p>[Brief overview of the report's purpose and key findings.]</p>
    <h2>2. Introduction</h2>
    <p>[Background information and context of the report.]</p>
    <h2>3. Key Findings</h2>
    <ul><li>Finding 1</li><li>Finding 2</li><li>Finding 3</li></ul>
    <h2>4. Analysis</h2>
    <p>[Detailed analysis and discussion of the findings.]</p>
    <h2>5. Recommendations</h2>
    <ol><li>Recommendation 1</li><li>Recommendation 2</li></ol>
    <h2>6. Conclusion</h2>
    <p>[Summary and next steps.]</p>`,

    meeting: `
    <h2>MEETING MINUTES</h2>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()} &nbsp;&nbsp; <strong>Time:</strong> [HH:MM]</p>
    <p><strong>Location / Platform:</strong> [Venue or Video Call Link]</p>
    <p><strong>Attendees:</strong> Name 1, Name 2, Name 3</p>
    <p><strong>Facilitator:</strong> [Name]</p>
    <hr>
    <h3>Agenda</h3>
    <ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>
    <h3>Discussion Points</h3>
    <p><strong>Topic 1:</strong> [Summary of discussion]</p>
    <p><strong>Topic 2:</strong> [Summary of discussion]</p>
    <h3>Action Items</h3>
    <table border="1" style="width:100%;border-collapse:collapse">
      <tr style="background:#eee"><th style="padding:6px">Action</th><th>Owner</th><th>Deadline</th></tr>
      <tr><td style="padding:6px">Task description</td><td>Name</td><td>DD/MM/YYYY</td></tr>
    </table>
    <h3>Next Meeting</h3>
    <p>[Date, Time, Location]</p>`,

    coverletter: `
    <p>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p>Hiring Manager<br>[Company Name]<br>[Company Address]</p>
    <p><strong>Re: Application for [Job Title] Position</strong></p>
    <p>Dear Hiring Manager,</p>
    <p>I am writing to express my strong interest in the [Job Title] position at [Company Name]. With [X] years of experience in [field], I am confident in my ability to contribute meaningfully to your team.</p>
    <p>In my previous role at [Previous Company], I [key achievement or responsibility]. This experience has equipped me with [specific skills relevant to the job].</p>
    <p>I am particularly drawn to [Company Name] because [specific reason]. I am excited about the opportunity to bring my expertise in [skill] to your growing team.</p>
    <p>Thank you for considering my application. I look forward to the opportunity to discuss how my background can benefit [Company Name].</p>
    <p>Sincerely,<br><strong>[Your Name]</strong><br>[Phone] | [Email]</p>`
};

function toggleTemplateMenu() {
    const menu = document.getElementById('templateMenu');
    menu.classList.toggle('open');
    document.addEventListener('click', closeTemplateMenuOutside);
}

function closeTemplateMenuOutside(e) {
    const wrap = document.querySelector('.tb-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('templateMenu').classList.remove('open');
        document.removeEventListener('click', closeTemplateMenuOutside);
    }
}

function applyTemplate(type) {
    if (!templates[type]) return;
    if (quill.getText().trim().length > 10) {
        if (!confirm('This will replace the current document. Continue?')) {
            document.getElementById('templateMenu').classList.remove('open');
            return;
        }
    }
    quill.root.innerHTML = templates[type];
    document.getElementById('templateMenu').classList.remove('open');
    showToast(`✅ Template applied`, 'success');
}


async function importWordFile() {
    const file = document.getElementById('uploadDoc').files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
        showToast('❌ Only .docx files are supported', 'error'); return;
    }
    if (file.size > 15 * 1024 * 1024) {
        showToast('❌ File too large (max 15MB)', 'error'); return;
    }

    showToast('📂 Loading document…', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${window.BACKEND_URL}/load-word`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Load failed');

        quill.root.innerHTML = data.html || '';
        showToast('✅ Document loaded successfully', 'success');

        if (data.warnings && data.warnings.length) {
            console.warn('Mammoth warnings:', data.warnings);
        }
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
    } finally {
        document.getElementById('uploadDoc').value = '';
    }
}

// -----------Download --------------------
async function saveDocument() {
    const content = getCleanHTML();
    if (!content || content === '<p><br></p>') {
        showToast('⚠️ Document is empty', 'warning'); return;
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>Saving…</span>';
    showToast('⏳ Preparing your document…', 'info');

    try {
        const title = prompt('Enter document title:', 'My Document') || 'My Document';
        const res = await fetch(`${window.BACKEND_URL}/save-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html_content: content, title })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');

        showToast(`✅ Downloaded! (${data.size_kb} KB)`, 'success');
        window.location.href = `${window.BACKEND_URL}/download/${data.filename}`;
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa fa-download"></i><span>Download</span>';
    }
}


function getCleanHTML() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(quill.root.innerHTML, 'text/html');

    doc.querySelectorAll('a').forEach(a => {
        a.style.wordBreak = 'break-all';
    });
    // Remove empty spans
    doc.querySelectorAll('span:empty').forEach(s => s.remove());

    return doc.body.innerHTML;
}

// -----------------PRINT -------------------
function printDocument() {
    const content = quill.root.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head>
    <title>Print – ToolNOVA</title>
    <style>
      body { font-family: 'Times New Roman', serif; margin: 20mm; color: #000; }
      h1,h2,h3 { margin-bottom: 8px; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 6px; }
      @media print { body { margin: 0; } }
    </style></head><body>
    ${content}
    <script>window.onload=()=>{window.print();window.close();}<\/script>
  </body></html>`);
    win.document.close();
}

// ----------ZOOM-------------------------- 
function applyZoom() {
    const editor = document.querySelector('.ql-editor');
    if (editor) {
        editor.style.transform = `scale(${currentZoom / 100})`;
        editor.style.transformOrigin = 'top center';

        const naturalH = editor.scrollHeight;
        editor.parentElement.style.minHeight = `${naturalH * currentZoom / 100}px`;
    }
    document.getElementById('zoomDisplay').textContent = `${currentZoom}%`;
}

function zoomIn() { if (currentZoom < 200) { currentZoom += 10; applyZoom(); } }
function zoomOut() { if (currentZoom > 50) { currentZoom -= 10; applyZoom(); } }
function resetZoom() { currentZoom = 100; applyZoom(); }

// ---------------------------------------
function toggleOrientation() {
    isLandscape = !isLandscape;
    const editor = document.querySelector('.ql-editor');
    const btn = document.getElementById('orientBtn');
    if (isLandscape) {
        editor.style.width = '297mm';
        editor.style.minHeight = '210mm';
        btn.innerHTML = '<i class="fa fa-file" style="transform:rotate(90deg)"></i>';
        document.getElementById('statusOrientation').textContent = 'Landscape';
    } else {
        editor.style.width = '210mm';
        editor.style.minHeight = '297mm';
        btn.innerHTML = '<i class="fa fa-file"></i>';
        document.getElementById('statusOrientation').textContent = 'Portrait';
    }
    showToast(`📐 ${isLandscape ? 'Landscape' : 'Portrait'} mode`, 'info');
}

// ---------------------INSERT PAGE BREAK -------------------
function insertPageBreak() {
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'block', true);
    quill.insertText(range.index, '\n', { 'class': 'page-break' });
    quill.root.innerHTML += '<div style="page-break-after:always;border-top:2px dashed #aaa;margin:24px 0;"></div>';
    showToast('📄 Page break inserted', 'info');
}

// ---------------- FIND & REPLACE -----------------
function openFindReplace() {
    document.getElementById('findReplaceModal').classList.add('open');
    document.getElementById('findInput').focus();
}

function closeFindReplace(e) {
    if (e && e.target !== document.getElementById('findReplaceModal')) return;
    document.getElementById('findReplaceModal').classList.remove('open');
    clearHighlights();
    findMatches = [];
    findIndex = 0;
    document.getElementById('findCount').textContent = '';
}

function highlightFind() {
    clearHighlights();
    findMatches = [];
    findIndex = 0;
    const term = document.getElementById('findInput').value;
    const caseSens = document.getElementById('caseSensitive').checked;
    if (!term) { document.getElementById('findCount').textContent = ''; return; }

    const html = quill.root.innerHTML;
    const flags = caseSens ? 'g' : 'gi';
    const regex = new RegExp(escapeRegex(term), flags);
    const highlighted = html.replace(regex, m => `<mark class="find-highlight">${m}</mark>`);
    quill.root.innerHTML = highlighted;

    findMatches = quill.root.querySelectorAll('mark.find-highlight');
    document.getElementById('findCount').textContent =
        findMatches.length ? `${findMatches.length} match${findMatches.length > 1 ? 'es' : ''}` : 'No matches';
    if (findMatches[0]) findMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearHighlights() {
    quill.root.querySelectorAll('mark.find-highlight').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent));
    });
}

function findNext() {
    if (!findMatches.length) { highlightFind(); return; }
    findIndex = (findIndex + 1) % findMatches.length;
    findMatches[findIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function findPrev() {
    if (!findMatches.length) return;
    findIndex = (findIndex - 1 + findMatches.length) % findMatches.length;
    findMatches[findIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function replaceNext() {
    const term = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    const caseSens = document.getElementById('caseSensitive').checked;
    if (!term) return;

    const flags = caseSens ? '' : 'i';
    const regex = new RegExp(escapeRegex(term), flags);
    quill.root.innerHTML = quill.root.innerHTML.replace(/<mark class="find-highlight">(.*?)<\/mark>/, replace);
    highlightFind();
    showToast('✅ Replaced 1 match', 'success');
}

function replaceAll() {
    const term = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    const caseSens = document.getElementById('caseSensitive').checked;
    if (!term) return;

    clearHighlights();
    const flags = caseSens ? 'g' : 'gi';
    const regex = new RegExp(escapeRegex(term), flags);
    const count = (quill.root.innerHTML.match(regex) || []).length;
    quill.root.innerHTML = quill.root.innerHTML.replace(regex, replace);
    showToast(`✅ Replaced ${count} match${count !== 1 ? 'es' : ''}`, 'success');
    document.getElementById('findCount').textContent = '';
    findMatches = [];
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------TABLE INSERT------------- 
function insertTable() {
    document.getElementById('tableModal').classList.add('open');
}

function closeTableModal(e) {
    if (e && e.target !== document.getElementById('tableModal')) return;
    document.getElementById('tableModal').classList.remove('open');
}

function buildTableGrid() {
    const grid = document.getElementById('tableGrid');
    const label = document.getElementById('tableGridLabel');
    const COLS = 8, ROWS = 8;
    grid.style.gridTemplateColumns = `repeat(${COLS}, 28px)`;

    for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'tg-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('mouseover', () => highlightGrid(r, c, label));
            cell.addEventListener('click', () => doInsertTable(r, c));
            grid.appendChild(cell);
        }
    }
}

function highlightGrid(row, col, label) {
    document.querySelectorAll('.tg-cell').forEach(c => {
        const r = +c.dataset.row, cc = +c.dataset.col;
        c.classList.toggle('tg-active', r <= row && cc <= col);
    });
    label.textContent = `${row} × ${col} table`;
}

function doInsertTable(rows, cols) {
    let html = '<table border="1" style="width:100%;border-collapse:collapse;margin:12px 0">';
    for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            html += r === 0
                ? `<th style="padding:8px;background:#f0f0f0;min-width:80px">&nbsp;</th>`
                : `<td style="padding:8px;min-width:80px">&nbsp;</td>`;
        }
        html += '</tr>';
    }
    html += '</table><p><br></p>';

    const range = quill.getSelection(true);
    const pos = range ? range.index : quill.getLength();
    quill.clipboard.dangerouslyPasteHTML(pos, html);
    closeTableModal();
    showToast(`🗂 ${rows}×${cols} table inserted`, 'success');
}
