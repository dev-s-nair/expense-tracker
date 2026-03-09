// Group Expense Tracker

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
let members = JSON.parse(localStorage.getItem('groupMembers')) || [];
let transactions = JSON.parse(localStorage.getItem('groupTransactions')) || [];
let payments = JSON.parse(localStorage.getItem('groupPayments')) || [];

// DOM Elements
const memberNameInput = document.getElementById('member-name');
const addMemberBtn = document.getElementById('add-member-btn');
const membersListEl = document.getElementById('members-list');
const memberStatsEl = document.getElementById('member-stats');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const paidBySelect = document.getElementById('paid-by');
const amountInput = document.getElementById('amount');
const splitEquallyCheckbox = document.getElementById('split-equally');
const splitAmongGroup = document.getElementById('split-among-group');
const splitMembersListEl = document.getElementById('split-members-list');
const form = document.getElementById('form');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionListEl = document.getElementById('transaction-list');
const settlementsListEl = document.getElementById('settlements-list');
const paymentForm = document.getElementById('payment-form');
const paymentFromSelect = document.getElementById('payment-from');
const paymentToSelect = document.getElementById('payment-to');
const paymentAmountInput = document.getElementById('payment-amount');

// Visualization Modal Elements

// Initialize the app
function init() {
    dateInput.valueAsDate = new Date();
    members = JSON.parse(localStorage.getItem('groupMembers')) || [];
    updateMembersList();
    updatePaidBySelect();
    updateSplitMembersList();
    updatePaymentSelects();
    updateTransactionList();
    updateSummary();
    updateMemberStats();
    calculateSettlements();
    
    splitEquallyCheckbox.addEventListener('change', function() {
        if (this.checked) {
            splitAmongGroup.style.display = 'none';
        } else {
            splitAmongGroup.style.display = 'block';
        }
    });
}

// Add member
function addMember() {
    const memberName = memberNameInput.value.trim();
    if (memberName === '') {
        alert('Please enter a member name');
        return;
    }
    if (members.includes(memberName)) {
        alert('Member already exists');
        return;
    }
    members.push(memberName);
    localStorage.setItem('groupMembers', JSON.stringify(members));
    updateMembersList();
    updatePaidBySelect();
    updateSplitMembersList();
    updatePaymentSelects();
    updateMemberStats();
    calculateSettlements();
    memberNameInput.value = '';
    console.log('Member added:', memberName, 'Current members:', members);
}

// Remove member
function removeMember(memberName) {
    const hasTransactions = transactions.some(t => t.paidBy === memberName);
    if (hasTransactions) {
        if (!confirm(`${memberName} has existing expenses. Remove anyway?`)) {
            return;
        }
    }
    members = members.filter(m => m !== memberName);
    localStorage.setItem('groupMembers', JSON.stringify(members));
    updateMembersList();
    updatePaidBySelect();
    updateSplitMembersList();
    updatePaymentSelects();
    updateMemberStats();
    calculateSettlements();
    console.log('Member removed:', memberName, 'Current members:', members);
}

// Update members list display
function updateMembersList() {
    membersListEl.innerHTML = '';
    
    members.forEach(member => {
        const chip = document.createElement('div');
        chip.className = 'member-chip';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = member;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-member';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeMember(member);
        chip.appendChild(nameSpan);
        chip.appendChild(removeBtn);
        membersListEl.appendChild(chip);
    });
    // Update visualize button state - only enable if more than 2 members
    if (typeof visualizeBtn !== 'undefined' && visualizeBtn) {
        visualizeBtn.disabled = members.length <= 2;
        visualizeBtn.style.opacity = members.length <= 2 ? '0.5' : '1';
        visualizeBtn.title = members.length <= 2 ? 'Need at least 3 members to visualize' : 'Visualize the situation';
    }
}

// Update paid-by dropdown
function updatePaidBySelect() {
    const currentValue = paidBySelect.value;
    paidBySelect.innerHTML = '<option value="">Select member...</option>';
    // Use current members array only
    members.forEach(member => {
        if (typeof member === 'string' && member.trim() !== '') {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            paidBySelect.appendChild(option);
        }
    });
    if (members.includes(currentValue)) {
        paidBySelect.value = currentValue;
    }
}

// Update split members checkboxes
function updateSplitMembersList() {
    splitMembersListEl.innerHTML = '';
    
    members.forEach((member, index) => {
        const div = document.createElement('div');
        div.className = 'split-member-checkbox selected';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `split-member-${index}`;
        checkbox.value = member;
        checkbox.checked = true;
        const label = document.createElement('label');
        label.htmlFor = `split-member-${index}`;
        label.textContent = member;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                div.classList.add('selected');
            } else {
                div.classList.remove('selected');
            }
        });
        div.appendChild(checkbox);
        div.appendChild(label);
        splitMembersListEl.appendChild(div);
    });
}

// Update payment form selects
function updatePaymentSelects() {
    paymentFromSelect.disabled = false;
    paymentToSelect.disabled = false;
    let fromOptionsHTML = '<option value="">Who is paying?</option>';
    let toOptionsHTML = '<option value="">To whom?</option>';
    // Use current members array only
    members.forEach(member => {
        if (typeof member === 'string' && member.trim() !== '') {
            fromOptionsHTML += `<option value="${member}">${member}</option>`;
            toOptionsHTML += `<option value="${member}">${member}</option>`;
        }
    });
    paymentFromSelect.innerHTML = fromOptionsHTML;
    paymentToSelect.innerHTML = toOptionsHTML;
}

// Add payment
function addPayment(e) {
    e.preventDefault();
    
    const from = paymentFromSelect.value;
    const to = paymentToSelect.value;
    const amount = parseFloat(paymentAmountInput.value);
    
    if (from === '' || to === '' || isNaN(amount) || amount <= 0) {
        alert('Please fill all fields correctly');
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
    
    payments.push(payment);
    saveToLocalStorage();
    updateMemberStats();
    calculateSettlements();
    
    paymentFromSelect.value = '';
    paymentToSelect.value = '';
    paymentAmountInput.value = '';
    
    alert(`Payment recorded: ${from} paid Rs.${amount.toFixed(2)} to ${to}`);
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();
    
    if (members.length === 0) {
        alert('Please add members first');
        return;
    }
    
    const date = dateInput.value;
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const paidBy = paidBySelect.value;
    const splitEqually = splitEquallyCheckbox.checked;
    
    let splitAmong = [];
    if (splitEqually) {
        splitAmong = [...members];
    } else {
        const checkboxes = splitMembersListEl.querySelectorAll('input[type="checkbox"]:checked');
        splitAmong = Array.from(checkboxes).map(cb => cb.value);
        
        if (splitAmong.length === 0) {
            alert('Please select at least one member to split the expense');
            return;
        }
    }
    
    if (description === '' || isNaN(amount) || amount <= 0 || date === '' || paidBy === '') {
        alert('Please fill all fields correctly');
        return;
    }
    
    const transaction = {
        id: generateID(),
        date: date,
        description: description,
        amount: amount,
        paidBy: paidBy,
        splitEqually: splitEqually,
        splitAmong: splitAmong
    };
    
    transactions.push(transaction);
    saveToLocalStorage();
    updateTransactionList();
    updateSummary();
    updateMemberStats();
    calculateSettlements();
    
    dateInput.valueAsDate = new Date();
    descriptionInput.value = '';
    amountInput.value = '';
    paidBySelect.value = '';
    splitEquallyCheckbox.checked = true;
    splitAmongGroup.style.display = 'none';
    updateSplitMembersList();
}

// Generate unique ID
function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

// Update transaction list in UI
function updateTransactionList() {
    transactionListEl.innerHTML = '';
    
    transactions.forEach(transaction => {
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const splitInfo = transaction.splitEqually 
            ? 'All members' 
            : transaction.splitAmong.join(', ');
        
        const li = document.createElement('li');
        li.className = 'transaction-item expense';
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'transaction-details';
        
        const descSpan = document.createElement('span');
        descSpan.className = 'description';
        descSpan.textContent = transaction.description;
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = `${formattedDate} • Paid by: ${transaction.paidBy}`;
        
        const splitSpan = document.createElement('span');
        splitSpan.className = 'date';
        splitSpan.textContent = `Split among: ${splitInfo}`;
        
        detailsDiv.appendChild(descSpan);
        detailsDiv.appendChild(dateSpan);
        detailsDiv.appendChild(splitSpan);
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'amount expense';
        amountSpan.textContent = `Rs.${transaction.amount.toFixed(2)}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTransaction(transaction.id);
        
        li.appendChild(detailsDiv);
        li.appendChild(amountSpan);
        li.appendChild(deleteBtn);
        
        transactionListEl.appendChild(li);
    });
}

// Update summary
function updateSummary() {
    const totalExpense = transactions.reduce((acc, t) => acc + t.amount, 0);
    
    const allSplitEqually = transactions.every(t => t.splitEqually);
    const avgPerPerson = allSplitEqually && members.length > 0 ? totalExpense / members.length : 0;
    
    balanceEl.textContent = `Rs.${totalExpense.toFixed(2)}`;
    incomeEl.textContent = `Rs.${totalExpense.toFixed(2)}`;
    
    if (allSplitEqually && members.length > 0) {
        expenseEl.textContent = `Rs.${avgPerPerson.toFixed(2)}`;
    } else {
        expenseEl.textContent = 'Varies';
    }
}

// Update member statistics
function updateMemberStats() {
    if (members.length === 0 || transactions.length === 0) {
        memberStatsEl.classList.remove('visible');
        return;
    }
    
    memberStatsEl.classList.add('visible');
    
    const memberBalances = {};
    members.forEach(member => {
        memberBalances[member] = { paid: 0, owes: 0, balance: 0 };
    });
    
    transactions.forEach(transaction => {
        if (memberBalances[transaction.paidBy]) {
            memberBalances[transaction.paidBy].paid += transaction.amount;
        }
        
        const splitMembers = transaction.splitAmong || members;
        const sharePerPerson = transaction.amount / splitMembers.length;
        
        splitMembers.forEach(member => {
            if (memberBalances[member]) {
                memberBalances[member].owes += sharePerPerson;
            }
        });
    });
    
    payments.forEach(payment => {
        if (memberBalances[payment.from]) {
            memberBalances[payment.from].paid += payment.amount;
        }
        if (memberBalances[payment.to]) {
            memberBalances[payment.to].owes += payment.amount;
        }
    });
    
    Object.keys(memberBalances).forEach(member => {
        memberBalances[member].balance += memberBalances[member].paid - memberBalances[member].owes;
    });
    
    memberStatsEl.innerHTML = '<h4 style="margin: 0 0 10px 0; color: #333;">💳 Individual Summary</h4>';
    
    members.forEach(member => {
        const stat = memberBalances[member];
        const div = document.createElement('div');
        div.className = 'member-stat-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'member-stat-name';
        nameSpan.textContent = member;
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'member-stat-amount';
        
        if (Math.abs(stat.balance) < 0.01) {
            amountSpan.textContent = 'Settled ✓';
            amountSpan.classList.add('neutral');
        } else if (stat.balance > 0) {
            amountSpan.textContent = `+Rs.${stat.balance.toFixed(2)} (gets back)`;
            amountSpan.classList.add('positive');
        } else {
            amountSpan.textContent = `-Rs.${Math.abs(stat.balance).toFixed(2)} (owes)`;
            amountSpan.classList.add('negative');
        }
        
        div.appendChild(nameSpan);
        div.appendChild(amountSpan);
        memberStatsEl.appendChild(div);
    });
}

// Calculate settlements
function calculateSettlements() {
    settlementsListEl.innerHTML = '';
    
    if (members.length === 0 || transactions.length === 0) {
        settlementsListEl.innerHTML = '<p class="empty-message">Add members and expenses to see settlements</p>';
        return;
    }
    
    const balances = {};
    members.forEach(member => {
        balances[member] = 0;
    });
    
    transactions.forEach(transaction => {
        if (balances.hasOwnProperty(transaction.paidBy)) {
            balances[transaction.paidBy] += transaction.amount;
        }
        
        const splitMembers = transaction.splitAmong || members;
        const sharePerPerson = transaction.amount / splitMembers.length;
        
        splitMembers.forEach(member => {
            if (balances.hasOwnProperty(member)) {
                balances[member] -= sharePerPerson;
            }
        });
    });
    
    payments.forEach(payment => {
        if (balances[payment.from]) {
            balances[payment.from] += payment.amount;
        }
        if (balances[payment.to]) {
            balances[payment.to] -= payment.amount;
        }
    });
    
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([member, balance]) => {
        if (balance < -0.01) {
            debtors.push({ name: member, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ name: member, amount: balance });
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
    
    if (settlements.length === 0) {
        settlementsListEl.innerHTML = '<p class="empty-message">All settled! No one owes anyone.</p>';
    } else {
        settlements.forEach(settlement => {
            const div = document.createElement('div');
            div.className = 'settlement-item';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'settlement-text';
            textSpan.textContent = `${settlement.from} pays ${settlement.to}`;
            
            const amountSpan = document.createElement('span');
            amountSpan.className = 'settlement-amount';
            amountSpan.textContent = `Rs.${settlement.amount.toFixed(2)}`;
            
            div.appendChild(textSpan);
            div.appendChild(amountSpan);
            settlementsListEl.appendChild(div);
        });
    }
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveToLocalStorage();
    updateTransactionList();
    updateSummary();
    updateMemberStats();
    calculateSettlements();
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('groupTransactions', JSON.stringify(transactions));
    localStorage.setItem('groupMembers', JSON.stringify(members));
    localStorage.setItem('groupPayments', JSON.stringify(payments));
}

// Clear all data
function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL data? This will delete all members, expenses, and payments. This action cannot be undone!')) {
        return;
    }
    
    if (!confirm('Final confirmation: Clear everything?')) {
        return;
    }
    
    transactions = [];
    members = [];
    payments = [];
    
    localStorage.removeItem('groupTransactions');
    localStorage.removeItem('groupMembers');
    localStorage.removeItem('groupPayments');
    
    updateMembersList();
    updatePaidBySelect();
    updateSplitMembersList();
    updatePaymentSelects();
    updateTransactionList();
    updateSummary();
    updateMemberStats();
    calculateSettlements();
    
    alert('All data has been cleared successfully!');
}

// Download as CSV
function downloadCSV() {
    if (transactions.length === 0) {
        alert('No transactions to download!');
        return;
    }
    
    let csv = 'Date,Description,Paid By,Amount,Split Among\n';
    
    transactions.forEach(transaction => {
        const splitInfo = transaction.splitAmong ? transaction.splitAmong.join('; ') : 'All members';
        csv += `${transaction.date},"${transaction.description}",${transaction.paidBy},${transaction.amount.toFixed(2)},"${splitInfo}"\n`;
    });
    
    csv += '\n\nSettlements:\n';
    csv += 'From,To,Amount\n';
    
    const settlements = calculateSettlementsForExport();
    settlements.forEach(settlement => {
        csv += `${settlement.from},${settlement.to},${settlement.amount.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Download as PDF
function downloadPDF() {
    if (transactions.length === 0) {
        alert('No transactions to download!');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Group Expense Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 28, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Members:', 20, 40);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(members.join(', '), 20, 47);
    
    const totalExpense = transactions.reduce((acc, t) => acc + t.amount, 0);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary:', 20, 58);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Expenses: Rs.${totalExpense.toFixed(2)}`, 20, 65);
    doc.text(`Number of Expenses: ${transactions.length}`, 20, 72);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Settlements:', 20, 85);
    
    let y = 93;
    const settlements = calculateSettlementsForExport();
    
    if (settlements.length === 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('All settled!', 20, y);
        y += 10;
    } else {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        settlements.forEach(settlement => {
            doc.text(`${settlement.from} pays ${settlement.to}: Rs.${settlement.amount.toFixed(2)}`, 20, y);
            y += 7;
        });
        y += 5;
    }
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Expenses:', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.text('Date', 20, y);
    doc.text('Description', 50, y);
    doc.text('Paid By', 110, y);
    doc.text('Split', 145, y);
    doc.text('Amount', 170, y);
    doc.line(20, y + 2, 200, y + 2);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    transactions.forEach(transaction => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const splitInfo = transaction.splitAmong 
            ? transaction.splitAmong.length === members.length ? 'All' : `${transaction.splitAmong.length}p`
            : 'All';
        
        const desc = transaction.description.length > 30 ? transaction.description.substring(0, 30) + '...' : transaction.description;
        const paidBy = transaction.paidBy.substring(0, 12);
        // Remove any prefix characters and convert to proper number
        const cleanAmount = parseFloat(String(transaction.amount).replace(/^[^\d.]+/, ''));
        const amount = `Rs.${cleanAmount.toFixed(2)}`;
        
        doc.text(formattedDate, 20, y);
        doc.text(desc, 50, y);
        doc.text(paidBy, 110, y);
        doc.text(splitInfo, 145, y);
        doc.text(amount, 170, y);
        y += 7;
    });
    
    doc.save(`group-expenses-${new Date().toISOString().split('T')[0]}.pdf`);
}

function calculateSettlementsForExport() {
    if (members.length === 0 || transactions.length === 0) {
        return [];
    }
    
    const balances = {};
    members.forEach(member => {
        balances[member] = 0;
    });
    
    transactions.forEach(transaction => {
        if (balances.hasOwnProperty(transaction.paidBy)) {
            balances[transaction.paidBy] += transaction.amount;
        }
        
        const splitMembers = transaction.splitAmong || members;
        const sharePerPerson = transaction.amount / splitMembers.length;
        
        splitMembers.forEach(member => {
            if (balances.hasOwnProperty(member)) {
                balances[member] -= sharePerPerson;
            }
        });
    });
    
    payments.forEach(payment => {
        if (balances[payment.from]) {
            balances[payment.from] += payment.amount;
        }
        if (balances[payment.to]) {
            balances[payment.to] -= payment.amount;
        }
    });
    
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([member, balance]) => {
        if (balance < -0.01) {
            debtors.push({ name: member, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ name: member, amount: balance });
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

// Event listeners
form.addEventListener('submit', addTransaction);
paymentForm.addEventListener('submit', addPayment);
addMemberBtn.addEventListener('click', addMember);
memberNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addMember();
    }
});
document.getElementById('download-csv').addEventListener('click', downloadCSV);
document.getElementById('download-pdf').addEventListener('click', downloadPDF);
document.getElementById('clear-all-btn').addEventListener('click', clearAllData);


// CALL INIT LAST
init();