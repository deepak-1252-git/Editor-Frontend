 function showToast(message, type = "info") {
    let bgColor = "rgb(255, 255, 255)";  
    
    if (type === "success") bgColor = "rgb(253, 247, 247)";
    if (type === "error") bgColor = "rgb(255, 255, 255)";   
    if (type === "warning") bgColor = "rgb(255, 255, 255)";   

    Toastify({
        text: message,
        duration: 3500,
        // close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true, 
         
        style: {
            background: bgColor,
            backdropFilter: "blur(12px)",
            webkitBackdropFilter: "blur(12px)",
            border: "4px solid rgba(26, 25, 25, 0.25)",
            borderRadius: "10px",
            color: "#000000",
            fontSize: "15px",
        },
    }).showToast();
}