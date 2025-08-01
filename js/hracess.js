const userEmail = localStorage.getItem('userEmail');
if (!userEmail) {
    console.warn('No user email found in localStorage. Redirecting to login.');
    window.location.href = 'index.html'; // Or your login page
}


const apiKey1 = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId1 = 'appD3QeLneqfNdX12';
const tableId1 = 'tbljmLpqXScwhiWTt'; // Table for PTO/Personal time

const tableBody = document.getElementById('tableBody');
const loadingMessage = document.getElementById('loadingMessage');
const content = document.getElementById('content');
const quarterStartInput = document.getElementById('quarter-start');
const quarterEndInput = document.getElementById('quarter-end');
let records = [];
let changes = {}; // Object to store changes
let searchMode = false; // To track if we are in search mode

// Check if the "Quarter Start" date is today and set Personaltime values to 8 if true
function checkQuarterStartOnce() {
    const lastChecked = localStorage.getItem('lastChecked');
    const today = new Date().toISOString().split('T')[0];
    const quarterStart = document.getElementById('quarter-start').value;

    if (lastChecked !== today && quarterStart === today) {
        console.log("Quarter Start date is today. Updating Personaltime values to 8.");
        const inputs = document.querySelectorAll('input[data-field="Personaltime"]');
        inputs.forEach(input => {
            input.value = 8;
            input.style.backgroundColor = "lightblue"; // Set background color to light blue
            // Store the change
            const id = input.dataset.id;
            const field = input.dataset.field;
            if (!changes[id]) {
                changes[id] = {};
            }
            changes[id][field] = 8;
        });
        localStorage.setItem('lastChecked', today);
    }
}

// Clear session and local storage on page refresh
window.onbeforeunload = function() {
    sessionStorage.clear();
};

// Show loading message with updated content
function showLoadingMessage() {
    loadingMessage.classList.remove('d-none');
    content.classList.add('d-none');
    document.getElementById('submitButton').style.display = 'none';
    
    // Hide additional elements
    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.style.display = 'none';

    const dataTable = document.getElementById('dataTable');
    if (dataTable) dataTable.style.display = 'none';

    const mainCard = document.getElementById('mainCard');
    if (mainCard) mainCard.style.display = 'none';  // 🔥 Hide the card itself
}

// Function to filter results based on the search input
function filterResults() {
    const searchValue = document.getElementById('searchBar').value.toLowerCase();
    searchMode = searchValue !== ''; // Enable search mode if there is a search value
    const filteredRecords = records.filter(record => {
        const fullName = record.fields['Full Name'] || ''; // Ensure Full Name is a string or empty string
        return fullName.toLowerCase().includes(searchValue); // Check if the Full Name contains the search value
    });

    console.log(`Filtered results: ${filteredRecords.length} records based on search value: ${searchValue}`);
    displayData(filteredRecords); // Display only the filtered records
}

// Hide loading message
function hideLoadingMessage() {
    loadingMessage.classList.add('d-none');
    content.classList.remove('d-none');
    document.getElementById('submitButton').style.display = 'block';
    
    // Show additional elements
    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.style.display = 'block';

    const dataTable = document.getElementById('dataTable');
    if (dataTable) dataTable.style.display = 'table';

    const mainCard = document.getElementById('mainCard');
    if (mainCard) mainCard.style.display = 'block'; // 🔥 Show the card again
}

async function fetchEmployeeNumbers() {
    let employeeRecords = [];
    let offset = '';

    do {
        const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}?${offset}`, {
            headers: {
                Authorization: `Bearer ${apiKey1}`
            }
        });
        const data = await response.json();
        employeeRecords = employeeRecords.concat(data.records);
        offset = data.offset ? `&offset=${data.offset}` : '';
    } while (offset);

    console.log("Fetched Employee Records:", employeeRecords); // Log fetched records
    return employeeRecords;
}

function showToast(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.background = '#28a745';
    toast.style.color = '#fff';
    toast.style.padding = '12px 18px';
    toast.style.marginTop = '10px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    toast.style.fontSize = '14px';
    toast.style.maxWidth = '300px';
    toast.style.wordWrap = 'break-word';

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}


async function fetchData() {
    let offset = '';
    records = []; // Reset the records array
    let totalFetched = 0; // To keep track of the number of records fetched

    showLoadingMessage(); // Show loading message

    do {
        console.log(`Fetching data with offset: ${offset}`);
        const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}?${offset}`, {
            headers: {
                Authorization: `Bearer ${apiKey1}`
            }
        });
        const data = await response.json();
        records = records.concat(data.records); // Append new records to the existing array
        offset = data.offset ? `&offset=${data.offset}` : ''; // Get the offset for the next set of records
        totalFetched += data.records.length; // Update the total number of records fetched
        console.log(`Fetched ${data.records.length} records, total fetched so far: ${totalFetched}`);
    } while (offset);

    console.log(`Total records fetched: ${totalFetched}`, records);
    // Sort records by Employee Number if it exists
  // Sort records by date7 or another field
records.sort((a, b) => (a.fields['date7'] || 0) - (b.fields['date7'] || 0));
displayData(records);

// ✅ After data is loaded, check for URL param and filter
const urlParams = new URLSearchParams(window.location.search);
const nameParam = urlParams.get('name');
if (nameParam) {
    const searchInput = document.getElementById('searchBar');
    if (searchInput) {
        searchInput.value = nameParam;
        searchMode = true;
        filterResults(); // Now filtering AFTER records are fully loaded
    }
}

hideLoadingMessage(); // Move this to the end so filtered table shows correctly

}


// Display data in the table
function displayData(records) {
    tableBody.innerHTML = `
        <tr>
            <th>Full Name</th>
            <th>Personaltime</th>
            <th>PTO Total</th>
            <th>PTO Used</th>
        </tr>
    `;

     records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.fields['Full Name']}</td>
            <td><input type="number" value="${record.fields['Personaltime'] || 0}" data-id="${record.id}" data-field="Personaltime" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
            <td><input type="number" value="${record.fields['PTO Total'] || 0}" data-id="${record.id}" data-field="PTO Total" class="form-control time-input" min="0" step="1" oninput="storeChange(this)" disabled></td>
            <td><input type="number" value="${record.fields['PTO'] || 0}" data-id="${record.id}" data-field="PTO" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
        `;
        tableBody.appendChild(row);
    });

    console.log(`Displayed ${records.length} records in the table`);
    checkQuarterStartOnce();

// Set Quarter Start and End Dates based on today's date
const today = new Date();
let quarterStart = '';
let quarterEnd = '';

if (today < new Date('2025-06-25')) {
    quarterStart = '2025-06-25';
    quarterEnd = '2025-09-30';
} else if (today < new Date('2025-09-30')) {
    quarterStart = '2025-09-30';
    quarterEnd = '2025-12-30';
} else if (today < new Date('2025-12-30')) {
    quarterStart = '2025-12-30';
    quarterEnd = '2026-03-31';
} else if (today < new Date('2026-03-31')) {
    quarterStart = '2026-03-31';
    quarterEnd = '2026-06-30';
} else if (today < new Date('2026-06-30')) {
    quarterStart = '2026-06-30';
    quarterEnd = '2026-09-29';
} else if (today < new Date('2026-09-29')) {
    quarterStart = '2026-09-29';
    quarterEnd = '2026-12-29';
} else if (today < new Date('2026-12-29')) {
    quarterStart = '2026-12-29';
    quarterEnd = '2027-03-30';
} else if (today < new Date('2027-03-30')) {
    quarterStart = '2027-03-30';
    quarterEnd = '2027-06-29';
} else if (today < new Date('2027-06-29')) {
    quarterStart = '2027-06-29';
    quarterEnd = '2027-09-28';
} else if (today < new Date('2027-09-28')) {
    quarterStart = '2027-09-28';
    quarterEnd = '2027-12-28';
} else {
    quarterStart = '';
    quarterEnd = '';
}

// Set the values in the inputs
quarterStartInput.value = quarterStart;
quarterEndInput.value = quarterEnd;


}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatUTCDateToMMDDYYYY(dateString) {
    const date = new Date(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
}



// Store changes in the changes object
function storeChange(input) {
    const id = input.dataset.id;
    const field = input.dataset.field;
    let value = input.value;

    if (field === 'date7') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            alert("Please enter a valid date for date7.");
            input.value = '';
            return;
        }
        value = date.toISOString(); // Store in ISO format for Airtable
    }
    
    

    input.style.backgroundColor = "lightblue"; // Set background color to indicate change

    // Ensure Personaltime is a valid number
    if (field === 'Personaltime') {
        value = parseFloat(value); // Convert to a number
        if (isNaN(value) || value < 0) {
            alert('Personaltime must be a valid positive number.');
            input.value = 0; // Reset the value to 0 or another default
            value = 0;
        }
    }

    // Ensure PTO is a valid number (assuming PTO should be a number field)
    if (field === 'PTO') {
        value = parseFloat(value); // Convert to a number
        if (isNaN(value) || value < 0) {
            alert('PTO must be a valid positive number.');
            input.value = 0; // Reset to 0 or another default
            value = 0;
        }
    }


    if (!changes[id]) {
        changes[id] = {};
    }
    changes[id][field] = value; // Store changes for Employee Number and other fields

    // Log the change
    console.log(`Stored change for record ${id}:`, changes[id]);
}

async function submitChanges() {
    const updatesPTO = [];
    const updatesEmployee = [];
    const employeeData = await fetchEmployeeNumbers(); // Fetch employee numbers

    console.log("Fetched Employee Data:", employeeData);

    for (const id in changes) {
        if (changes.hasOwnProperty(id)) {
            const fields = { ...changes[id] }; // Clone the fields to modify without affecting the original

            // Check if there is an Employee Number field and handle it separately
            if (fields.hasOwnProperty('date7')) {
                const employeeNumber = fields['date7'];
                delete fields['date7']; // Remove Employee Number from the PTO/Personal time table update

                const fullName = records.find(record => record.id === id)?.fields['Full Name']; // Get the Full Name from the PTO records

                if (fullName) {
                    const matchingEmployee = employeeData.find(emp => {
                        const employeeFullName = emp.fields['Full Name'] ? emp.fields['Full Name'].trim().toLowerCase() : null;
                        return employeeFullName === fullName.toLowerCase(); // Match by Full Name
                    });

                    if (matchingEmployee) {
                        updatesEmployee.push({
                            id: matchingEmployee.id, // Update using the correct record ID in the Employee table
                            fields: { 'date7': employeeNumber } // Update Employee Number in the Employee table only
                        });
                    } else {
                        console.warn(`No matching employee found for Full Name: ${fullName}`);
                    }
                }
            }

            // If there are other fields to update in the PTO/Personal time table, add them to updatesPTO
            if (Object.keys(fields).length > 0) {
                updatesPTO.push({ id, fields });
            }
        }
    }

    // Log final payloads before sending
    console.log("Final payload for PTO/Personal Time Table PATCH request:", updatesPTO);
    console.log("Final payload for Employee Number PATCH request:", updatesEmployee);

    // Submit changes for PTO/Personal Time (excluding Employee Number)
    if (updatesPTO.length > 0) {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey1}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records: updatesPTO })
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(JSON.stringify(responseData, null, 2));
            }
            console.log('PTO/Personal Time changes submitted successfully!', responseData);
        } catch (error) {
            console.error('Error submitting PTO/Personal Time changes:', error.message);
        }
    }

// Submit changes for Employee Number (in the Employee table)
if (updatesEmployee.length > 0) {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey1}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: updatesEmployee })
        });

        const responseData = await response.json();

        // Check if the response is not ok and log detailed error if it failed
        if (!response.ok) {
            console.error('Failed to submit date7 changes:', responseData);
            throw new Error(`Failed to update Employee Number. Status: ${response.status}. Message: ${responseData.error?.message || 'Unknown error'}`);
        }

        console.log('Employee Number changes submitted successfully!', responseData);
    } catch (error) {
        console.error('Error submitting Employee Number changes:', error.message);
    }
}


      // Refresh data after submission
      await fetchData();

      // Prepare readable change summary for the toast
      const changeSummary = Object.entries(changes).map(([id, fields]) => {
        const record = records.find(rec => rec.id === id);
        const fullName = record?.fields['Full Name'] || 'Unknown';
    
        const fieldChanges = Object.entries(fields).map(([field, value]) => {
            if (field === 'date7') {
                const formatted = formatUTCDateToMMDDYYYY(value);
                return `${field}: ${formatted}`;
            }
            return `${field}: ${value}`;
        }).join(', ');
    
        return `<strong>${fullName}:</strong> ${fieldChanges}`;
    }).join('<br>');
      showToast(`<div><strong>Changes Submitted Successfully!</strong><br>${changeSummary}</div>`);
  
      // Clear the search bar and reset search mode
      document.getElementById('searchBar').value = '';
      searchMode = false;
      changes = {}; // Clear changes after submit
  
}
// Initial fetch
fetchData();

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name');

    if (nameParam) {
        const searchInput = document.getElementById('searchBar');
        if (searchInput) {
            searchInput.value = nameParam;
            searchMode = true;
        }

        // Wait for data to load, then filter
        const interval = setInterval(() => {
            if (records.length > 0) {
                clearInterval(interval);
                filterResults(); // Filter and display only that name
            }
        }, 200);
    }
});

