// Data Management
let data = JSON.parse(localStorage.getItem("budgetData")) || [];
let salary = Number(localStorage.getItem("monthlySalary")) || 0;
let lastResetMonth = localStorage.getItem("lastResetMonth") || "";

function advanceDate(dateStr, months) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month overflow (e.g., Jan 31 -> Feb 28)
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d.toISOString().split('T')[0];
}

function checkMonthlyReset() {
  const now = new Date();
  const currentMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
  
  // If it's a new month, reset completion status and advance past dates
  if (lastResetMonth !== currentMonthYear) {
    const today = new Date();
    today.setHours(0,0,0,0);

    data = data.map(item => {
      let newDate = item.dueDate;
      if (newDate) {
        const d = new Date(newDate);
        // If the date is in the past month/year, advance it to the current month
        if (d < today) {
          const monthsDiff = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
          if (monthsDiff > 0) {
            newDate = advanceDate(newDate, monthsDiff);
          }
        }
      }
      return { ...item, completed: false, dueDate: newDate };
    });

    lastResetMonth = currentMonthYear;
    localStorage.setItem("lastResetMonth", lastResetMonth);
    saveData();
  }
}

function saveData() {
  localStorage.setItem("budgetData", JSON.stringify(data));
  localStorage.setItem("monthlySalary", salary);
}

function toggleComplete(index) {
  const item = data[index];
  item.completed = !item.completed;
  
  // Automatically update the date
  if (item.dueDate) {
    if (item.completed) {
      // Advance to next month
      item.dueDate = advanceDate(item.dueDate, 1);
    } else {
      // Revert to previous month
      item.dueDate = advanceDate(item.dueDate, -1);
    }
  }

  saveData();
  
  // Refresh based on current page
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "entry.html") renderAll();
  else if (path.includes(".html")) {
    const category = path.replace(".html", "").charAt(0).toUpperCase() + path.replace(".html", "").slice(1);
    if (["Needs", "Savings", "Wants"].includes(category)) renderCategory(category);
  }
}

// Navigation
function updateActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-item").forEach(item => {
    const href = item.getAttribute("href");
    if (href === path) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Global calculations
function calculateSplit() {
  const salaryInput = document.getElementById("salary");
  if (salaryInput) {
    salary = Number(salaryInput.value) || 0;
    saveData();
  }
  
  const needsAlloc = (salary * 0.6).toFixed(2);
  const wantsAlloc = (salary * 0.2).toFixed(2);
  const savingsAlloc = (salary * 0.2).toFixed(2);

  if (document.getElementById("needs")) document.getElementById("needs").textContent = `RM ${needsAlloc}`;
  if (document.getElementById("wants")) document.getElementById("wants").textContent = `RM ${wantsAlloc}`;
  if (document.getElementById("savings")) document.getElementById("savings").textContent = `RM ${savingsAlloc}`;

  return { needsAlloc, wantsAlloc, savingsAlloc };
}

// Add / Edit Logic
function addItem() {
  const desc = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const dueDate = document.getElementById("dueDate").value;
  const editIndex = parseInt(document.getElementById("edit-index").value);

  if (!desc || !amount) return alert("Please fill in Description and Amount");

  const newItem = { 
    desc, 
    amount: Number(amount), 
    category, 
    dueDate,
    completed: editIndex > -1 ? data[editIndex].completed : false 
  };

  if (editIndex > -1) {
    data[editIndex] = newItem;
    document.getElementById("edit-index").value = "-1";
    document.getElementById("add-btn").textContent = "➕ Add Item";
  } else {
    data.push(newItem);
  }

  saveData();
  clearForm();
  renderAll();
}

function clearForm() {
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("dueDate").value = "";
  document.getElementById("category").value = "Needs";
}

function deleteItem(index) {
  if (confirm("Are you sure you want to delete this item?")) {
    data.splice(index, 1);
    saveData();
    renderAll();
  }
}

function editItem(index) {
  const item = data[index];
  document.getElementById("desc").value = item.desc;
  document.getElementById("amount").value = item.amount;
  document.getElementById("category").value = item.category;
  document.getElementById("dueDate").value = item.dueDate || "";
  document.getElementById("edit-index").value = index;
  document.getElementById("add-btn").textContent = "💾 Update Item";
  window.scrollTo(0, 0);
}

// Rendering Logic
function getAutoNeedsValue() {
  const needsAlloc = salary * 0.6;
  const fixedNeedsTotal = data
    .filter(item => item.category === 'Needs')
    .reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, needsAlloc - fixedNeedsTotal);
}

function renderAll() {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  
  // Add Fixed Items
  data.forEach((item, index) => {
    const row = `
      <tr class="${item.completed ? 'completed-row' : ''}">
        <td data-label="Description">${item.desc}</td>
        <td data-label="Amount">RM ${item.amount.toFixed(2)}</td>
        <td data-label="Category">${item.category}</td>
        <td data-label="Due Date">${item.dueDate || "-"}</td>
        <td data-label="Action">
          <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleComplete(${index})" title="Mark as Done">
          <button class="edit-btn" onclick="editItem(${index})">✏️</button>
          <button class="delete-btn" onclick="deleteItem(${index})">❌</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  // Add Automated Needs Item
  if (salary > 0) {
    const autoValue = getAutoNeedsValue();
    const autoRow = `
      <tr style="background: rgba(76, 175, 80, 0.1); font-style: italic;">
        <td data-label="Description">Foods/Snack/Groceries/Others (Auto)</td>
        <td data-label="Amount">RM ${autoValue.toFixed(2)}</td>
        <td data-label="Category">Needs</td>
        <td data-label="Due Date">-</td>
        <td data-label="Action"><small>Auto</small></td>
      </tr>
    `;
    tbody.innerHTML += autoRow;
  }

  if (data.length === 0 && salary === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">No entries found.</td></tr>';
  }

  const salaryInput = document.getElementById("salary");
  if (salaryInput) salaryInput.value = salary || "";
}

function renderCategory(category) {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  let total = 0;

  // Add fixed items
  data.forEach((item, index) => {
    if (item.category === category) {
      total += item.amount;
      tbody.innerHTML += `
        <tr class="${item.completed ? 'completed-row' : ''}">
          <td data-label="Description">${item.desc}</td>
          <td data-label="Amount">RM ${item.amount.toFixed(2)}</td>
          <td data-label="Date">${item.dueDate || "-"}</td>
          <td data-label="Done" style="text-align:center;">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleComplete(${index})" title="Mark as Done">
          </td>
        </tr>
      `;
    }
  });

  // Add Auto item if category is Needs
  if (category === 'Needs' && salary > 0) {
    const autoValue = getAutoNeedsValue();
    total += autoValue;
    tbody.innerHTML += `
      <tr style="background: rgba(76, 175, 80, 0.1); font-style: italic;">
        <td data-label="Description">Foods/Snack/Groceries/Others (Auto)</td>
        <td data-label="Amount">RM ${autoValue.toFixed(2)}</td>
        <td data-label="Date">-</td>
        <td data-label="Done">-</td>
      </tr>
    `;
  }

  if (total === 0 && !(category === 'Needs' && salary > 0)) {
    tbody.innerHTML = `<tr><td colspan="4" class="no-data">No ${category} found.</td></tr>`;
  }

  const totalEl = document.getElementById("total-category");
  if (totalEl) {
    const { needsAlloc, wantsAlloc, savingsAlloc } = calculateSplit();
    let allocated = 0;
    if (category === 'Needs') allocated = needsAlloc;
    if (category === 'Wants') allocated = wantsAlloc;
    if (category === 'Savings') allocated = savingsAlloc;
    
    totalEl.textContent = `Total ${category}: RM ${total.toFixed(2)} / RM ${allocated}`;
  }
}

// Dashboard Logic
function updateDashboard() {
  const dashSalary = document.getElementById("dash-salary");
  const dashTotal = document.getElementById("dash-total");
  const dashDueSoon = document.getElementById("dash-due-soon");
  const remindersList = document.getElementById("reminders-list");

  if (!dashSalary) return;

  dashSalary.textContent = `RM ${salary.toFixed(2)}`;

  let totalExpenses = 0;
  let needsTotal = 0;
  let wantsTotal = 0;
  let savingsTotal = 0;
  let dueSoonCount = 0;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  remindersList.innerHTML = "";

  // Process data
  data.forEach(item => {
    totalExpenses += item.amount;
    if (item.category === 'Needs') needsTotal += item.amount;
    if (item.category === 'Wants') wantsTotal += item.amount;
    if (item.category === 'Savings') savingsTotal += item.amount;

    // Check for due soon / overdue status
    if (item.dueDate && !item.completed) {
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0,0,0,0);
      
      const isDueSoon = dueDate >= today && dueDate <= nextWeek;
      const isOverdue = dueDate < today;

      if (isDueSoon) dueSoonCount++;

      // Only show reminders for 'Needs' category
      if (item.category === 'Needs') {
        if (isDueSoon) {
          remindersList.innerHTML += `
            <div class="due-soon" style="margin-bottom: 8px; font-size: 0.85rem;">
              ⚠️ <strong>${item.desc}</strong> is due on ${item.dueDate} (RM ${item.amount.toFixed(2)})
            </div>
          `;
        } else if (isOverdue) {
          remindersList.innerHTML += `
            <div class="overdue" style="margin-bottom: 8px; font-size: 0.85rem;">
              🚨 <strong>${item.desc}</strong> was due on ${item.dueDate} (RM ${item.amount.toFixed(2)}) - OVERDUE
            </div>
          `;
        }
      }
    }
  });

  // Add Auto Needs to totals
  const autoNeeds = getAutoNeedsValue();
  needsTotal += autoNeeds;
  totalExpenses += autoNeeds;

  if (remindersList.innerHTML === "") {
    remindersList.innerHTML = '<p class="no-data">No urgent reminders.</p>';
  }

  dashTotal.textContent = `RM ${totalExpenses.toFixed(2)}`;
  dashDueSoon.textContent = `${dueSoonCount} Items`;

  const { needsAlloc, wantsAlloc, savingsAlloc } = calculateSplit();

  document.getElementById("needs-status").textContent = `RM ${needsTotal.toFixed(2)} / ${needsAlloc}`;
  document.getElementById("wants-status").textContent = `RM ${wantsTotal.toFixed(2)} / ${wantsAlloc}`;
  document.getElementById("savings-status").textContent = `RM ${savingsTotal.toFixed(2)} / ${savingsAlloc}`;
}

// Initial setup
window.addEventListener('load', () => {
  checkMonthlyReset();
  updateActiveNav();
  if (typeof updateDashboard === 'function' && document.getElementById("dash-salary")) {
    updateDashboard();
  }
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered'))
      .catch(err => console.log('Service Worker Error: ', err));
  }
});

// CSV Export/Import Functions
function exportToCSV() {
  if (data.length === 0) return alert("No data to export");

  const headers = ["Description", "Amount", "Category", "DueDate", "Completed"];
  const csvContent = [
    headers.join(","),
    ...data.map(item => [
      `"${item.desc.replace(/"/g, '""')}"`,
      item.amount,
      item.category,
      item.dueDate || "",
      item.completed ? "TRUE" : "FALSE"
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `budget_tracker_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return alert("Invalid CSV file");

    const importedData = [];
    // Start from index 1 to skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Robust CSV parsing regex to handle quoted commas
      const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
      const parts = [];
      let match;
      
      // Manual split logic to handle empty fields between commas
      const rawParts = [];
      let current = '';
      let inQuotes = false;
      for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          rawParts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      rawParts.push(current);

      if (rawParts.length < 4) continue;

      const desc = rawParts[0].replace(/^"|"$/g, '').replace(/""/g, '"');
      const amount = parseFloat(rawParts[1]);
      const category = rawParts[2].trim();
      const dueDate = rawParts[3].trim();
      const completed = rawParts[4] ? rawParts[4].trim().toUpperCase() === "TRUE" : false;

      if (desc && !isNaN(amount)) {
        importedData.push({ desc, amount, category, dueDate, completed });
      }
    }

    if (importedData.length > 0) {
      if (confirm(`Import ${importedData.length} items? This will ADD to your current list.`)) {
        data = [...data, ...importedData];
        saveData();
        renderAll();
        alert("Import successful!");
      }
    } else {
      alert("No valid data found in CSV.");
    }
    // Reset file input
    event.target.value = "";
  };
  reader.readAsText(file);
}