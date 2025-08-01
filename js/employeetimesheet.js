document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tbl8znXria2leJfUd';
    const table2Id = 'tbljmLpqXScwhiWTt';
    const userEmailElement = document.getElementById('user-email');
    const timesheetsBody = document.getElementById('timesheets-body');
    const logoutButton = document.getElementById('logout-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingScreen = document.getElementById('loading-screen');
    const loadingLogo = document.getElementById('loading-logo');
    const mainContent = document.getElementById('main-content');
  
    let supervisorEmail = localStorage.getItem('userEmail') || 'supervisor@example.com';

// Define impersonation rules
const impersonateKatyEmails = ['nhernandez@guyclee.com', 'jjones@guyclee.com'];
const impersonateBrianEmails = ['brian@vanirinstalledsales.com'];

const isKaty = supervisorEmail === 'katy@vanirinstalledsales.com';
const isImpersonatingKaty = impersonateKatyEmails.includes(supervisorEmail);
const isImpersonatingBrian = impersonateBrianEmails.includes(supervisorEmail);


  if (isKaty || isImpersonatingKaty) {
    filterFormula = '{Employee Number}!=BLANK()';
}

    console.log(`[INFO] Logged in as: ${supervisorEmail} (Impersonating Katy: ${isImpersonatingKaty}, Impersonating Brian: ${isImpersonatingBrian})`);

    if (userEmailElement) {
        if (isImpersonatingKaty) {
            userEmailElement.style.display = 'none';
        } else {
            userEmailElement.textContent = supervisorEmail;
            userEmailElement.classList.add('clickable');
            userEmailElement.addEventListener('click', () => {
                window.location.href = 'timesheet.html';
            });
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('🔓 Logout button clicked. Clearing session and navigating to index.html');
    
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userPassword'); 
            sessionStorage.removeItem('user');
    
            window.location.href = 'index.html';
        });
    }

    console.log('Starting loading screen sequence');
    setTimeout(() => {
        loadingLogo.classList.add('full-color');

        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainContent.classList.add('visible');
                loadDataAndInitializePage();
            }, 700);
        }, 1000);
    }, 1000);

    async function loadDataAndInitializePage() {
        try {
            console.log(`[INFO] Initializing page for: ${supervisorEmail}`);

           console.log('Current login:', supervisorEmail);
let supervisorName = supervisorEmail;
if (!isImpersonatingBrian) {
    supervisorName = await fetchSupervisorName(supervisorEmail);
}
console.log('SupervisorName returned:', supervisorName);


            await fetchTimesheets(supervisorName);


            if (supervisorName) {
                await fetchTimesheets(supervisorName);
            } else {
                alert("Supervisor not found. Please ensure the email is correct.");
            }
        } catch (error) {
            console.error(`[ERROR] An error occurred: ${error.message}`);
            alert("An unexpected error occurred. Please try again later.");
        }
    }

    // Define handleInputChange globally so it can be accessed in the DOM
async function handleInputChange(event, recordId, employeeNumber, fieldName) {
    const newValue = event.target.value;

    console.log(`[INFO] Field "${fieldName}" changed for Record: ${recordId}, Employee Number: ${employeeNumber}, New Value: ${newValue}`);

  
    try {
        const updateEndpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        
        const body = JSON.stringify({
            fields: {
                [fieldName]: newValue
            }
        });

        const response = await fetch(updateEndpoint, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: body
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to update Airtable: ${errorMessage}`);
        }

        console.log(`[SUCCESS] Successfully updated field "${fieldName}" for Employee: ${employeeNumber}`);
        displaySuccessMessage("Timesheet updated successfully!");

    } catch (error) {
        console.error(`[ERROR] Error updating timesheet: ${error.message}`);
        alert("Error updating timesheet. Please try again.");
    }
}

    function toggleVisibility(recordId) {
        const nameContainer = timesheetsBody.querySelector(`.name-container[data-record-id="${recordId}"]`);
        const table = timesheetsBody.querySelector(`.time-entry-table[data-record-id="${recordId}"]`);

        if (nameContainer && table) {
            console.log(`Toggling table visibility for record ID: ${recordId}`);
            table.style.display = table.style.display === 'none' ? '' : 'none';
            nameContainer.classList.toggle('hidden', table.style.display === 'none');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
          const scrollableDiv = document.querySelector('.time-tracking-table.scrollable');
    
          document.body.style.overflow = 'hidden';
      
          document.body.addEventListener('wheel', function (event) {
              event.preventDefault();
      
              scrollableDiv.scrollTop += event.deltaY;
          });
    });

    async function fetchSupervisorName(email) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${email}')`;
        console.log(`Fetching supervisor name from Airtable with endpoint: ${endpoint}`);
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch supervisor name: ${response.statusText}`);
            const data = await response.json();
            console.log('Supervisor data fetched:', data);
// Pick the one where 'Full Name' matches the supervisor's name pattern
const nameRecord = data.records.find(r => 
  r.fields['Full Name'] && r.fields['Full Name'].toLowerCase().includes('mike raszmann')
);
// fallback to the first record
return nameRecord ? nameRecord.fields['Full Name'] : (data.records[0]?.fields['Full Name'] || null);
        } catch (error) {
            console.error(error);
            alert("Error fetching supervisor data. Please try again later.");
            return null;
        }
    }

    async function fetchApprovedStatus() {
        let allRecords = [];
        let offset = null;
    
        do {
            const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}${offset ? `?offset=${offset}` : ''}`;
            console.log(`Fetching approved status with endpoint: ${endpoint}`);
    
            try {
                const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`Failed to fetch approved status: ${response.statusText}`);
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
    
                offset = data.offset;
            } catch (error) {
                console.error('Error fetching approved status:', error);
                return {};
            }
        } while (offset);
    
        return allRecords.reduce((acc, record) => {
            const employeeNumber = record.fields['Employee Number'];
            const approved = record.fields['Approved'] ?? false;
            const date7 = record.fields['date7'] || '';
            acc[employeeNumber] = { approved, date7 };
            console.log(`Employee Number: ${employeeNumber}, Approved: ${approved}, date7: ${date7}`);
            return acc;
        }, {});
    }
    
  async function fetchTimesheets(supervisorName) {
    let filterFormula;

    // The key line
if (isKaty || isImpersonatingKaty) {
    filterFormula = '{Employee Number}!=BLANK()';
} else if (isImpersonatingBrian) {
    filterFormula = "OR({Employee Number}='12078',{Employee Number}='12098',{Employee Number}='12002')";
} else if (supervisorEmail === 'mike.raszmann@vanirinstalledsales.com') {
    filterFormula = "OR({Supervisor Email}='mike.raszmann@vanirinstalledsales.com',{Supervisor Email}='ethen.wilson@vanirinstalledsales.com')";
} else {
    filterFormula = `AND({Supervisor}='${supervisorName}', {Employee Number}!=BLANK())`;
}

        let allRecords = [];
        let offset = null;

        do {
const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Employee Number&sort[0][direction]=asc`;
            try {
                loadingIndicator.style.display = 'block';
                const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } catch (error) {
                console.error(error);
                alert("Error fetching timesheet data.");
                return;
            } finally {
                loadingIndicator.style.display = 'none';
            }
        } while (offset);

        const approvedData = await fetchApprovedStatus();
        await populateTimesheets(allRecords, approvedData);
    }

    async function fetchEmployeeName(employeeNumber) {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Employee Number}='${employeeNumber}')&sort[0][field]=Full Name&sort[0][direction]=asc`;
        console.log(`Fetching employee name from Airtable with endpoint: ${endpoint}`);
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch employee name: ${response.statusText}`);
            const data = await response.json();
            console.log('Employee data fetched:', data);
            return data.records.length > 0 ? data.records[0].fields['Full Name'] : 'Unknown';
        } catch (error) {
            console.error(error);
            alert("Error fetching employee data. Please try again later.");
            return 'Unknown';
        }
    }
    function formatDateToMMDDYYYY(dateString) {
        if (!dateString) return ''; // Return empty string if date is not available
    
        // Append 'T00:00:00Z' to treat the date as UTC
        const date = new Date(`${dateString}T00:00:00Z`);
    
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Get month (UTC)
        const day = date.getUTCDate().toString().padStart(2, '0'); // Get day (UTC)
        const year = date.getUTCFullYear(); // Get year (UTC)
    
        return `${month}/${day}/${year}`;
    }

    function roundToQuarterHour(hours) {
    const quarter = 0.25;
    return Math.round(hours / quarter) * quarter;
}

function calculateHours(start, end, lunchStart, lunchEnd, additionalIn, additionalOut) {
    if (!start || !end) return 0;

    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const lunchStartTime = lunchStart ? new Date(`1970-01-01T${lunchStart}:00`) : null;
    const lunchEndTime = lunchEnd ? new Date(`1970-01-01T${lunchEnd}:00`) : null;
    const additionalInTime = additionalIn ? new Date(`1970-01-01T${additionalIn}:00`) : null;
    const additionalOutTime = additionalOut ? new Date(`1970-01-01T${additionalOut}:00`) : null;

    let workedHours = (endTime - startTime) / (1000 * 60 * 60);

    if (lunchStartTime && lunchEndTime) {
        workedHours -= (lunchEndTime - lunchStartTime) / (1000 * 60 * 60);
    }

    if (additionalInTime && additionalOutTime) {
        workedHours += (additionalOutTime - additionalInTime) / (1000 * 60 * 60);
    }

    const roundedHours = workedHours > 0 ? roundToQuarterHour(workedHours) : 0;
    return roundedHours.toFixed(2);
}


    function generateRows(fields, recordId, employeeNumber) {
        console.log(`[INFO] Generating rows for timesheet for record: ${recordId}, Employee Number: ${employeeNumber}`);
        
        let totalHoursWorked = 0;
        let giftedHours = 0;
        const isEditable = isImpersonatingBrian; // Only Brian can edit
    
        function calculateAndAccumulateHours(day) {
            const start = fields[`start${day}`] || '';
            const end = fields[`end${day}`] || '';
            const lunchStart = fields[`lunchs${day}`] || '';
            const lunchEnd = fields[`lunche${day}`] || '';
            const additionalIn = fields[`additionali${day}`] || '';
            const additionalOut = fields[`additionalo${day}`] || '';
            const HolidayHours = fields[`Holiday Hours${day}`] || '';
    
            const hours = calculateHours(start, end, lunchStart, lunchEnd, additionalIn, additionalOut, HolidayHours);
            totalHoursWorked += parseFloat(hours) || 0;
            return hours;
        }
    
        const rows = [1, 2, 3, 4, 5, 6, 7].map(day => `
            <tr>
                <th><input type="time" name="start${day}" value="${fields[`start${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'start${day}')"></th>
                <th><input type="time" name="lunchs${day}" value="${fields[`lunchs${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'lunchs${day}')"></th>
                <th><input type="time" name="lunche${day}" value="${fields[`lunche${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'lunche${day}')"></th>
                <th><input type="time" name="end${day}" value="${fields[`end${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'end${day}')"></th>
                <th><input type="time" name="additionali${day}" value="${fields[`additionali${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'additionali${day}')"></th>
                <th><input type="time" name="additionalo${day}" value="${fields[`additionalo${day}`] || ''}" ${isEditable ? '' : 'disabled'}
                    onblur="handleInputChange(event, '${recordId}', '${employeeNumber}', 'additionalo${day}')"></th>
                    
                <th>${calculateAndAccumulateHours(day)}</th>
            </tr>
        `).join('');
       
    
console.log(`[INFO] Total hours worked after all days: ${totalHoursWorked.toFixed(2)}`);

// ⬇️ Add this to round it
totalHoursWorked = roundToQuarterHour(totalHoursWorked);
console.log(`[INFO] Total hours worked after rounding: ${totalHoursWorked.toFixed(2)}`);


           // Fetch additional hours
           const totalPersonalHours = parseFloat(fields['Total Personal Hours'] || 0);
           const totalPtoHours = parseFloat(fields['Total PTO Hours'] || 0);
           const totalHolidayHours = parseFloat(fields['Total holiday hours'] || 0);
       
           console.log(`[DEBUG] Personal Hours: ${totalPersonalHours}, PTO Hours: ${totalPtoHours}, Holiday Hours: ${totalHolidayHours}`);
    
// Gifted hours logic
 const totalEligibleHours = totalHoursWorked + totalHolidayHours + totalPersonalHours + totalPtoHours;

 if (totalHoursWorked === 0) {
    giftedHours = 0;
    console.log(`[INFO] Gifted hours set to 0 because total hours worked is 0.`);
} else if (totalEligibleHours < 40) {
    giftedHours = Math.min(3, 40 - totalEligibleHours);
    console.log(`[INFO] Gifted hours calculated: ${giftedHours.toFixed(2)} based on total eligible hours: ${totalEligibleHours.toFixed(2)}`);
} else {
    giftedHours = 0;
    console.log(`[INFO] No gifted hours as total eligible hours (${totalEligibleHours.toFixed(2)}) exceed 40.`);
 }
   
        // Calculate the final total including all hours
        const finalTotal = totalHoursWorked + giftedHours + totalHolidayHours + totalPersonalHours + totalPtoHours;
        console.log(`[INFO] Final total hours (including gifted): ${finalTotal.toFixed(2)}`);
    
        // Construct rows for totals
        let totalRow = `
            <tr>
                <td colspan="5" style="border: none;"></td>
                <td class="narrow-border" style="text-align:right; border-top: 4px solid white; border-left: 4px solid white; width: 30%;">Total Hours Worked:</td>
                <td style="border-top: 4px solid white; border-right: 4px solid white; width: 10%; color: ${totalHoursWorked > 40 ? 'red' : 'white'};">
                    ${totalHoursWorked.toFixed(2)}
                </td>
            </tr>
        `;
    
        if (giftedHours > 0) {
            totalRow += `
                <tr>
                    <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Gifted Hours:</td>
                    <td style="border-right: 4px solid white; width: 10%;">${giftedHours.toFixed(2)}</td>
                </tr>
            `;
        }
    
        if (totalPersonalHours > 0) {
            totalRow += `
                <tr>
                    <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Personal Hours:</td>
                    <td style="border-right: 4px solid white; width: 10%;">${totalPersonalHours.toFixed(2)}</td>
                </tr>
            `;
        }
    
        if (totalPtoHours > 0) {
            totalRow += `
                <tr>
                    <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">PTO Hours:</td>
                    <td style="border-right: 4px solid white; width: 10%;">${totalPtoHours.toFixed(2)}</td>
                </tr>
            `;
        }
    
        if (totalHolidayHours > 0) {
            totalRow += `
                <tr>
                    <td colspan="5" style="border: none;"></td>
                    <td class="narrow-border" style="text-align:right; border-left: 4px solid white; width: 30%;">Holiday Hours:</td>
                    <td style="border-right: 4px solid white; width: 10%;">${totalHolidayHours.toFixed(2)}</td>
                </tr>
            `;
        }
    
        // Add row for the final total
        totalRow += `
            <tr>
                <td colspan="5" style="border: none;"></td>
                <td class="narrow-border" style="text-align:right; border-left: 4px solid white; border-top: 4px solid white; width: 30%; font-weight: bold;">Grand Total:</td>
                <td style="border-right: 4px solid white; border-top: 4px solid white; width: 10%; font-weight: bold;">${finalTotal.toFixed(2)}</td>
            </tr>
        `;
    
        // Add approval row
        totalRow += `
            <tr>
                <td colspan="5" style="border: none;"></td>
                <td class="narrow-border" style="text-align:right; border-bottom: 4px solid white; border-left: 4px solid white; width: 30%;">Approval :</td>
                <td style="border-bottom: 4px solid white; border-right: 4px solid white; width: 10%;">
                    <input type="checkbox" class="approve-checkbox" 
                        data-record-id="${recordId}" 
                        ${fields['Approved'] === true ? 'checked' : ''}>
                </td>
            </tr>
        `;
    
        console.log(`[INFO] Total row constructed for Employee Number: ${employeeNumber}`);
        return rows + totalRow;
    }
    
    
    // Handling the checkbox change and passing `recordId`
   function handleCheckboxChange(event) {
    const checkbox = event.target;
    const recordId = checkbox.getAttribute('data-record-id'); // This is likely the record ID
    const employeeNumber = checkbox.getAttribute('data-employee-number'); // Use this to get the employee number
    const isApproved = checkbox.checked;

    console.log(`Checkbox clicked. Record ID: ${recordId}, Employee Number: ${employeeNumber}, Approved: ${isApproved}`);

    if (employeeNumber) {
        updateApprovalStatus(employeeNumber, isApproved);
    } else {
        console.error('Employee Number is not defined');
    }
}

async function populateTimesheets(records, approvedData) {
    console.log('Populating timesheets');
    timesheetsBody.innerHTML = '';

    if (records.length > 0) {
        for (const record of records) {
            const fields = record.fields;
            const employeeNumber = fields['Employee Number'];

            if (!employeeNumber) continue;

            const employeeName = await fetchEmployeeName(employeeNumber);
            const { approved: approvalStatus, date7 } = approvedData[employeeNumber] || { approved: false, date7: '' };
            const formattedDate7 = formatDateToMMDDYYYY(date7);

            let totalHoursWorked = 0;
            for (let day = 1; day <= 7; day++) {
                totalHoursWorked += parseFloat(calculateHours(fields[`start${day}`], fields[`end${day}`], fields[`lunchs${day}`], fields[`lunche${day}`], fields[`additionali${day}`], fields[`additionalo${day}`])) || 0;
            }

            const nameContainer = document.createElement('div');
            nameContainer.classList.add('name-container');
            nameContainer.textContent = `${employeeName}  ${formattedDate7}`;
            nameContainer.setAttribute('data-record-id', record.id);
            nameContainer.setAttribute('data-employee-number', employeeNumber);
            nameContainer.addEventListener('click', () => {
                toggleVisibility(record.id);
            });
            nameContainer.classList.add('clickable');

            if (totalHoursWorked === 0) {
                nameContainer.style.color = 'red';
            }
            timesheetsBody.appendChild(nameContainer);

            const table = document.createElement('table');
            table.classList.add('time-entry-table');
            table.setAttribute('data-record-id', record.id);
            table.innerHTML = `
                <thead>
                    <tr>
                        <th class="narrow-column">Start Time</th>
                        <th class="narrow-column">Lunch Start</th>
                        <th class="narrow-column">Lunch End</th>
                        <th class="narrow-column">End Time</th>
                        <th class="narrow-column">Additional Time in</th>
                        <th class="narrow-column">Additional Time out</th>

                        <th>Hours Worked</th> 
                    </tr>
                </thead>
                <tbody>
                    ${generateRows(fields, record.id, employeeNumber)}
                </tbody>
            `;

            // Attach `onblur` event to inputs to call `handleInputChange`
            if (isImpersonatingBrian) {
                table.querySelectorAll('input[type="time"]').forEach(input => {
                    input.addEventListener('blur', (event) => {
                        const fieldName = input.getAttribute('name');
                        handleInputChange(event, record.id, employeeNumber, fieldName);
                    });
                });
            }

            const approveCheckbox = table.querySelector('.approve-checkbox');
            if (approveCheckbox) {
                approveCheckbox.checked = approvalStatus;
                approveCheckbox.setAttribute('data-employee-number', employeeNumber);
                approveCheckbox.addEventListener('change', handleCheckboxChange);
            }

            if (supervisorEmail !== 'katy@vanirinstalledsales.com' && approvalStatus) {
                table.style.display = 'none'; 
            }

            timesheetsBody.appendChild(table);
        }
    } else {
        console.log('No records found for the supervisor');
        const noRecordsRow = document.createElement('div');
        noRecordsRow.classList.add('name-container');
        noRecordsRow.textContent = `No records found for the supervisor: ${supervisorEmail}`;
        timesheetsBody.appendChild(noRecordsRow);
    }
}

    async function updateApprovalStatus(employeeNumber, isApproved) {
        const approvedEndpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}?filterByFormula=AND({Employee Number}='${employeeNumber}')`;

        try {
            const response = await fetch(approvedEndpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            const data = await response.json();
            if (data.records.length === 0) throw new Error(`No record found for Employee Number: ${employeeNumber}`);

            const recordId = data.records[0].id;
            const endpoint = `https://api.airtable.com/v0/${baseId}/${table2Id}/${recordId}`;

            const body = JSON.stringify({ fields: { Approved: isApproved } });

            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body,
            });

            if (!updateResponse.ok) {
                const errorMessage = await updateResponse.text();
                throw new Error(`Failed to update approval: ${errorMessage}`);
            }

            console.log(`Approval status updated for ${employeeNumber}: ${isApproved}`);
            displaySuccessMessage("Record successfully updated");
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });

        const scrollableDiv = document.querySelector('.time-tracking-table.scrollable');
        document.body.style.overflow = 'hidden';

        document.body.addEventListener('wheel', function (event) {
            event.preventDefault();
            scrollableDiv.scrollTop += event.deltaY;
        });
    });

    document.addEventListener('wheel', function(e) {
  const scrollable = document.querySelector('.scrollable');
  if (!scrollable) return;

  // Scroll the div if mouse is not directly over it
  if (!e.target.closest('.scrollable')) {
    scrollable.scrollTop += e.deltaY;
  }
}, { passive: true });


    function displaySuccessMessage(message) {
        let messageElement = document.getElementById('success-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'success-message';
            messageElement.style.position = 'fixed';
            messageElement.style.top = '50%';
            messageElement.style.left = '50%';
            messageElement.style.transform = 'translate(-50%, -50%)';
            messageElement.style.padding = '20px';
            messageElement.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
            messageElement.style.color = 'white';
            messageElement.style.fontSize = '16px';
            messageElement.style.borderRadius = '8px';
            messageElement.style.zIndex = '1000';
            document.body.appendChild(messageElement);
        }

        messageElement.textContent = message;
        messageElement.style.display = 'block';
        setTimeout(() => { messageElement.style.display = 'none'; }, 2000);
    }
});
