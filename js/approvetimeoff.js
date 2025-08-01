document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tblDUlMq88nxT7M4I';
    const ptoTableId = 'tbljmLpqXScwhiWTt';
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    const userEmail = localStorage.getItem('userEmail');
    const userEmailElement = document.getElementById('user-email');
    const notificationElement = document.getElementById('notification');

    console.log("User email:", userEmail);

    if (!userEmail) {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    userEmailElement.textContent = userEmail;

    async function fetchSupervisorName(email) {
        try {
            const supervisorUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(supervisorUrl, { headers });
            const data = await response.json();
            if (data.records.length > 0) {
                return data.records[0].fields['Name'];
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error fetching supervisor name:', error);
            window.location.href = 'index.html';
        }
    }

    function parseDate(dateStr) {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
            console.error(`Invalid date format: ${dateStr}`);
            return null; // Return null for invalid dates
        }
        return parsedDate;
    }
    

    async function fetchRequests(supervisorName) {
        let allRecords = [];
        let offset = '';

        try {
            do {
                const fetchUrl = offset ? `${url}?offset=${offset}` : url;
                const response = await fetch(fetchUrl, { headers });
                const data = await response.json();
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } while (offset);

            const supervisorRequests = allRecords.filter(record => record.fields.Supervisor === supervisorName);
            displayRequests(supervisorRequests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    async function fetchAvailableHours(employeeName) {
        try {
            const employeeUrl = `https://api.airtable.com/v0/${baseId}/${ptoTableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${employeeName}'`)}`;
            const response = await fetch(employeeUrl, { headers });
            const data = await response.json();

            if (data.records.length > 0) {
                const employee = data.records[0].fields;
                const availablePTO = employee['PTO Total'] || 0;
                const availablePersonalHours = employee['Personaltime'] || 0;
                return { availablePTO, availablePersonalHours };
            } else {
                return { availablePTO: 0, availablePersonalHours: 0 };
            }
        } catch (error) {
            console.error('Error fetching available hours:', error);
            return { availablePTO: 0, availablePersonalHours: 0 };
        }
    }

   function calculateWorkDayHoursMissed(startDateTimeStr, endDateTimeStr, workStartTime = "07:00 AM", workEndTime = "04:00 PM") {
    console.log("Inputs:", { startDateTimeStr, endDateTimeStr, workStartTime, workEndTime });

    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error("Invalid start or end datetime:", { startDateTimeStr, endDateTimeStr });
        return 0;
    }

    let totalMissedHours = 0;
    let currentDate = new Date(startDateTime);

    while (currentDate <= endDateTime) {

        // === SKIP WEEKENDS HERE ===
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
            continue;
        }

        // ...rest of your code below unchanged...
        const workStart = new Date(currentDate);
        const workEnd = new Date(currentDate);

        const [workStartHour, workStartMinutes, workStartPeriod] = parseTime(workStartTime);
        const [workEndHour, workEndMinutes, workEndPeriod] = parseTime(workEndTime);

        workStart.setHours(convertTo24Hour(workStartHour, workStartPeriod));
        workStart.setMinutes(workStartMinutes);
        workEnd.setHours(convertTo24Hour(workEndHour, workEndPeriod));
        workEnd.setMinutes(workEndMinutes);

        const currentDayStart = new Date(currentDate);
        const currentDayEnd = new Date(currentDate);

        if (currentDate.toDateString() === startDateTime.toDateString()) {
            currentDayStart.setHours(startDateTime.getHours(), startDateTime.getMinutes());
        } else {
            currentDayStart.setTime(workStart.getTime());
        }

        if (currentDate.toDateString() === endDateTime.toDateString()) {
            currentDayEnd.setHours(endDateTime.getHours(), endDateTime.getMinutes());
        } else {
            currentDayEnd.setTime(workEnd.getTime());
        }

        const missedStart = Math.max(workStart.getTime(), currentDayStart.getTime());
        const missedEnd = Math.min(workEnd.getTime(), currentDayEnd.getTime());

        let missedHours = (missedEnd - missedStart) / (1000 * 60 * 60);

        // Subtract one hour for lunch if overlaps with noon–1pm
        const noon = new Date(currentDate); noon.setHours(12, 0, 0, 0);
        const onePM = new Date(currentDate); onePM.setHours(13, 0, 0, 0);

        if (missedStart < onePM.getTime() && missedEnd > noon.getTime()) {
            missedHours = Math.max(0, missedHours - 1);
        }

        totalMissedHours += Math.max(0, missedHours);

        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
    }

    return totalMissedHours;
}

    // Helper functions
    function parseTime(timeStr) {
        const [time, period] = timeStr.split(" ");
        const [hour, minutes] = time.split(":").map(Number);
        return [hour, minutes || 0, period];
    }
    
    function convertTo24Hour(hour, period) {
        if (period === "PM" && hour !== 12) {
            return hour + 12;
        }
        if (period === "AM" && hour === 12) {
            return 0;
        }
        return hour;
    }   

    async function displayRequests(records) {
        const container = document.getElementById('requests-container');
        container.innerHTML = '';
    
        // Group records by employee name
        const groupedByEmployee = records.reduce((acc, record) => {
            const employeeName = record.fields.Name;
            if (!acc[employeeName]) acc[employeeName] = [];
            acc[employeeName].push(record);
            return acc;
        }, {});
    
        // Format date utility
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC', // Use UTC to avoid timezone issues
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
    
        // Iterate over employees
        for (const [employeeName, employeeRequests] of Object.entries(groupedByEmployee)) {
            const employeeDiv = document.createElement('div');
            employeeDiv.className = 'employee';
    
            // Filter out records that don't contain time off
            const validRequests = employeeRequests.filter(record => {
                for (let i = 1; i <= 10; i++) {
                    if (record.fields[`Time off Start Date ${i}`] && record.fields[`Time off End Date ${i}`]) {
                        return true;
                    }
                }
                return false;
            });
    
            if (validRequests.length === 0) continue; // Skip employees without valid time off records
    
            // Add employee name
            const name = document.createElement('h3');
            name.textContent = employeeName;
            employeeDiv.appendChild(name);
    
            // Fetch and display available hours
            const availableHours = await fetchAvailableHours(employeeName);
            const availablePto = document.createElement('p');
            availablePto.textContent = `Available PTO: ${availableHours.availablePTO}`;
            employeeDiv.appendChild(availablePto);
    
            const availablePersonalHours = document.createElement('p');
            availablePersonalHours.textContent = `Available Personal Hours: ${availableHours.availablePersonalHours}`;
            employeeDiv.appendChild(availablePersonalHours);
    
            const requestsRow = document.createElement('div');
            requestsRow.className = 'requests-row';
    
            // Merge requests per index and create a single div
            for (let i = 1; i <= 10; i++) {
                const mergedRequest = validRequests.reduce((acc, record) => {
                    const startDateStr = record.fields[`Time off Start Date ${i}`];
                    const endDateStr = record.fields[`Time off End Date ${i}`];
                    const startTimeStr = record.fields[`Time off Start Time ${i}`] || '7:00 AM';
                    const endTimeStr = record.fields[`Time off End Time ${i}`] || '4:00 PM';
    
                    if (startDateStr && endDateStr) {
                        const startDate = new Date(startDateStr);
                        const endDate = new Date(endDateStr);
    
                        if (!acc.startDate || startDate < acc.startDate) {
                            acc.startDate = startDate;
                            acc.startTime = startTimeStr;
                        }
    
                        if (!acc.endDate || endDate > acc.endDate) {
                            acc.endDate = endDate;
                            acc.endTime = endTimeStr;
                            acc.lastRecord = record; // Track the last record
                        }
                    }
    
                    return acc;
                }, { startDate: null, endDate: null, startTime: '', endTime: '', lastRecord: null });
    
                if (mergedRequest.startDate && mergedRequest.endDate) {
                    const formattedStartDate = new Date(mergedRequest.startDate).toISOString().split('T')[0]; // Get date part only
                    const formattedEndDate = new Date(mergedRequest.endDate).toISOString().split('T')[0]; // Get date part only
                    
                    const formattedStartTime = formatTime(mergedRequest.startTime);
                    const formattedEndTime = formatTime(mergedRequest.endTime);
                
                    const requestDiv = document.createElement('div');
                    requestDiv.className = 'request';
                
                    const startDateTimeElement = document.createElement('p');
                    startDateTimeElement.textContent = `Start: ${formattedStartDate} ${formattedStartTime}`;
                    requestDiv.appendChild(startDateTimeElement);
                
                    const endDateTimeElement = document.createElement('p');
                    endDateTimeElement.textContent = `End: ${formattedEndDate} ${formattedEndTime}`;
                    requestDiv.appendChild(endDateTimeElement);
                
                    // Calculate workday hours missed without factoring in lunch break
                    const formattedStartDateTime = `${formattedStartDate} ${formattedStartTime}`;
                    const formattedEndDateTime = `${formattedEndDate} ${formattedEndTime}`;
                    const hoursMissed = calculateWorkDayHoursMissed(formattedStartDateTime, formattedEndDateTime);
                
                    const missedHoursElement = document.createElement('p');
                    missedHoursElement.textContent = `Workday Hours Missed: ${hoursMissed.toFixed(2)}`;
                    requestDiv.appendChild(missedHoursElement);
                
                   const approvalCheckbox = document.createElement('input');
approvalCheckbox.type = 'checkbox';
approvalCheckbox.checked = mergedRequest.lastRecord.fields[`Time off Approved ${i}`] || false;
approvalCheckbox.dataset.recordId = mergedRequest.lastRecord.id;
approvalCheckbox.dataset.approvalIndex = i;
approvalCheckbox.classList.add('approval-checkbox');

const denialReasonInput = document.createElement('input');
denialReasonInput.type = 'text';
denialReasonInput.placeholder = 'Reason for denial';
denialReasonInput.style.display = approvalCheckbox.checked ? 'none' : 'inline-block';
denialReasonInput.value = mergedRequest.lastRecord.fields[`Reason ${i}`] || '';
denialReasonInput.dataset.recordId = mergedRequest.lastRecord.id;
denialReasonInput.dataset.approvalIndex = i;

approvalCheckbox.addEventListener('change', () => {
    denialReasonInput.style.display = approvalCheckbox.checked ? 'none' : 'inline-block';
    handleApprovalChange({ target: approvalCheckbox });
});

requestDiv.appendChild(approvalCheckbox);
requestDiv.appendChild(denialReasonInput);

// ✅ Trigger update on blur if non-empty
denialReasonInput.addEventListener('blur', async () => {
    const recordId = denialReasonInput.dataset.recordId;
    const approvalIndex = denialReasonInput.dataset.approvalIndex;
    const reasonText = denialReasonInput.value.trim();

    // Always update, even if blank, so empty value is sent to Airtable!


    const updateUrl = `${url}/${recordId}`;
    const data = {
        fields: {
            [`Reason ${approvalIndex}`]: reasonText,
            [`Time off Approved ${approvalIndex}`]: false  // Denied
        }
    };

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update denial reason');
        }
        showNotification('Denial reason saved');
    } catch (err) {
        console.error("❌ Error saving denial reason:", err);
    }
});

                
                    requestsRow.appendChild(requestDiv);
                }
            }
    
            employeeDiv.appendChild(requestsRow);
            container.appendChild(employeeDiv);
        }
    }
    
    
    function isOverlapping(startDate1, endDate1, startDate2, endDate2) {
        return startDate1 <= endDate2 && startDate2 <= startDate1;
    }
    
    async function handleApprovalChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.dataset.recordId;
        const approvalIndex = checkbox.dataset.approvalIndex;
        const approved = checkbox.checked;
    
        console.log(`Updating approval for recordId ${recordId}, index ${approvalIndex}:`, approved);
    
        const denialReasonSelect = document.querySelector(`select[data-record-id="${recordId}"][data-approval-index="${approvalIndex}"]`);
    
        const updateUrl = `${url}/${recordId}`;
       const denialReasonInput = document.querySelector(`input[type="text"][data-record-id="${recordId}"][data-approval-index="${approvalIndex}"]`);
const denialReason = denialReasonInput ? denialReasonInput.value.trim() : '';

const data = {
    fields: {
        [`Time off Approved ${approvalIndex}`]: approved,
        [`Reason ${approvalIndex}`]: approved ? '' : denialReason
    }
};

    
        try {
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error('Failed to update approval status');
            }
            showNotification('Record saved successfully!');
        } catch (error) {
            console.error('Error updating approval status:', error);
        }
    }
    
    function formatTime(time, isStartTime = true) {
        if (!time || time.toLowerCase() === 'all day') {
            return null; // Return null if invalid
        }
    
        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);
    
        if (!match) {
            console.warn("Invalid time format:", time);
            return null;
        }
    
        let [, hours, minutes, period] = match;
        hours = hours.padStart(2, '0');
        minutes = minutes || '00';
        period = period ? period.toUpperCase() : 'AM';
    
        return `${hours}:${minutes} ${period}`;
    }
    
    function parseTime(time) {
        const timePattern = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])? ?([aApP][mM])?$/;
        const match = time.match(timePattern);
    
        if (!match) {
            console.error("Invalid time format:", time);
            return [null, null, null];
        }
    
        const hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3] ? match[3].toUpperCase() : null;
    
        return [hours, minutes, period];
    }
    
    function convertTo24Hour(hours, period) {
        if (period === "AM" && hours === 12) return 0;
        if (period === "PM" && hours < 12) return hours + 12;
        return hours;
    }
     
    function showNotification(message) {
        if (notificationElement) {
            notificationElement.textContent = message;
            notificationElement.style.display = 'block';

            setTimeout(() => {
                notificationElement.style.display = 'none';
            }, 3500);
        }
    }

    async function initialize() {
        const supervisorName = await fetchSupervisorName(userEmail);
        if (supervisorName) {
            fetchRequests(supervisorName);
        }
    }

    document.getElementById('refresh-button').addEventListener('click', initialize);
    document.getElementById('logout-button').addEventListener('click', handleLogout);

    function handleLogout() {
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    }

    initialize();
});
