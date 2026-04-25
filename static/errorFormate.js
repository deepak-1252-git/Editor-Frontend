 function showToast(message, type = "info") {
    let bgColor = "rgba(255, 255, 255, 0.05)";  
    
    if (type === "success") bgColor = "rgb(0, 255, 60)";
    if (type === "error") bgColor = "rgb(255, 0, 25)";   
    if (type === "warning") bgColor = "rgb(225, 254, 4)";   

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