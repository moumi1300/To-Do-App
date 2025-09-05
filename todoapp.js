 /* ===============================
   Simple To-Do App (Vanilla JS)
   Features:
   - Add task
   - Pending vs Completed lists
   - Toggle complete/incomplete
   - Edit and Delete (from any list)
   - Timestamps: createdAt & completedAt
   - Persist to localStorage
================================== */

const els = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  pendingList: document.getElementById('pending-list'),
  completedList: document.getElementById('completed-list'),
  emptyPending: document.getElementById('empty-pending'),
  emptyCompleted: document.getElementById('empty-completed'),
  tpl: document.getElementById('task-item-template'),
  countTotal: document.getElementById('count-total'),
  countPending: document.getElementById('count-pending'),
  countCompleted: document.getElementById('count-completed'),
  badgePending: document.getElementById('badge-pending'),
  badgeCompleted: document.getElementById('badge-completed'),
  clearAll: document.getElementById('clear-all'),
  exportBtn: document.getElementById('export-json'),
};

const STORAGE_KEY = 'todo.tasks.v1';

/** @type {Array<{id:string,text:string,createdAt:number,completed:boolean,completedAt:number|null}>} */
let tasks = loadTasks();

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  updateCounts();
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function fmt(ts) {
  if (!ts) return '';
  // Shows local date & time, e.g., "27 Aug 2025, 7:32 PM"
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ---------- Rendering ---------- */

function clearList(list) {
  while (list.firstChild) list.removeChild(list.firstChild);
}

function render() {
  clearList(els.pendingList);
  clearList(els.completedList);

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  pending.forEach(t => els.pendingList.appendChild(renderItem(t)));
  completed.forEach(t => els.completedList.appendChild(renderItem(t)));

  els.emptyPending.style.display = pending.length ? 'none' : 'block';
  els.emptyCompleted.style.display = completed.length ? 'none' : 'block';

  updateCounts();
}

function renderItem(task) {
  const node = /** @type {HTMLLIElement} */els.tpl.content.firstElementChild.cloneNode(true);

  const li = node;
  const checkbox = li.querySelector('.toggle');
  const textSpan = li.querySelector('.task-text');
  const editInput = li.querySelector('.task-edit');
  const timeAdded = li.querySelector('.time-added');
  const timeCompleted = li.querySelector('.time-completed');
  const btnEdit = li.querySelector('.edit');
  const btnSave = li.querySelector('.save');
  const btnCancel = li.querySelector('.cancel');
  const btnDelete = li.querySelector('.delete');

  li.dataset.id = task.id;
  li.classList.toggle('completed', task.completed);

  textSpan.textContent = task.text;
  editInput.value = task.text;
  checkbox.checked = task.completed;

  timeAdded.textContent = Added: ${fmt(task.createdAt)};
  timeCompleted.textContent = task.completedAt ? Completed: ${fmt(task.completedAt)} : '';

  // Toggle complete/incomplete
  checkbox.addEventListener('change', () => {
    const now = Date.now();
    updateTask(task.id, {
      completed: checkbox.checked,
      completedAt: checkbox.checked ? now : null
    });
  });

  // Edit
  btnEdit.addEventListener('click', () => startEditing(li));
  textSpan.addEventListener('dblclick', () => startEditing(li));

  // Save
  btnSave.addEventListener('click', () => commitEdit(li, task.id));
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit(li, task.id);
    if (e.key === 'Escape') cancelEdit(li);
  });

  // Cancel
  btnCancel.addEventListener('click', () => cancelEdit(li));

  // Delete
  btnDelete.addEventListener('click', () => {
    if (confirm('Delete this task?')) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    }
  });

  return li;
}

function startEditing(li) {
  li.classList.add('editing');
  const input = li.querySelector('.task-edit');
  input.value = li.querySelector('.task-text').textContent || '';
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function cancelEdit(li) {
  li.classList.remove('editing');
}

function commitEdit(li, id) {
  const input = li.querySelector('.task-edit');
  const newText = input.value.trim();
  if (!newText) {
    alert('Task cannot be empty.');
    return;
  }
  updateTask(id, { text: newText });
  li.classList.remove('editing');
}

function updateTask(id, patch) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], ...patch };
  saveTasks();
  render();
}

function updateCounts() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.completed).length;
  const completed = total - pending;

  els.countTotal.textContent = String(total);
  els.countPending.textContent = String(pending);
  els.countCompleted.textContent = String(completed);
  els.badgePending.textContent = String(pending);
  els.badgeCompleted.textContent = String(completed);
}

/* ---------- Events ---------- */

// Add task
els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
  const now = Date.now();
  tasks.unshift({
    id: uid(),
    text,
    createdAt: now,
    completed: false,
    completedAt: null
  });
  els.input.value = '';
  saveTasks();
  render();
});

// Clear all
els.clearAll.addEventListener('click', () => {
  if (!tasks.length) return;
  if (confirm('Clear all tasks?')) {
    tasks = [];
    saveTasks();
    render();
  }
});

// Export JSON
els.exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = tasks-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Initial paint
render();