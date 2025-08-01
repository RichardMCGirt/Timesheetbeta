function moveToNextCell(currentInput) {
    const inputs = Array.from(document.querySelectorAll('.time-entry-table input[type="time"], .time-entry-table input[type="number"]'));

    // Get the current input's index
    let currentIndex = inputs.indexOf(currentInput);
    console.log('Current input index:', currentIndex);

    // Determine the next input's index, skipping the weekend (days 4 and 5)
    do {
        currentIndex = (currentIndex + 1) % inputs.length;
        console.log('Next input index:', currentIndex, 'Input:', inputs[currentIndex]);
    } while (shouldSkipInput(inputs[currentIndex]));

    // Focus the next input
    console.log('Focusing on input:', inputs[currentIndex]);
    inputs[currentIndex].focus();
}

function shouldSkipInput(input) {
    const rowIndex = input.closest('tr').dataset.day;
    console.log('Row index:', rowIndex, 'Skipping:', rowIndex === '4' || rowIndex === '5');
    return rowIndex === '4' || rowIndex === '5'; // Skip days 4 and 5 (weekend)
}

// Attach the moveToNextCell function to the input fields
document.querySelectorAll('.time-entry-table input[type="time"]').forEach(input => {
    input.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        console.log('Time input value:', value);
        if (value.includes('a') || value.includes('p')) {
            console.log('Triggering move to next cell due to input');
            moveToNextCell(this);
        }
    });

    input.addEventListener('change', function () {
        const value = this.value.toLowerCase();
        console.log('Time input value on change:', value);
        if (value.includes('a') || value.includes('p')) {
            console.log('Triggering move to next cell due to change');
            moveToNextCell(this);
        }
    });
});

document.querySelectorAll('.time-entry-table input[type="number"]').forEach(input => {
    input.addEventListener('input', function () {
        if (this.value) {
            console.log('Number input value:', this.value, 'Moving to next cell');
            moveToNextCell(this);
        }
    });
});
