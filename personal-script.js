// Personal Monthly Expense Tracker Script

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

// Initialize expenses array from localStorage or empty array
let expenses = [];
let customCategories = [];

try {
    const storedExpenses = localStorage.getItem('personalExpenses');
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
} catch (e) {
    console.error('Error loading expenses from localStorage:', e);
    expenses = [];
}

try {
    const storedCategories = localStorage.getItem('personalCustomCategories');
    customCategories = storedCategories ? JSON.parse(storedCategories) : [];
} catch (e) {
    console.error('Error loading custom categories from localStorage:', e);
    customCategories = [];
}

// Default categories
const defaultCategories = ['Food', 'Entertainment', 'Transport', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];

// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const expenseName = document.getElementById('expenseName');
const expenseAmount = document.getElementById('expenseAmount');
const expenseCategory = document.getElementById('expenseCategory');
const customCategoryGroup = document.getElementById('customCategoryGroup');
const customCategory = document.getElementById('customCategory');
const expensesTableBody = document.getElementById('expensesTableBody');
const totalAmountElement = document.getElementById('totalAmount');
const clearAllBtn = document.getElementById('clearAllBtn');
const categoryFilter = document.getElementById('categoryFilter');
const categorySummary = document.getElementById('categorySummary');
const noExpenses = document.getElementById('noExpenses');

// Verify all required DOM elements exist
function checkDOMElements() {
    const requiredElements = {
        expenseForm, expenseName, expenseAmount, expenseCategory,
        customCategoryGroup, customCategory, expensesTableBody,
        totalAmountElement, clearAllBtn, categoryFilter, categorySummary, noExpenses
    };
    
    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`Required DOM element '${name}' not found. Please check your HTML.`);
            return false;
        }
    }
    return true;
}

// Initialize the app
function init() {
    if (!checkDOMElements()) {
        console.error('Missing required DOM elements. App initialization failed.');
        return false;
    }
    
    updateCategoryDropdown();
    updateFilterDropdown();
    displayExpenses();
    updateTotalAmount();
    updateCategorySummary();
}

// Show/hide custom category input
expenseCategory.addEventListener('change', function() {
    if (this.value === 'custom') {
        customCategoryGroup.style.display = 'block';
        customCategory.required = true;
    } else {
        customCategoryGroup.style.display = 'none';
        customCategory.required = false;
        customCategory.value = '';
    }
});

// Helper function to safely save to localStorage
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
        alert('Unable to save data. Your changes may not persist.');
        return false;
    }
}

// Handle form submission
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let category = expenseCategory.value;
    
    // Handle custom category
    if (category === 'custom') {
        const newCategory = customCategory.value.trim();
        if (newCategory === '') {
            alert('Please enter a category name');
            return;
        }
        category = newCategory;
        
        // Add to custom categories if not already present
        if (!customCategories.includes(category) && !defaultCategories.includes(category)) {
            customCategories.push(category);
            saveToLocalStorage('personalCustomCategories', customCategories);
            updateCategoryDropdown();
            updateFilterDropdown();
        }
    }
    
    // Validate inputs
    const name = expenseName.value.trim();
    const amount = parseFloat(expenseAmount.value);
    
    if (!name || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid expense name and amount');
        return;
    }
    
    // Create expense object
    const expense = {
        id: Date.now(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };
    
    // Add to expenses array
    expenses.unshift(expense); // Add to beginning of array
    
    // Save to localStorage
    saveToLocalStorage('personalExpenses', expenses);
    
    // Update UI
    displayExpenses();
    updateTotalAmount();
    updateCategorySummary();
    
    // Reset form
    expenseForm.reset();
    customCategoryGroup.style.display = 'none';
    customCategory.required = false;
    
    // Show success feedback
    showNotification('Expense added successfully!');
});

// Update category dropdown with custom categories
function updateCategoryDropdown() {
    const currentValue = expenseCategory.value;
    const customOption = expenseCategory.querySelector('option[value="custom"]');
    
    // Remove old custom category options
    const options = expenseCategory.querySelectorAll('option');
    options.forEach(option => {
        if (!defaultCategories.includes(option.value) && option.value !== 'custom') {
            option.remove();
        }
    });
    
    // Add custom categories
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        expenseCategory.insertBefore(option, customOption);
    });
    
    // Restore previous value if it still exists
    if (currentValue && currentValue !== 'custom') {
        expenseCategory.value = currentValue;
    }
}

// Update filter dropdown
function updateFilterDropdown() {
    const allCategories = [...new Set([...defaultCategories, ...customCategories])];
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add all unique categories
    allCategories.sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}

// Display expenses in table
function displayExpenses(filter = 'all') {
    if (!expensesTableBody) return;
    
    expensesTableBody.innerHTML = '';
    
    const filteredExpenses = filter === 'all' 
        ? expenses 
        : expenses.filter(exp => exp.category === filter);
    
    const expensesTable = document.getElementById('expensesTable');
    
    if (filteredExpenses.length === 0) {
        if (noExpenses) noExpenses.style.display = 'block';
        if (expensesTable) expensesTable.style.display = 'none';
        return;
    }
    
    if (noExpenses) noExpenses.style.display = 'none';
    if (expensesTable) expensesTable.style.display = 'table';
    
    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${expense.name}</td>
            <td><span class="category-tag">${expense.category}</span></td>
            <td class="amount-cell">₹${expense.amount.toFixed(2)}</td>
            <td>
                <button class="delete-btn small-btn" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        `;
        
        expensesTableBody.appendChild(row);
    });
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveToLocalStorage('personalExpenses', expenses);
        displayExpenses(categoryFilter.value);
        updateTotalAmount();
        updateCategorySummary();
        showNotification('Expense deleted successfully!');
    }
}

// Clear all expenses
clearAllBtn.addEventListener('click', function() {
    if (expenses.length === 0) {
        alert('No expenses to clear!');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
        expenses = [];
        saveToLocalStorage('personalExpenses', expenses);
        displayExpenses();
        updateTotalAmount();
        updateCategorySummary();
        showNotification('All expenses cleared!');
    }
});

// Update total amount
function updateTotalAmount() {
    if (!totalAmountElement) return;
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalAmountElement.textContent = total.toFixed(2);
}

// Update category summary
function updateCategorySummary() {
    if (!categorySummary) return;
    
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });
    
    categorySummary.innerHTML = '';
    
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    sortedCategories.forEach(([category, amount]) => {
        const badge = document.createElement('div');
        badge.className = 'category-badge';
        badge.innerHTML = `
            <span class="category-name">${category}</span>
            <span class="category-amount">₹${amount.toFixed(2)}</span>
        `;
        categorySummary.appendChild(badge);
    });
}

// Filter expenses by category
categoryFilter.addEventListener('change', function() {
    displayExpenses(this.value);
});

// Show notification (simple alert, can be enhanced with better UI)
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

