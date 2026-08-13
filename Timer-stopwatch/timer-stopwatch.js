document.addEventListener('DOMContentLoaded', () => {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.remove('hidden');
        });
    });

    // Timer functionality
    const timerDisplay = document.querySelector('.timer-display');
    const hourInput = document.getElementById('hourInput');
    const minuteInput = document.getElementById('minuteInput');
    const secondInput = document.getElementById('secondInput');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const pauseTimerBtn = document.getElementById('pauseTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');

    let timerInterval;
    let timeRemaining = 0; // in seconds
    let isTimerRunning = false;

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [
            h.toString().padStart(2, '0'),
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':');
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeRemaining);
        if (timeRemaining <= 10 && timeRemaining > 0) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }

    function startTimer() {
        if (isTimerRunning) return;
        
        // If timeRemaining is 0, get time from inputs
        if (timeRemaining === 0) {
            const hours = parseInt(hourInput.value) || 0;
            const minutes = parseInt(minuteInput.value) || 0;
            const seconds = parseInt(secondInput.value) || 0;
            timeRemaining = hours * 3600 + minutes * 60 + seconds;
        }

        if (timeRemaining <= 0) {
            alert('Please set a time greater than zero.');
            return;
        }

        isTimerRunning = true;
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
        hourInput.disabled = true;
        minuteInput.disabled = true;
        secondInput.disabled = true;

        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert('Timer finished!');
                resetTimer(); // Automatically reset after finishing
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timeRemaining = 0;
        updateTimerDisplay();
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
        resetTimerBtn.disabled = true;
        hourInput.disabled = false;
        minuteInput.disabled = false;
        secondInput.disabled = false;
        hourInput.value = '';
        minuteInput.value = '';
        secondInput.value = '';
        timerDisplay.classList.remove('warning');
    }

    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    // Input validation for timer
    [hourInput, minuteInput, secondInput].forEach(input => {
        input.addEventListener('input', () => {
            if (!isTimerRunning) {
                const hours = parseInt(hourInput.value) || 0;
                const minutes = parseInt(minuteInput.value) || 0;
                const seconds = parseInt(secondInput.value) || 0;
                timeRemaining = hours * 3600 + minutes * 60 + seconds;
                updateTimerDisplay();
                startTimerBtn.disabled = timeRemaining <= 0;
                resetTimerBtn.disabled = timeRemaining <= 0;
            }
        });
        input.addEventListener('change', () => {
            let val = parseInt(input.value);
            if (isNaN(val) || val < 0) val = 0;
            if (input.id === 'minuteInput' || input.id === 'secondInput') {
                if (val > 59) val = 59;
            }
            input.value = val.toString().padStart(2, '0');
        });
    });

    // Stopwatch functionality
    const stopwatchDisplay = document.querySelector('.stopwatch-display');
    const startStopwatchBtn = document.getElementById('startStopwatchBtn');
    const pauseStopwatchBtn = document.getElementById('pauseStopwatchBtn');
    const resetStopwatchBtn = document.getElementById('resetStopwatchBtn');
    const lapStopwatchBtn = document.getElementById('lapStopwatchBtn');
    const lapsList = document.getElementById('lapsList');

    let stopwatchInterval;
    let stopwatchTime = 0; // in milliseconds
    let isStopwatchRunning = false;
    let lapCounter = 0;

    function formatStopwatchTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const cs = Math.floor((milliseconds % 1000) / 10); // Centiseconds
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [
            h.toString().padStart(2, '0'),
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':') + `.${cs.toString().padStart(2, '0')}`;
    }

    function updateStopwatchDisplay() {
        stopwatchDisplay.textContent = formatStopwatchTime(stopwatchTime);
    }

    function startStopwatch() {
        if (isStopwatchRunning) return;

        isStopwatchRunning = true;
        startStopwatchBtn.disabled = true;
        pauseStopwatchBtn.disabled = false;
        resetStopwatchBtn.disabled = false;
        lapStopwatchBtn.disabled = false;

        let startTime = Date.now() - stopwatchTime;

        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - startTime;
            updateStopwatchDisplay();
        }, 10);
    }

    function pauseStopwatch() {
        clearInterval(stopwatchInterval);
        isStopwatchRunning = false;
        startStopwatchBtn.disabled = false;
        pauseStopwatchBtn.disabled = true;
    }

    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        isStopwatchRunning = false;
        stopwatchTime = 0;
        lapCounter = 0;
        updateStopwatchDisplay();
        lapsList.innerHTML = '';
        startStopwatchBtn.disabled = false;
        pauseStopwatchBtn.disabled = true;
        resetStopwatchBtn.disabled = true;
        lapStopwatchBtn.disabled = true;
    }

    function recordLap() {
        lapCounter++;
        const lapTime = formatStopwatchTime(stopwatchTime);
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>Lap ${lapCounter}:</span> <span>${lapTime}</span>`;
        lapsList.prepend(listItem); // Add to the beginning of the list
    }

    startStopwatchBtn.addEventListener('click', startStopwatch);
    pauseStopwatchBtn.addEventListener('click', pauseStopwatch);
    resetStopwatchBtn.addEventListener('click', resetStopwatch);
    lapStopwatchBtn.addEventListener('click', recordLap);

    // Initial state setup
    updateTimerDisplay();
    updateStopwatchDisplay();
});


