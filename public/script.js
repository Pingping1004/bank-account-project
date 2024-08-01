let accounts = [];
let usernames = [];

let isInflow = null;
let totalBalance = 0;
let bankBalance = 0;
let dividendsPaid = 0;
let totalDividendPaid = 0;
let totalLending = 0;

//add expense section
const depositBtn = document.querySelector('#deposit-btn');
const withdrawalBtn = document.querySelector('#withdrawal-btn');
const accountNameInput = document.querySelector('.account-input');
const accountAmountInput = document.querySelector('.amount-input');
const addAccountBtn = document.querySelector('#add-transaction-btn');
const deleteAccountBtn = document.querySelector('.delete-account-btn');

//show account
const accountList = document.querySelector('.account-list');

//add user
const addUserBtn = document.querySelector('#add-user-btn');
const addUserInput = document.querySelector('#add-user-input');
//delete user
const deleteUserBtn = document.querySelector('#delete-user-btn');
const deleteUserSelect = document.querySelector('#delete-user')

//update username list
const filterUserSelect = document.querySelector('#filter-user-select');

//user filter
const applyFilterBtn = document.querySelector('#apply-filter-btn');

//dashboard information
const lendingElement = document.querySelector('#lending-money');
const bankBalanceElement = document.querySelector('#bank-balance');
const dividendsPaidElement = document.querySelector('#dividend-paid');

depositBtn.addEventListener('click', () => isInflow = true, accounts.flowType = "inflow");
withdrawalBtn.addEventListener('click', () => isInflow = false, accounts.flowType = "outflow");

//make the click button to be primary format and make another one to be outline format
depositBtn.addEventListener('click', (event) => {
    event.preventDefault();
    depositBtn.classList.add('btn-primary');
    depositBtn.classList.remove('btn-outline-primary');

    if (withdrawalBtn.classList.contains('btn-danger')) {
        withdrawalBtn.classList.remove('btn-danger');
        withdrawalBtn.classList.add('btn-outline-danger');
    }

    isInflow = true;
});

withdrawalBtn.addEventListener('click', (event) => {
    event.preventDefault();
    withdrawalBtn.classList.add('btn-danger');
    withdrawalBtn.classList.remove('btn-outline-danger');

    if (depositBtn.classList.contains('btn-primary')) {
        depositBtn.classList.remove('btn-primary');
        depositBtn.classList.add('btn-outline-primary');
    }

    isInflow = false;
});

// alert("Using admin account as a bank account");
// alert("Set the initial cash in bank");

// Fetch transactions on page load if user is logged in
document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        // fetchTransactions(userId);
        await updateRenderTransactions();
        await updateAccountList();
    }
});

async function fetchTransactions(userId) {
    console.log(`Fetching transactions for user ID: ${userId}`);
    try {
        const response = await fetch(`http://localhost:3000/api/transactions?user_id=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        console.log('Fetched transactions:', data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

function formatDateToMySQL(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function addTransactions() {
    const user_id = localStorage.getItem('user_id');
    const name = accountNameInput.value;
    let amount = parseFloat(accountAmountInput.value);
    const transactionTime = formatDateToMySQL(new Date());
    let flowType;
    let balance;

    console.log('Selected name:', accountNameInput.value);

    if (name === "Select Username" || !amount || isNaN(amount) || amount <= 0 || isInflow === null) {
        alert("Please provide all necessary details correctly");
        return;
    }

    flowType = isInflow ? 'inflow' : 'outflow';

    const existingAccounts = await fetchTransactions(user_id);

    // Check if the account already exists
    let existingAccount = existingAccounts.find(account => account.name === name);

    let transactionData = {
        id: 0, // Assuming your API returns this ID
        user_id,
        name,
        amount,
        totalLending,
        type: flowType,
        date: formatDateToMySQL(transactionTime),
        balance: balance // Placeholder, will be updated later
    };

    if (existingAccount) {
        // Update existing account
        let newBalance = parseFloat(existingAccount.balance); // Ensure balance is a number
        if (flowType === "inflow") {
            newBalance += amount;
        } else {
            newBalance -= amount;
            if (name === 'Admin') {
                totalLending += amount;
                console.log(`Admin Withdrawal: ${amount}. Total lending: ${totalLending}`);
            }
        }

        // balance = existingAccount.balance;
        existingAccount.lastTransaction = { amount, flowType, transactionTime };
        balance = newBalance;

        // transactionData.balance = balance;
        transactionData.balance = balance;

        try {
            const response = await fetch(`http://localhost:3000/api/transactions/${existingAccount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                throw new Error('Failed to update transaction');
            }
            const data = await response.json();
            console.log('Transaction updated successfully:', data);
            await updateRenderTransactions();
        } catch (error) {
            console.error('Error updating transaction:', error);
        }

    } else {
        // Add new account
        balance = (flowType === "inflow") ? amount : -amount;
        let lastTransaction = { amount, flowType, transactionTime };

        transactionData.balance = balance;

        try {
            const response = await fetch('http://localhost:3000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                throw new Error('Failed to store transaction');
            }
            const data = await response.json();
            accounts.push({ id: data.id, user_id, name, amount, balance, flowType, lastTransaction, transactionTime, dividendsPaid: 0 });
            console.log('Transaction stored successfully:', data);
            await updateRenderTransactions();
        } catch (error) {
            console.error('Error storing transaction:', error);
        }
    }

    clearAccountInputs();
}

addAccountBtn.addEventListener('click', addTransactions);

window.deleteTransactions = async function (index) {
    if (index > -1 && index < accounts.length) {
        const account = accounts[index];
        const transactionId = account.id;
        console.log('Deleted transaction ID: ' + transactionId);

        // Set flowType before creating the account object
        if (account.flowType === 'inflow') {
            account.balance -= account.amount;
            totalBalance -= account.amount;
        }
        if (account.flowType === 'outflow') {
            account.balance += account.amount;
            totalBalance += account.amount;
        }

        accounts.splice(index, 1);
        // getTotalBalance();

        try {
            // Send DELETE request to the server
            const response = await fetch(`http://localhost:3000/api/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }

            const data = await response.json();
            console.log('Transaction deleted successfully:', data);;
            await updateRenderTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    } else {
        console.error('Invalid index for deleting transaction');
    }
}

async function updateRenderTransactions() {
    console.log('update render funciton work');
    accountList.innerHTML = '';

    const userId = localStorage.getItem('user_id');
    const transactions = await fetchTransactions(userId);

    console.log('Fetched transactions:', transactions);

    accounts = transactions.map(transaction => {
        const amount = parseFloat(transaction.amount);
        const balance = parseFloat(transaction.balance);
        console.log('Balance type:', typeof balance); // Add this line
        return {
            id: transaction.id,
            name: transaction.name,
            balance: balance, // Ensure it's a number
            lastTransaction: {
                amount: amount,
                flowType: transaction.type,
                transactionTime: new Date(transaction.date)  // Ensure transactionTime is a Date object
            },
            transactionTime: new Date(transaction.date)  // Ensure transactionTime is a Date object
        };
    });

    accounts.sort((a, b) => b.transactionTime - a.transactionTime);
    console.log('Updated accounts:', accounts);

    accounts.forEach((account, index) => {
        const accountListItem = document.createElement('div');
        accountListItem.classList.add('account-list-item');

        accountListItem.innerHTML = `
        <div>
            <h3 class="account-name">${account.name}</h3>
            <h5 class="account-balance">Balance: ${account.balance.toFixed(2)}</h5>
            <p class="account-lasttransaction">Last Transaction: ${account.lastTransaction.amount.toFixed(2)} (${account.lastTransaction.flowType})</p>
            <button class="delete-account-btn btn btn-danger" onclick="deleteTransactions(${index})">Delete</button>
        </div>
        `;

        accountList.append(accountListItem);
    });

    // bankBalanceElement.textContent = `$${parseFloat(getBankBalance()).toFixed(2)}`;
    // lendingElement.textContent = `$${totalLending.toFixed(2)}`;
    // dividendsPaidElement.textContent = `$${getTotalDividendPaid()}`;

    // getTotalBalance();
    // getBankBalance();
}

function clearAccountInputs() {
    accountNameInput.value = 'Select Username';
    accountAmountInput.value = '';
}

async function fetchUser(userId) {
    console.log('Fetching accounts for user ID:', userId);
    try {
        const response = await fetch(`http://localhost:3000/api/accounts?user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        console.log('Fetch accounts:', data);
        return data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

async function addUser() {
    const userName = addUserInput.value.trim();
    const userId = localStorage.getItem('user_id');
    console.log('User ID: ', userId);

    if (userName && !usernames.some(user => user.name === userName)) {

        let userData = {
            user_id: userId,
            name: userName
        }

        try {
            const response = await fetch('http://localhost:3000/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Failed to store transaction');
            }

            const data = await response.json();
            usernames.push({ id: data.accountId, user_id: userId, name: userName });
            console.log('Account stored successfully:', data);
            await updateAccountList();
            addUserInput.value = '';
        } catch (error) {
            console.error('Error storing account names:', error);
        }
    } else {
        console.log('Account already exists or invalid name');
    }
}

addUserBtn.addEventListener('click', addUser);

async function updateAccountList() {
    const userId = localStorage.getItem('user_id');
    const accounts = await fetchUser(userId);

    console.log('Fetched transactions:', accounts);

    usernames = accounts.map(account => {
        return {
            id: account.id,
            name: account.name,
        }
    })

    usernames.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    console.log('Updated sorting usernames:', usernames);

    accountNameInput.innerHTML = `
        <option value="Select Username">Select Username</option>
        <option value="Admin">Admin</option>`

    deleteUserSelect.innerHTML = '<option value="Select Username">Select Username</option>'

    usernames.forEach(username => {
        const option = document.createElement('option');
        option.value = username.name;
        option.textContent = username.name;

        accountNameInput.append(option);
        deleteUserSelect.append(option.cloneNode(true));
    })
}
async function deleteAccount() {
    const selectedUserName = deleteUserSelect.value.trim();
    console.log('Selected user name:', selectedUserName);

    const selectedUser = usernames.find(user => user.name === selectedUserName);
    console.log('Selected user:', selectedUser);

    if (!selectedUser) {
        console.log('No account name found');
        return;
    }

    const accountId = selectedUser.id; // This should be correctly set
    if (!accountId) {
        console.log('No valid account ID found');
        return;
    }

    console.log('Deleting account ID:', accountId);

    try {
        const response = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete account');
        }

        const data = await response.json();
        console.log('Account deleted successfully:', data);
        usernames = usernames.filter(user => user.id !== accountId); // Update local list
        await updateAccountList(); // Refresh UI
        console.log('Updated usernames:', usernames);
    } catch (error) {
        console.error('Error deleting account:', error);
    }
}


deleteUserBtn.addEventListener('click', deleteAccount);