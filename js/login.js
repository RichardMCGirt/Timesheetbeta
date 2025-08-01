const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'appD3QeLneqfNdX12';
const tableId = 'tbljmLpqXScwhiWTt';

// DOM elements
const jokeText = document.getElementById('joke-text');
const loginButton = document.getElementById('loginButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const playPauseButton = document.getElementById('playPauseButton');
const loginSuccessMessage = document.getElementById('login-success');

loginButton.addEventListener('click', login);

// Trigger login on Enter key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        login(); // Trigger the login function
    }
});

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");
    debounce(fetchJoke, 300)(); // Fetch joke on page load with debounce
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Fetch all records from Airtable with pagination
async function fetchAllRecords() {
    let allRecords = [];
    let offset = '';

    try {
        do {
            const emailValue = emailInput.value.trim().toLowerCase(); // Normalize input
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=LOWER({Email})='${emailValue}'${offset ? `&offset=${offset}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const data = await response.json();
            allRecords = allRecords.concat(data.records);
            offset = data.offset; // Update offset if present

        } while (offset);

        return allRecords;
    } catch (error) {
        console.error('Error fetching records:', error);
        return [];
    }
}

async function login() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim().toLowerCase();

    console.log("Login attempt with email:", email);

    if (!email || !password) {
        alert('Please fill in both email and password fields.');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    try {
        // Bypass login for impersonation accounts
        if ((email === 'nhernandez@guyclee.com' || email === 'jjones@guyclee.com') && password === 'guyclee') {
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', password); // Save for auto-login
            console.log("Impersonation successful, redirecting to supervisor.html");
            window.location.href = 'supervisor.html';
            return;
        }

        // Fetch records from Airtable
        const allRecords = await fetchAllRecords();
        console.log("Fetched records from Airtable:", allRecords);

        const user = allRecords.find(record =>
            record.fields.email.toLowerCase() === email &&
            record.fields.password.toLowerCase() === password
        );

        if (user) {
            console.log("User authenticated:", user);
            sessionStorage.setItem('user', JSON.stringify(user.fields));
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', password); 

            const employeeRedirectEmails = [
                'brett.moss@vanirinstalledsales.com',
                'tony.amenta@vanirinstalledsales.com',
                'josh@vanirinstalledsales.com',
                'ethen.wilson@vanirinstalledsales.com',
                'jason.smith@vanirinstalledsales.com',
                'dallas.hudson@vanirinstalledsales.com',
                'brooke.slaugenhoup@vanirinstalledsales.com',
                'carina.gonzalez@vanirinstalledsales.com',
                'faith.hudson@vanirinstalledsales.com',
                'mike.raszmann@vanirinstalledsales.com'
            ].map(e => e.toLowerCase());

            if (employeeRedirectEmails.includes(email)) {
                console.log("Redirecting to employeetimesheet.html");
                window.location.href = 'employeetimesheet.html';
            } else {
                console.log("Redirecting to timesheet.html");
                window.location.href = 'timesheet.html';
            }
        } else {
            console.log("No matching user found. Invalid email or password.");
            alert('Invalid email or password');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
}

async function fetchJoke() {

    try {
        const response = await fetch('https://official-joke-api.appspot.com/jokes/random');
        if (!response.ok) {
            throw new Error(`Failed to fetch joke: ${response.statusText}`);
        }

        const data = await response.json();

        jokeText.textContent = `${data.setup} - ${data.punchline}`;
    } catch (error) {
        console.error('Error fetching joke:', error);
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

emailInput.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    if (event.key === '@') {
        const emailValue = emailInput.value;
        if (!emailValue.includes('@vanirinstalledsales.com')) {
            event.preventDefault();
            emailInput.value = `${emailValue}@vanirinstalledsales.com`;

            // Temporarily switch to text type for selection range
            emailInput.type = 'text';
            emailInput.setSelectionRange(emailInput.value.length, emailInput.value.length);
            emailInput.type = 'email'; // Revert to email type
        }
    }
    if (event.key === 'p') {
        handleKeyPPress();
    }
}

const savedEmail = localStorage.getItem('userEmail');
const savedPassword = localStorage.getItem('userPassword');

// If credentials exist, auto-login immediately without showing the login form
if (savedEmail && savedPassword) {
    window.addEventListener('DOMContentLoaded', () => {
        emailInput.value = savedEmail;
        passwordInput.value = savedPassword;
        login();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!savedEmail || !savedPassword) {
        loginForm.style.display = 'block'; // Show login form if no saved credentials
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.querySelector('.email-input');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');

    const minWidth = emailInput.style.minWidth;
    const minWidthValue = parseInt(minWidth, 10);

    function adjustWidth() {
        const newWidth = ((emailInput.value.length + 2) * 8) + 'px';
        emailInput.style.width = (parseInt(newWidth, 13) < minWidthValue) ? minWidth : newWidth;
    }

    adjustWidth(); // Initial width based on default value

    emailInput.addEventListener('input', adjustWidth);

    togglePasswordButton.addEventListener('click', function () {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordButton.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            togglePasswordButton.textContent = 'Show';
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedPassword = localStorage.getItem('userPassword');
    const loginForm = document.getElementById('login-form');

    if (savedEmail && savedPassword) {
        emailInput.value = savedEmail;
        passwordInput.value = savedPassword;
        login(); // Auto-login
    } else {
        loginForm.style.display = 'block'; // Only show form if no credentials saved
    }
});

let mKeyCount = 0;
let mKeyTimer;

document.addEventListener('keydown', function(e) {
    // Ensure it's actually a key event and has a key
    if (!e || typeof e.key !== "string") return;

    const activeElement = document.activeElement;

    // Only trigger when not inside input/textarea
    if (e.key.toLowerCase() === 'm' &&
        activeElement.tagName !== 'INPUT' &&
        activeElement.tagName !== 'TEXTAREA') {
        
        mKeyCount++;

        // Reset if more than 1s between presses
        clearTimeout(mKeyTimer);
        mKeyTimer = setTimeout(() => { mKeyCount = 0; }, 1000);

        if (mKeyCount === 3) {
            if (typeof passwordInput !== "undefined" && passwordInput) {
                passwordInput.value = "Vanir2024!!"; // Autofill
                console.log("Hidden shortcut activated: Password autofilled");
                // Optionally auto-login:
                 login();
            } else {
                console.warn("passwordInput element not found.");
            }
            mKeyCount = 0; // reset
        }
    }
});
