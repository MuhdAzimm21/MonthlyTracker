/**
 * MONTHLY TRACKER - Core Application Logic
 */

let data = JSON.parse(localStorage.getItem("budgetData")) || [];
let salary = Number(localStorage.getItem("monthlySalary")) || 0;
let lastResetMonth = localStorage.getItem("lastResetMonth") || "";
let budgetRule = localStorage.getItem("budgetRule") || "622"; 
let salaryConfirmed = localStorage.getItem("salaryConfirmed") === "true";
let ruleSelected = localStorage.getItem("ruleSelected") === "true";

let openedRow = null;
let touchstartX = 0;
let touchendX = 0;

// SVG Icons Constants
const ICONS = {
  edit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`,
  undo: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`
};

function saveData() {
  localStorage.setItem("budgetData", JSON.stringify(data));
  localStorage.setItem("monthlySalary", salary);
  localStorage.setItem("budgetRule", budgetRule);
  localStorage.setItem("salaryConfirmed", salaryConfirmed);
  localStorage.setItem("ruleSelected", ruleSelected);
}

function confirmSalary() {
  const salaryInput = document.getElementById("salary");
  const val = Number(salaryInput.value);
  if (val > 0) {
    salary = val; salaryConfirmed = true; saveData(); syncSetupUI();
    Popup.toast("Salary confirmed!");
  } else {
    Popup.alert("Invalid Input", "Please enter a valid monthly income.");
  }
}

function editSalary() {
  salaryConfirmed = false; ruleSelected = false; saveData(); syncSetupUI();
}

function syncSetupUI() {
  const stepSalary = document.getElementById("step-salary");
  const stepRule = document.getElementById("step-rule");
  const summary = document.getElementById("setup-summary");
  const title = document.getElementById("setup-title");
  const editCard = document.getElementById("edit-form-card");
  const dataCard = document.getElementById("data-table-card");
  if (!stepSalary) return;
  if (!salaryConfirmed) {
    stepSalary.style.display = "block"; stepRule.style.display = "none"; summary.style.display = "none";
    title.textContent = "Step 1: Monthly Income";
    if (editCard) { editCard.style.opacity = "0.5"; editCard.style.pointerEvents = "none"; }
    if (dataCard) { dataCard.style.opacity = "0.5"; dataCard.style.pointerEvents = "none"; }
    document.getElementById("salary").value = salary || "";
  } else if (!ruleSelected) {
    stepSalary.style.display = "none"; stepRule.style.display = "block"; summary.style.display = "none";
    title.textContent = "Step 2: Budgeting Rule";
    if (editCard) { editCard.style.opacity = "0.5"; editCard.style.pointerEvents = "none"; }
    if (dataCard) { dataCard.style.opacity = "0.5"; dataCard.style.pointerEvents = "none"; }
  } else {
    stepSalary.style.display = "none"; stepRule.style.display = "none"; summary.style.display = "block";
    title.textContent = "Setup Active";
    if (editCard) { editCard.style.opacity = "1"; editCard.style.pointerEvents = "auto"; }
    if (dataCard) { dataCard.style.opacity = "1"; dataCard.style.pointerEvents = "auto"; }
    calculateSplit();
  }
}

function setBudgetRule(rule) {
  budgetRule = rule; ruleSelected = true; saveData(); syncSetupUI(); calculateSplit();
  Popup.toast(`Rule ${rule.split('').join('/')} activated!`);
}

function getRulePercentages() {
  if (budgetRule === '721') return { needs: 0.7, savings: 0.2, wants: 0.1 };
  return { needs: 0.6, savings: 0.2, wants: 0.2 };
}

function advanceDate(dateStr, months) {
  if (!dateStr) return "";
  const d = new Date(dateStr); const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().split('T')[0];
}

function openEntryModal() {
  const modal = document.getElementById('entry-modal');
  if (modal) modal.classList.add('active');
}

function closeEntryModal() {
  const modal = document.getElementById('entry-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(clearForm, 300);
  }
}

async function addItem() {
  const desc = document.getElementById("desc").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const dueDate = document.getElementById("dueDate").value;
  const editIndex = parseInt(document.getElementById("edit-index").value);

  if (!desc || !amount) return Popup.toast("Fill in all fields", "warning");

  const percs = getRulePercentages();
  const limit = salary * percs[category.toLowerCase()];
  const currentTotal = data.filter((item, idx) => item.category === category && idx !== editIndex).reduce((sum, item) => sum + item.amount, 0);

  if (currentTotal + amount > limit) {
    const proceed = await Popup.confirm("Budget Exceeded", `Limit is RM ${limit.toFixed(2)}. Total will be RM ${(currentTotal + amount).toFixed(2)}. Save anyway?`);
    if (!proceed) return;
  }

  const newItem = { desc, amount, category, dueDate, completed: editIndex > -1 ? data[editIndex].completed : false };
  if (editIndex > -1) {
    data[editIndex] = newItem; document.getElementById("edit-index").value = "-1";
    document.getElementById("add-btn").textContent = "Add Item";
  } else {
    data.push(newItem);
  }
  saveData(); clearForm(); renderAll(); calculateSplit();
  closeEntryModal();
  Popup.toast("Data saved!");
}

function editItem(index) {
  const item = data[index];
  document.getElementById("desc").value = item.desc;
  document.getElementById("amount").value = item.amount;
  document.getElementById("category").value = item.category;
  document.getElementById("dueDate").value = item.dueDate || "";
  document.getElementById("edit-index").value = index;
  document.getElementById("add-btn").textContent = "Update Item";
  openEntryModal();
}

async function deleteItem(index) {
  const confirmed = await Popup.confirm("Delete Item", "Are you sure you want to remove this entry?");
  if (confirmed) {
    data.splice(index, 1); saveData(); renderAll(); calculateSplit();
    Popup.toast("Item deleted");
  }
}

function toggleComplete(index) {
  const item = data[index];
  item.completed = !item.completed;
  if (item.completed && navigator.vibrate) navigator.vibrate(50);
  saveData();
  Popup.toast(item.completed ? "Marked Done" : "Marked Pending");
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "entry.html") renderAll();
  else if (path.includes(".html")) {
    const category = path.replace(".html", "").charAt(0).toUpperCase() + path.replace(".html", "").slice(1);
    renderCategory(category);
  }
}

function clearForm() {
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("dueDate").value = "";
}

function openFilterModal() {
  const modal = document.getElementById('filter-modal');
  if (modal) modal.classList.add('active');
}

function closeFilterModal() {
  const modal = document.getElementById('filter-modal');
  if (modal) modal.classList.remove('active');
}

let currentCategoryFilter = "All";
let currentTimeFilter = "All";

function renderAll() {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  const today = new Date(); today.setHours(0,0,0,0);
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const searchKeyword = document.getElementById("search-keyword")?.value.toLowerCase() || "";

  const filteredData = data.filter(item => {
    // Category Filter
    const catMatch = currentCategoryFilter === "All" || item.category === currentCategoryFilter;
    
    // Time Filter
    let timeMatch = true;
    if (currentTimeFilter !== "All" && item.dueDate) {
      const itemDate = new Date(item.dueDate);
      if (currentTimeFilter === "Week") timeMatch = itemDate >= startOfWeek;
      else if (currentTimeFilter === "Month") timeMatch = itemDate >= startOfMonth;
    } else if (currentTimeFilter !== "All" && !item.dueDate) {
      timeMatch = false;
    }
    
    // Keyword Search
    const nameMatch = item.desc.toLowerCase().includes(searchKeyword);
    
    return catMatch && timeMatch && nameMatch;
  });

  filteredData.forEach((item) => {
    const originalIndex = data.indexOf(item);
    const tr = document.createElement('tr');
    if (item.completed) tr.classList.add('completed-row');
    tr.innerHTML = `
      <td data-label="Description">${item.desc}</td>
      <td data-label="Amount">RM ${item.amount.toFixed(2)}</td>
      <td data-label="Category">${item.category}</td>
      <td data-label="Due Date">${item.dueDate || "-"}</td>
      <td data-label="Action">
        <button class="edit-btn" onclick="editItem(${originalIndex})" style="width:auto;margin:0;padding:6px;border-radius:8px;">${ICONS.edit}</button>
      </td>
    `;
    attachSwipeListeners(tr, originalIndex);
    tbody.appendChild(tr);
  });

  if (salary > 0 && (currentCategoryFilter === "All" || currentCategoryFilter === "Needs") && !searchKeyword) {
    const autoValue = getAutoNeedsValue();
    const autoRow = document.createElement('tr');
    autoRow.style.background = "rgba(16, 185, 129, 0.05)";
    autoRow.innerHTML = `<td data-label="Description">Foods (Auto)</td><td data-label="Amount">RM ${autoValue.toFixed(2)}</td><td data-label="Category">Needs</td><td data-label="Due Date">-</td><td data-label="Action"><small>Auto</small></td>`;
    tbody.appendChild(autoRow);
  }
  
  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">No results found.</td></tr>';
  }
}

function renderCategory(category) {
  const tbody = document.querySelector("#table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let totalAmount = 0, completedAmount = 0;
  
  const categoryItems = data.filter(item => item.category === category);
  
  categoryItems.forEach((item) => {
    totalAmount += item.amount;
    if (item.completed) completedAmount += item.amount;
    
    const originalIndex = data.indexOf(item);
    const tr = document.createElement('tr');
    if (item.completed) tr.classList.add('completed-row');
    
    tr.innerHTML = `
      <td data-label="Description">${item.desc}</td>
      <td data-label="Amount">RM ${item.amount.toFixed(2)}</td>
      <td data-label="Date">${item.dueDate || "-"}</td>
    `;
    
    attachSwipeListeners(tr, originalIndex);
    tbody.appendChild(tr);
  });
  
  if (category === 'Needs' && salary > 0) {
    const autoValue = getAutoNeedsValue(); totalAmount += autoValue;
    const autoRow = document.createElement('tr');
    autoRow.style.background = "rgba(16, 185, 129, 0.05)";
    autoRow.innerHTML = `<td data-label="Description">Foods (Auto)</td><td data-label="Amount">RM ${autoValue.toFixed(2)}</td><td data-label="Date">-</td>`;
    tbody.appendChild(autoRow);
  }
  const totalEl = document.getElementById("total-category");
  if (totalEl) totalEl.textContent = `Balance: RM ${(totalAmount - completedAmount).toFixed(2)} / RM ${totalAmount.toFixed(2)}`;
}

let urgentNotifications = [];

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
  
  urgentNotifications = [];
  data.forEach(item => {
    totalExpenses += item.amount;
    if (item.dueDate && !item.completed) {
      const dueDate = new Date(item.dueDate); dueDate.setHours(0,0,0,0);
      if (dueDate >= today && dueDate <= nextWeek) dueSoonCount++;
      if (item.category === 'Needs') {
        const isOverdue = dueDate < today;
        const isDueSoon = dueDate >= today && dueDate <= nextWeek;
        if (isOverdue || isDueSoon) {
          urgentNotifications.push({
            ...item,
            isOverdue,
            isDueSoon,
            sortDate: dueDate
          });
        }
      }
    }
  });

  // Sort: Overdue first, then by date ascending
  urgentNotifications.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.sortDate - b.sortDate;
  });

  remindersList.innerHTML = "";
  if (urgentNotifications.length === 0) {
    remindersList.innerHTML = '<p class="no-data">No urgent notifications.</p>';
  } else {
    // Show only top 3
    urgentNotifications.slice(0, 3).forEach(item => {
      remindersList.innerHTML += `
        <div class="reminder-item ${item.isOverdue ? 'overdue' : 'due-soon'}">
          ${item.isOverdue ? ICONS.danger : ICONS.warning}
          <div><strong>${item.desc}</strong> ${item.isOverdue ? 'overdue since' : 'due on'} ${item.dueDate}</div>
        </div>`;
    });
    if (urgentNotifications.length > 3) {
      remindersList.innerHTML += `<p style="font-size: 0.75rem; color: var(--accent-color); text-align: center; margin-top: 5px;">+ ${urgentNotifications.length - 3} more. Tap to view all.</p>`;
    }
  }

  const autoNeeds = getAutoNeedsValue(); totalExpenses += autoNeeds;
  dashTotal.textContent = `RM ${totalExpenses.toFixed(2)}`;
  dashDueSoon.textContent = `${dueSoonCount} Items`;
  calculateSplit();
}

function showAllNotifications() {
  const modal = document.getElementById("notifications-modal");
  const list = document.getElementById("all-reminders-list");
  if (!modal || !list) return;

  list.innerHTML = "";
  if (urgentNotifications.length === 0) {
    list.innerHTML = '<p class="no-data">No urgent notifications.</p>';
  } else {
    urgentNotifications.forEach(item => {
      list.innerHTML += `
        <div class="reminder-item ${item.isOverdue ? 'overdue' : 'due-soon'}" style="margin-bottom: 10px;">
          ${item.isOverdue ? ICONS.danger : ICONS.warning}
          <div><strong>${item.desc}</strong> ${item.isOverdue ? 'overdue since' : 'due on'} ${item.dueDate}</div>
        </div>`;
    });
  }
  modal.classList.add("active");
}

function closeAllNotifications() {
  const modal = document.getElementById("notifications-modal");
  if (modal) modal.classList.remove("active");
}

function calculateSplit() {
  const percs = getRulePercentages();
  const limits = { needs: salary * percs.needs, wants: salary * percs.wants, savings: salary * percs.savings };
  const currentTotals = { needs: 0, wants: 0, savings: 0 };
  data.forEach(item => { const cat = item.category.toLowerCase(); if (currentTotals.hasOwnProperty(cat)) currentTotals[cat] += item.amount; });
  if (salary > 0) currentTotals.needs += getAutoNeedsValue();

  const updateDisplay = (id, percId, alloc, total, barId, totalId) => {
    const el = document.getElementById(id);
    const barEl = document.getElementById(barId);
    const totalDisplayEl = document.getElementById(totalId);
    if (el) el.textContent = `RM ${alloc.toFixed(0)}`;
    if (totalDisplayEl) totalDisplayEl.textContent = `RM ${total.toFixed(0)}`;
    if (barEl) {
      const percentage = salary > 0 ? Math.min(100, (total / alloc) * 100) : 0;
      barEl.style.width = `${percentage}%`;
      barEl.classList.remove('warning', 'danger');
      if (percentage > 100) barEl.classList.add('danger');
      else if (percentage > 85) barEl.classList.add('warning');
    }
  };

  updateDisplay("needs", "perc-needs", limits.needs, currentTotals.needs, "bar-needs", "total-needs");
  updateDisplay("wants", "perc-wants", limits.wants, currentTotals.wants, "bar-wants", "total-wants");
  updateDisplay("savings", "perc-savings", limits.savings, currentTotals.savings, "bar-savings", "total-savings");
  
  const healthCircle = document.getElementById("health-circle");
  if (healthCircle) {
    let overCount = 0;
    if (currentTotals.needs > limits.needs) overCount++;
    if (currentTotals.wants > limits.wants) overCount++;
    if (currentTotals.savings > limits.savings) overCount++;
    const healthTitle = document.getElementById("health-title");
    const healthDesc = document.getElementById("health-desc");
    if (overCount === 0) {
      healthCircle.textContent = "100%"; healthCircle.style.color = "#10b981"; healthCircle.style.borderColor = "#10b981";
      healthTitle.textContent = "Budget Healthy"; healthDesc.textContent = "Spending within limits.";
    } else {
      healthCircle.textContent = overCount === 1 ? "80%" : "40%";
      healthCircle.style.color = overCount === 1 ? "#f59e0b" : "#ef4444";
      healthCircle.style.borderColor = overCount === 1 ? "#f59e0b" : "#ef4444";
      healthTitle.textContent = overCount === 1 ? "Watching Limits" : "Critical Overspend";
      healthDesc.textContent = overCount === 1 ? "One category is over budget." : "Multiple categories over limit.";
    }
  }
}

function attachSwipeListeners(row, index) {
  row.classList.add('swipe-row');
  const path = window.location.pathname.split("/").pop() || "index.html";
  const isEntryPage = path === "entry.html";
  const swipeAction = document.createElement('div');
  swipeAction.className = 'swipe-action';
  if (isEntryPage) {
    swipeAction.innerHTML = ICONS.delete; swipeAction.classList.add('delete-action');
    swipeAction.onclick = (e) => { e.stopPropagation(); deleteItem(index); };
  } else {
    const isCompleted = data[index].completed;
    swipeAction.innerHTML = isCompleted ? ICONS.undo : ICONS.check;
    swipeAction.className = `swipe-action ${isCompleted ? 'undo-action' : 'done-action'}`;
    swipeAction.onclick = (e) => { e.stopPropagation(); toggleComplete(index); resetOpenedRow(); };
  }
  row.appendChild(swipeAction);
  row.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  row.addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; handleGesture(row, index); }, { passive: true });
}

function handleGesture(row, index) {
  const swipeAction = row.querySelector('.swipe-action');
  if (!swipeAction) return;
  if (touchendX < touchstartX - 70) {
    if (openedRow && openedRow !== row) resetOpenedRow();
    row.style.transform = "translateX(-80px)"; swipeAction.style.opacity = "1"; openedRow = row;
  } else if (touchendX > touchstartX + 50) {
    row.style.transform = "translateX(0)"; swipeAction.style.opacity = "0"; if (openedRow === row) openedRow = null;
  }
}

function resetOpenedRow() {
  if (openedRow) {
    openedRow.style.transform = "translateX(0)";
    const action = openedRow.querySelector('.swipe-action');
    if (action) action.style.opacity = "0";
    openedRow = null;
  }
}

function initFilters() {
  const catPills = document.querySelectorAll("#filter-category .pill");
  const timePills = document.querySelectorAll("#filter-time .pill");
  catPills.forEach(pill => { pill.onclick = () => { catPills.forEach(p => p.classList.remove("active")); pill.classList.add("active"); currentCategoryFilter = pill.dataset.value; renderAll(); }; });
  timePills.forEach(pill => { pill.onclick = () => { timePills.forEach(p => p.classList.remove("active")); pill.classList.add("active"); currentTimeFilter = pill.dataset.value; renderAll(); }; });
}

async function resetData() {
  const confirmed = await Popup.confirm("New Month Reset", "Advance dates by 1 month and reset status?");
  if (confirmed) {
    data = data.map(item => ({ ...item, completed: false, dueDate: item.dueDate ? advanceDate(item.dueDate, 1) : "" }));
    saveData(); location.reload();
  }
}

function getAutoNeedsValue() {
  const percs = getRulePercentages(); const needsAlloc = salary * percs.needs;
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
  if (data.length === 0) return Popup.toast("No data", "warning");
  const headers = ["Description", "Amount", "Category", "DueDate", "Completed"];
  const csv = [headers.join(","), ...data.map(item => [`"${item.desc}"`, item.amount, item.category, item.dueDate || "", item.completed ? "TRUE" : "FALSE"].join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `budget.csv`; link.click();
}

function importFromCSV(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split(/\r?\n/); const importedData = [];
    for (let i = 1; i < lines.length; i++) {
      const p = lines[i].split(","); if (p.length < 3) continue;
      importedData.push({ desc: p[0].replace(/"/g,''), amount: parseFloat(p[1]), category: p[2], dueDate: p[3], completed: p[4] === "TRUE" });
    }
    data = [...data, ...importedData]; saveData(); location.reload();
  };
  reader.readAsText(file);
}

window.addEventListener('load', () => {
  showSkeletons("#table"); updateActiveNav();
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "index.html") updateDashboard();
  else if (path === "entry.html") { syncSetupUI(); renderAll(); initFilters(); }
  else { 
    const cat = path.replace(".html", "").charAt(0).toUpperCase() + path.replace(".html", "").slice(1);
    if (["Needs", "Savings", "Wants"].includes(cat)) renderCategory(cat);
  }
});
