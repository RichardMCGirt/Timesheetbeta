document.addEventListener('DOMContentLoaded', function () {
    const totalTimeWorkedElement = document.getElementById('total-time-worked');
    const overtimeHoursElement = document.getElementById('overtimehours');

    function calculateOvertime() {
        const totalHoursWorked = parseFloat(totalTimeWorkedElement.textContent) || 0;
        let overtimeHours = 0;

        if (totalHoursWorked > 40) {
            overtimeHours = totalHoursWorked - 40;
        }

        overtimeHoursElement.textContent = overtimeHours.toFixed(2);
    }

    // Call calculateOvertime whenever the total hours worked changes
    function monitorTotalHoursWorked() {
        const observer = new MutationObserver(() => {
            calculateOvertime();
        });

        observer.observe(totalTimeWorkedElement, { childList: true, subtree: true });
    }

    monitorTotalHoursWorked();
    calculateOvertime(); // Initial calculation on page load
});
