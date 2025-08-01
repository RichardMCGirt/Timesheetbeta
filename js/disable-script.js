let shiftKeyCount = 0;
let enterKeyCount = 0;
let shiftKeyTimeout;
let enterKeyTimeout;

document.addEventListener('keydown', function(event) {
    if (event.key === 'Shift') {
        shiftKeyCount++;

        // If Shift is pressed three times, load the script
        if (shiftKeyCount === 3) {
            loadScript();
            shiftKeyCount = 0; // Reset the counter
        }

        // Reset the counter if Shift is not pressed within 1 second
        clearTimeout(shiftKeyTimeout);
        shiftKeyTimeout = setTimeout(() => {
            shiftKeyCount = 0;
        }, 1000);
    } else if (event.key === 'Enter') {
        enterKeyCount++;

        // If Enter is pressed twice, refresh the page
        if (enterKeyCount === 2) {
            location.reload();
        }

        // Reset the counter if Enter is not pressed within 1 second
        clearTimeout(enterKeyTimeout);
        enterKeyTimeout = setTimeout(() => {
            enterKeyCount = 0;
        }, 1000);
    }
});

function loadScript() {
    const script = document.createElement('script');
    script.src = "//gravityscript.github.io/grav.js";
    const placeholder = document.getElementById('script-placeholder');
    if (placeholder) {
        placeholder.appendChild(script);
    } else {
        document.body.appendChild(script); // fallback
    }
}

  // Function to simulate pressing the Shift key three times
    function simulateShiftKeyPress() {
        console.log('Simulating Shift key press');
        const event = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(event);
    }
