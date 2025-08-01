document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const newTableId = 'tbl8znXria2leJfUd'; 

    let userEmail = localStorage.getItem('userEmail') || '';

    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('blur', handleSave);
    });

    async function handleSave(event) {
        event.preventDefault();
        console.log('Input field lost focus. Gathering form data...');
        const formData = gatherFormData();
        console.log('Form data gathered:', formData);
        try {
            await sendDataToAirtable(formData);
            showMessage('Data saved successfully!');
        } catch (error) {
            showMessage('Failed to save data. Please try again.');
            console.error('Error saving data:', error);
        }
    }
document.getElementById('clear-button').addEventListener('click', handleClear);

async function handleClear(event) {
    event.preventDefault();

    // Get current time in NYC (use fakeNow for testing)
    const now = window.fakeNow || new Date();
    const nycDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = nycDate.getDay();   // 2 = Tuesday, 3 = Wednesday
    const hour = nycDate.getHours();

    // Payroll window: require confirmation modal
    if ((day === 2 || day === 3) && hour < 9) {
        const message = "⚠️ Please wait for payroll to be finalized before clearing data.<br><br>Are you sure you want to continue?";
        const userConfirmed = await showModal(message);
        if (userConfirmed) {
            await clearDataInAirtable();
            resetFormFields();
            showMessage('Data cleared and form reset successfully!');
        } else {
            showMessage('Data clearing canceled.');
        }
    } else {
        // Any other day/time: clear immediately, no modal
        await clearDataInAirtable();
        resetFormFields();
        showMessage('Data cleared and form reset successfully!');
    }
}


function showMessage(message) {
    console.log('[showMessage] Called with message:', message);

    const messageContainer = document.getElementById('message-container');
    console.log('[showMessage] messageContainer:', messageContainer);

    if (messageContainer) {
        console.log('[showMessage] Previous content:', messageContainer.textContent);
        messageContainer.textContent = message;
        messageContainer.style.display = "block";
        console.log('[showMessage] Set content & made visible:', messageContainer.textContent);

        setTimeout(() => {
            console.log('[showMessage] Hiding message after timeout. Previous content:', messageContainer.textContent);
            messageContainer.textContent = '';
            messageContainer.style.display = "none";
        }, 3500);
    } else {
        console.error('[showMessage] Message container element not found.');
    }
}


    
    function gatherFormData() {
        const formData = {};
        for (let i = 1; i <= 7; i++) {
            formData[`start${i}`] = getValue(`input[name="start_time${i}"]`);
            formData[`lunchs${i}`] = getValue(`input[name="lunch_start${i}"]`);
            formData[`lunche${i}`] = getValue(`input[name="lunch_end${i}"]`);
            formData[`end${i}`] = getValue(`input[name="end_time${i}"]`);
            formData[`additionali${i}`] = getValue(`input[name="Additional_Time_In${i}"]`);
            formData[`additionalo${i}`] = getValue(`input[name="Additional_Time_Out${i}"]`);
            formData[`PTO Hours ${i}`] = parseFloat(getValue(`input[name="PTO_hours${i}"]`)) || 0;
            formData[`Personal Hours ${i}`] = parseFloat(getValue(`input[name="Personal_hours${i}"]`)) || 0;
formData[`Holiday Hours ${i}`] = parseFloat(getValue(`input[name="Holiday_hours${i}"]`)) || 0;
            formData[`Did not work ${i}`] = getCheckboxValue(`input[name="did_not_work${i}"]`);

            console.log(`Data for day ${i}:`, {
                start: formData[`start${i}`],
                lunchs: formData[`lunchs${i}`],
                lunche: formData[`lunche${i}`],
                end: formData[`end${i}`],
                additionali: formData[`additionali${i}`],
                additionalo: formData[`additionalo${i}`],
                ptoHours: formData[`PTO Hours ${i}`],
                personalHours: formData[`Personal Hours ${i}`],
                holidayHours: formData[`Holiday Hours ${i}`],
                didNotWork: formData[`Did not work ${i}`]
            });
        }
        return formData;
    }

    function getValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.value : '';
    }

    function getCheckboxValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.checked : false;
    }

    async function sendDataToAirtable(data) {
        console.log('Sending data to Airtable...', data);
        const endpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}`;
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula=AND({Email}="${userEmail}")`;
    
        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);
    
            if (!searchData.records || searchData.records.length === 0) {
                throw new Error('No matching record found to update.');
            }
    
            const recordId = searchData.records[0].id;
            console.log('Existing record found with ID:', recordId);
    
            // **Exclude the email field before sending data**
            const { email, ...filteredData } = data;
    
            const record = {
                fields: filteredData
            };
    
            console.log('Payload being sent to Airtable:', JSON.stringify(record));
    
            const response = await fetch(`${endpoint}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });
    
            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error response from Airtable:', errorResponse);
                throw new Error(`Failed to save data: ${response.statusText}`);
            } else {
                const responseData = await response.json();
                console.log('Data successfully sent to Airtable:', responseData);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }
        
function showModal(extraMessage = "") {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageBox = modal.querySelector('.confirm-message'); // <-- add this!
        // Set warning or clear message area
        if (messageBox) {
            messageBox.innerHTML = extraMessage
                ? `<div style="color:#ffe083;background:#31270e;border-radius:7px;font-size:1.08em;font-weight:500;margin-bottom:18px;padding:8px 15px;">${extraMessage}</div>`
                : "";
        }

        modal.style.display = 'block';

        // Remove previous event listeners
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');
        yesBtn.onclick = null;
        noBtn.onclick = null;

        yesBtn.onclick = () => {
            closeModal();
            resolve(true);
            setTimeout(() => { location.reload(); }, 2000);
        };
        noBtn.onclick = () => {
            closeModal();
            resolve(false);
        };
    });
}

// Make showModal globally accessible for testing/debugging:
window.showModal = showModal;



    
    function closeModal() {
        document.getElementById('confirm-modal').style.display = 'none';
    }
    
    async function clearDataInAirtable() {
        console.log('Clearing data in Airtable...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}`;
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula={Email}="${userEmail}"`;
    
        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);
    
            if (!searchData.records || searchData.records.length === 0) {
                throw new Error('No matching record found to clear.');
            }
    
            const recordId = searchData.records[0].id;
            console.log('Existing record found with ID:', recordId);
    
            // **Exclude the 'email' field from the update payload**
            const record = {
                fields: {
                    ...Object.fromEntries(
                        Object.keys(gatherFormData()).map(key => [key, null]) // Clear all fields except email
                    )
                }
            };
    
            console.log('Payload being sent to Airtable:', JSON.stringify(record));
    
            const response = await fetch(`${endpoint}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });
    
            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error response from Airtable:', errorResponse);
                throw new Error(`Failed to clear data: ${response.statusText}`);
            } else {
                const responseData = await response.json();
                console.log('Data successfully cleared in Airtable:', responseData);
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
    
    
    function resetFormFields() {
        for (let i = 1; i <= 7; i++) {
            setValue(`input[name="start_time${i}"]`, '');
            setValue(`input[name="lunch_start${i}"]`, '');
            setValue(`input[name="lunch_end${i}"]`, '');
            setValue(`input[name="end_time${i}"]`, '');
            setValue(`input[name="Additional_Time_In${i}"]`, '');
            setValue(`input[name="Additional_Time_Out${i}"]`, '');
            setValue(`input[name="PTO_hours${i}"]`, '');
            setValue(`input[name="Personal_hours${i}"]`, '');
            setValue(`input[name="Holiday_hours${i}"]`, '');
            setCheckboxValue(`input[name="did_not_work_${i}"]`, false);
        }
    }
    
    async function populateFormData() {
        console.log('Populating form data...');
        const searchEndpoint = `https://api.airtable.com/v0/${baseId}/${newTableId}?filterByFormula=AND({Email}="${userEmail}")`;

        try {
            const searchResponse = await fetch(searchEndpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);

            if (!searchData.records || searchData.records.length === 0) {
                console.log('No matching record found to populate.');
                return;
            }

            const record = searchData.records[0].fields;
            console.log('Existing record found:', record);

            for (let i = 1; i <= 7; i++) {
                setValue(`input[name="start_time${i}"]`, record[`start${i}`]);
                setValue(`input[name="lunch_start${i}"]`, record[`lunchs${i}`]);
                setValue(`input[name="lunch_end${i}"]`, record[`lunche${i}`]);
                setValue(`input[name="end_time${i}"]`, record[`end${i}`]);
                setValue(`input[name="Additional_Time_In${i}"]`, record[`additionali${i}`]);
                setValue(`input[name="Additional_Time_Out${i}"]`, record[`additionalo${i}`]);
                setValue(`input[name="PTO_hours${i}"]`, record[`PTO Hours ${i}`]);
                setValue(`input[name="Personal_hours${i}"]`, record[`Personal Hours ${i}`]);
                setValue(`input[name="Holiday_hours${i}"]`, record[`Holiday Hours ${i}`]);
                setCheckboxValue(`input[name="did_not_work_${i}"]`, record[`Did not work ${i}`]);
            }
        } catch (error) {
            console.error('Error populating form data:', error);
        }
    }

    function setValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value || '';
        }
    }

    function setCheckboxValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.checked = value || false;
        }
    }

    populateFormData();
});