document.addEventListener("DOMContentLoaded", function () {
     
    // Rounds all displayed personal hours
    document.querySelectorAll('.remaining-personal-hours').forEach(el => {
        el.textContent = Math.floor(parseFloat(el.textContent));
    });

    // PTO/Personal limits and visibility checks
    function checkTimeUsed() {
        const ptoTime = parseInt(document.getElementById('pto-time').innerText, 10);
        const personalTime = parseInt(document.getElementById('total-personal-time-display').innerText, 10);
        let personalHoursUsed = false;

        document.querySelectorAll('input[name^="Personal_hours"]').forEach(input => {
            if (parseInt(input.value, 10) > 0) {
                personalHoursUsed = true;
            }
        });

        document.querySelector('.info-container').style.display = 
            (ptoTime > 0 || personalTime > 0 || personalHoursUsed) ? 'none' : 'block';
    }

    function checkRemainingPtoHours() {
        const remainingPtoHours = parseFloat(document.getElementById('remaining-pto-hours').innerText);
        document.querySelectorAll('input[name^="PTO_hours"]').forEach(input => {
            const value = parseFloat(input.value);
            const max = 10;
            input.setAttribute('max', remainingPtoHours <= 0 ? value : max);
            if (value > max) input.value = max;
        });
    }

    function checkRemainingPersonalHours() {
        const remaining = parseFloat(document.getElementById('remaining-personal-hours').innerText);
        document.querySelectorAll('input[name^="Personal_hours"]').forEach(input => {
            const value = parseFloat(input.value);
            const max = 8;
            input.setAttribute('max', remaining <= 0 ? value : max);
            if (value > max) input.value = max;
        });
    }

    // Observers for updates
    const observer = new MutationObserver(() => {
        checkTimeUsed();
        checkRemainingPtoHours();
        checkRemainingPersonalHours();
    });

    ['pto-time', 'total-personal-time-display', 'remaining-personal-hours', 'remaining-pto-hours'].forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el, { childList: true, subtree: true });
    });

    // Input change listeners
    document.querySelectorAll('input[name^="Personal_hours"], input[name^="PTO_hours"]').forEach(input => {
        input.addEventListener('input', () => {
            checkTimeUsed();
            checkRemainingPtoHours();
            checkRemainingPersonalHours();
        });
    });

    checkTimeUsed();
    checkRemainingPtoHours();
    checkRemainingPersonalHours();

    // Logout button
    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Navbar toggle
    function toggleNavbar(isLoading = false) {
        const navbar = document.getElementById("navbar");
        const loadingBar = document.getElementById("loading-bar-container");
        navbar.style.display = isLoading ? "none" : "block";
        loadingBar.style.display = isLoading ? "block" : "none";
    }

    function setLoadingState(isLoading) {
        toggleNavbar(isLoading);
    }

    setTimeout(() => setLoadingState(false), 3000);

    // Redirect by clicking email
    document.getElementById('user-email').addEventListener('click', () => {
        const email = document.getElementById('user-email').textContent.trim();
        window.location.href = email === 'katy@vanirinstalledsales.com' ? 'supervisor.html' : 'employeetimesheet.html';
    });

    // Optional: Keyboard shortcut
    addGlobal55Shortcut();

    function addGlobal55Shortcut() {
        let keysPressed = "";
        document.addEventListener('keydown', function (e) {
            if (document.activeElement.tagName !== 'INPUT') {
                keysPressed += e.key;
                if (keysPressed.endsWith("55")) {
                    apply55Shortcut();
                    keysPressed = "";
                }
                if (keysPressed.length > 2) {
                    keysPressed = keysPressed.slice(-2);
                }
            }
        });
    }

    function apply55Shortcut() {
        const rows = document.querySelectorAll('#time-entry-table tbody tr');
        rows.forEach(row => {
            const index = parseInt(row.dataset.day, 10);
            const start = row.querySelector('input[name^="start_time"]');
            const end = row.querySelector('input[name^="end_time"]');
            const lunchStart = row.querySelector('input[name^="lunch_start"]');
            const lunchEnd = row.querySelector('input[name^="lunch_end"]');

            if (index === 7) {
                start.value = '07:00';
                end.value = '12:00';
            } else if ([1, 2, 3, 6].includes(index)) {
                start.value = '07:00';
                end.value = '16:00';
                lunchStart.value = '12:00';
                lunchEnd.value = '13:00';
            }
        });
    }

    // Time input auto nav
    initializeTimeDropdowns();

    function initializeTimeDropdowns() {
        const inputs = document.querySelectorAll('#time-entry-table input[type="time"], input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('change', checkInputsAndToggleSummary);
            input.addEventListener('keydown', handleKeyNavigation);
            input.addEventListener('keyup', handleTimeInput);
        });
        checkInputsAndToggleSummary();
    }

    function checkInputsAndToggleSummary() {
        const inputs = document.querySelectorAll('#time-entry-table input[type="time"], input[type="number"]');
        const hasInput = Array.from(inputs).some(input => input.value);
        document.getElementById('summary').style.display = hasInput ? 'flex' : 'none';
    }

    function handleKeyNavigation(e) {
        const key = e.key;
        const input = e.target;
        if (key === 'ArrowRight') navigateToNextField(input);
        else if (key === 'ArrowLeft') navigateToPreviousField(input);
        else if (!['number', 'time'].includes(input.type)) {
            if (key === 'ArrowDown') navigateToNextField(input);
            else if (key === 'ArrowUp') navigateToPreviousField(input);
        }
    }

    function navigateToNextField(current) {
        const inputs = [...document.querySelectorAll('#time-entry-table input[type="time"], input[type="number"]')];
        const idx = inputs.indexOf(current);
        for (let i = idx + 1; i < inputs.length; i++) {
            if (!isFieldInSkippedDay(inputs[i])) {
                inputs[i].focus();
                break;
            }
        }
    }

    function navigateToPreviousField(current) {
        const inputs = [...document.querySelectorAll('#time-entry-table input[type="time"], input[type="number"]')];
        const idx = inputs.indexOf(current);
        for (let i = idx - 1; i >= 0; i--) {
            if (!isFieldInSkippedDay(inputs[i])) {
                inputs[i].focus();
                break;
            }
        }
    }

    function isFieldInSkippedDay(field) {
        const inputs = [...document.querySelectorAll('input')];
        const index = inputs.indexOf(field);
        return [4, 5].includes(index);
    }

    function handleTimeInput(e) {
        const value = e.target.value.toUpperCase();
        if (value.includes('AM') || value.includes('PM')) {
            navigateToNextField(e.target);
        }
    }

    // Checkbox logging
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            console.log(`Checkbox ${this.id} was ${this.checked ? 'checked and rotated' : 'unchecked'}.`);
        });
    });
});
// Submit button restriction for Kyle
const submitBtn = document.getElementById("submit-button");
submitBtn.addEventListener("click", () => {
    const userEmailEl = document.getElementById("user-email");
    const userEmail = userEmailEl?.textContent?.trim()?.toLowerCase();
    const today = new Date();
    const isTuesday = today.getDay() === 2; // 0 = Sunday, 2 = Tuesday

    if (userEmail === "kyle.thurston@vanirinstalledsales.com" && !isTuesday) {
        alert("⚠️ Submit button does not need to be clicked daily.");
    }
});
