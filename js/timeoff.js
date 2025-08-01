document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tblDUlMq88nxT7M4I';

    const userEmail = localStorage.getItem('userEmail');
    let records = [];
    let currentEditingIndex = null;

    const form = document.getElementById('timeOffForm');
    const requestsList = document.getElementById('requestsList');
    const previousRequestsContainer = document.getElementById('previousRequests');
    const submissionStatus = document.getElementById('submissionStatus');
    const submittedData = document.getElementById('submittedData');
    const submittedEmployeeName = document.getElementById('submittedEmployeeName');
    const submittedStartDate = document.getElementById('submittedStartDate');
    const submittedStartTime = document.getElementById('submittedStartTime');
    const submittedEndDate = document.getElementById('submittedEndDate');
    const submittedEndTime = document.getElementById('submittedEndTime');
    const daysOffMessage = document.getElementById('daysOffMessage');
    const submitButton = document.getElementById('submitButton');
    const logoutButton = document.getElementById('logout-button');
   

    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    fetchEmployeeName(userEmail);

    function fillEmailFromLocalStorage() {
        const email = localStorage.getItem('userEmail');
        if (email) {
            document.getElementById('user-email').textContent = email;
        }
    }

    fillEmailFromLocalStorage();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit();
    });

    logoutButton.addEventListener('click', (event) => {
        handleLogout(event);
    });

    async function fetchEmployeeName(email) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            if (data.records.length > 0) {
                const employeeName = data.records[0].fields['Full Name'];
                document.getElementById('employeeName').value = employeeName;
                fetchPreviousRequests(email);
                await uncheckSubmitCheckbox(data.records[0].id);

            } else {
                console.error('No employee found with the given email.');
            }
        } catch (error) {
            console.error('Error fetching employee name:', error);
        }
    }

    async function fetchPreviousRequests(email) {
        try {
            let url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}`;
            let allRecords = [];
    
            console.log(`Fetching data for email: ${email}`);
    
            while (url) {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`
                    }
                });
                const data = await response.json();
    
                console.log("Fetched data batch:", data); // Log each batch of data
    
                if (data.records && data.records.length > 0) {
                    allRecords = allRecords.concat(data.records);
                }
    
                url = data.offset ? `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{email}='${email}'`)}&offset=${data.offset}` : null;
            }
    
            records = allRecords || [];
    
            console.log("Final fetched records:", records); // Log the final array of records
    
            await deleteExpiredRecords(records);
            await displayPreviousRequests(records); // Ensure display happens after fetch
    
        } catch (error) {
            console.error('Error fetching previous requests:', error);
        }
    }
    
    async function uncheckSubmitCheckbox(recordId) {
        try {
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'Submit': false
                    }
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to uncheck Submit checkbox:', errorData);
            } else {
                console.log('Submit checkbox unchecked on page load');
            }
        } catch (error) {
            console.error('Error unchecking Submit checkbox:', error);
        }
    }
    

    async function sendToAirtable(formData) {
        try {
            delete formData['Full Name'];
    
            const employeeName = document.getElementById('employeeName').value;
            const recordId = await getRecordIdByName(employeeName);
    
            if (!recordId) {
                showError(`Could not find your employee record (${employeeName}). Please ensure your email is correct or contact HR.`);
                return;
            }
    
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: formData })
            });
    
            if (response.ok) {
                const data = await response.json();
                showSuccessMessage('Submission successful!');
                displaySubmittedData(formData);
                fetchPreviousRequests(localStorage.getItem('userEmail'));
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to update record: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error saving to Airtable:', error);
            showError('Submission failed. Please try again.');
        }
    }
    
    
    async function getRecordIdByName(name) {
        try {
            const escapedName = name.replace(/'/g, "\\'");
            const url = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{Full Name}='${escapedName}'`)}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const data = await response.json();
            if (data.records && data.records.length > 0) {
                return data.records[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error fetching record ID by name:', error);
            return null;
        }
    }
    

    function getNextAvailableIndex() {
        let maxIndex = 0;
        if (records) {
            records.forEach(record => {
                for (let i = 1; i <= 10; i++) {
                    if (record.fields[`Time off Start Date ${i}`]) {
                        maxIndex = i;
                    }
                }
            });
        }
        return maxIndex + 1;
    }

 function handleFormSubmit() {
    const startDate = document.getElementById('startDate').value;
    let startTime = document.getElementById('startTime').value;
    const endDate = document.getElementById('endDate').value;
    let endTime = document.getElementById('endTime').value;

    if (!startDate || !endDate) {
        console.log('Missing start or end date.');
        return;
    }

    const startDayOfWeek = new Date(startDate).getDay();
    console.log(`Start date: ${startDate}, Day of week: ${startDayOfWeek} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][startDayOfWeek]})`);
    console.log(`Initial startTime: ${startTime}, endTime: ${endTime}`);

    // --- FRIDAY ALL DAY LOGIC ---
    // If start date is Friday and All Day is selected for start or end time, force endTime to 12:00
    if (startDayOfWeek === 5 && (startTime === "All Day" || endTime === "All Day")) {
        console.log('Friday and All Day selected. Overriding endTime to 12:00 PM.');
        endTime = "12:00";
    }

    const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
    const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);

    if (startDateTime > endDateTime) {
        showError('Start Date cannot be later than End Date.');
        console.log('Error: Start Date > End Date');
        return;
    }

    const now = new Date();
    if (now >= startDateTime && now <= endDateTime) {
        showSuccessMessage('The requested time-off is happening now.');
    }

    // --- TIME FORMATTING ---
    if (startTime === 'All Day') {
        startTime = '07:00 AM';
        console.log('Set startTime to 07:00 AM for All Day.');
    } else {
        startTime = convertToAMPM(startTime);
        console.log('Converted startTime:', startTime);
    }
    if (endTime === 'All Day') {
        endTime = '04:00 PM';
        console.log('Set endTime to 04:00 PM for All Day.');
    } else if (startDayOfWeek === 5 && endTime === "12:00") {
        endTime = "12:00 PM";
        console.log('Confirmed endTime as 12:00 PM for Friday All Day.');
    } else {
        endTime = convertToAMPM(endTime);
        console.log('Converted endTime:', endTime);
    }

    console.log('Final values:', {startDate, startTime, endDate, endTime});

    const nextIndex = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex();
    if (nextIndex > 10) {
        showError('No available index to store the new time-off request.');
        console.log('Error: No available index.');
        return;
    }

    const formData = {
        'Full Name': document.getElementById('employeeName').value,
        [`Time off Start Date ${nextIndex}`]: startDate,
        [`Time off Start Time ${nextIndex}`]: startTime,
        [`Time off End Date ${nextIndex}`]: endDate,
        [`Time off End Time ${nextIndex}`]: endTime,
        'Submit': true,
    };

    console.log('Sending formData to Airtable:', formData);

    sendToAirtable(formData);

    document.getElementById('startDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('endTime').value = '';

    currentEditingIndex = null;
    submitButton.textContent = 'Submit';

    fetchPreviousRequests(userEmail);
}


    
    function convertToAMPM(time) {
        const [hourString, minute] = time.split(':');
        let hour = parseInt(hourString, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${period}`;
    }

    async function displayPreviousRequests(records) {
        requestsList.innerHTML = '';
    
        if (records.length > 0) {
            previousRequestsContainer.classList.remove('hidden');
        } else {
            previousRequestsContainer.classList.add('hidden');
        }
    
        for (const record of records) {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off Start Date ${i}`] && record.fields[`Time off End Date ${i}`]) {
                    const recordItem = document.createElement('li');
                    recordItem.className = 'record';
    
                    const approved = record.fields[`Time off Approved ${i}`];
                    const approvedCheckbox = approved ? '<input type="checkbox" class="approved-checkbox" checked disabled>' : '';
                    const approvedText = approved ? '<p><strong>Approved:</strong>' : '';
    
                    // Ensure that the calculation is performed only when data is available
                    const { totalHoursMissed, percentageMissed } = calculateHoursMissed(
                        record.fields[`Time off Start Date ${i}`], 
                        record.fields[`Time off Start Time ${i}`] || '07:00', // Default to 7 AM if missing
                        record.fields[`Time off End Date ${i}`], 
                        record.fields[`Time off End Time ${i}`] || '16:00' // Default to 4 PM if missing
                    );
    
                    recordItem.innerHTML = `
<p><strong>Start Date:</strong> ${formatDate(record.fields[`Time off Start Date ${i}`])}</p>
                        <p><strong>Start Time:</strong> ${record.fields[`Time off Start Time ${i}`] || '07:00 AM'}</p>
<p><strong>End Date:</strong> ${formatDate(record.fields[`Time off End Date ${i}`])}</p>
                        <p><strong>End Time:</strong> ${record.fields[`Time off End Time ${i}`] || '04:00 PM'}</p>
                        <p><strong>Hours Missed:</strong> ${totalHoursMissed} hours</p>
                        ${approvedText}${approvedCheckbox}</p>
                        <button class="edit-button" data-index="${i}" data-id="${record.id}">Edit</button>
                        <button class="delete-button" data-index="${i}" data-id="${record.id}">Delete</button>`;
    
                    requestsList.appendChild(recordItem);
                }
            }
        }
    
        // Attach event listeners to the edit buttons
        attachEditListeners();
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteClick);
        });
    }
    function formatDate(dateString) {
        if (!dateString) {
            console.warn("formatDate: Received an empty date string.");
            return ''; // Handle empty dates
        }
    
        console.log("formatDate: Original date string from Airtable:", dateString);
    
        // Create a date object and ensure it's treated as UTC
        const date = new Date(dateString + "T00:00:00Z");
    
        // Extract UTC values (prevents timezone shifts)
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC' // 🔥 Ensures no timezone conversion!
        }).format(date);
    
        console.log("formatDate: Parsed Date object (UTC assumed):", date.toISOString());
        console.log("formatDate: Formatted output:", formattedDate);
    
        return formattedDate;
    }
    
    
    
    
    
    // Function to handle clicking the edit button
    function handleEditClick(event) {
        const index = event.target.dataset.index; // Get the index from the clicked button
        const id = event.target.dataset.id; // Get the record id from the clicked button
        const record = records.find(record => record.id === id); // Find the record in the list of records

        if (record) {
            // Fill form fields with the existing data for editing
            currentEditingIndex = index;
            document.getElementById('startDate').value = record.fields[`Time off Start Date ${index}`] || '';
            document.getElementById('startTime').value = convertTo24HourFormat(record.fields[`Time off Start Time ${index}`]) || '';
            document.getElementById('endDate').value = record.fields[`Time off End Date ${index}`] || '';
            document.getElementById('endTime').value = convertTo24HourFormat(record.fields[`Time off End Time ${index}`]) || '';

            document.getElementById('startDate').focus(); // Focus on the date input for quick editing
            submitButton.textContent = 'Submit Edit'; // Update the submit button text

            // Hide the previous requests container
            previousRequestsContainer.style.display = 'none';
        }
    }

    async function handleDeleteClick(event) {
        const index = event.target.dataset.index;
        const id = event.target.dataset.id;
        const record = records.find(record => record.id === id);
        if (record) {
            const confirmDelete = confirm('Are you sure you want to delete this request?');
            if (confirmDelete) {
                try {
                    const fieldsToDelete = {
                        [`Time off Start Date ${index}`]: null,
                        [`Time off Start Time ${index}`]: null,
                        [`Time off End Date ${index}`]: null,
                        [`Time off End Time ${index}`]: null,
                        [`Reason ${index}`]: null,
                        [`Time off Approved ${index}`]: null
                    };

                    const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${id}`;
                    const response = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ fields: fieldsToDelete })
                    });

                    if (response.ok) {
                        fetchPreviousRequests(localStorage.getItem('userEmail'));
                    } else {
                        const errorData = await response.json();
                        throw new Error(`Failed to delete fields: ${JSON.stringify(errorData)}`);
                    }
                } catch (error) {
                    console.error('Error deleting fields from Airtable:', error);
                }
            }
        }
    }

     // Function to show the previous requests container after form submit or enter key press
     function showPreviousRequests() {
        previousRequestsContainer.style.display = 'block'; // Show the previous requests container
    }

    // Add event listener for form submit
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit();
        showPreviousRequests(); // Show previous requests after submitting
    });

    // Add event listener for keydown to check for the Enter key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && form.contains(document.activeElement)) {
            event.preventDefault(); // Prevent default Enter key behavior
            handleFormSubmit();
            showPreviousRequests(); // Show previous requests after pressing Enter
        }
    });

       // Add event listeners to the edit buttons
       function attachEditListeners() {
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditClick);
        });
    }

    function convertTo24HourFormat(time) {
        const [timePart, period] = time.split(' ');
        let [hours, minutes] = timePart.split(':');
        hours = parseInt(hours, 10);
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    function displaySubmittedData(formData) {
        const index = currentEditingIndex !== null ? currentEditingIndex : getNextAvailableIndex() - 1;

        if (submittedStartDate) submittedStartDate.textContent = formData[`Time off Start Date ${index}`];
        if (submittedStartTime) submittedStartTime.textContent = formData[`Time off Start Time ${index}`];
        if (submittedEndDate) submittedEndDate.textContent = formData[`Time off End Date ${index}`];
        if (submittedEndTime) submittedEndTime.textContent = formData[`Time off End Time ${index}`];

        const daysOff = calculateBusinessDays(formData[`Time off Start Date ${index}`], formData[`Time off End Date ${index}`]);
        if (daysOffMessage) daysOffMessage.textContent = `Total days off (excluding weekends): ${daysOff}`;

        if (submittedData) submittedData.classList.remove('hidden');
    }

    function calculateBusinessDays(startDate, endDate) {
        let start = new Date(startDate);
        let end = new Date(endDate);
        let count = 0;
    
        while (start <= end) {
            let dayOfWeek = start.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
                count++;
            }
            start.setDate(start.getDate() + 1);
        }
    
        return count;
    }
    

    function handleLogout(event) {
        event.preventDefault();
        console.log('🔓 Logging out...');
    
        // Clear all relevant storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPassword'); // ✅ Also remove the password!
        sessionStorage.removeItem('user');
    
        // Optional: Clear all local/session storage if you want a full reset
        // localStorage.clear();
        // sessionStorage.clear();
    
        // Redirect to login screen
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }
    

    function calculateHoursMissed(startDate, startTime, endDate, endTime) {
        const workDayStart = 7; // 7:00 AM
        const workDayEnd = 16; // 4:00 PM
        const lunchBreak = 1; // 1-hour lunch
        const workHoursPerDay = (workDayEnd - workDayStart) - lunchBreak; // 7 working hours per full workday
    
        // Convert to DateTime Objects
        const startDateTime = new Date(`${startDate}T${convertTo24HourFormat(startTime)}:00`);
        const endDateTime = new Date(`${endDate}T${convertTo24HourFormat(endTime)}:00`);
    
        let totalHoursMissed = 0;
        let currentDate = new Date(startDateTime);
        
        while (currentDate <= endDateTime) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
                let dayStart = new Date(currentDate);
                dayStart.setHours(workDayStart, 0, 0); // Set to 7:00 AM
    
                let dayEnd = new Date(currentDate);
                dayEnd.setHours(workDayEnd, 0, 0); // Set to 4:00 PM
    
                if (currentDate.toDateString() === startDateTime.toDateString() && currentDate.toDateString() === endDateTime.toDateString()) {
                    // Single-day partial leave
                    let missedHours = Math.max(0, (endDateTime - startDateTime) / (1000 * 60 * 60));
                    totalHoursMissed += Math.min(missedHours, workHoursPerDay);
                } else if (currentDate.toDateString() === startDateTime.toDateString()) {
                    // First day - partial leave
                    let missedHours = Math.max(0, (dayEnd - startDateTime) / (1000 * 60 * 60));
                    totalHoursMissed += Math.min(missedHours, workHoursPerDay);
                } else if (currentDate.toDateString() === endDateTime.toDateString()) {
                    // Last day - partial leave
                    let missedHours = Math.max(0, (endDateTime - dayStart) / (1000 * 60 * 60));
                    totalHoursMissed += Math.min(missedHours, workHoursPerDay);
                } else {
                    // Full workday off
                    totalHoursMissed += workHoursPerDay;
                }
            }
    
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Calculate total work hours in period
        let totalWorkingDays = 0;
        let tempDate = new Date(startDateTime);
        while (tempDate <= endDateTime) {
            if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) {
                totalWorkingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
    
        let totalWorkingHours = totalWorkingDays * workHoursPerDay;
        let percentageMissed = totalWorkingHours > 0 ? ((totalHoursMissed / totalWorkingHours) * 100).toFixed(2) : 0;
    
        return {
            totalHoursMissed,
            percentageMissed
        };
    }
    
        
        // ✅ Convert "7:00 AM" → "07:00" (24-hour format)
        function convertTo24HourFormat(time) {
            const [hourString, minute] = time.split(':');
            let [hours, minutes] = minute.split(' ');
            hours = parseInt(hourString, 10);
            if (minutes.includes('PM') && hours < 12) {
                hours += 12;
            } else if (minutes.includes('AM') && hours === 12) {
                hours = 0;
            }
            return `${hours.toString().padStart(2, '0')}:${minute.split(' ')[0]}`;
        }
        

    async function deleteExpiredRecords(records) {
        const now = new Date();
        const expiredRecords = records.filter(record => {
            return Object.keys(record.fields).some(field => {
                if (field.startsWith('Time off End Date ') && record.fields[field]) {
                    const endDate = new Date(record.fields[field]);
                    const endTimeField = field.replace('Date', 'Time');
                    const endTime = record.fields[endTimeField];
                    if (endTime) {
                        const [hours, minutes] = endTime.split(':');
                        endDate.setHours(hours, minutes);
                    }
                    return endDate < now;
                }
                return false;
            });
        });

        for (const record of expiredRecords) {
            for (let i = 1; i <= 10; i++) {
                if (record.fields[`Time off End Date ${i}`]) {
                    try {
                        const fieldsToDelete = {
                            [`Time off Start Date ${i}`]: null,
                            [`Time off Start Time ${i}`]: null,
                            [`Time off End Date ${i}`]: null,
                            [`Time off End Time ${i}`]: null,
                            [`Reason ${i}`]: null,
                            [`Time off Approved ${i}`]: null
                        };

                        const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${record.id}`;
                        const response = await fetch(url, {
                            method: 'PATCH',
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ fields: fieldsToDelete })
                        });

                        if (response.ok) {
                            console.log('Expired fields deleted successfully');
                        } else {
                            const errorData = await response.json();
                            throw new Error(`Failed to delete expired fields: ${JSON.stringify(errorData)}`);
                        }
                    } catch (error) {
                        console.error('Error deleting expired fields from Airtable:', error);
                    }
                }
            }
        }
    }

    setInterval(() => {
        fetchPreviousRequests(userEmail).then(() => {
            deleteExpiredRecords(records);
        });
    }, 24 * 60 * 60 * 1000);

    fetchPreviousRequests(userEmail).then(() => {
        deleteExpiredRecords(records);
    });

    function convertTimeToTextInput(inputId) {
        const input = document.getElementById(inputId);
        let isTextInput = false;
        input.addEventListener('dblclick', () => {
            if (!isTextInput) {
                input.type = 'text';
                input.value = 'All Day';
                isTextInput = true;
            } else {
                input.type = 'time';
                input.value = '';
                isTextInput = false;
            }
        });
        input.addEventListener('click', () => {
            if (input.type === 'time') {
                input.showPicker();
            }
        });
    }

    convertTimeToTextInput('startTime');
    convertTimeToTextInput('endTime');

    function showDatePicker(inputId) {
        const input = document.getElementById(inputId);
        input.addEventListener('click', () => {
            input.showPicker();
        });
    }

    showDatePicker('startDate');
    showDatePicker('endDate');

    function showSuccessMessage(message) {
        submissionStatus.textContent = message;
        submissionStatus.classList.remove('hidden');
        submissionStatus.classList.add('success');
    }

    function showError(message) {
        submissionStatus.textContent = message;
        submissionStatus.classList.remove('hidden');
        submissionStatus.classList.add('error');
    }
});