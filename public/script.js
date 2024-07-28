const accounts = [];
const usernames = [];

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
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        fetchTransactions(userId);
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

async function addTransactions() {
    const user_id = localStorage.getItem('user_id');
    const name = accountNameInput.value;
    let amount = parseFloat(accountAmountInput.value);
    const transactionTime = new Date().toISOString();
    let flowType;
    let balance;

    if (name === "Select Username" || !amount || isNaN(amount) || amount <= 0 || isInflow === null) {
        alert("Please provide all necessary details correctly");
        return;
    }

    flowType = isInflow ? 'inflow' : 'outflow';

    let existingAccount = accounts.find(account => account.name === name);

    if (existingAccount) {
        if (flowType === "inflow") {
            existingAccount.balance += amount;
        } else {
            existingAccount.balance -= amount;
            if (name === 'Admin') {
                totalLending += amount;
                console.log(`Admin Withdrawal: ${amount}. Total lending: ${totalLending}`);
            }
        }

        existingAccount.lastTransaction = { amount, flowType, transactionTime };
        balance = existingAccount.balance;

    } else {
        balance = (flowType === "inflow") ? amount : -amount;
        let lastTransaction = { amount, flowType, transactionTime };
        accounts.push({ user_id, name, amount, balance, flowType, lastTransaction, transactionTime, dividendsPaid: 0 });
    }

    const transactionData = {
        user_id,
        name,
        amount,
        totalLending,
        type: flowType,
        date: transactionTime,
        balance,
    };

    console.log('user_id set in localStorage:', user_id);
    console.log('Transaction data to be sent:', transactionData);

    fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to store transaction');
            }
            return response.json();
        })
        .then(async data => {
            console.log('Transaction stored successfully:', data);
            const transactions = await fetchTransactions(user_id)
            await updateRenderTransactions(transactions);
        })
        .catch(error => console.error('Error storing transaction:', error));

    // getTotalBalance();
    clearAccountInputs();
}

addAccountBtn.addEventListener('click', addTransactions);

async function deleteTransactions(index) {
    if (index > -1 && index < accounts.length) {
        const account = accounts[index];

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
        updateRenderTransactions();
    }
}

async function updateRenderTransactions() {
    accountList.innerHTML = '';
    accounts.sort((a, b) => b.transactionTime - a.transactionTime);
    const userId = localStorage.getItem('user_id');
    fetchTransactions(userId);

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