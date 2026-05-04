'use strict';

let currentZoom = 100;
let isLandscape = false;
let autosaveTimer = null;
let findMatches = [];   
let findCurrent = -1;
const AUTOSAVE_KEY = 'toolnova_word_autosave';

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
            ['link', 'image'],
            ['clean']
        ]
    }
});

// -------LOAD---------------------------- 
window.addEventListener('load', () => {
    restoreAutosave();
    updateStats();
    buildTableGrid();
});

// ----------QUILL EVENTS------------- 
quill.on('text-change', () => {
    updateStats();
    scheduleAutosave();
});

quill.on('selection-change', (range) => {
    const el = document.getElementById('statusSel');
    if (!el) return;
    if (range && range.length > 0) {
        el.style.display = 'inline';
        el.textContent = `${range.length} selected`;
    } else {
        el.style.display = 'none';
    }
});

// --------------SHORTCUTS------------------- 
document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 's') { e.preventDefault(); saveDocument(); }
    if (ctrl && e.key === 'h') { e.preventDefault(); openModal('findReplaceModal'); setTimeout(() => document.getElementById('findInput').focus(), 80); }
    if (ctrl && e.key === 'p') { e.preventDefault(); printDocument(); }
    if (ctrl && e.key === '=') { e.preventDefault(); zoomIn(); }
    if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); }
    if (ctrl && e.key === '0') { e.preventDefault(); resetZoom(); }
    if (e.key === 'Escape') { closeAllModals(); }
    if (e.key === 'Enter' && isModalOpen('findReplaceModal')) {
        if (document.activeElement.id !== 'replaceInput') {
            e.preventDefault(); findNext();
        }
    }
});

// -----------STATS ---------------------------------------
function updateStats() {
    const text = quill.getText().replace(/\n$/, '');
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const pages = Math.max(1, Math.ceil(words / 500));

    const wc = document.getElementById('wordCount');
    const cc = document.getElementById('charCount');
    const pg = document.getElementById('statusPage');
    if (wc) wc.innerHTML = `<i class="fa fa-font"></i> ${words.toLocaleString()} word${words !== 1 ? 's' : ''}`;
    if (cc) cc.textContent = `${chars.toLocaleString()} char${chars !== 1 ? 's' : ''}`;
    if (pg) pg.textContent = `~${pages} page${pages !== 1 ? 's' : ''}`;
}

// ---------AUTO-SAVE ------------------------------------
function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    setAutosaveUI('saving');
    autosaveTimer = setTimeout(doAutosave, 1500);
}

function doAutosave() {
    try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ html: quill.root.innerHTML, ts: Date.now() }));
        setAutosaveUI('saved');
    } catch (_) { setAutosaveUI('error'); }
}

function restoreAutosave() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_KEY);
        if (!raw) return;
        const { html, ts } = JSON.parse(raw);
        if (!html || html === '<p><br></p>') return;
        quill.root.innerHTML = html;
        const mins = Math.round((Date.now() - ts) / 60000);
        showToast(`📄 Restored from ${mins < 1 ? 'just now' : mins + ' min ago'}`, 'info');
    } catch (_) { }
}

function setAutosaveUI(state) {
    const spin = document.getElementById('autosaveSpinner');
    const txt = document.getElementById('autosaveText');
    const ind = document.getElementById('autosaveIndicator');
    if (!spin || !txt || !ind) return;
    spin.style.display = state === 'saving' ? 'inline-block' : 'none';
    txt.textContent = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Auto-saved' : 'Save failed';
    ind.className = `autosave-indicator ${state}`;
}

// --------------NEW DOCUMENT------------------------------- 
function newDocument() {
    if (quill.getText().trim().length > 5 && !confirm('Clear the document and start fresh?')) return;
    quill.setContents([]);
    localStorage.removeItem(AUTOSAVE_KEY);
    showToast('📄 New document ready', 'success');
}

function formatDate(addDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + addDays);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const templates = {
    letter: `<h2 style="text-align:center">OFFICIAL LETTER</h2>
<p><strong>Date:</strong> ${formatDate()}</p><br>
<p>To,<br><strong>Recipient Name</strong><br>Designation &amp; Department<br>Organization Name<br>City, State – 000000</p><br>
<p><strong>Subject:</strong> [Write the subject of your letter here]</p><br>
<p>Dear Sir / Madam,</p>
<p>I am writing this letter to bring to your kind attention that [main body here. Clearly state the purpose, provide relevant details, and make your request concisely].</p>
<p>We hope this matter shall be given due consideration at the earliest.</p><br>
<p>Thanking you,</p><p><strong>Yours sincerely,</strong><br>[Your Full Name]<br>[Your Designation]<br>[Phone] | [Email]</p>`,

    resume: `<h1 style="text-align:center;margin-bottom:4px">YOUR FULL NAME</h1>
<p style="text-align:center;color:#555">📧 email@example.com &nbsp;|&nbsp; 📞 +91 98765 43210 &nbsp;|&nbsp; 🌐 linkedin.com/in/profile &nbsp;|&nbsp; 📍 City, State</p>
<hr style="border:1px solid #ddd;margin:12px 0">
<h3>Professional Summary</h3>
<p>Results-driven professional with [X] years of experience in [field]. Skilled in [skill 1], [skill 2], and [skill 3].</p>
<h3>Work Experience</h3>
<p><strong>Job Title</strong> — Company Name &nbsp;|&nbsp; <em>Jan 2022 – Present, City</em></p>
<ul><li>Led [project] that resulted in [measurable outcome]</li><li>Managed [team/process] improving efficiency by [%]</li></ul>
<h3>Education</h3>
<p><strong>Bachelor of Technology – [Branch]</strong> — University Name &nbsp;|&nbsp; <em>2018 – 2022 | CGPA: 8.5/10</em></p>
<h3>Skills</h3>
<p><strong>Technical:</strong> Python, JavaScript, SQL, MS Office, Git<br><strong>Soft Skills:</strong> Leadership, Communication, Problem Solving</p>`,

    invoice: `<h2 style="color:#1e40af">INVOICE</h2>
<p><strong>Invoice No:</strong> INV-2026-001 &nbsp;&nbsp; <strong>Date:</strong> ${formatDate()} &nbsp;&nbsp; <strong>Due Date:</strong> ${formatDate(15)}</p><hr>
<p><strong>From:</strong><br>Your Company Name<br>Address, City – PIN<br>GST: XXXXXXXXXXXX</p><br>
<p><strong>To:</strong><br>Client Name<br>Address, City – PIN<br>GST: XXXXXXXXXXXX</p><br>
<table border="1" style="width:100%;border-collapse:collapse;font-size:13px">
  <tr style="background:#dbeafe"><th style="padding:10px;text-align:left">Description</th><th style="padding:10px">Qty</th><th style="padding:10px">Rate (₹)</th><th style="padding:10px">Amount (₹)</th></tr>
  <tr><td style="padding:10px">Service / Product 1</td><td style="padding:10px;text-align:center">1</td><td style="padding:10px;text-align:right">5,000</td><td style="padding:10px;text-align:right">5,000</td></tr>
  <tr><td style="padding:10px">Service / Product 2</td><td style="padding:10px;text-align:center">2</td><td style="padding:10px;text-align:right">2,500</td><td style="padding:10px;text-align:right">5,000</td></tr>
  <tr style="background:#f8fafc"><td colspan="3" style="padding:10px;text-align:right"><strong>Subtotal</strong></td><td style="padding:10px;text-align:right"><strong>₹10,000</strong></td></tr>
  <tr style="background:#f8fafc"><td colspan="3" style="padding:10px;text-align:right">GST @ 18%</td><td style="padding:10px;text-align:right">₹1,800</td></tr>
  <tr style="background:#dbeafe"><td colspan="3" style="padding:10px;text-align:right"><strong>Total Due</strong></td><td style="padding:10px;text-align:right"><strong>₹11,800</strong></td></tr>
</table>
<br><p><em>Payment due within 15 days. Thank you for your business!</em></p>`,

    report: `<h1 style="text-align:center">BUSINESS REPORT</h1>
<p style="text-align:center"><em>By: [Author] &nbsp;|&nbsp; Date: ${formatDate()}</em></p><hr>
<h2>1. Executive Summary</h2><p>[Concise overview of purpose and key conclusions in 3–5 sentences.]</p>
<h2>2. Introduction</h2><p>[Background, context, objectives, and scope.]</p>
<h2>3. Key Findings</h2>
<ul><li><strong>Finding 1:</strong> [Description and data]</li><li><strong>Finding 2:</strong> [Description and data]</li></ul>
<h2>4. Analysis</h2><p>[In-depth analysis and discussion of findings.]</p>
<h2>5. Recommendations</h2>
<ol><li>[Recommendation 1 with rationale]</li><li>[Recommendation 2 with rationale]</li></ol>
<h2>6. Conclusion</h2><p>[Summary and next steps.]</p>`,

    meeting: `<h2>MEETING MINUTES</h2>
<table border="1" style="width:100%;border-collapse:collapse;font-size:13px">
  <tr><td style="padding:8px;background:#f8fafc;width:20%"><strong>Date</strong></td><td style="padding:8px">${formatDate()}</td><td style="padding:8px;background:#f8fafc;width:20%"><strong>Time</strong></td><td style="padding:8px">[HH:MM]</td></tr>
  <tr><td style="padding:8px;background:#f8fafc"><strong>Location</strong></td><td style="padding:8px">[Venue / Link]</td><td style="padding:8px;background:#f8fafc"><strong>Facilitator</strong></td><td style="padding:8px">[Name]</td></tr>
</table><br>
<p><strong>Attendees:</strong> Name 1, Name 2, Name 3</p><hr>
<h3>Agenda</h3>
<ol><li>Previous action items review</li><li>[Topic 2]</li><li>[Topic 3]</li></ol>
<h3>Discussion</h3>
<p><strong>Item 1:</strong> [Notes]</p><p><strong>Item 2:</strong> [Notes]</p>
<h3>Action Items</h3>
<table border="1" style="width:100%;border-collapse:collapse">
  <tr style="background:#dbeafe"><th style="padding:8px">Action</th><th style="padding:8px">Owner</th><th style="padding:8px">Deadline</th></tr>
  <tr><td style="padding:8px">Task description</td><td style="padding:8px">Name</td><td style="padding:8px">DD/MM/YYYY</td></tr>
</table>`,

    coverletter: `<p>${formatDate()}</p><br>
<p>Hiring Manager<br>[Company Name]<br>[Address]</p><br>
<p><strong>Re: Application for [Job Title]</strong></p><br>
<p>Dear Hiring Manager,</p>
<p>I am writing to express my enthusiastic interest in the <strong>[Job Title]</strong> position at <strong>[Company Name]</strong>. With [X] years of experience in [field], I am confident in my ability to contribute meaningfully to your team.</p>
<p>In my previous role at <strong>[Previous Company]</strong>, I [key achievement]. This strengthened my expertise in [skill 1] and [skill 2] — directly aligned with this role.</p>
<p>I am particularly drawn to [Company Name] because of [specific reason]. I look forward to discussing how my background can add value.</p><br>
<p>Sincerely,<br><strong>[Your Name]</strong><br>[Phone] | [Email]</p>`
};

function toggleTemplateMenu() {
    const menu = document.getElementById('templateMenu');
    const opening = !menu.classList.contains('open');
    menu.classList.toggle('open');
    if (opening) {
        setTimeout(() => document.addEventListener('click', closeTemplateOnOutside), 0);
    }
}
function closeTemplateOnOutside(e) {
    const wrap = document.querySelector('.tb-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('templateMenu').classList.remove('open');
        document.removeEventListener('click', closeTemplateOnOutside);
    }
}
function applyTemplate(type) {
    if (!templates[type]) return;
    if (quill.getText().trim().length > 5 && !confirm('Replace current document with template?')) return;
    quill.root.innerHTML = templates[type];
    document.getElementById('templateMenu').classList.remove('open');
    document.removeEventListener('click', closeTemplateOnOutside);
    updateStats();
    showToast('✅ Template applied', 'success');
}

// ----------------IMPORT WORD FILE ------------------------
async function importWordFile() {
    const inp = document.getElementById('uploadDoc');
    const file = inp.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
        showToast('❌ Only .docx files are supported', 'error');
        inp.value = ''; return;
    }
    if (file.size > 15 * 1024 * 1024) {
        showToast('❌ File too large (max 15MB)', 'error');
        inp.value = ''; return;
    }

    showToast('📂 Loading document…', 'info');
    const fd = new FormData();
    fd.append('file', file);

    try {
        const res = await fetch(`${window.BACKEND_URL}/load-word`, { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        quill.root.innerHTML = data.html || '<p></p>';
        showToast('✅ Document loaded!', 'success');
        updateStats();
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
    } finally {
        inp.value = '';
    }
}

// -------SAVE  DOCX------------------------------ 
async function saveDocument() {
    if (quill.getText().trim().length === 0) {
        showToast('⚠️ Document is empty', 'warning'); return;
    }

    const raw = prompt('File name for download:', 'My Document') || 'My Document';
    const safeName = raw.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() || 'document';

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>Saving…</span>';
    showToast('⏳ Preparing .docx…', 'info');

    try {
        const res = await fetch(`${window.BACKEND_URL}/save-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html_content: quill.root.innerHTML, title: safeName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error');

        const a = document.createElement('a');
        a.href = `${window.BACKEND_URL}/download/${data.filename}`;
        a.setAttribute('download', safeName + '.docx');
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 200);

        showToast(`✅ "${safeName}.docx" downloading… (${data.size_kb} KB)`, 'success');
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-download"></i><span>Download</span>';
    }
}

// ----------------PRINT------------------------ 
function printDocument() {
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`<!DOCTYPE html><html><head>
    <title>Print – ToolNOVA</title>
    <style>
      * { box-sizing:border-box; }
      body { font-family:'Times New Roman',serif; margin:20mm; color:#000; line-height:1.7; }
      h1,h2,h3,h4 { margin:0.6em 0 0.3em; }
      table { border-collapse:collapse; width:100%; margin:12px 0; }
      td,th { border:1px solid #bbb; padding:7px 10px; }
      th { background:#f0f0f0; }
      @page { margin:20mm; }
      @media print { body { margin:0; } }
    </style>
  </head><body>${quill.root.innerHTML}
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);};<\/script>
  </body></html>`);
    win.document.close();
}

// ----------------ZOOM----------------------------------- 
function applyZoom() {
    const cont = document.querySelector('#editor-container .ql-editor');
    if (!cont) return;
    cont.style.transform = `scale(${currentZoom / 100})`;
    cont.style.transformOrigin = 'top center';
    document.getElementById('zoomDisplay').textContent = `${currentZoom}%`;
}
function zoomIn() { if (currentZoom < 200) { currentZoom += 10; applyZoom(); } }
function zoomOut() { if (currentZoom > 50) { currentZoom -= 10; applyZoom(); } }
function resetZoom() { currentZoom = 100; applyZoom(); }

function toggleOrientation() {
    isLandscape = !isLandscape;
    const editor = document.querySelector('.ql-editor');
    if (!editor) return;
    if (isLandscape) {
        editor.style.width = '297mm';
        editor.style.minHeight = '210mm';
        document.getElementById('orientBtn').innerHTML = '<i class="fa fa-file" style="transform:rotate(90deg)"></i>';
        document.getElementById('statusOrientation').textContent = 'Landscape';
        showToast('📐 Landscape mode', 'info');
    } else {
        editor.style.width = '210mm';
        editor.style.minHeight = '297mm';
        document.getElementById('orientBtn').innerHTML = '<i class="fa fa-file"></i>';
        document.getElementById('statusOrientation').textContent = 'Portrait';
        showToast('📄 Portrait mode', 'info');
    }
}

// ----------------PAGE BREAK---------------------------------- 
function insertPageBreak() {
    const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 };
    const html = `<p style="page-break-after:always;border-bottom:2px dashed #94a3b8;margin:20px 0 0;padding-bottom:8px;text-align:center"><span style="font-size:11px;color:#94a3b8;font-family:monospace;letter-spacing:2px">── PAGE BREAK ──</span></p><p><br></p>`;
    quill.clipboard.dangerouslyPasteHTML(range.index, html);
    showToast('📄 Page break inserted', 'info');
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}
function isModalOpen(id) {
    const el = document.getElementById(id);
    return !!(el && el.classList.contains('open'));
}
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    clearFindHighlights();
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
        if (e.target.id === 'findReplaceModal') clearFindHighlights();
    }
});

function openFindReplace() {
    openModal('findReplaceModal');
    setTimeout(() => document.getElementById('findInput').focus(), 80);
}
function closeFindReplace() {
    closeModal('findReplaceModal');
    clearFindHighlights();
}

function clearFindHighlights() {

    try { quill.formatText(0, quill.getLength(), 'background', false, 'silent'); } catch (_) { }
    findMatches = [];
    findCurrent = -1;
    const fc = document.getElementById('findCount');
    if (fc) fc.textContent = '';
}

let _findTimer;
function onFindInput() {
    clearTimeout(_findTimer);
    _findTimer = setTimeout(runFind, 250);
}

function runFind() {
    clearFindHighlights();
    const term = (document.getElementById('findInput').value || '').trim();
    const caseSens = document.getElementById('caseSensitive').checked;
    const fc = document.getElementById('findCount');

    if (!term) { if (fc) fc.textContent = ''; return; }

    const allText = quill.getText();  // plain text
    const searchText = caseSens ? allText : allText.toLowerCase();
    const searchTerm = caseSens ? term : term.toLowerCase();

    findMatches = [];
    let pos = 0;
    while (pos < searchText.length) {
        const idx = searchText.indexOf(searchTerm, pos);
        if (idx === -1) break;
        findMatches.push({ index: idx, length: term.length });
        quill.formatText(idx, term.length, 'background', '#fde68a', 'silent');
        pos = idx + 1;
    }

    if (fc) {
        fc.textContent = findMatches.length
            ? `${findMatches.length} match${findMatches.length !== 1 ? 'es' : ''}`
            : '❌ No matches';
    }
    if (findMatches.length) {
        findCurrent = 0;
        highlightCurrent();
    }
}

function highlightCurrent() {
    if (!findMatches.length || findCurrent < 0) return;

    findMatches.forEach(m => quill.formatText(m.index, m.length, 'background', '#fde68a', 'silent'));

    const cur = findMatches[findCurrent];
    quill.formatText(cur.index, cur.length, 'background', '#fb923c', 'silent');

    try {
        const bounds = quill.getBounds(cur.index, cur.length);
        const cont = document.getElementById('editor-container');
        if (cont && bounds) cont.scrollTop = bounds.top - 150 + cont.scrollTop;
    } catch (_) { }
    quill.setSelection(cur.index, cur.length, 'silent');
}

function findNext() {
    if (!findMatches.length) { runFind(); return; }
    findCurrent = (findCurrent + 1) % findMatches.length;
    highlightCurrent();
}
function findPrev() {
    if (!findMatches.length) { runFind(); return; }
    findCurrent = (findCurrent - 1 + findMatches.length) % findMatches.length;
    highlightCurrent();
}

function replaceCurrent() {
    if (!findMatches.length) { runFind(); return; }
    const rep = document.getElementById('replaceInput').value || '';
    const match = findMatches[findCurrent];
    if (!match) return;
    quill.deleteText(match.index, match.length, 'user');
    if (rep) quill.insertText(match.index, rep, 'user');
    showToast('✅ 1 match replaced', 'success');
    setTimeout(runFind, 50);
}

function replaceAll() {
    const term = (document.getElementById('findInput').value || '').trim();
    const rep = document.getElementById('replaceInput').value || '';
    const caseSens = document.getElementById('caseSensitive').checked;
    if (!term) { showToast('⚠️ Enter text to find', 'warning'); return; }

    clearFindHighlights();
    const allText = quill.getText();
    const searchText = caseSens ? allText : allText.toLowerCase();
    const searchTerm = caseSens ? term : term.toLowerCase();

    const positions = [];
    let pos = 0;
    while (pos < searchText.length) {
        const idx = searchText.indexOf(searchTerm, pos);
        if (idx === -1) break;
        positions.push(idx);
        pos = idx + 1;
    }

    if (!positions.length) { showToast('❌ No matches found', 'warning'); return; }

    for (let i = positions.length - 1; i >= 0; i--) {
        quill.deleteText(positions[i], term.length, 'silent');
        if (rep) quill.insertText(positions[i], rep, 'silent');
    }

    showToast(`✅ Replaced ${positions.length} match${positions.length !== 1 ? 'es' : ''}`, 'success');
    document.getElementById('findCount').textContent = '';
}

function insertTable() { openModal('tableModal'); }
function closeTableModal() {
    closeModal('tableModal');
    document.querySelectorAll('.tg-cell').forEach(c => c.classList.remove('tg-active'));
    const lbl = document.getElementById('tableGridLabel');
    if (lbl) lbl.textContent = 'Hover to select size';
}

function buildTableGrid() {
    const grid = document.getElementById('tableGrid');
    const label = document.getElementById('tableGridLabel');
    if (!grid) return;
    const COLS = 8, ROWS = 8;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${COLS}, 28px)`;

    for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'tg-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('mouseenter', () => {
                document.querySelectorAll('.tg-cell').forEach(cc =>
                    cc.classList.toggle('tg-active', +cc.dataset.row <= r && +cc.dataset.col <= c)
                );
                if (label) label.textContent = `${r} × ${c} table`;
            });
            cell.addEventListener('click', () => doInsertTable(r, c));
            grid.appendChild(cell);
        }
    }
}

function doInsertTable(rows, cols) {
    const CELL = 'border:1px solid #cbd5e1;padding:8px 10px;min-width:70px;';
    let html = `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">`;
    for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            html += r === 0
                ? `<th style="${CELL}background:#dbeafe;font-weight:600;text-align:left">Header ${c + 1}</th>`
                : `<td style="${CELL}"> </td>`;
        }
        html += '</tr>';
    }
    html += '</table><p><br></p>';

    const range = quill.getSelection();
    const idx = range ? range.index : quill.getLength() - 1;
    quill.clipboard.dangerouslyPasteHTML(idx, html);

    closeTableModal();
    showToast(`✅ ${rows}×${cols} table inserted`, 'success');
}
