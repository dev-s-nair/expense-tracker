// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check for saved dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
    body.classList.add('dark-mode');
}

// Toggle dark mode
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const darkModeEnabled = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', darkModeEnabled);
    });
}

// Intro screen elements
const getStartedBtn = document.getElementById('get-started-btn');

// Handle intro screen - navigate to mode selection
if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
        window.location.href = 'mode-selection.html';
    });
}
