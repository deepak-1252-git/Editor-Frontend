function showToast(msg, type = 'info') {
    const bg = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    Toastify({
        text: msg,
        duration: 3000,
        gravity: 'bottom',
        position: 'right',
        style: { background: bg[type] || bg.info, borderRadius: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }
    }).showToast();
}