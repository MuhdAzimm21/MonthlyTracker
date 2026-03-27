/**
 * MONTHLY TRACKER - Core Application Logic
 * 
 * This file manages data persistence, financial calculations, 
 * UI rendering, and gesture interactions.
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================

// Global application state retrieved from LocalStorage
let data = JSON.parse(localStorage.getItem("budgetData")) || [];
let salary = Number(localStorage.getItem("monthlySalary")) || 0;
let lastResetMonth = localStorage.getItem("lastResetMonth") || "";
let budgetRule = localStorage.getItem("budgetRule") || "622"; 
let salaryConfirmed = localStorage.getItem("salaryConfirmed") === "true";
let ruleSelected = localStorage.getItem("ruleSelected") === "true";

// Global tracker for opened swipe row
let openedRow = null;
let touchstartX = 0;
let touchendX = 0;

/**
 * Saves current state to LocalStorage
 */
function saveData() {
  localStorage.setItem("budgetData", JSON.stringify(data));
  localStorage.setItem("monthlySalary", salary);
  localStorage.setItem("budgetRule", budgetRule);
  localStorage.setItem("salaryConfirmed", salaryConfirmed);
  localStorage.setItem("ruleSelected", ruleSelected);
}

// ==========================================
// 2. BUDGET SETUP & RULES
// ==========================================

/**
 * Validates and locks the salary input
 */
function confirmSalary() {
  const salaryInput = document.getElementById("salary");
  const val = Number(salaryInput.value);
  
  if (val > 0) {
    salary = val;
    salaryConfirmed = true;
    saveData();
    syncSetupUI();
  } else {
    alert("Please enter a valid monthly income.");
  }
}

/**
 * Unlocks the salary input for editing
 */
function editSalary() {
  salaryConfirmed = false;
  ruleSelected = false; // Reset rule selection too if editing income
  saveData();
  syncSetupUI();
}

/**
 * Syncs the Setup Card UI and Page Locking
 */
function syncSetupUI() {
  const stepSalary = document.getElementById("step-salary");
  const stepRule = document.getElementById("step-rule");
  const summary = document.getElementById("setup-summary");
  const title = document.getElementById("setup-title");
  
  // Elements to lock/unlock
  const editCard = document.getElementById("edit-form-card");
  const dataCard = document.getElementById("data-table-card");

  if (!stepSalary) return; // Not on entry page

  if (!salaryConfirmed) {
    // Step 1: Entry
    stepSalary.style.display = "block";
    stepRule.style.display = "none";
    summary.style.display = "none";
    title.textContent = "Step 1: Monthly Income";
    
    if (editCard) { editCard.style.opacity = "0.5"; editCard.style.pointerEvents = "none"; }
    if (dataCard) { dataCard.style.opacity = "0.5"; dataCard.style.pointerEvents = "none"; }
    
    document.getElementById("salary").value = salary || "";
  } else if (!ruleSelected) {
    // Step 2: Rule Selection
    stepSalary.style.display = "none";
    stepRule.style.display = "block";
    summary.style.display = "none";
    title.textContent = "Step 2: Budgeting Rule";
    
    if (editCard) { editCard.style.opacity = "0.5"; editCard.style.pointerEvents = "none"; }
    if (dataCard) { dataCard.style.opacity = "0.5"; dataCard.style.pointerEvents = "none"; }
  } else {
    // Fully Complete
    stepSalary.style.display = "none";
    stepRule.style.display = "none";
    summary.style.display = "block";
    title.textContent = "Budgeting Setup";
    
    if (editCard) { editCard.style.opacity = "1"; editCard.style.pointerEvents = "auto"; }
    if (dataCard) { dataCard.style.opacity = "1"; dataCard.style.pointerEvents = "auto"; }
    
    calculateSplit();
  }
}

/**
 * Updates the active budget rule (6/2/2 or 7/2/1)
 */
function setBudgetRule(rule) {
  budgetRule = rule;
  ruleSelected = true;
  saveData();
  syncSetupUI();
  calculateSplit();
}

/**
 * Returns decimal multipliers based on active rule
 */
function getRulePercentages() {
  if (budgetRule === '721') {
    return { needs: 0.7, savings: 0.2, wants: 0.1 };
  }
  return { needs: 0.6, savings: 0.2, wants: 0.2 };
}

// ==========================================
// 3. DATE UTILITIES & AUTO-RESET
// ==========================================

function advanceDate(dateStr, months) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().split('T')[0];
}

function checkMonthlyReset() {
  const now = new Date();
  const currentMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
  if (lastResetMonth !== currentMonthYear) {
    const today = new Date(); today.setHours(0,0,0,0);
    data = data.filter(item => item.recurring || !item.completed).map(item => {
      let newDate = item.dueDate;
      if (newDate && item.recurring) {
        const d = new Date(newDate);
        if (d < today) {
          const monthsDiff = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
          if (monthsDiff > 0) newDate = advanceDate(newDate, monthsDiff);
        }
      }
      return { ...item, completed: false, dueDate: newDate };
    });
    lastResetMonth = currentMonthYear;
    localStorage.setItem("lastResetMonth", lastResetMonth);
    saveData();
  }
}

// ==========================================
// 4. CORE DATA LOGIC (ADD, EDIT, DELETE)
// ==========================================

function addItem() {
  const desc = document.getElementById("desc").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const dueDate = document.getElementById("dueDate").value;
  const recurring = document.getElementById("recurring").checked;
  const editIndex = parseInt(document.getElementById("edit-index").value);

  if (!desc || !amount) return alert("Please fill in Description and Amount");

  const percs = getRulePercentages();
  const limit = salary * percs[category.toLowerCase()];
  const currentTotal = data
    .filter((item, idx) => item.category === category && idx !== editIndex)
    .reduce((sum, item) => sum + item.amount, 0);

  if (currentTotal + amount > limit) {
    return alert(`🚨 Budget Exceeded! Limit for ${category} is RM ${limit.toFixed(2)}.`);
  }

  const newItem = { desc, amount, category, dueDate, recurring, completed: editIndex > -1 ? data[editIndex].completed : false };
  if (editIndex > -1) {
    data[editIndex] = newItem;
    document.getElementById("edit-index").value = "-1";
    document.getElementById("add-btn").textContent = "➕ Add Item";
  } else {
    data.push(newItem);
  }
  saveData(); clearForm(); renderAll();
}

function editItem(index) {
  const item = data[index];
  document.getElementById("desc").value = item.desc;
  document.getElementById("amount").value = item.amount;
  document.getElementById("category").value = item.category;
  document.getElementById("dueDate").value = item.dueDate || "";
  document.getElementById("recurring").checked = item.recurring || false;
  document.getElementById("edit-index").value = index;
  document.getElementById("add-btn").textContent = "💾 Update Item";
  const editCard = document.getElementById("edit-form-card");
  if (editCard) editCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteItem(index) {
  if (confirm("Are you sure you want to delete this item?")) {
    data.splice(index, 1); saveData(); renderAll();
  }
}

function toggleComplete(index) {
  const item = data[index];
  item.completed = !item.completed;
  if (item.completed && navigator.vibrate) navigator.vibrate(50);
  if (item.dueDate) {
    item.dueDate = advanceDate(item.dueDate, item.completed ? 1 : -1);
  }
  saveData();
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "entry.html") renderAll();
  else if (path.includes(".html")) {
    const category = path.replace(".html", "").charAt(0).toUpperCase() + path.replace(".html", "").slice(1);
    if (["Needs", "Savings", "Wants"].includes(category)) renderCategory(category);
  }
}

function clearForm() {
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("dueDate").value = "";
  document.getElementById("category").value = "Needs";
  document.getElementById("recurring").checked = false;
}

// ==========================================
// 5. RENDERING LOGIC
// ==========================================

function renderAll() {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  data.forEach((item, index) => {
    const tr = document.createElement('tr');
    if (item.completed) tr.classList.add('completed-row');
    tr.innerHTML = `
      <td data-label="Description">${item.recurring ? '🔄 ' : ''}${item.desc}</td>
      <td data-label="Amount">RM ${item.amount.toFixed(2)}</td>
      <td data-label="Category">${item.category}</td>
      <td data-label="Due Date">${item.dueDate || "-"}</td>
      <td data-label="Action">
        <button class="edit-btn" onclick="editItem(${index})">✏️</button>
        <button class="delete-btn" onclick="deleteItem(${index})" style="display:none;">❌</button>
      </td>
    `;
    attachSwipeListeners(tr, index);
    tbody.appendChild(tr);
  });
  if (salary > 0) {
    const autoValue = getAutoNeedsValue();
    const autoRow = document.createElement('tr');
    autoRow.style.background = "rgba(76, 175, 80, 0.1)";
    autoRow.style.fontStyle = "italic";
    autoRow.innerHTML = `<td data-label="Description">Foods (Auto)</td><td data-label="Amount">RM ${autoValue.toFixed(2)}</td><td data-label="Category">Needs</td><td data-label="Due Date">-</td><td data-label="Action"><small>Auto</small></td>`;
    tbody.appendChild(autoRow);
  }
}

function renderCategory(category) {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let totalAmount = 0, completedAmount = 0;
  data.forEach((item, index) => {
    if (item.category === category) {
      totalAmount += item.amount;
      if (item.completed) completedAmount += item.amount;
      const tr = document.createElement('tr');
      if (item.completed) tr.classList.add('completed-row');
      tr.innerHTML = `<td data-label="Description">${item.desc}</td><td data-label="Amount">RM ${item.amount.toFixed(2)}</td><td data-label="Date">${item.dueDate || "-"}</td>`;
      attachSwipeListeners(tr, index);
      tbody.appendChild(tr);
    }
  });
  if (category === 'Needs' && salary > 0) {
    const autoValue = getAutoNeedsValue(); totalAmount += autoValue;
    const autoRow = document.createElement('tr');
    autoRow.style.background = "rgba(76, 175, 80, 0.1)"; autoRow.style.fontStyle = "italic";
    autoRow.innerHTML = `<td data-label="Description">Foods (Auto)</td><td data-label="Amount">RM ${autoValue.toFixed(2)}</td><td data-label="Date">-</td>`;
    tbody.appendChild(autoRow);
  }
  const totalEl = document.getElementById("total-category");
  if (totalEl) totalEl.textContent = `Total ${category}: RM ${(totalAmount - completedAmount).toFixed(2)} / RM ${totalAmount.toFixed(2)}`;
}

function updateDashboard() {
  const dashSalary = document.getElementById("dash-salary");
  const dashTotal = document.getElementById("dash-total");
  const dashDueSoon = document.getElementById("dash-due-soon");
  const remindersList = document.getElementById("reminders-list");
  if (!dashSalary) return;
  dashSalary.textContent = `RM ${salary.toFixed(2)}`;
  let totalExpenses = 0, dueSoonCount = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
  remindersList.innerHTML = "";
  data.forEach(item => {
    totalExpenses += item.amount;
    if (item.dueDate && !item.completed) {
      const dueDate = new Date(item.dueDate); dueDate.setHours(0,0,0,0);
      if (dueDate >= today && dueDate <= nextWeek) dueSoonCount++;
      if (item.category === 'Needs') {
        if (dueDate >= today && dueDate <= nextWeek) remindersList.innerHTML += `<div class="due-soon">⚠️ <strong>${item.desc}</strong> due ${item.dueDate}</div>`;
        else if (dueDate < today) remindersList.innerHTML += `<div class="overdue">🚨 <strong>${item.desc}</strong> was due ${item.dueDate}</div>`;
      }
    }
  });
  const autoNeeds = getAutoNeedsValue(); totalExpenses += autoNeeds;
  if (remindersList.innerHTML === "") remindersList.innerHTML = '<p class="no-data">No urgent reminders.</p>';
  dashTotal.textContent = `RM ${totalExpenses.toFixed(2)}`;
  dashDueSoon.textContent = `${dueSoonCount} Items`;
  calculateSplit();
}

// ==========================================
// 6. GESTURE & UI HELPERS
// ==========================================

function resetOpenedRow() {
  if (openedRow) {
    openedRow.style.transform = "translateX(0)";
    const action = openedRow.querySelector('.swipe-action');
    if (action) action.style.opacity = "0";
    openedRow = null;
  }
}

function handleGesture(row, index) {
  const swipeAction = row.querySelector('.swipe-action');
  if (!swipeAction) return;
  if (touchendX < touchstartX - 70) {
    if (openedRow && openedRow !== row) resetOpenedRow();
    row.style.transform = "translateX(-80px)";
    swipeAction.style.opacity = "1";
    openedRow = row;
  } else if (touchendX > touchstartX + 50) {
    row.style.transform = "translateX(0)";
    swipeAction.style.opacity = "0";
    if (openedRow === row) openedRow = null;
  }
}

function attachSwipeListeners(row, index) {
  row.classList.add('swipe-row');
  const path = window.location.pathname.split("/").pop() || "index.html";
  const isEntryPage = path === "entry.html";
  const isCategoryPage = ["needs.html", "savings.html", "wants.html"].includes(path);
  if (isEntryPage || isCategoryPage) {
    const swipeAction = document.createElement('div');
    swipeAction.className = 'swipe-action';
    if (isEntryPage) {
      swipeAction.innerHTML = '❌'; swipeAction.classList.add('delete-action');
      swipeAction.onclick = (e) => { e.stopPropagation(); deleteItem(index); };
    } else {
      const isCompleted = data[index].completed;
      swipeAction.innerHTML = isCompleted ? '↩️' : '✅';
      swipeAction.className = `swipe-action ${isCompleted ? 'undo-action' : 'done-action'}`;
      swipeAction.onclick = (e) => { e.stopPropagation(); toggleComplete(index); resetOpenedRow(); };
    }
    row.appendChild(swipeAction);
  }
  row.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  row.addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; handleGesture(row, index); }, { passive: true });
}

function calculateSplit() {
  const percs = getRulePercentages();
  const needsAlloc = (salary * percs.needs).toFixed(2);
  const wantsAlloc = (salary * percs.wants).toFixed(2);
  const savingsAlloc = (salary * percs.savings).toFixed(2);
  
  const limits = { needs: Number(needsAlloc), wants: Number(wantsAlloc), savings: Number(savingsAlloc) };
  const currentTotals = { needs: 0, wants: 0, savings: 0 };
  
  data.forEach(item => {
    const cat = item.category.toLowerCase();
    if (currentTotals.hasOwnProperty(cat)) currentTotals[cat] += item.amount;
  });
  
  // Add Auto Needs to the needs total for visualization
  if (salary > 0) currentTotals.needs += getAutoNeedsValue();

  const updateDisplay = (id, percId, alloc, total) => {
    const el = document.getElementById(id);
    const percEl = document.getElementById(percId);
    if (percEl) percEl.textContent = Math.round(alloc / salary * 100) || (id === "needs" ? percs.needs * 100 : id === "wants" ? percs.wants * 100 : percs.savings * 100);
    if (el) {
      el.textContent = `RM ${alloc}`;
      if (total > alloc && salary > 0) {
        el.style.color = "#f44336";
        el.innerHTML = `RM ${alloc} <br><small style="font-size:0.6rem; font-weight:bold;">⚠️ Over by RM ${(total - alloc).toFixed(2)}</small>`;
      } else {
        el.style.color = "#4CAF50";
      }
    }
  };

  updateDisplay("needs", "perc-needs", limits.needs, currentTotals.needs);
  updateDisplay("wants", "perc-wants", limits.wants, currentTotals.wants);
  updateDisplay("savings", "perc-savings", limits.savings, currentTotals.savings);
  
  // Highlight active button
  const btn622 = document.getElementById('rule-622');
  const btn721 = document.getElementById('rule-721');
  if (btn622 && btn721) {
    const isActive = (rule) => budgetRule === rule && ruleSelected;
    btn622.style.background = isActive('622') ? '#4CAF50' : '#333';
    btn622.style.color = isActive('622') ? 'black' : 'white';
    btn721.style.background = isActive('721') ? '#4CAF50' : '#333';
    btn721.style.color = isActive('721') ? 'black' : 'white';
  }
}

function getAutoNeedsValue() {
  const percs = getRulePercentages();
  const needsAlloc = salary * percs.needs;
  const fixedNeedsTotal = data.filter(item => item.category === 'Needs').reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, needsAlloc - fixedNeedsTotal);
}

function showSkeletons(targetId) {
  const target = document.querySelector(`${targetId} tbody`);
  if (!target) return;
  target.innerHTML = '<tr><td colspan="5"><div class="skeleton"></div></td></tr>';
}

function updateActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-item").forEach(item => {
    const href = item.getAttribute("href");
    if (href === path) item.classList.add("active"); else item.classList.remove("active");
  });
}

function exportToCSV() {
  if (data.length === 0) return alert("No data");
  const headers = ["Description", "Amount", "Category", "DueDate", "Completed"];
  const csv = [headers.join(","), ...data.map(item => [`"${item.desc}"`, item.amount, item.category, item.dueDate || "", item.completed ? "TRUE" : "FALSE"].join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "budget.csv"; link.click();
}

function importFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split(/\r?\n/);
    const importedData = [];
    const totals = { needs: 0, wants: 0, savings: 0 };
    
    // Calculate current totals
    data.forEach(item => {
      const cat = item.category.toLowerCase();
      if (totals.hasOwnProperty(cat)) totals[cat] += item.amount;
    });

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const p = line.split(",");
      if (p.length < 4) continue;
      
      const desc = p[0].replace(/^"|"$/g, '');
      const amount = parseFloat(p[1]);
      const category = p[2].trim();
      const dueDate = p[3].trim();
      const completed = p[4] ? p[4].trim().toUpperCase() === "TRUE" : false;
      const catKey = category.toLowerCase();
      
      if (desc && !isNaN(amount)) {
        importedData.push({ desc, amount, category, dueDate, completed });
        if (totals.hasOwnProperty(catKey)) totals[catKey] += amount;
      }
    }

    // Budget Check
    const percs = getRulePercentages();
    const limits = {
      needs: salary * percs.needs,
      wants: salary * percs.wants,
      savings: salary * percs.savings
    };

    let overBudgetMsg = "";
    for (const cat in limits) {
      if (totals[cat] > limits[cat]) {
        overBudgetMsg += `\n- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: RM ${totals[cat].toFixed(2)} (Limit: RM ${limits[cat].toFixed(2)})`;
      }
    }

    if (overBudgetMsg) {
      if (!confirm(`⚠️ Warning: Importing this data will exceed your budget for the following categories:${overBudgetMsg}\n\nDo you want to proceed anyway?`)) {
        event.target.value = "";
        return;
      }
    }

    if (importedData.length > 0) {
      data = [...data, ...importedData];
      saveData();
      renderAll();
      calculateSplit();
      alert("Data imported successfully.");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

// ==========================================
// 8. INITIALIZATION
// ==========================================

// Global touch listener for closing swipe rows
document.addEventListener('touchstart', (e) => {
  if (openedRow && !openedRow.contains(e.target)) resetOpenedRow();
}, { passive: true });

window.addEventListener('load', () => {
  showSkeletons("#table");
  checkMonthlyReset();
  updateActiveNav();
  
  setTimeout(() => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "index.html") updateDashboard();
    else if (path === "entry.html") { syncSetupUI(); renderAll(); }
    else if (path.includes(".html")) {
      const cat = path.replace(".html", "").charAt(0).toUpperCase() + path.replace(".html", "").slice(1);
      if (["Needs", "Savings", "Wants"].includes(cat)) renderCategory(cat);
    }
  }, 300);
});
