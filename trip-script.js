// Trip/Event Tracker - Complete Implementation

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

// State Management
let trips = JSON.parse(localStorage.getItem('trips')) || [];
let currentTripId = localStorage.getItem('currentTripId') || null;

// Get current trip data
function getCurrentTrip() {
    if (!currentTripId) return null;
    return trips.find(t => t.id === currentTripId) || null;
}

// DOM Elements
const tripSelect = document.getElementById('trip-select');
const newTripBtn = document.getElementById('new-trip-btn');
const editTripBtn = document.getElementById('edit-trip-btn');
const deleteTripBtn = document.getElementById('delete-trip-btn');
const lockTripBtn = document.getElementById('lock-trip-btn');
const tripModal = document.getElementById('trip-modal');
const closeTripModal = document.getElementById('close-trip-modal');
const tripForm = document.getElementById('trip-form');
const tripModalTitle = document.getElementById('trip-modal-title');
const tripFormSubmit = document.getElementById('trip-form-submit');
const mainContent = document.getElementById('main-content');

// Trip form inputs
const tripNameInput = document.getElementById('trip-name');
const tripStartDateInput = document.getElementById('trip-start-date');
const tripEndDateInput = document.getElementById('trip-end-date');
const tripBudgetInput = document.getElementById('trip-budget');

// Trip info display
const currentTripName = document.getElementById('current-trip-name');
const currentTripDates = document.getElementById('current-trip-dates');
const tripLockedBadge = document.getElementById('trip-locked-badge');
const tripTotalSpent = document.getElementById('trip-total-spent');
const tripBudgetDisplay = document.getElementById('trip-budget-display');
const tripRemaining = document.getElementById('trip-remaining');
const tripPerPerson = document.getElementById('trip-per-person');
const budgetAlert = document.getElementById('budget-alert');
const participantNameInput = document.getElementById('participant-name');
const addParticipantBtn = document.getElementById('add-participant-btn');
const participantsListEl = document.getElementById('participants-list');
const participantStatsEl = document.getElementById('participant-stats');

// Summary
const totalExpensesEl = document.getElementById('total-expenses');
const totalDaysEl = document.getElementById('total-days');

// Settlements
const tripSettlementsListEl = document.getElementById('trip-settlements-list');

// Payments
const tripPaymentForm = document.getElementById('trip-payment-form');
const tripPaymentFromSelect = document.getElementById('trip-payment-from');
const tripPaymentToSelect = document.getElementById('trip-payment-to');
const tripPaymentAmountInput = document.getElementById('trip-payment-amount');

// Expenses
const expenseForm = document.getElementById('expense-form');
const expenseDateInput = document.getElementById('expense-date');
const expenseDayInput = document.getElementById('expense-day');
const expenseCategoryInput = document.getElementById('expense-category');
const expensePaidBySelect = document.getElementById('expense-paid-by');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseSplitEquallyCheckbox = document.getElementById('expense-split-equally');
const expenseSplitAmongGroup = document.getElementById('expense-split-among-group');
const expenseSplitListEl = document.getElementById('expense-split-list');
const expenseListEl = document.getElementById('expense-list');

// Breakdowns
const categoryBreakdownEl = document.getElementById('category-breakdown');
const dayBreakdownEl = document.getElementById('day-breakdown');

// Export buttons
const exportTripCSVBtn = document.getElementById('export-trip-csv');
const exportTripPDFBtn = document.getElementById('export-trip-pdf');

// Track if we're editing a trip
let editingTripId = null;

// Initialize
function init() {
    updateTripSelector();
    
    if (currentTripId && getCurrentTrip()) {
        loadTrip(currentTripId);
    }
    
    // Event Listeners
    newTripBtn.addEventListener('click', openNewTripModal);
    closeTripModal.addEventListener('click', closeModal);
    tripForm.addEventListener('submit', saveTripForm);
    tripSelect.addEventListener('change', onTripSelectChange);
    editTripBtn.addEventListener('click', openEditTripModal);
    deleteTripBtn.addEventListener('click', deleteCurrentTrip);
    lockTripBtn.addEventListener('click', toggleTripLock);
    
    addParticipantBtn.addEventListener('click', addParticipant);
    participantNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addParticipant();
        }
    });
    
    expenseForm.addEventListener('submit', addExpense);
    expenseSplitEquallyCheckbox.addEventListener('change', function() {
        expenseSplitAmongGroup.style.display = this.checked ? 'none' : 'block';
    });
    
    tripPaymentForm.addEventListener('submit', recordPayment);
    
    exportTripCSVBtn.addEventListener('click', exportCSV);
    exportTripPDFBtn.addEventListener('click', exportPDF);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === tripModal) {
            closeModal();
        }
    });
}

// Trip Management Functions
function updateTripSelector() {
    tripSelect.innerHTML = '<option value="">No trips yet - Create one!</option>';
    
    if (trips.length > 0) {
        tripSelect.innerHTML = '<option value="">Select a trip...</option>';
        trips.forEach(trip => {
            const option = document.createElement('option');
            option.value = trip.id;
            const status = trip.locked ? ' 🔒' : '';
            option.textContent = `${trip.name} (${formatDateShort(trip.startDate)} - ${formatDateShort(trip.endDate)})${status}`;
            if (trip.id === currentTripId) {
                option.selected = true;
            }
            tripSelect.appendChild(option);
        });
    }
}

function openNewTripModal() {
    editingTripId = null;
    tripModalTitle.textContent = 'Create New Trip';
    tripFormSubmit.textContent = 'Create Trip';
    tripForm.reset();
    tripModal.style.display = 'flex';
}

function openEditTripModal() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot edit a locked/completed trip!');
        return;
    }
    
    editingTripId = trip.id;
    tripModalTitle.textContent = 'Edit Trip';
    tripFormSubmit.textContent = 'Save Changes';
    
    tripNameInput.value = trip.name;
    tripStartDateInput.value = trip.startDate;
    tripEndDateInput.value = trip.endDate;
    tripBudgetInput.value = trip.budget || '';
    
    tripModal.style.display = 'flex';
}

function closeModal() {
    tripModal.style.display = 'none';
    tripForm.reset();
    editingTripId = null;
}

function saveTripForm(e) {
    e.preventDefault();
    
    const name = tripNameInput.value.trim();
    const startDate = tripStartDateInput.value;
    const endDate = tripEndDateInput.value;
    const budget = tripBudgetInput.value ? parseFloat(tripBudgetInput.value) : null;
    
    if (name === '' || startDate === '' || endDate === '') {
        alert('Please fill all required fields!');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date!');
        return;
    }
    
    if (editingTripId) {
        // Edit existing trip
        const trip = trips.find(t => t.id === editingTripId);
        if (trip) {
            trip.name = name;
            trip.startDate = startDate;
            trip.endDate = endDate;
            trip.budget = budget;
        }
    } else {
        // Create new trip
        const newTrip = {
            id: generateID(),
            name: name,
            startDate: startDate,
            endDate: endDate,
            budget: budget,
            participants: [],
            expenses: [],
            payments: [],
            locked: false,
            createdAt: new Date().toISOString()
        };
        
        trips.push(newTrip);
        currentTripId = newTrip.id;
        localStorage.setItem('currentTripId', currentTripId);
    }
    
    saveTrips();
    updateTripSelector();
    closeModal();
    
    if (currentTripId) {
        loadTrip(currentTripId);
    }
}

function onTripSelectChange() {
    const selectedTripId = tripSelect.value;
    
    if (selectedTripId === '') {
        currentTripId = null;
        localStorage.removeItem('currentTripId');
        mainContent.style.display = 'none';
        editTripBtn.style.display = 'none';
        deleteTripBtn.style.display = 'none';
        lockTripBtn.style.display = 'none';
    } else {
        currentTripId = selectedTripId;
        localStorage.setItem('currentTripId', currentTripId);
        loadTrip(currentTripId);
    }
}

function loadTrip(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    mainContent.style.display = 'block';
    editTripBtn.style.display = 'inline-block';
    deleteTripBtn.style.display = 'inline-block';
    lockTripBtn.style.display = 'inline-block';
    
    // Update trip info
    currentTripName.textContent = trip.name;
    currentTripDates.textContent = `${formatDateLong(trip.startDate)} - ${formatDateLong(trip.endDate)}`;
    
    // Locked status
    if (trip.locked) {
        tripLockedBadge.style.display = 'block';
        lockTripBtn.textContent = '🔓';
        lockTripBtn.title = 'Unlock trip';
    } else {
        tripLockedBadge.style.display = 'none';
        lockTripBtn.textContent = '🔒';
        lockTripBtn.title = 'Lock/Complete trip';
    }
    
    // Disable forms if locked
    const isLocked = trip.locked;
    participantNameInput.disabled = isLocked;
    addParticipantBtn.disabled = isLocked;
    expenseForm.querySelectorAll('input, select, button').forEach(el => el.disabled = isLocked);
    tripPaymentForm.querySelectorAll('input, select, button').forEach(el => el.disabled = isLocked);
    
    updateTripStats();
    updateParticipantsList();
    updateExpensePaidBySelect();
    updateExpenseSplitList();
    updatePaymentSelects();
    updateExpenseList();
    updateSummary();
    updateParticipantStats();
    updateSettlements();
    updateCategoryBreakdown();
    updateDayBreakdown();
    
    expenseDateInput.valueAsDate = new Date();
}

function deleteCurrentTrip() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (!confirm(`Are you sure you want to delete "${trip.name}"? This will delete all participants, expenses, and payments. This action cannot be undone!`)) {
        return;
    }
    
    trips = trips.filter(t => t.id !== currentTripId);
    currentTripId = null;
    localStorage.removeItem('currentTripId');
    
    saveTrips();
    updateTripSelector();
    mainContent.style.display = 'none';
    editTripBtn.style.display = 'none';
    deleteTripBtn.style.display = 'none';
    lockTripBtn.style.display = 'none';
    
    alert('Trip deleted successfully!');
}

function toggleTripLock() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        // Unlock
        if (confirm('Unlock this trip? You will be able to add/edit expenses again.')) {
            trip.locked = false;
            saveTrips();
            loadTrip(currentTripId);
        }
    } else {
        // Lock
        if (confirm('Lock/Complete this trip? This will mark it as complete and prevent further edits. You can unlock it later if needed.')) {
            trip.locked = true;
            saveTrips();
            loadTrip(currentTripId);
        }
    }
}

// Participants Management
function addParticipant() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot add participants to a locked trip!');
        return;
    }
    
    const name = participantNameInput.value.trim();
    
    if (name === '') {
        alert('Please enter a participant name!');
        return;
    }
    
    if (trip.participants.includes(name)) {
        alert('Participant already exists!');
        return;
    }
    
    trip.participants.push(name);
    saveTrips();
    updateParticipantsList();
    updateExpensePaidBySelect();
    updateExpenseSplitList();
    updatePaymentSelects();
    updateParticipantStats();
    updateSettlements();
    participantNameInput.value = '';
}

function removeParticipant(name) {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot remove participants from a locked trip!');
        return;
    }
    
    const hasExpenses = trip.expenses.some(e => e.paidBy === name);
    
    if (hasExpenses) {
        if (!confirm(`${name} has existing expenses. Remove anyway?`)) {
            return;
        }
    }
    
    trip.participants = trip.participants.filter(p => p !== name);
    saveTrips();
    updateParticipantsList();
    updateExpensePaidBySelect();
    updateExpenseSplitList();
    updatePaymentSelects();
    updateParticipantStats();
    updateSettlements();
}

function updateParticipantsList() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    participantsListEl.innerHTML = '';
    
    trip.participants.forEach(participant => {
        const chip = document.createElement('div');
        chip.className = 'member-chip';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = participant;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-member';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeParticipant(participant);
        removeBtn.disabled = trip.locked;
        
        chip.appendChild(nameSpan);
        chip.appendChild(removeBtn);
        participantsListEl.appendChild(chip);
    });
}

// Expense Management
function addExpense(e) {
    e.preventDefault();
    
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot add expenses to a locked trip!');
        return;
    }
    
    if (trip.participants.length === 0) {
        alert('Please add participants first!');
        return;
    }
    
    const date = expenseDateInput.value;
    const day = expenseDayInput.value ? parseInt(expenseDayInput.value) : null;
    const category = expenseCategoryInput.value;
    const paidBy = expensePaidBySelect.value;
    const amount = parseFloat(expenseAmountInput.value);
    const splitEqually = expenseSplitEquallyCheckbox.checked;
    
    let splitAmong = [];
    if (splitEqually) {
        splitAmong = [...trip.participants];
    } else {
        const checkboxes = expenseSplitListEl.querySelectorAll('input[type="checkbox"]:checked');
        splitAmong = Array.from(checkboxes).map(cb => cb.value);
        
        if (splitAmong.length === 0) {
            alert('Please select at least one participant to split the expense!');
            return;
        }
    }
    
    if (date === '' || category === '' || paidBy === '' || isNaN(amount) || amount <= 0) {
        alert('Please fill all required fields correctly!');
        return;
    }
    
    const expense = {
        id: generateID(),
        date: date,
        day: day,
        category: category,
        paidBy: paidBy,
        amount: amount,
        splitEqually: splitEqually,
        splitAmong: splitAmong
    };
    
    trip.expenses.push(expense);
    saveTrips();
    
    updateTripStats();
    updateExpenseList();
    updateSummary();
    updateParticipantStats();
    updateSettlements();
    updateCategoryBreakdown();
    updateDayBreakdown();
    
    // Reset form
    expenseDateInput.valueAsDate = new Date();
    expenseDayInput.value = '';
    expenseCategoryInput.value = '';
    expensePaidBySelect.value = '';
    expenseAmountInput.value = '';
    expenseSplitEquallyCheckbox.checked = true;
    expenseSplitAmongGroup.style.display = 'none';
    updateExpenseSplitList();
}

function deleteExpense(expenseId) {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot delete expenses from a locked trip!');
        return;
    }
    
    trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
    saveTrips();
    
    updateTripStats();
    updateExpenseList();
    updateSummary();
    updateParticipantStats();
    updateSettlements();
    updateCategoryBreakdown();
    updateDayBreakdown();
}

function updateExpensePaidBySelect() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    const currentValue = expensePaidBySelect.value;
    expensePaidBySelect.innerHTML = '<option value="">Select participant...</option>';
    
    trip.participants.forEach(participant => {
        const option = document.createElement('option');
        option.value = participant;
        option.textContent = participant;
        expensePaidBySelect.appendChild(option);
    });
    
    if (trip.participants.includes(currentValue)) {
        expensePaidBySelect.value = currentValue;
    }
}

function updateExpenseSplitList() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    expenseSplitListEl.innerHTML = '';
    
    trip.participants.forEach((participant, index) => {
        const div = document.createElement('div');
        div.className = 'split-member-checkbox selected';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `expense-split-${index}`;
        checkbox.value = participant;
        checkbox.checked = true;
        
        const label = document.createElement('label');
        label.htmlFor = `expense-split-${index}`;
        label.textContent = participant;
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                div.classList.add('selected');
            } else {
                div.classList.remove('selected');
            }
        });
        
        div.appendChild(checkbox);
        div.appendChild(label);
        expenseSplitListEl.appendChild(div);
    });
}

function updateExpenseList() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    expenseListEl.innerHTML = '';
    
    if (trip.expenses.length === 0) {
        expenseListEl.innerHTML = '<li class="empty-message">No expenses yet</li>';
        return;
    }
    
    // Sort by date descending
    const sortedExpenses = [...trip.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        const dateObj = new Date(expense.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const splitInfo = expense.splitEqually 
            ? 'All participants' 
            : expense.splitAmong.join(', ');
        
        const dayInfo = expense.day ? ` • Day ${expense.day}` : '';
        
        const li = document.createElement('li');
        li.className = 'transaction-item expense';
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'transaction-details';
        
        const descSpan = document.createElement('span');
        descSpan.className = 'description';
        descSpan.textContent = expense.category;
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = `${formattedDate}${dayInfo} • Paid by: ${expense.paidBy}`;
        
        const splitSpan = document.createElement('span');
        splitSpan.className = 'date';
        splitSpan.textContent = `Split among: ${splitInfo}`;
        
        detailsDiv.appendChild(descSpan);
        detailsDiv.appendChild(dateSpan);
        detailsDiv.appendChild(splitSpan);
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'amount expense';
        amountSpan.textContent = `₹${expense.amount.toFixed(2)}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteExpense(expense.id);
        deleteBtn.disabled = trip.locked;
        
        li.appendChild(detailsDiv);
        li.appendChild(amountSpan);
        li.appendChild(deleteBtn);
        
        expenseListEl.appendChild(li);
    });
}

// Payment Management
function recordPayment(e) {
    e.preventDefault();
    
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.locked) {
        alert('Cannot record payments in a locked trip!');
        return;
    }
    
    const from = tripPaymentFromSelect.value;
    const to = tripPaymentToSelect.value;
    const amount = parseFloat(tripPaymentAmountInput.value);
    
    if (from === '' || to === '' || isNaN(amount) || amount <= 0) {
        alert('Please fill all fields correctly!');
        return;
    }
    
    if (from === to) {
        alert('Cannot pay to yourself!');
        return;
    }
    
    const payment = {
        id: generateID(),
        from: from,
        to: to,
        amount: amount,
        date: new Date().toISOString()
    };
    
    trip.payments.push(payment);
    saveTrips();
    
    updateParticipantStats();
    updateSettlements();
    
    tripPaymentFromSelect.value = '';
    tripPaymentToSelect.value = '';
    tripPaymentAmountInput.value = '';
    
    alert(`Payment recorded: ${from} paid ₹${amount.toFixed(2)} to ${to}`);
}

function updatePaymentSelects() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    tripPaymentFromSelect.innerHTML = '<option value="">Who is paying?</option>';
    tripPaymentToSelect.innerHTML = '<option value="">To whom?</option>';
    
    trip.participants.forEach(participant => {
        const optionFrom = document.createElement('option');
        optionFrom.value = participant;
        optionFrom.textContent = participant;
        tripPaymentFromSelect.appendChild(optionFrom);
        
        const optionTo = document.createElement('option');
        optionTo.value = participant;
        optionTo.textContent = participant;
        tripPaymentToSelect.appendChild(optionTo);
    });
}

// Statistics & Summary
function updateTripStats() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    const totalSpent = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
    tripTotalSpent.textContent = `₹${totalSpent.toFixed(2)}`;
    
    if (trip.budget) {
        tripBudgetDisplay.textContent = `₹${trip.budget.toFixed(2)}`;
        const remaining = trip.budget - totalSpent;
        tripRemaining.textContent = `₹${remaining.toFixed(2)}`;
        
        if (remaining < 0) {
            tripRemaining.style.color = '#ff0000';
        } else {
            tripRemaining.style.color = '#000';
        }
        
        // Budget alerts
        const percentUsed = (totalSpent / trip.budget) * 100;
        
        if (percentUsed >= 100) {
            budgetAlert.textContent = '⚠️ Budget exceeded!';
            budgetAlert.className = 'budget-alert error';
            budgetAlert.style.display = 'block';
        } else if (percentUsed >= 90) {
            budgetAlert.textContent = '⚠️ 90% of budget used!';
            budgetAlert.className = 'budget-alert warning';
            budgetAlert.style.display = 'block';
        } else if (percentUsed >= 75) {
            budgetAlert.textContent = '💡 75% of budget used';
            budgetAlert.className = 'budget-alert info';
            budgetAlert.style.display = 'block';
        } else {
            budgetAlert.style.display = 'none';
        }
    } else {
        tripBudgetDisplay.textContent = 'No Limit';
        tripRemaining.textContent = '-';
        budgetAlert.style.display = 'none';
    }
    
    // Per person
    if (trip.participants.length > 0) {
        const perPerson = totalSpent / trip.participants.length;
        tripPerPerson.textContent = `₹${perPerson.toFixed(2)}`;
    } else {
        tripPerPerson.textContent = '₹0.00';
    }
}

function updateSummary() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    const totalExpense = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
    totalExpensesEl.textContent = `₹${totalExpense.toFixed(2)}`;
    
    // Calculate total days
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    totalDaysEl.textContent = diffDays;
}

function updateParticipantStats() {
    const trip = getCurrentTrip();
    if (!trip || trip.participants.length === 0 || trip.expenses.length === 0) {
        participantStatsEl.classList.remove('visible');
        return;
    }
    
    participantStatsEl.classList.add('visible');
    
    const balances = {};
    trip.participants.forEach(participant => {
        balances[participant] = { paid: 0, owes: 0, balance: 0 };
    });
    
    // Calculate from expenses
    trip.expenses.forEach(expense => {
        if (balances[expense.paidBy]) {
            balances[expense.paidBy].paid += expense.amount;
        }
        
        const splitMembers = expense.splitAmong || trip.participants;
        const sharePerPerson = expense.amount / splitMembers.length;
        
        splitMembers.forEach(participant => {
            if (balances[participant]) {
                balances[participant].owes += sharePerPerson;
            }
        });
    });
    
    // Apply payments
    trip.payments.forEach(payment => {
        if (balances[payment.from]) {
            balances[payment.from].paid += payment.amount;
        }
        if (balances[payment.to]) {
            balances[payment.to].owes += payment.amount;
        }
    });
    
    // Calculate final balance
    Object.keys(balances).forEach(participant => {
        balances[participant].balance = balances[participant].paid - balances[participant].owes;
    });
    
    participantStatsEl.innerHTML = '<h4 style="margin: 0 0 10px 0; color: #333;">💳 Individual Summary</h4>';
    
    trip.participants.forEach(participant => {
        const stat = balances[participant];
        const div = document.createElement('div');
        div.className = 'member-stat-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'member-stat-name';
        nameSpan.textContent = participant;
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'member-stat-amount';
        
        if (Math.abs(stat.balance) < 0.01) {
            amountSpan.textContent = 'Settled ✓';
            amountSpan.classList.add('neutral');
        } else if (stat.balance > 0) {
            amountSpan.textContent = `+₹${stat.balance.toFixed(2)} (gets back)`;
            amountSpan.classList.add('positive');
        } else {
            amountSpan.textContent = `-₹${Math.abs(stat.balance).toFixed(2)} (owes)`;
            amountSpan.classList.add('negative');
        }
        
        div.appendChild(nameSpan);
        div.appendChild(amountSpan);
        participantStatsEl.appendChild(div);
    });
}

function updateSettlements() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    tripSettlementsListEl.innerHTML = '';
    
    if (trip.participants.length === 0 || trip.expenses.length === 0) {
        tripSettlementsListEl.innerHTML = '<p class="empty-message">Add participants and expenses to see settlements</p>';
        return;
    }
    
    const balances = {};
    trip.participants.forEach(participant => {
        balances[participant] = 0;
    });
    
    // Calculate balances
    trip.expenses.forEach(expense => {
        if (balances.hasOwnProperty(expense.paidBy)) {
            balances[expense.paidBy] += expense.amount;
        }
        
        const splitMembers = expense.splitAmong || trip.participants;
        const sharePerPerson = expense.amount / splitMembers.length;
        
        splitMembers.forEach(participant => {
            if (balances.hasOwnProperty(participant)) {
                balances[participant] -= sharePerPerson;
            }
        });
    });
    
    // Apply payments
    trip.payments.forEach(payment => {
        if (balances[payment.from]) {
            balances[payment.from] += payment.amount;
        }
        if (balances[payment.to]) {
            balances[payment.to] -= payment.amount;
        }
    });
    
    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([participant, balance]) => {
        if (balance < -0.01) {
            debtors.push({ name: participant, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ name: participant, amount: balance });
        }
    });
    
    // Calculate settlements
    const settlements = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i].amount;
        const credit = creditors[j].amount;
        const settleAmount = Math.min(debt, credit);
        
        settlements.push({
            from: debtors[i].name,
            to: creditors[j].name,
            amount: settleAmount
        });
        
        debtors[i].amount -= settleAmount;
        creditors[j].amount -= settleAmount;
        
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }
    
    if (settlements.length === 0) {
        tripSettlementsListEl.innerHTML = '<p class="empty-message">All settled! No one owes anyone.</p>';
    } else {
        settlements.forEach(settlement => {
            const div = document.createElement('div');
            div.className = 'settlement-item';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'settlement-text';
            textSpan.textContent = `${settlement.from} pays ${settlement.to}`;
            
            const amountSpan = document.createElement('span');
            amountSpan.className = 'settlement-amount';
            amountSpan.textContent = `₹${settlement.amount.toFixed(2)}`;
            
            div.appendChild(textSpan);
            div.appendChild(amountSpan);
            tripSettlementsListEl.appendChild(div);
        });
    }
}

// Category Breakdown
function updateCategoryBreakdown() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    categoryBreakdownEl.innerHTML = '';
    
    if (trip.expenses.length === 0) {
        categoryBreakdownEl.innerHTML = '<p class="empty-message">No expenses yet</p>';
        return;
    }
    
    const categoryTotals = {};
    let totalAmount = 0;
    
    trip.expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
        totalAmount += expense.amount;
    });
    
    // Sort by amount descending
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / totalAmount) * 100;
        
        const div = document.createElement('div');
        div.className = 'category-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category;
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'category-amount';
        amountSpan.textContent = `₹${amount.toFixed(2)} (${percentage.toFixed(1)}%)`;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'category-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'category-bar';
        bar.style.width = `${percentage}%`;
        
        barContainer.appendChild(bar);
        
        div.appendChild(nameSpan);
        div.appendChild(amountSpan);
        div.appendChild(barContainer);
        
        categoryBreakdownEl.appendChild(div);
    });
}

// Day-wise Breakdown
function updateDayBreakdown() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    dayBreakdownEl.innerHTML = '';
    
    if (trip.expenses.length === 0) {
        dayBreakdownEl.innerHTML = '<p class="empty-message">No expenses yet</p>';
        return;
    }
    
    const dayTotals = {};
    
    trip.expenses.forEach(expense => {
        const dayKey = expense.day ? `Day ${expense.day}` : formatDateShort(expense.date);
        
        if (!dayTotals[dayKey]) {
            dayTotals[dayKey] = 0;
        }
        dayTotals[dayKey] += expense.amount;
    });
    
    // Sort by day number or date
    const sortedDays = Object.entries(dayTotals).sort((a, b) => {
        // Extract day numbers if available
        const dayA = a[0].match(/Day (\d+)/);
        const dayB = b[0].match(/Day (\d+)/);
        
        if (dayA && dayB) {
            return parseInt(dayA[1]) - parseInt(dayB[1]);
        }
        
        return a[0].localeCompare(b[0]);
    });
    
    sortedDays.forEach(([day, amount]) => {
        const div = document.createElement('div');
        div.className = 'day-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'day-name';
        nameSpan.textContent = day;
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'day-amount';
        amountSpan.textContent = `₹${amount.toFixed(2)}`;
        
        div.appendChild(nameSpan);
        div.appendChild(amountSpan);
        
        dayBreakdownEl.appendChild(div);
    });
}

// Export Functions
function exportCSV() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }
    
    let csv = `Trip Name: ${trip.name}\n`;
    csv += `Dates: ${trip.startDate} to ${trip.endDate}\n`;
    csv += `Participants: ${trip.participants.join(', ')}\n\n`;
    
    csv += 'Date,Day,Category,Description,Paid By,Amount,Split Among\n';
    
    trip.expenses.forEach(expense => {
        const splitInfo = expense.splitAmong ? expense.splitAmong.join('; ') : 'All participants';
        const dayInfo = expense.day || '';
        csv += `${expense.date},${dayInfo},"${expense.category}","${expense.description}",${expense.paidBy},${expense.amount.toFixed(2)},"${splitInfo}"\n`;
    });
    
    csv += '\n\nSettlements:\n';
    csv += 'From,To,Amount\n';
    
    const settlements = calculateSettlementsForExport(trip);
    settlements.forEach(settlement => {
        csv += `${settlement.from},${settlement.to},${settlement.amount.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportPDF() {
    const trip = getCurrentTrip();
    if (!trip) return;
    
    if (trip.expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(trip.name, 105, 20, { align: 'center' });
    
    // Dates
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${formatDateLong(trip.startDate)} - ${formatDateLong(trip.endDate)}`, 105, 28, { align: 'center' });
    
    // Participants
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Participants:', 20, 40);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(trip.participants.join(', '), 20, 47);
    
    // Summary
    const totalExpense = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary:', 20, 58);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Expenses: ₹${totalExpense.toFixed(2)}`, 20, 65);
    doc.text(`Number of Expenses: ${trip.expenses.length}`, 20, 72);
    if (trip.budget) {
        doc.text(`Budget: ₹${trip.budget.toFixed(2)}`, 20, 79);
        doc.text(`Remaining: ₹${(trip.budget - totalExpense).toFixed(2)}`, 20, 86);
    }
    
    // Settlements
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    let y = trip.budget ? 97 : 85;
    doc.text('Settlements:', 20, y);
    
    y += 8;
    const settlements = calculateSettlementsForExport(trip);
    
    if (settlements.length === 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('All settled!', 20, y);
        y += 10;
    } else {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        settlements.forEach(settlement => {
            doc.text(`${settlement.from} pays ${settlement.to}: ₹${settlement.amount.toFixed(2)}`, 20, y);
            y += 7;
        });
        y += 5;
    }
    
    // Expenses
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Expenses:', 20, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.text('Date', 20, y);
    doc.text('Category', 50, y);
    doc.text('Description', 95, y);
    doc.text('Paid By', 145, y);
    doc.text('Amount', 175, y);
    doc.line(20, y + 2, 200, y + 2);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    trip.expenses.forEach(expense => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        const dateObj = new Date(expense.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short'
        });
        
        // Remove emoji from category for PDF export
        const categoryText = expense.category.replace(/^[^\w\s]+\s*/, '').substring(0, 12);
        const desc = expense.description.length > 18 ? expense.description.substring(0, 18) + '...' : expense.description;
        const paidBy = expense.paidBy.substring(0, 12);
        // Remove any prefix characters and convert to proper number
        const cleanAmount = parseFloat(String(expense.amount).replace(/^[^\d.]+/, ''));
        const amount = `₹${cleanAmount.toFixed(2)}`;
        
        doc.text(formattedDate, 20, y);
        doc.text(categoryText, 50, y);
        doc.text(desc, 95, y);
        doc.text(paidBy, 145, y);
        doc.text(amount, 175, y);
        y += 7;
    });
    
    doc.save(`${trip.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
}

function calculateSettlementsForExport(trip) {
    if (trip.participants.length === 0 || trip.expenses.length === 0) {
        return [];
    }
    
    const balances = {};
    trip.participants.forEach(participant => {
        balances[participant] = 0;
    });
    
    trip.expenses.forEach(expense => {
        if (balances.hasOwnProperty(expense.paidBy)) {
            balances[expense.paidBy] += expense.amount;
        }
        
        const splitMembers = expense.splitAmong || trip.participants;
        const sharePerPerson = expense.amount / splitMembers.length;
        
        splitMembers.forEach(participant => {
            if (balances.hasOwnProperty(participant)) {
                balances[participant] -= sharePerPerson;
            }
        });
    });
    
    trip.payments.forEach(payment => {
        if (balances[payment.from]) {
            balances[payment.from] += payment.amount;
        }
        if (balances[payment.to]) {
            balances[payment.to] -= payment.amount;
        }
    });
    
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([participant, balance]) => {
        if (balance < -0.01) {
            debtors.push({ name: participant, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ name: participant, amount: balance });
        }
    });
    
    const settlements = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i].amount;
        const credit = creditors[j].amount;
        const settleAmount = Math.min(debt, credit);
        
        settlements.push({
            from: debtors[i].name,
            to: creditors[j].name,
            amount: settleAmount
        });
        
        debtors[i].amount -= settleAmount;
        creditors[j].amount -= settleAmount;
        
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }
    
    return settlements;
}

// Utility Functions
function generateID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveTrips() {
    localStorage.setItem('trips', JSON.stringify(trips));
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Initialize the app
init();



