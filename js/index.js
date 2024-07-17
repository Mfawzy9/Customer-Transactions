
let customers = [];
let transactions = [];


// Handle Search
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const filterValue = searchInput.value.toLowerCase().trim();

  // Filter customers by name
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(filterValue)
  );

  // Filter transactions by amount or by matching filtered customer IDs
  const filteredTransactions = transactions.filter((transaction) => {
    const customerMatches = filteredCustomers.some(
      (customer) => customer.id === transaction.customer_id
    );
    const amountMatches = transaction.amount.toString().includes(filterValue);
    return customerMatches || amountMatches;
  });


  filteredTransactions.forEach((transaction) => {
    if (
      !filteredCustomers.some(
        (customer) => customer.id === transaction.customer_id
      )
    ) {
      const customer = customers.find(
        (customer) => customer.id === transaction.customer_id
      );
      if (customer) {
        filteredCustomers.push(customer);
      }
    }
  });

  displayCustomers(filteredCustomers, filteredTransactions);
});


async function getCustomers() {
  const api = await fetch("../data.json");
  const data = await api.json();

  customers = data.customers;
  transactions = data.transactions;

  displayCustomers(customers, transactions);
}

function getTransactionsForCustomer(customerId) {

  return transactions.filter((t) => t.customer_id === customerId);
}


function aggregateTransactionsByDay(transactions) {
  const totalsByDay = transactions.reduce((acc, { date, amount }) => {
    // Date is already in 'YYYY-MM-DD' format, so no need to split or format
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += amount;
    return acc;
  }, {});

  return Object.entries(totalsByDay).map(([date, total]) => ({
    time: date,
    value: total,
  }));
}

function displayCustomers(customers, transactions) {
  let customersContainer = ``;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const customerTransactions = transactions.filter(
      (transaction) => transaction.customer_id === customer.id
    );

    if (customerTransactions.length === 0) {
      customersContainer += `
      <tr>
        <td>${customer.name}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `;
      continue;
    }

    customersContainer += `
      <tr>
        <td rowspan="${customerTransactions.length + 1}">${customer.name}</td>
      </tr>
    `;

    customerTransactions.forEach((transaction, i) => {
      customersContainer += `
        <tr>
          <td>${transaction.date}</td>
          <td>${transaction.amount}</td>
          ${
            i === 0
              ? `<td rowspan="${customerTransactions.length}" width="80px" height="80px">
                  <canvas id="chart-${customer.id}" max-width="auto" max-height="auto"></canvas>
                </td>`
              : ""
          }
        </tr>
      `;
    });
  }

  document.getElementById("tableData").innerHTML = customersContainer;
  customers.forEach((customer) => {
    const ctx = document.getElementById(`chart-${customer.id}`);
    const transactions = getTransactionsForCustomer(customer.id);
    const aggregatedTransactions = aggregateTransactionsByDay(transactions);

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: aggregatedTransactions.map((transaction) => transaction.time),
        datasets: [
          {
            data: aggregatedTransactions.map(
              (transaction) => transaction.value
            ),
          },
        ],
      },
    });
  });
}

getCustomers();
