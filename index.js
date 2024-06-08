document.addEventListener("DOMContentLoaded", () => {
  let currency = 20000;
  let day = 1;
  let currentLoan = 0;
  let transactions = [];
  let inventory = [];
  let employees = 0;
  let dailyEarnings = 0;
  let hasWorkedToday = false;

  // Get references to DOM elements
  const currencyDisplay = document.getElementById("currency-display");
  const dayDisplay = document.getElementById("day-display");
  const loanBtn = document.getElementById("loan-btn");
  const loanAmountInput = document.getElementById("loan-amount");
  const currentlyOweDisplay = document.getElementById("currently-owe");
  const payOffAllLoansBtn = document.getElementById("payoff-all-loans-btn");
  /* const paybackBtn = document.getElementById("payback-btn");
  const paybackAmountInput = document.getElementById("payback-amount"); */
  const workTabBtn = document.getElementById("work-tab-btn");
  const transactionsTabBtn = document.getElementById("transactions-tab-btn");
  const upgradesTabBtn = document.getElementById("upgrades-tab-btn");
  const workTab = document.getElementById("work-tab");
  const transactionsTab = document.getElementById("transactions-tab");
  const upgradesTab = document.getElementById("upgrades-tab");
  const startWorkBtn = document.getElementById("start-work-btn");
  const workLog = document.getElementById("work-log");
  const transactionsList = document.getElementById("transactions-list");
  const hireBtn = document.getElementById("hire-btn");
  const fireBtn = document.getElementById("fire-btn");
  const employeeCount = document.getElementById("employee-count");
  const inventoryContainer = document.getElementById("inventory-container");
  const productsContainer = document.getElementById("products-container");
  const sortOptions = document.getElementById("sort-options");
  const endDayBtn = document.getElementById("end-day-btn");

  let products = [];

  // Update the displayed values of currency, day, and employees
  function updateDisplay() {
    currencyDisplay.textContent = `Currency: ${currency.toFixed(2)} NOK`;
    dayDisplay.textContent = `Day: ${day}`;
    currentlyOweDisplay.textContent = `${currentLoan.toFixed(2)}`;
    employeeCount.textContent = `Employees: ${employees}`;
    fireBtn.style.display = employees > 0 ? "block" : "none";
    payOffAllLoansBtn.style.display = currentLoan > 0 ? "block" : "none";
  }

  // Fetch products from JSON file
  async function fetchProducts() {
    try {
      const response = await fetch("Computers.json");
      products = await response.json();
      renderProducts();
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }

  // Makes the transactions tab dynamicaly update
  function addTransaction(transaction) {
    transactions.push(transaction);
    renderTransactions();
  }

  // Event listener for loan button
  loanBtn.addEventListener("click", () => {
    const amount = parseFloat(loanAmountInput.value);
    if (amount > currency * 2) {
      alert("You cannot loan more than double your current currency.");
      return;
    }
    if (!isNaN(amount) && amount <= currency * 2 && currentLoan === 0) {
      currency += amount;
      currentLoan += amount;
      addTransaction({
        day,
        type: "loan",
        amount,
        description: `Loaned ${amount.toFixed(2)},- NOK`,
      });
      updateDisplay();
    } else if (currentLoan > 0) {
      alert(
        "You already have an active loan. Please pay it off before taking another loan."
      );
    }
  });

  // Event listener for pay off all loans button
  payOffAllLoansBtn.addEventListener("click", () => {
    if (currency >= currentLoan) {
      currency -= currentLoan;
      addTransaction({
        day,
        type: "payoff",
        amount: currentLoan,
        description: `Paid off ${currentLoan.toFixed(2)},- NOK loan`,
      });
      currentLoan = 0;
      updateDisplay();
    }
  });

  // Event listener for work tab button
  workTabBtn.addEventListener("click", () => {
    workTab.classList.remove("hidden");
    transactionsTab.classList.add("hidden");
    upgradesTab.classList.add("hidden");
  });

  // Event listener for transactions tab button
  transactionsTabBtn.addEventListener("click", () => {
    workTab.classList.add("hidden");
    transactionsTab.classList.remove("hidden");
    upgradesTab.classList.add("hidden");
    renderTransactions();
  });

  // Event listener for upgrades tab button
  upgradesTabBtn.addEventListener("click", () => {
    workTab.classList.add("hidden");
    transactionsTab.classList.add("hidden");
    upgradesTab.classList.remove("hidden");
  });

  // Event listener for start work button
  startWorkBtn.addEventListener("click", () => {
    if (inventory.length === 0) {
      alert("No items in inventory to sell. Please add items before working.");
      return;
    }
    if (!hasWorkedToday) {
      hasWorkedToday = true;
      startWorkBtn.disabled = true;
      workLog.innerHTML = "Working...";

      setTimeout(() => {
        let soldItems = 0;
        let saleProbability = 0.1 + employees * 0.05; // Base probability plus 0.05 for each employee
        let salesLog = "";

        inventory.forEach((item) => {
          let itemsSold = 0;

          // Process each quantity of the item
          for (let i = 0; i < item.quantity; i++) {
            if (Math.random() < saleProbability) {
              dailyEarnings += item.price;
              soldItems++;
              itemsSold++;
            }
          }

          if (itemsSold > 0) {
            salesLog += `<p>Sold ${itemsSold} x ${
              item.name
            } for ${item.price.toFixed(2)},- NOK each</p>`;
            item.quantity -= itemsSold;
          }
        });

        inventory = inventory.filter((item) => item.quantity > 0); // Remove items with zero quantity

        if (soldItems === 0) {
          workLog.innerHTML = "No items were sold today";
        } else {
          workLog.innerHTML = `Work session completed. Sold ${soldItems} items.<br>${salesLog}`;
          addTransaction({
            day,
            type: "work",
            amount: soldItems,
            description: `Completed work session and sold ${soldItems} items`,
          });
        }

        // Deduct employee costs if there are employees
        if (employees > 0) {
          const employeeCost = employees * 275;
          currency -= employeeCost;
          addTransaction({
            day,
            type: "employee",
            amount: -employeeCost,
            description: `Paid ${employees} employees ${employeeCost.toFixed(
              2
            )},- NOK`,
          });
        }

        updateDisplay();
        renderInventory();
        startWorkBtn.disabled = false;
      }, 2000);
    } else {
      alert(
        "You have already worked today. Please wait until the next day to work again."
      );
    }
  });

  // Event listener for hire button
  hireBtn.addEventListener("click", () => {
    employees++;
    updateDisplay();
  });

  // Event listener for fire button
  fireBtn.addEventListener("click", () => {
    if (employees > 0) {
      employees--;
      updateDisplay();
    }
  });

  // Event listener for sort options change
  sortOptions.addEventListener("change", renderProducts);

  // Render the transactions list
  function renderTransactions() {
    transactionsList.innerHTML = "";
    transactions.forEach((tx) => {
      const li = document.createElement("li");
      li.textContent = `Day ${tx.day}: ${tx.description}`;
      li.style.color = tx.amount < 0 ? "lightcoral" : "lightgreen";
      transactionsList.appendChild(li);
    });
  }

  // Render the inventory list
  function renderInventory() {
    inventoryContainer.innerHTML = "";
    inventory.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.textContent = `${item.name} - ${item.price.toFixed(2)},- NOK (x${
        item.quantity
      })`;
      inventoryContainer.appendChild(itemDiv);
    });
  }

  // Render the product list
  function renderProducts() {
    productsContainer.innerHTML = "";

    let sortedProducts = [...products];
    if (sortOptions.value === "low-to-high") {
      sortedProducts.sort((a, b) => a["product-price"] - b["product-price"]);
    } else {
      sortedProducts.sort((a, b) => b["product-price"] - a["product-price"]);
    }

    sortedProducts.forEach((product) => {
      const productDiv = document.createElement("div");
      productDiv.classList.add("product");

      const productDetails = document.createElement("div");
      productDetails.classList.add("product-details");

      productDetails.innerHTML = `
        <h3>${product["product-name"]}</h3>
        <p>ID: ${product["product-id"]}</p>
        <p class="product-price">${product["product-price"]},- NOK</p>
      `;

      const buyButton = document.createElement("button");
      buyButton.textContent = "Buy";
      buyButton.addEventListener("click", () => {
        if (currency >= product["product-price"]) {
          currency -= product["product-price"];
          const existingItem = inventory.find(
            (item) => item.id === product["product-id"]
          );
          if (existingItem) {
            existingItem.quantity++;
          } else {
            inventory.push({
              id: product["product-id"],
              name: product["product-name"],
              price: product["product-price"] * 1.25,
              quantity: 1,
            });
          }
          addTransaction({
            day,
            type: "purchase",
            amount: -product["product-price"],
            description: `Purchased ${product["product-name"]} for ${product["product-price"]},- NOK`,
          });
          updateDisplay();
          renderInventory();
          renderTransactions();
        }
      });

      productDiv.innerHTML = `<img src="${product["product-img"]}" alt="${product["product-name"]}">`;
      productDiv.appendChild(productDetails);
      productDiv.appendChild(buyButton);
      productsContainer.appendChild(productDiv);
    });
  }

  // Check if the game is over
  function checkGameOver() {
    if (currency < 0 && currentLoan > 0) gameOver();
  }

  // Game over function
  function gameOver() {
    alert("Game over! You ran out of money");
    location.reload();
  }

  // Pay bills at the end of each day
  function payBills() {
    let billPayment = 500;
    if (currency >= billPayment) {
      currency -= billPayment;
      addTransaction({
        day,
        type: "paying-bills",
        amount: -billPayment,
        description: `Paid bills for ${billPayment},- NOK`,
      });
    } else {
      alert("Not enough currency to pay bills!");
      gameOver();
    }
    updateDisplay();
  }

  // Event listener for end day button
  endDayBtn.addEventListener("click", () => {
    if (dailyEarnings > 0) {
      if (currentLoan > 0) {
        const loanRepayment = currentLoan * 0.1;
        currentLoan -= loanRepayment;
        dailyEarnings -= loanRepayment;
        addTransaction({
          day,
          type: "loan-repayment",
          amount: -loanRepayment,
          description: `10% of loan (${loanRepayment.toFixed(2)} NOK) repaid`,
        });
      }
      currency += dailyEarnings;
      addTransaction({
        day,
        type: "daily-earnings",
        amount: dailyEarnings,
        description: `Transferred daily earnings of ${dailyEarnings.toFixed(
          2
        )} NOK to currency`,
      });
      dailyEarnings = 0;
    } else {
      addTransaction({
        day,
        type: "no-earnings",
        amount: 0,
        description: "No money earned",
      });
    }
    payBills();

    day++;
    currentLoan *= 1.002; // Increase loan by 0.2%
    hasWorkedToday = false;
    workLog.innerHTML = ""; // Clear the work tab
    renderProducts();
    updateDisplay();

    checkGameOver();
  });

  fetchProducts(); // Fetch products when the page loads
  updateDisplay(); // Initial display update
});
