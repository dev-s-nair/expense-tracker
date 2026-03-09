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

// Handle mode selection - navigate to separate HTML pages
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        
        if (mode === 'personal') {
            window.location.href = 'personal-tracker.html';
        } else if (mode === 'group') {
            window.location.href = 'group-tracker.html';
        } else if (mode === 'trip') {
            window.location.href = 'trip-tracker.html';
        }
    });
});
