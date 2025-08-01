document.addEventListener("DOMContentLoaded", function() {
    // Check if the email is stored in local storage
    const userEmail = localStorage.getItem("userEmail");
    console.log("User email from local storage:", userEmail);

    // If the email is 'hunter@vanirinstalledsales.com', play the audio
    if (userEmail === 'hunter@vanirinstalledsales.com' || userEmail === 'dallas.hudson@vanirinstalledsales.com') {
        console.log("Email matches. Playing audio...");
        const audio = new Audio('old-zildjian-gong-quite-natural-34294.mp3');
        audio.loop = false; // Ensure looping is disabled
        audio.play();
    } else {
        console.log("Email does not match. Audio will not play.");
    }
});


