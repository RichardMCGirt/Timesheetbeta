const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'appD3QeLneqfNdX12';
const tableId = 'tbljmLpqXScwhiWTt';

// DOM elements
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const submitEmailButton = document.getElementById('submitEmailButton');
const resetPasswordButton = document.getElementById('resetPasswordButton');
const goBackButton = document.getElementById('goBackButton');

submitEmailButton.addEventListener('click', handleEmailSubmit);
resetPasswordButton.addEventListener('click', handlePasswordReset);
goBackButton.addEventListener('click', handleGoBack);
emailInput.addEventListener('input', handleEmailInput);

function handleEmailInput() {
    const email = emailInput.value;
    if (!email.includes('@')) {
        emailInput.value = `${email}@vanirinstalledsales.com`;
    }
}

async function handleEmailSubmit() {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
        alert('Please enter your email.');
        return;
    }

    try {
        let records = [];
        let offset = '';
        let keepFetching = true;
        let recordCount = 0; // To track total records fetched

        // Loop until all records are fetched
        while (keepFetching) {
            console.log(`Fetching records with offset: ${offset}`);
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=LOWER({email})='${email}'&offset=${offset}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(`Fetched ${data.records.length} records in this batch`);
            records = records.concat(data.records);
            recordCount += data.records.length;

            // Check if there is more data to fetch
            if (data.offset) {
                offset = data.offset;
            } else {
                keepFetching = false;
            }
        }

        console.log(`Total records fetched: ${recordCount}`);
        console.log(records);

        if (records.length > 0) {
            forgotPasswordForm.style.display = 'none';
            resetPasswordForm.style.display = 'block';
        } else {
            alert('Email not found.');
        }
    } catch (error) {
        console.error('Error validating email:', error);
        alert('Error validating email: ' + error.message);
    }
}

async function handlePasswordReset() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
        alert('Please fill in both password fields.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const email = emailInput.value;
    try {
        let records = [];
        let offset = '';
        let keepFetching = true;
        let recordCount = 0; // To track total records fetched

        // Loop to fetch all records with pagination
        while (keepFetching) {
            console.log(`Fetching records with offset: ${offset}`);
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula={email}='${email}'&offset=${offset}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(`Fetched ${data.records.length} records in this batch`);
            records = records.concat(data.records);
            recordCount += data.records.length;

            // Check if there is more data to fetch
            if (data.offset) {
                offset = data.offset;
            } else {
                keepFetching = false;
            }
        }

        console.log(`Total records fetched: ${recordCount}`);
        console.log(records);

        const userRecord = records.find(record => record.fields.email === email);

        if (userRecord) {
            console.log('Found user record:', userRecord);
            const updateResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${userRecord.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        password: newPassword
                    }
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Error updating password');
            }

            alert('Password updated successfully.');
            window.location.href = 'index.html';
        } else {
            alert('Error finding user record.');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password: ' + error.message);
    }
}

function handleGoBack() {
    window.location.href = 'index.html';
}
