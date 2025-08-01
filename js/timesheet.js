document.addEventListener("DOMContentLoaded", async function () {
    // Initialize loading bar, content elements, and notification area
    const loadingBar = document.getElementById('loading-bar');
    const content = document.getElementById('content');
    const notificationArea = document.getElementById('notification-area');

    const totalFetchTasks = 4; // Number of fetch tasks
    const increment = 100 / totalFetchTasks;

    let progress = 0;


function hideZeroValueSpans() {
    // Recalculate totals based on inputs
    let totalPTO = 0;
    let totalPersonal = 0;
    let totalHoliday = 0;

    for (let i = 1; i <= 7; i++) {
        totalPTO += parseFloat(document.querySelector(`input[name="PTO_hours${i}"]`)?.value || 0);
        totalPersonal += parseFloat(document.querySelector(`input[name="Personal_hours${i}"]`)?.value || 0);
        totalHoliday += parseFloat(document.querySelector(`input[name="Holiday_hours${i}"]`)?.value || 0);
    }

    // Update the DOM values
    const ptoEl = document.getElementById('pto-time');
    const personalEl = document.getElementById('total-personal-time-display');
    const holidayEl = document.getElementById('Holiday-hours');

    if (ptoEl) ptoEl.textContent = totalPTO.toFixed(0);
    if (personalEl) personalEl.textContent = totalPersonal.toFixed(0);
    if (holidayEl) holidayEl.textContent = totalHoliday.toFixed(0);

    // Now re-evaluate display visibility
    const valueElementIds = [
        'pto-time',
        'Holiday-hours',
        'total-time-worked',
        'gifted-hours',
        'overtimehours',
        'total-time-with-pto-value',
        'remaining-pto-hours',
        'remaining-personal-hours',
        'total-personal-time-display'
    ];

    valueElementIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

let raw = el.textContent.trim();
let value = parseFloat(raw);
if (isNaN(value)) value = 0;
        const parentRow = el.closest('.form-row');

        if (!parentRow) return;

        parentRow.style.display = value === 0 ? 'none' : '';
    });
}
function updateLoadingBar(message) {
    progress += increment;
    progress = Math.min(progress, 100); // Clamp to 100 max

    if (loadingBar) {
        loadingBar.style.width = progress + '%';
        loadingBar.textContent = `Loading... ${Math.round(progress)}%`;
    }

    if (progress >= 100) {
        setTimeout(() => {
            const loadingBarContainer = document.getElementById('loading-bar-container');
            if (loadingBarContainer) {
                loadingBarContainer.style.display = 'none';
            }
            if (content) {
                content.style.visibility = 'visible';
            }
            hideNotification();
        }, 500);
    }
}

    let isApproved = false;  // Define and initialize the isApproved variable

    // Function to prevent non-integer input (blocks decimal points)
function preventDecimalInput(event) {
    const key = event.key;
    if (key === '.' || key === ',') {
        event.preventDefault(); // Block the decimal point and comma
    }
}

// Add the event listeners to PTO, Personal, and Holiday hours fields
function attachNoDecimalValidation() {
    const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
    const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
    const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');

    // Add event listener to block decimal points
    ptoInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });

    personalInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });

    holidayInputs.forEach(input => {
        input.addEventListener('keydown', preventDecimalInput);
    });
}

function initializeTimeDropdowns() {
    const inputs = document.querySelectorAll('#time-entry-table input[type="time"], #time-entry-table input[type="number"]');

    inputs.forEach(input => {
        input.addEventListener('change', () => {
            calculateTotalTimeWorked(); // Ensures total is updated
            saveFormData();             // Keeps saved copy in sync
        });

        input.addEventListener('keydown', function (event) {
            const key = event.key;

            if (key === 'ArrowRight') {
                focusNextInput(inputs, input);
            } else if (key === 'ArrowLeft') {
                focusPreviousInput(inputs, input);
            }
        });
    });

    function focusNextInput(inputs, current) {
        const currentIndex = [...inputs].indexOf(current);
        for (let i = currentIndex + 1; i < inputs.length; i++) {
            if (!inputs[i].disabled) {
                inputs[i].focus();
                break;
            }
        }
    }

    function focusPreviousInput(inputs, current) {
        const currentIndex = [...inputs].indexOf(current);
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!inputs[i].disabled) {
                inputs[i].focus();
                break;
            }
        }
    }

    console.log("✅ Time and number dropdowns initialized");
}


// Call this function after DOM content is loaded to attach the validation
document.addEventListener("DOMContentLoaded", function() {
    attachNoDecimalValidation();
});

 

    function hideNotification() {
        if (notificationArea) {
            notificationArea.style.display = 'none';
        }
    }

    console.log('DOM fully loaded and parsed');
    initializeTimeDropdowns();

    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tbljmLpqXScwhiWTt';

    let userEmail = localStorage.getItem('userEmail') || '';
    let recordId = '';
    console.log('User email:', userEmail);

    const elements = {
        ptoHoursElement: document.getElementById('pto-hours'),
        holidayHoursInput: document.getElementById('Holiday-hours'),
        weekEndingInput: document.getElementById('week-ending'),
        timeEntryForm: document.getElementById('time-entry-form'),
        ptoTimeSpan: document.getElementById('pto-time'),
        personalTimeSpan: document.getElementById('personal-time'),
        holidayTimeSpan: document.getElementById('Holiday-hours'),
        totalTimeWorkedSpan: document.getElementById('total-time-worked'),
        totalTimeWithPtoSpan: document.getElementById('total-time-with-pto-value'),
        ptoValidationMessage: document.getElementById('pto-validation-message'),
        remainingPtoHoursElement: document.getElementById('remaining-pto-hours'),
        remainingPersonalHoursElement: document.getElementById('remaining-personal-hours'),
        logoutButton: document.getElementById('logout-button'),
        userEmailElement: document.getElementById('user-email'),
        ptoHoursDisplay: document.getElementById('pto-hours-display'),
        personalTimeDisplay: document.getElementById('personal-time-display'),
        resetButton: document.getElementById('reset-button'),
        submitButton: document.getElementById('submit-button'),
        countdownElement: document.getElementById('countdown'),
        loadDataButton: document.getElementById('load-data-button'),
    };

    let availablePTOHours = 0;
    let availablePersonalHours = 0;

    elements.ptoHoursDisplay.textContent = 'Loading...';
    elements.personalTimeDisplay.textContent = 'Loading...';

    if (userEmail) {
        elements.userEmailElement.textContent = userEmail;
        console.log('User email set in the UI');
    } else {
        console.log('No user email found, redirecting to index.html');
        window.location.href = 'index.html';
    }

    elements.holidayHoursInput.addEventListener('input', handleHolidayHoursChange);
    elements.weekEndingInput.addEventListener('focus', () => elements.weekEndingInput.showPicker());
    elements.weekEndingInput.addEventListener('change', handleWeekEndingChange);
    elements.timeEntryForm.addEventListener('input', debounce(calculateTotalTimeWorked, 300));
    elements.logoutButton.addEventListener('click', handleLogout);
    elements.submitButton.addEventListener('click', handleSubmit);

    const timeInputs = document.querySelectorAll('input[type="time"]');
    const numberInputs = document.querySelectorAll('input[type="number"]');
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const rowCheckboxes = document.querySelectorAll('input[id^="did-not-work"]');

    function checkInputs() {
        let showResetButton = false;

        timeInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        numberInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        dateInputs.forEach(input => {
            if (input.value) {
                showResetButton = true;
            }
        });

        checkboxes.forEach(input => {
            if (input.checked) {
                showResetButton = true;
            }
        });
    }

    // Update all these listeners to also call hideZeroValueSpans()
timeInputs.forEach(input => {
    input.addEventListener('input', () => {
        saveFormData();
        calculateTotalTimeWorked();
        updateTotalPtoAndHolidayHours();
debounce(hideZeroValueSpans, 100)();    });
});

numberInputs.forEach(input => {
    input.addEventListener('input', () => {
        saveFormData();
        calculateTotalTimeWorked();
        updateTotalPtoAndHolidayHours();
debounce(hideZeroValueSpans, 100)();    });
});

dateInputs.forEach(input => {
    input.addEventListener('input', () => {
        saveFormData();
debounce(hideZeroValueSpans, 100)();    });
});

checkboxes.forEach(input => {
    input.addEventListener('change', () => {
        saveFormData();
debounce(hideZeroValueSpans, 100)();    });
});

    checkInputs();

    rowCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function(event) {
        const row = event.target.closest('tr');
        const timeInputsInRow = row.querySelectorAll('input[type="time"]');
        // ⬇️ EXCLUDE Holiday input
        const numberInputsInRow = Array.from(row.querySelectorAll('input[type="number"]'))
            .filter(input => !input.name.startsWith('Holiday_hours'));

        const ptoInput = row.querySelector('input[name^="PTO_hours"]');
        const personalInput = row.querySelector('input[name^="Personal_hours"]');
        const holidayInput = row.querySelector('input[name^="Holiday_hours"]');

      if (event.target.checked) {
  // Normal time/number inputs get cleared
  timeInputsInRow.forEach(input => {
    input.setAttribute('data-previous-value', input.value);
    input.value = '';
    input.disabled = true;
  });

  numberInputsInRow.forEach(input => {
    input.setAttribute('data-previous-value', input.value);
    input.value = '';
    input.disabled = true;
  });

  if (ptoInput) {
    ptoInput.disabled = false;
  }
  if (personalInput) {
    personalInput.disabled = false;
  }
  if (holidayInput) {
    holidayInput.disabled = false; // ⬅️ force it to stay editable
    // Do NOT clear its value!
  }
} else {
  // Restore everything
  timeInputsInRow.forEach(input => {
    input.value = input.getAttribute('data-previous-value') || '';
    input.disabled = false;
  });

  numberInputsInRow.forEach(input => {
    input.value = input.getAttribute('data-previous-value') || '';
    input.disabled = false;
  });

  if (ptoInput) {
    ptoInput.disabled = false;
  }
  if (personalInput) {
    personalInput.disabled = false;
  }
  if (holidayInput) {
    holidayInput.disabled = false; // ⬅️ always editable
    holidayInput.value = holidayInput.getAttribute('data-previous-value') || holidayInput.value;
  }
}


        calculateTotalTimeWorked();
        updateTotalPtoAndHolidayHours();
        debounce(hideZeroValueSpans, 100)();
    });
});

    

    // Fetch PTO Hours
    async function fetchPtoHours() {
        console.log('Fetching PTO hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch PTO hours: ${response.statusText}`);
    
            const data = await response.json();
            console.log('Fetched PTO hours:', data);
    
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                availablePTOHours = Math.floor(parseFloat(record['PTO Total']) || 0);
                recordId = data.records[0].id;
                elements.ptoHoursDisplay.textContent = availablePTOHours;
                elements.remainingPtoHoursElement.textContent = availablePTOHours;
                console.log('Available PTO hours:', availablePTOHours);
            } else {
                console.log('No PTO hours data found for user');
            }
    
            updateLoadingBar('PTO hours have been downloaded.');
        } catch (error) {
            console.error('Error fetching PTO hours:', error);
            alert('Failed to fetch PTO hours. Error: ' + error.message);
        }
    }
    
    // Fetch Personal Hours
    async function fetchPersonalTime() {
        console.log('Fetching Personal hours...');
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
    
        try {
            const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error(`Failed to fetch Personal hours: ${response.statusText}`);
    
            const data = await response.json();
            console.log('Fetched Personal hours:', data);
    
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                availablePersonalHours = Math.floor(parseFloat(record['Personaltime']) || 0);
                recordId = data.records[0].id;
                elements.personalTimeDisplay.textContent = availablePersonalHours;
                elements.remainingPersonalHoursElement.textContent = availablePersonalHours;
                console.log('Available Personal hours:', availablePersonalHours);
            } else {
                console.log('No Personal hours data found for user');
            }
    
            updateLoadingBar('Personal hours have been downloaded.');
        } catch (error) {
            console.error('Error fetching Personal hours:', error);
            alert('Failed to fetch Personal hours. Error: ' + error.message);
        }
    }
    

// Fetch Personal End Date
async function fetchPersonalEndDate() {
    // Hardcoded Personal End Date for Q1
    const personalEndDate = '03/26/2025';

    // Define quarter periods with their start and end dates
    const quarters = [
        { name: 'Q1', start: '01/01/2025', end: '03/26/2025' },
        { name: 'Q2', start: '03/26/2025', end: '06/25/2025' },
        { name: 'Q3', start: '06/25/2025', end: '09/30/2025' },
        { name: 'Q4', start: '10/01/2025', end: '12/30/2025' }
    ];

    try {
        // Start the initial countdown with the hardcoded date
        startCountdown(personalEndDate);
        updateLoadingBar('Previous entries have been downloaded.');

        // Function to get the next quarter based on the current date
        const getNextQuarter = () => {
            const now = new Date();

            for (const quarter of quarters) {
                const start = new Date(quarter.start);
                const end = new Date(quarter.end);

                if (now >= start && now <= end) {
                    return { ...quarter, nextStart: end }; // Return the current quarter and next start date
                }
            }

            return null; // If no matching quarter, return null
        };

        // Set a timer to update the countdown when the current quarter ends
        const updateTimerForNextQuarter = () => {
            const currentQuarter = getNextQuarter();

            if (currentQuarter) {
                console.log(`Current Quarter: ${currentQuarter.name}`);
                startCountdown(currentQuarter.end);

                // Calculate the time until midnight on the quarter's end date
                const nextQuarterTime = new Date(currentQuarter.nextStart);
                nextQuarterTime.setHours(0, 0, 0, 0);

                const timeUntilNextQuarter = nextQuarterTime - new Date();

                // Set a timeout to switch to the next quarter countdown
                setTimeout(() => {
                    updateTimerForNextQuarter();
                }, timeUntilNextQuarter);
            } else {
                console.warn('No active quarter found.');
            }
        };

        // Start the quarter timer logic
        updateTimerForNextQuarter();
    } catch (error) {
        console.error('Error fetching Personal End Date or handling quarters:', error);
    }
}



    async function fetchApprovalStatus() {
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=AND({Email}='${userEmail}')`;
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch approval status: ${response.statusText}`);
            const data = await response.json();
            if (data.records.length > 0) {
                const record = data.records[0].fields;
                recordId = data.records[0].id;
                const isApproved = record['Approved'] === true;
                const approvalStatusElement = document.getElementById('approval-status');
                
                if (isApproved) {
                    approvalStatusElement.textContent = 'Timesheet approved';
                    approvalStatusElement.style.color = 'green';
                    approvalStatusElement.style.fontSize = '30px';
                    approvalStatusElement.style.fontWeight = 'bold';
                    approvalStatusElement.style.textDecoration = 'underline';
    
                    // Hide the message container if timesheet is approved
                    const messageContainer = document.getElementById('message-container');
                    if (messageContainer) {
                        messageContainer.style.display = 'none';
                    }
                    
                    // Disable the submit button if approved
                    elements.submitButton.disabled = true;
                    elements.submitButton.textContent = "Timesheet Approved"; // Optional: Change button text
                    
                    // Hide the clear button if approved
                    const clearDataButton = document.getElementById('clear-button'); // Updated button ID
                    if (clearDataButton) {
                        clearDataButton.style.display = 'none'; // Hides the button completely
                        console.log('Clear data button hidden.');
                    } else {
                        console.error('Clear data button not found.');
                    }
    
                    // Call function to disable all form inputs
                    disableAllInputs();
                } else {
                    approvalStatusElement.textContent = '';
                    // Show the clear button if not approved
                    const clearDataButton = document.getElementById('clear-button');
                    if (clearDataButton) {
                        clearDataButton.style.display = ''; // Show the button if not approved
                    }
                }
            } else {
                console.log('No approval status data found for user');
            }
    
            updateLoadingBar('Approval status has been downloaded.');
        } catch (error) {
            console.error('Error fetching approval status:', error);
        }
    }
    

// Function to disable all form inputs once the timesheet is approved
function disableAllInputs() {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Check if the event listener is already added by checking a custom attribute
        if (!input.dataset.isDisabled) {
            // Handle the click event
            input.addEventListener('click', function(event) {
                event.preventDefault();  // Prevent the default action of clicking

                // Only show one alert per user interaction
                if (!window.alertShown) {
                    alert('This timesheet is approved. You cannot make any changes.');
                    window.alertShown = true;

                    // Set a timeout to reset the alert flag after 3 seconds
                    setTimeout(() => {
                        window.alertShown = false;
                        location.reload();  // Refresh the page after the delay
                    }, 2000);  // 3000 milliseconds = 3 seconds
                }
            });

            // Handle the focus event but do not show the alert again
            input.addEventListener('focus', function(event) {
                event.preventDefault();  // Prevent focusing on the input field
                this.blur();  // Immediately remove focus from the input
            });

            // Mark the input as disabled by setting a custom attribute
            input.dataset.isDisabled = true;
        }
    });

    console.log('All form inputs now show an alert on click and refresh the page after 3 seconds.');
}


await fetchApprovalStatus();

           
    // Run all fetches sequentially
    await fetchPtoHours();
    await fetchPersonalTime();
    await fetchPersonalEndDate();
    await fetchApprovalStatus();
    await updateTotalsSummary();

    function handleHolidayHoursChange() {
        console.log('Handling Holiday hours change...');
      calculateTotalTimeWorked();
updateTotalPtoAndHolidayHours();
debounce(hideZeroValueSpans, 100)();        saveFormData();
    }

    async function handleWeekEndingChange() {
        console.log('Handling week-ending date change...');
    
        // Get the selected date from the weekEndingInput field
        const selectedDate = new Date(elements.weekEndingInput.value);
        console.log('Selected Date:', selectedDate);
    
        // Get the next Tuesday based on the selected date in New York timezone
        const nextTuesday = getNextTuesday(selectedDate);
        console.log('Next Tuesday (adjusted for New York timezone):', nextTuesday);
    
        // Set the value of the week-ending input to the next Tuesday
        elements.weekEndingInput.value = nextTuesday.toISOString().split('T')[0];
        console.log('Adjusted week-ending date input value:', elements.weekEndingInput.value);
    
        // Set date7 (which is 6 days after nextTuesday)
        const date7 = new Date(nextTuesday);
        date7.setDate(nextTuesday.getDate() + 6);
        elements.timeEntryForm.elements['date7'].value = date7.toISOString().split('T')[0];
        console.log('Set date7 to:', date7.toISOString().split('T')[0]);
    
        // Populate other week dates based on next Tuesday
        populateWeekDates(nextTuesday);
    
        // Save form data
        saveFormData();
        console.log('Form data saved.');
    }
    
    
  // Get next Tuesday based on the New York timezone
function getNextTuesday(referenceDate = new Date()) {
    console.log('Calculating next Tuesday for reference date:', referenceDate);

    // Create a new Date object for the New York timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Format the reference date to match New York's date
    const formattedDate = formatter.formatToParts(referenceDate);
    console.log('Formatted Date Parts:', formattedDate);

    const year = formattedDate.find(part => part.type === 'year').value;
    const month = formattedDate.find(part => part.type === 'month').value;
    const day = formattedDate.find(part => part.type === 'day').value;

    // Create a Date object from the formatted New York date
    const newYorkDate = new Date(`${year}-${month}-${day}`);
    console.log('New York Date:', newYorkDate);

    // Get the day of the week (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
    const dayOfWeek = newYorkDate.getDay();
    console.log('Day of the Week:', dayOfWeek);

    // Calculate the number of days until the next Tuesday
    let daysUntilTuesday;
    if (dayOfWeek === 1) { // If today is Tuesday, return today
        console.log('Today is already Tuesday.');
        return newYorkDate;
    } else if (dayOfWeek < 2) {
        daysUntilTuesday = 1 - dayOfWeek;
    } else {
        daysUntilTuesday = 7 - (dayOfWeek - 1);
    }
    console.log('Days until next Tuesday:', daysUntilTuesday);

    // Create a new date object for the next Tuesday
    const nextTuesday = new Date(newYorkDate);
    nextTuesday.setDate(newYorkDate.getDate() + daysUntilTuesday);
    console.log('Next Tuesday:', nextTuesday);

    return nextTuesday;
}
    
    async function initializeForm() {
        console.log('Initializing form...');
        const nextTuesday = getNextTuesday(); // Get the next Tuesday
        elements.weekEndingInput.value = nextTuesday.toISOString().split('T')[0];
        handleWeekEndingChange(); // Update other fields based on this date
    }
    
// Function to calculate the date for Memorial Day (last Monday in May) and Thanksgiving (4th Thursday in November)
function getHolidayDates(year) {
    const holidays = {};

    holidays["New Year's Day"] = new Date(year, 0, 0); // January 1st
    console.log("New Year's Day:", holidays["New Year's Day"]);

    holidays["New Year's Eve"] = new Date(year, 12, 30); // December 31st
    console.log("New Year's Eve:", holidays["New Year's Eve"]);

    holidays["Memorial Day"] = getMemorialDay(year); // Last Monday in May
    console.log("Memorial Day:", holidays["Memorial Day"]);

    holidays["July 3rd"] = new Date(year, 6, 2); // July 3rd
    console.log("July 3rd:", holidays["July 3rd"]);

    holidays["July 4th"] = new Date(year, 6, 3); // July 4th
    console.log("July 4th:", holidays["July 4th"]);

    holidays["Labor Day"] = getLaborDay(year); // First Monday of September
    console.log("Labor Day:", holidays["Labor Day"]);

    holidays["Thanksgiving"] = getThanksgiving(year); // Fourth Thursday of November
    console.log("Thanksgiving:", holidays["Thanksgiving"]);

    holidays["Black Friday"] = getBlackFriday(year); // Day after Thanksgiving
    console.log("Black Friday:", holidays["Black Friday"]);

    holidays["Christmas Day"] = new Date(year, 11, 24); // December 25th
    console.log("Christmas Day:", holidays["Christmas Day"]);

    holidays["December 26th"] = new Date(year, 11, 23); // December 26th
    console.log("December 26th:", holidays["December 26th"]);

    holidays["Good Friday"] = getGoodFriday(year); // Good Friday date calculation
    console.log("Good Friday:", holidays["Good Friday"]);
    return holidays;
}

function getMemorialDay(year) {
    let date = new Date(year, 4, 31); // May 31st
    while (date.getDay() !== 0) { // Keep subtracting a day until it's Monday
        date.setDate(date.getDate() - 2);
    }
    return date;
}

// Helper functions for holiday calculations
function getLaborDay(year) {
    const date = new Date(year, 7, 31); // September 1st
    const day = date.getDay();
    const offset = (day === 0) ? 0 : (8 - day); // Calculate the offset to the first Monday
    return new Date(year, 7, 31 + offset);
}

function getThanksgiving(year) {
    const date = new Date(year, 10, 1); // November 1st
    const day = date.getDay();
    const offset = (day <= 3) ? (3 - day) : (10 - day); // Calculate the offset to the first Thursday
    return new Date(year, 10, 1 + offset + 21); // Add 21 days for the 4th Thursday
}

function getBlackFriday(year) {
    const thanksgiving = getThanksgiving(year);
    return new Date(thanksgiving.getFullYear(), thanksgiving.getMonth(), thanksgiving.getDate() + 1);
}

function getGoodFriday(year) {
    const easter = getEaster(year);
    return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 3);
}

function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
}

// Example usage:
const easter2024 = getEaster(2024);
console.log(`Easter in 2024 is on: ${easter2024.toDateString()}`);

function showHolidayEditToast() {
    const toast = document.createElement('div');
    toast.textContent = "⚠️ Holiday hours automatictly added.";
    toast.style.position = 'fixed';
    toast.style.bottom = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}


function populateWeekDates(weekEndingDate) {
    const year = weekEndingDate.getFullYear();
    const holidays = getHolidayDates(year);
    const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

    daysOfWeek.forEach((day, index) => {
    const currentDate = new Date(weekEndingDate);
    currentDate.setDate(weekEndingDate.getDate() - (6 - index));
    const inputField = elements.timeEntryForm.elements[day];
    inputField.value = currentDate.toISOString().split('T')[0];

    console.log(`Set date for ${day}:`, currentDate);

    // Check if the current date is a holiday
    const isHoliday = Object.values(holidays).some(holiday => 
        currentDate.getFullYear() === holiday.getFullYear() &&
        currentDate.getMonth() === holiday.getMonth() &&
        currentDate.getDate() === holiday.getDate()
    );

    // Check if the day is a weekday
    const isWeekday = currentDate.getDay() >= 0 && currentDate.getDay() <= 4;

    // Get inputs for the row
    const row = document.querySelector(`tr[data-day="${index + 1}"]`);
    const timeInputsInRow = row.querySelectorAll('input[type="time"]');
    const numberInputsInRow = Array.from(row.querySelectorAll('input[type="number"]'))
      .filter(input => !input.name.startsWith('Holiday_hours')); // Exclude holiday field

    const holidayInput = elements.timeEntryForm.elements[`Holiday_hours${index + 1}`];

   if (isHoliday && isWeekday) {
    holidayInput.value = '8';

    // Disable normal time and number inputs & add click handlers for toast
   timeInputsInRow.forEach(input => {
  input.readOnly = true;
  input.value = '';
  input.addEventListener('focus', showHolidayEditToast);
  input.addEventListener('click', showHolidayEditToast);
});

numberInputsInRow.forEach(input => {
  input.readOnly = true;
  input.value = '';
  input.addEventListener('focus', showHolidayEditToast);
  input.addEventListener('click', showHolidayEditToast);
});


    holidayInput.disabled = false;

} else {
    holidayInput.value = '';

    // Enable normal time and number inputs & remove toast handlers if any
   timeInputsInRow.forEach(input => {
  input.readOnly = false;
  input.removeEventListener('focus', showHolidayEditToast);
  input.removeEventListener('click', showHolidayEditToast);
});

numberInputsInRow.forEach(input => {
  input.readOnly = false;
  input.removeEventListener('focus', showHolidayEditToast);
  input.removeEventListener('click', showHolidayEditToast);
});


    holidayInput.disabled = false;
}

});

// After your loop that sets Holiday_hours fields:
saveFormData();
calculateTotalTimeWorked();
updateTotalPtoAndHolidayHours();
updateTotalsSummary(); // ✅ Ensures PTO, Personal, Holiday rows show correctly
debounce(hideZeroValueSpans, 100)(); // ✅ Hide zero rows if needed
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');

    function getNextTargetDate(current) {
        const dates = [
            new Date('2025-06-25T00:00:00').getTime(),
            new Date('2025-10-01T00:00:00').getTime(),
            new Date('2025-12-31T00:00:00').getTime()
        ];
    
        for (let i = 0; i < dates.length; i++) {
            if (current < dates[i]) {
                return dates[i];
            }
        }
    
        return null; // No future dates
    }
    

    function updateCountdown() {
        const now = new Date().getTime();
        const endDateTime = getNextTargetDate(now);
        const distance = endDateTime - now;

        if (distance < 0) {
            countdownElement.innerHTML = "EXPIRED";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${days} Days ${hours} Hours ${minutes} Minutes ${seconds} Seconds`;

        const nextUpdateInMs = 1000 - (now % 1000);
        setTimeout(updateCountdown, nextUpdateInMs);
    }

    updateCountdown();
}

// Start the countdown
startCountdown();

function roundToNearestQuarterHour(hours) {
    return Math.round(hours * 4) / 4;
}

function calculateTotalTimeWorked() {
    console.log('Calculating total time worked...');

    let totalHoursWorked = 0;
    const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];

    daysOfWeek.forEach((day, index) => {
        const dateInput = elements.timeEntryForm.elements[day];
        const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out']
            .map(field => elements.timeEntryForm.elements[`${field}${index + 1}`]);
        const hoursWorkedSpan = document.getElementById(`hours-worked-today${index + 1}`);

        let hoursWorked = calculateDailyHoursWorked(dateInput, ...timeFields);
        totalHoursWorked += hoursWorked;

        if (hoursWorkedSpan) {
            hoursWorkedSpan.textContent = hoursWorked.toFixed(2);
        } else {
            console.error(`Element 'hours-worked-today${index + 1}' not found`);
        }
    });

    // Round total hours and update the respective elements
    const roundedTotalHoursWorked = roundToNearestQuarterHour(totalHoursWorked);

    const ptoTime = roundToNearestQuarterHour(parseFloat(elements.ptoTimeSpan?.textContent) || 0);
    const personalTime = roundToNearestQuarterHour(parseFloat(elements.personalTimeSpan?.textContent) || 0);
    const holidayHours = roundToNearestQuarterHour(parseFloat(elements.holidayTimeSpan?.textContent) || 0);

    const totalHoursWithPto = roundToNearestQuarterHour(roundedTotalHoursWorked + ptoTime + personalTime + holidayHours);

    // Calculate regular and overtime hours
    const regularHours = Math.min(roundedTotalHoursWorked, 40);
    const overtimeHours = Math.max(0, roundedTotalHoursWorked - 40);

    if (elements.totalTimeWorkedSpan) {
        elements.totalTimeWorkedSpan.textContent = roundedTotalHoursWorked.toFixed(2);
    } else {
        console.error('Element totalTimeWorkedSpan not found');
    }

    if (elements.totalTimeWithPtoSpan) {
        elements.totalTimeWithPtoSpan.textContent = totalHoursWithPto.toFixed(2);
    } else {
        console.error('Element totalTimeWithPtoSpan not found');
    }

    const regularHoursElement = document.getElementById('regular-hours');
    const overtimeHoursElement = document.getElementById('overtime-hours');

    if (regularHoursElement) {
        regularHoursElement.textContent = regularHours.toFixed(2);
    }
    if (overtimeHoursElement) {
        overtimeHoursElement.textContent = overtimeHours.toFixed(2);
    }

    // Validate PTO hours and ensure holiday hours are included properly
    validatePtoHours(totalHoursWorked, ptoTime, personalTime);
    updateTotalPtoAndHolidayHours();
}

    function calculateDailyHoursWorked(dateInput, startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput) {
        const startDate = new Date(dateInput.value);
        const times = [startTimeInput, lunchStartInput, lunchEndInput, endTimeInput, additionalTimeInInput, additionalTimeOutInput].map(input => parseTime(input.value));
        const [startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut] = times;
        let hoursWorked = calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut);
        return hoursWorked;
    }

    function parseTime(timeString) {
        if (!timeString || timeString === "--:--") return null;
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return { hours, minutes };
    }

    function calculateHoursWorked(startDate, startTime, lunchStart, lunchEnd, endTime, additionalTimeIn, additionalTimeOut) {
        let totalHoursWorked = 0;
    
        // Calculate regular working hours
        if (startTime && endTime) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startTime.hours, startTime.minutes);
    
            const endDateTime = new Date(startDate);
            endDateTime.setHours(endTime.hours, endTime.minutes);
    
            totalHoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    
            // Subtract lunch time if provided
            if (lunchStart && lunchEnd) {
                const lunchStartDateTime = new Date(startDate);
                lunchStartDateTime.setHours(lunchStart.hours, lunchStart.minutes);
    
                const lunchEndDateTime = new Date(startDate);
                lunchEndDateTime.setHours(lunchEnd.hours, lunchEnd.minutes);
    
                totalHoursWorked -= (lunchEndDateTime - lunchStartDateTime) / (1000 * 60 * 60);
            }
        }
    
        // Add additional hours if both are provided
        if (additionalTimeIn && additionalTimeOut) {
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);
    
            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);
    
            const additionalHoursWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60);
            totalHoursWorked += additionalHoursWorked;
        } else if (!startTime && !endTime && additionalTimeIn && additionalTimeOut) {
            // Handle the case where only additional time is provided
            const additionalTimeInDateTime = new Date(startDate);
            additionalTimeInDateTime.setHours(additionalTimeIn.hours, additionalTimeIn.minutes);
    
            const additionalTimeOutDateTime = new Date(startDate);
            additionalTimeOutDateTime.setHours(additionalTimeOut.hours, additionalTimeOut.minutes);
    
            totalHoursWorked = (additionalTimeOutDateTime - additionalTimeInDateTime) / (1000 * 60 * 60); // Only additional hours
        }
    
        return Math.max(0, totalHoursWorked);
    }
    

      const form = document.getElementById('summary-form');

    form.addEventListener('submit', function (event) {
        if (!validatePTOandPersonalHours()) {
            event.preventDefault();
            alert('PTO and Personal Hours in the summary exceed the allowed values.');
        }
    });

    function validatePTOandPersonalHours() {
        const ptoHeader = parseFloat(document.getElementById('pto-hours-display').textContent) || 0;
        const personalHeader = parseFloat(document.getElementById('personal-time-display').textContent) || 0;
        const ptoSummary = parseFloat(document.getElementById('pto-time').textContent) || 0;
        const personalSummary = parseFloat(document.getElementById('total-personal-time-display').textContent) || 0;

        return ptoSummary <= ptoHeader && personalSummary <= personalHeader;
    }

    const ptoTimeInput = document.getElementById('pto-time');
    const ptoHoursDisplay = document.getElementById('pto-hours-display');


    function validatePtoHours(totalHoursWorked, ptoTime, personalTime) {
        const remainingPTO = Math.max(0, availablePTOHours - ptoTime);
        const totalHoursWithPto = totalHoursWorked + ptoTime + personalTime;
        console.log('PTO used:', ptoTime);

        if (totalHoursWithPto > 40 && (ptoTime > 0 || personalTime > 0)) {
            elements.ptoValidationMessage.textContent = 'Total hours including PTO and Personal time cannot exceed 40 hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (ptoTime > availablePTOHours) {
            elements.ptoValidationMessage.textContent = 'PTO time used cannot exceed available PTO hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else if (personalTime > availablePersonalHours) {
            elements.ptoValidationMessage.textContent = 'Personal time used cannot exceed available Personal hours';
            elements.ptoValidationMessage.style.color = 'red';
        } else {
            elements.ptoValidationMessage.textContent = '';
        }
    }

    function updateTotalPtoAndHolidayHours() {
        let totalPtoHours = 0;
        let totalHolidayHours = 0;
        let totalPersonalHours = 0;
    
        const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
        ptoInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalPtoHours += value;
        });
    
        const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');
        holidayInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalHolidayHours += value;
        });
    
        const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
        personalInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            totalPersonalHours += value;
        });
    
        console.log('Total PTO hours:', totalPtoHours); // Debugging log
        console.log('Total Holiday hours:', totalHolidayHours);
        console.log('Total Personal hours:', totalPersonalHours);
    
        // Ensure the textContent is correctly updated
        elements.ptoTimeSpan.textContent = totalPtoHours.toFixed(0);
        elements.holidayTimeSpan.textContent = totalHolidayHours.toFixed(0);
        elements.personalTimeSpan.textContent = totalPersonalHours.toFixed(0);
    
        elements.remainingPtoHoursElement.textContent = Math.max(0, availablePTOHours - totalPtoHours).toFixed(0);
        elements.remainingPersonalHoursElement.textContent = Math.max(0, availablePersonalHours - totalPersonalHours).toFixed(0);
       // Initial total (without gifted hours)
let totalTimeWithPto = totalPtoHours + totalHolidayHours + totalPersonalHours + parseFloat(elements.totalTimeWorkedSpan.textContent);
elements.totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);

// Update remaining PTO and personal hours
elements.remainingPtoHoursElement.textContent = Math.max(0, availablePTOHours - totalPtoHours).toFixed(0);
elements.remainingPersonalHoursElement.textContent = Math.max(0, availablePersonalHours - totalPersonalHours).toFixed(0);

// Handle gifted hours
const giftedHoursElement = document.getElementById('gifted-hours');
let giftedHours = 0;

if (giftedHoursElement) {
    console.log(`💼 Total Time With PTO (before gift): ${totalTimeWithPto}`);

    if (totalTimeWithPto < 40) {
        giftedHours = Math.min(3, 40 - totalTimeWithPto);
        console.log(`🎁 Gifted Hours Applied: ${giftedHours}`);
    } else {
        console.log("✅ No Gifted Hours Needed");
    }

    giftedHoursElement.textContent = giftedHours.toFixed(2);

    // Add gifted hours to total and update display again
    totalTimeWithPto += giftedHours;
    elements.totalTimeWithPtoSpan.textContent = totalTimeWithPto.toFixed(2);
} else {
    console.warn("⚠️ gifted-hours element not found in DOM.");
}

    }
    

    async function updatePtoHours() {
        console.log('Updating PTO hours...');
        const usedPtoHoursValue = parseFloat(elements.ptoTimeSpan.textContent) || 0;
        console.log('Total PTO hours:', usedPtoHoursValue);
    
        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);
    
        try {
            // Step 1: Fetch the current value of PTO from Airtable
            const fetchResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!fetchResponse.ok) throw new Error(`Failed to fetch current PTO hours: ${fetchResponse.statusText}`);
    
            const fetchData = await fetchResponse.json();
            console.log('Fetched data:', fetchData);
            
            // Fetch and parse the current PTO hours
            const currentPtoHours = parseFloat(fetchData.fields['PTO']) || 0; // Default to 0 if undefined
            console.log('Current PTO hours fetched from Airtable:', currentPtoHours);
    
            if (isNaN(currentPtoHours)) throw new Error(`Invalid PTO hours value retrieved from Airtable: ${fetchData.fields['PTO']}`);
    
            // Step 2: Add the used PTO hours value to the current PTO hours
            const newPtoHoursValue = currentPtoHours + usedPtoHoursValue;
            console.log('New PTO hours value to update:', newPtoHoursValue);
    
            // Step 3: Patch the updated total back to Airtable
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'PTO': newPtoHoursValue } })  // Send the new total as a number
            });
    
            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);
    
            if (!updateResponse.ok) throw new Error(`Failed to update PTO hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('PTO hours updated successfully');
        } catch (error) {
            console.error('Error updating PTO hours:', error);
            throw new Error('Failed to update PTO hours. Error: ' + error.message);
        }
    }
             

    async function updatePersonalHours() {
        console.log('Updating Personal hours...');
        const usedPersonalHoursValue = parseFloat(elements.personalTimeSpan.textContent) || 0;
        const newPersonalHoursValue = Math.max(0, availablePersonalHours - usedPersonalHoursValue);
        console.log('Used Personal hours value:', usedPersonalHoursValue);
        console.log('New Personal hours value:', newPersonalHoursValue);

        const endpoint = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
        console.log('Endpoint for update:', endpoint);

        try {
            const updateResponse = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: { 'Personaltime': newPersonalHoursValue } })
            });

            const updateResponseData = await updateResponse.json();
            console.log('Update response data:', updateResponseData);

            if (!updateResponse.ok) throw new Error(`Failed to update Personal hours: ${updateResponse.statusText} - ${JSON.stringify(updateResponseData)}`);
            console.log('Personal hours updated successfully');
        } catch (error) {
            console.error('Error updating Personal hours:', error);
            throw new Error('Failed to update Personal hours. Error: ' + error.message);
        }
    }


    async function submitFinal() {
    try {
        await updatePtoHours();
        await updatePersonalHours();
        await sendDataToAirtable();
        throwConfetti();
        convertToCsvButton.click();

        const userEmail = localStorage.getItem('userEmail');
        if (userEmail !== '') {
            setTimeout(() => {
                window.location.reload();
            }, 6000);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`An error occurred: ${error.message}`);
    }
}

    function validateWholeNumbers() {
        let hasDecimal = false; // Flag to track if any field has a decimal
    
        // Check PTO input fields directly
        const ptoInputs = document.querySelectorAll('input[name^="PTO_hours"]');
        ptoInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating PTO input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`PTO hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        // Check Personal input fields directly
        const personalInputs = document.querySelectorAll('input[name^="Personal_hours"]');
        personalInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating Personal input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`Personal hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        // Check Holiday input fields directly
        const holidayInputs = document.querySelectorAll('input[name^="Holiday_hours"]');
        holidayInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            console.log('Validating Holiday input value:', value); // Log the value
            if (value % 1 !== 0) {
                alert(`Holiday hours must be a whole number. Current value: ${value}`);
                hasDecimal = true;
            }
        });
    
        return !hasDecimal; // If any decimal was found, return false to prevent submission
    }
    
   async function handleSubmit(event) {
    event.preventDefault(); // Prevent form submission by default

    // Check if the submit button is disabled (e.g., when timesheet is approved)
    if (elements.submitButton.disabled) {
        console.log('Form submission blocked: Timesheet is already approved');
        return;
    }

    if (isApproved) {
        alert('This timesheet is approved. You cannot make any changes.');
        return;  // Stop the form submission if the timesheet is approved
    }

    console.log('User clicked submit.');

    // Check if today is Wednesday and prompt the user to confirm date7
const today = new Date();
if (today.getDay() === 3) { // Wednesday
    event.preventDefault(); // Pause submission

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const formattedYesterday = `${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}/${yesterday.getFullYear()}`;

    const date7Field = elements.timeEntryForm.elements['date7'];
    const currentDate7Value = date7Field?.value || '';
    const currentDate7 = currentDate7Value ? new Date(currentDate7Value) : new Date();
currentDate7.setDate(currentDate7.getDate() + 1); // Add 1 day

const formattedCurrentDate7 = `${String(currentDate7.getMonth() + 1).padStart(2, '0')}/${String(currentDate7.getDate()).padStart(2, '0')}/${currentDate7.getFullYear()}`;

    // Setup modal
    const modal = document.getElementById('wednesdayModal');
    const message = document.getElementById('wednesdayMessage');
    const yesBtn = document.getElementById('wednesdayYes');
    const noBtn = document.getElementById('wednesdayNo');

    message.textContent = `Would you like to submit for the week of ${formattedYesterday} instead of the currently selected ${formattedCurrentDate7}?`;
    modal.style.display = 'block';

    // Prevent multiple bindings
    yesBtn.onclick = async () => {
        modal.style.display = 'none';
        if (date7Field) {
            date7Field.value = yesterday.toISOString().split('T')[0];
        }
        await submitFinal(); // ⬅️ custom wrapper to handle submit
    };

    noBtn.onclick = async () => {
        modal.style.display = 'none';
        await submitFinal(); // ⬅️ submit with current date7
    };

    return; // wait for user choice before continuing
}






    if (!validateWholeNumbers()) {
        console.log("Validation failed: Non-whole number in PTO, Personal, or Holiday hours.");
        return; // Stop the form submission if the validation fails
    }

    const totalPtoHours = parseFloat(elements.ptoTimeSpan.textContent) || 0;
    const totalPersonalHours = parseFloat(elements.personalTimeSpan.textContent) || 0;

    // Validate the whole numbers for PTO, Personal, and Holiday Hours
    if (!validateWholeNumbers()) {
        console.log("Validation failed: Non-whole number in PTO, Personal, or Holiday hours.");
        return; // Stop the form submission if the validation fails
    }

    // Validate that PTO and Personal hours don't exceed the available amount
    if (totalPtoHours > availablePTOHours) {
        alert('PTO time used cannot exceed available PTO hours');
        return; // Stop the form submission if PTO hours exceed available hours
    }

    if (totalPersonalHours > availablePersonalHours) {
        alert('Personal time used cannot exceed available Personal hours');
        return; // Stop the form submission if Personal hours exceed available hours
    }

    // If all validations pass, proceed with submitting the data
    try {
        await updatePtoHours();
        await updatePersonalHours();
        await sendDataToAirtable();
        throwConfetti();

        convertToCsvButton.click();

        // Get the user email from localStorage and prevent page refresh if it's Luz
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail !== '') {
            // Refresh the page after a delay if the user is not Luz
            setTimeout(() => {
                window.location.reload();
            }, 6000); // Reduced delay for a better user experience
        } else {
            console.log('Page refresh prevented for Luz.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`An error occurred: ${error.message}`);
    }
}

    function throwConfetti() {
        confetti({
            particleCount: 1400,
            spread: 180,
            origin: { y: 0.6 }
        });
    }
    
    let countdownInterval; // Declare countdownInterval in a higher scope to track the interval
    
  
    
    async function sendDataToAirtable() {
        const date7 = elements.timeEntryForm.elements['date7']?.value || '0';
        const totalPtoHours = calculateColumnSum('PTO_hours');
        const totalPersonalHours = calculateColumnSum('Personal_hours');
        const totalHolidayHours = calculateColumnSum('Holiday_hours');
        
        console.log('Preparing to send data to Airtable:', {
            date7,
            totalPtoHours,
            totalPersonalHours,
            totalHolidayHours,
            totalTimeWorked: elements.totalTimeWorkedSpan.textContent,
            totalTimeWithPto: elements.totalTimeWithPtoSpan.textContent
        });
    
        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        "date7": date7 || '0',
                        "PTO Time Used": parseFloat(totalPtoHours) || 0,
                        "Personal Time Used": parseFloat(totalPersonalHours) || 0,
                        "Holiday Hours Used": parseFloat(totalHolidayHours) || 0,
                        "Total Hours Worked": parseFloat(elements.totalTimeWorkedSpan.textContent) || 0,
                        "Total Time with PTO": parseFloat(elements.totalTimeWithPtoSpan.textContent) || 0,
                    }
                })
            });
    
            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Error updating Airtable:', response.statusText, errorDetails);
                throw new Error(`Failed to update data in Airtable: ${response.statusText} - ${JSON.stringify(errorDetails)}`);
            }
    
            console.log('Data successfully updated in Airtable');
        } catch (error) {
            console.error('Error updating Airtable:', error);
            alert(`Failed to update data in Airtable. 
                Error Details:
                - Status: ${response.status}
                - Status Text: ${response.statusText}
                - Endpoint: ${endpoint}
                - Record ID: ${recordId}
                - API Key: ${apiKey ? 'Provided' : 'Not Provided'}
                
               `);
                        }
    }
    
    
    document.addEventListener("DOMContentLoaded", function() {
        const timeEntryWrapper = document.querySelector('.time-entry-table-wrapper');
    
        let isScrolling;
    
        timeEntryWrapper.addEventListener('scroll', function() {
            timeEntryWrapper.style.scrollbarWidth = 'auto';
            timeEntryWrapper.style.setProperty('--scrollbar-width', 'auto');
    
            window.clearTimeout(isScrolling);
    
            isScrolling = setTimeout(function() {
                timeEntryWrapper.style.scrollbarWidth = 'none';
                timeEntryWrapper.style.setProperty('--scrollbar-width', 'none');
            }, 1000);
        });
    });

    function formatNumber(element) {
        const value = parseInt(element.innerText, 10) || 0;
        element.innerText = value.toString();
    }
    
    function formatAllNumbers() {
        formatNumber(document.getElementById('pto-time'));
        formatNumber(document.getElementById('total-personal-time-display'));
        formatNumber(document.getElementById('Holiday-hours'));
    }
    
    formatAllNumbers();
    
    setInterval(formatAllNumbers, 1);

    function clearForm() {
        console.log('Clearing form...');
        elements.timeEntryForm.reset();
        elements.ptoTimeSpan.textContent = '0';
        elements.personalTimeSpan.textContent = '0';
        elements.holidayTimeSpan.textContent = '0';
        elements.totalTimeWorkedSpan.textContent = '0.00';
        elements.totalTimeWithPtoSpan.textContent = '0.00';
        elements.remainingPtoHoursElement.textContent = '0';
        elements.remainingPersonalHoursElement.textContent = '0';
        window.location.reload();
    }

    function resetForm(event) {
        event.preventDefault();
        console.log('Resetting form...');
        clearForm();
    }

    function calculateColumnSum(columnName) {
        const inputs = document.querySelectorAll(`input[name^="${columnName}"]`);
        let total = 0;
        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });
        return total;
    }


    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    timeInputs.forEach(input => {
        input.addEventListener('focus', () => scrollToElement(input));
    });

    function handleLogout(event) {
        event.preventDefault();
        console.log('🔓 Logging out...');
    
        // Clear all relevant storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPassword'); // ✅ Also remove the password!
        sessionStorage.removeItem('user');
            // Redirect to login screen
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }
    
    const convertToCsvButton = document.getElementById('convert-to-csv-button');

    convertToCsvButton.addEventListener('click', convertToCsv);

    function convertToCsv() {
        console.log('Converting to CSV...');
    
        const userEmail = localStorage.getItem('userEmail') || 'user';
        const date7Value = document.querySelector('[name="date7"]')?.value || 'date7';
        const rawDate = new Date(date7Value);
        rawDate.setDate(rawDate.getDate() + 1); // Add one day
        
        const formattedDate7 = rawDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
        
        // Format the file name using email and date7
        const fileName = `${userEmail}_${formattedDate7}.csv`.replace(/[@.]/g, '_');
    
        const rows = [];
        const employeeEmailRow = [userEmail];
        rows.push(employeeEmailRow);
    
        const headerRow = ['Date', 'Start Time', 'Lunch Start', 'Lunch End', 'End Time', 'Additional Time In', 'Additional Time Out', 'Hours Worked', 'PTO Hours', 'Personal Hours', 'Holiday Hours'];
        rows.push(headerRow);
    
        const daysOfWeek = ['date1', 'date2', 'date3', 'date4', 'date5', 'date6', 'date7'];
        daysOfWeek.forEach((day, index) => {
            const row = [];
    
            // Format each date as "Month Name DD, YYYY" and ensure it stays in one cell
            const dateValue = document.querySelector(`[name="${day}"]`)?.value;
            const formattedDate = dateValue
                ? `"${new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}"`
                : '';
            
            row.push(formattedDate);
            const timeFields = ['start_time', 'lunch_start', 'lunch_end', 'end_time', 'Additional_Time_In', 'Additional_Time_Out'];

            timeFields.forEach(field => {
                const input = elements.timeEntryForm.elements[`${field}${index + 1}`];
                if (input && input.value) {
                    const [hour, minute] = input.value.split(':');
                    const formatted = new Date();
                    formatted.setHours(parseInt(hour), parseInt(minute));
                    row.push(formatted.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }));
                } else {
                    row.push('');
                }
            });
            
            row.push(document.getElementById(`hours-worked-today${index + 1}`)?.textContent || '');
            row.push(elements.timeEntryForm.elements[`PTO_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Personal_hours${index + 1}`]?.value || '');
            row.push(elements.timeEntryForm.elements[`Holiday_hours${index + 1}`]?.value || '');
            rows.push(row);
        });
    
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
    
        // Create a custom modal for confirmation
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.padding = "20px";
        modal.style.backgroundColor = "black";
        modal.style.border = "1px solid #ccc";
        modal.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        modal.style.zIndex = "1000";
    
        const message = document.createElement("p");
        message.innerText = "Do you want to download your time sheet?";
        modal.appendChild(message);
    
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-between";
        buttonContainer.style.marginTop = "20px";
    
        const yesButton = document.createElement("button");
        yesButton.innerText = "Yes";
        yesButton.style.padding = "10px 20px";
        yesButton.style.border = "none";
        yesButton.style.backgroundColor = "#4CAF50";
        yesButton.style.color = "white";
        yesButton.style.cursor = "pointer";
        yesButton.onclick = () => {
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri); // Use encodedUri from outer scope
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            document.body.removeChild(modal);
        };
    
        const noButton = document.createElement("button");
        noButton.innerText = "No";
        noButton.style.padding = "10px 20px";
        noButton.style.border = "none";
        noButton.style.backgroundColor = "#f44336";
        noButton.style.color = "white";
        noButton.style.cursor = "pointer";
        noButton.onclick = () => {
            console.log("User canceled the download.");
            document.body.removeChild(modal);
        };
    
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
    
        modal.appendChild(buttonContainer);
        document.body.appendChild(modal);
    }
    
    initializeForm();
    initializeTimeDropdowns();


    function showPickerOnFocus() {
        const timeInputs = document.querySelectorAll('select.time-dropdown, input[type="number"]');
        timeInputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (input.showPicker) input.showPicker();
            });
        });
    }

    showPickerOnFocus();
    

   function saveFormData() {
    // Prevent saving if the timesheet is approved
    if (isApproved) {
        console.log('🛑 Form data saving is disabled because the timesheet is approved.');
        return;
    }

    const data = {};

    // Collect all relevant inputs by type
    const allInputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="time"], input[type="checkbox"]');

    allInputs.forEach(input => {
        if (input.type === "checkbox") {
            data[input.name] = input.checked;
        } else {
            data[input.name] = input.value;
        }
    });

    // Store in localStorage
    localStorage.setItem('formData', JSON.stringify(data));
    console.log('✅ Form data saved:', data);
}

    
    function loadFormData() {
        const data = JSON.parse(localStorage.getItem('formData'));
        if (data) {
            Object.keys(data).forEach(key => {
                const input = elements.timeEntryForm.elements[key];
                if (input) {
                    input.value = data[key];
                }
            });

            // Load number inputs
            const numberInputs = document.querySelectorAll('input[type="number"]');
            numberInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

            // Load date inputs
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

            // Load time inputs
            const timeInputs = document.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                if (data[input.name]) {
                    input.value = data[input.name];
                }
            });

           calculateTotalTimeWorked();
updateTotalPtoAndHolidayHours();
debounce(hideZeroValueSpans, 100)();        }
    }

    loadFormData(); // Load form data on page load
});

function toggleWorkInputs(dayIndex, isChecked) {
    const row = document.querySelector(`tr[data-day="${dayIndex + 1}"]`);
    const timeInputs = row.querySelectorAll('input[type="time"]');
    const numberInputs = row.querySelectorAll('input[type="number"]');
    
    if (isChecked) {
        timeInputs.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
        numberInputs.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
    } else {
        timeInputs.forEach(input => {
            input.disabled = false;
        });
        numberInputs.forEach(input => {
            input.disabled = false;
        });
    }
 calculateTotalTimeWorked();
updateTotalPtoAndHolidayHours();
debounce(hideZeroValueSpans, 100)();
}

document.addEventListener('DOMContentLoaded', () => {
 for (let i = 1; i <= 7; i++) {
  const ptoInput = document.querySelector(`input[name="PTO_hours${i}"]`);
  const personalInput = document.querySelector(`input[name="Personal_hours${i}"]`);
  const holidayInput = document.querySelector(`input[name="Holiday_hours${i}"]`);

  if (ptoInput) ptoInput.addEventListener('input', debounce(updateTotalsSummary, 200));
  if (personalInput) personalInput.addEventListener('input', debounce(updateTotalsSummary, 200));
  if (holidayInput) holidayInput.addEventListener('input', debounce(updateTotalsSummary, 200));
 }
});
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

// Master summary visibility control
function updateTotalsSummary() {
  let totalPTO = 0;
  let totalPersonal = 0;
  let totalHoliday = 0;
  

  for (let i = 1; i <= 7; i++) {
    totalPTO += parseFloat(document.querySelector(`input[name="PTO_hours${i}"]`)?.value) || 0;
    totalPersonal += parseFloat(document.querySelector(`input[name="Personal_hours${i}"]`)?.value) || 0;
    totalHoliday += parseFloat(document.querySelector(`input[name="Holiday_hours${i}"]`)?.value) || 0;
  }

  console.log(`📊 PTO: ${totalPTO} | Personal: ${totalPersonal} | Holiday: ${totalHoliday}`);

  document.getElementById('total-pto-used').innerText = totalPTO.toFixed(2);
  document.getElementById('total-personal-used').innerText = totalPersonal.toFixed(2);
  document.getElementById('Holiday-hours').innerText = totalHoliday.toFixed(2);

  const totalsDiv = document.getElementById('totals-summary');
  totalsDiv.style.display = (totalPTO || totalPersonal || totalHoliday) ? 'block' : 'none';

  // ✅ Toggle each row INDIVIDUALLY
  toggleRowDisplay('total-pto-used', totalPTO);
  toggleRowDisplay('total-personal-used', totalPersonal);
  toggleRowDisplay('Holiday-hours', totalHoliday);

  // Also handle holiday-row if you have a special container
  const holidayRow = document.getElementById('holiday-row');
  if (holidayRow) {
    holidayRow.style.display = (totalHoliday) ? 'flex' : 'none';
  }

  // PTO + Personal wrapper if needed
  const ptoPersonalWrapper = document.getElementById('pto-personal-wrapper');
  if (ptoPersonalWrapper) {
    ptoPersonalWrapper.style.display = (totalPTO || totalPersonal) ? 'block' : 'none';
  }
}

function toggleRowDisplay(spanId, value) {
  const span = document.getElementById(spanId);
  if (!span) return;

  const parentRow = span.closest('.form-row');
  if (parentRow) {
    parentRow.style.display = (value === 0) ? 'none' : 'flex';
  }
}

// Attach listeners to all PTO and Personal time inputs
document.addEventListener('DOMContentLoaded', () => {
 for (let i = 1; i <= 7; i++) {
  const ptoInput = document.querySelector(`input[name="PTO_hours${i}"]`);
  const personalInput = document.querySelector(`input[name="Personal_hours${i}"]`);
  const holidayInput = document.querySelector(`input[name="Holiday_hours${i}"]`);

  if (ptoInput) ptoInput.addEventListener('input', debounce(updateTotalsSummary, 200));

  if (personalInput) personalInput.addEventListener('input', updateTotalsSummary, 200);
  if (holidayInput) holidayInput.addEventListener('input', updateTotalsSummary, 200);
}

});