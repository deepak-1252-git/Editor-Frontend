 function showToast(message, type = "info") {
    let bgColor = "rgba(255, 255, 255, 0.05)";  
    
    if (type === "success") bgColor = "rgba(11, 247, 66, 0.2)";
    if (type === "error") bgColor = "rgba(249, 7, 31, 0.2)";   
    if (type === "warning") bgColor = "rgba(225, 254, 4, 0.2)";   

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true, 
        // --- Custom Glass Effect Yahan Hai ---
        style: {
            background: bgColor,
            backdropFilter: "blur(12px)",
            webkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "#faf8f8",
            fontSize: "14px"
        },
    }).showToast();
}