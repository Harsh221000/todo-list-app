// Todo App State
let todos = [];
let currentFilter = 'all';
let editingId = null;

// Local Storage Keys
const STORAGE_KEY = 'todos';

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const sortBtn = document.getElementById('sortBtn');
const exportBtn = document.getElementById('exportBtn');
const prioritySelect = document.getElementById('prioritySelect');
const modal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const editPriority = document.getElementById('editPriority');
const saveBtn = document.getElementById('savebtn');
const cancelBtn = document.getElementById('cancelbtn');
const modalClose = document.querySelector('.modal-close');
const notification = document.getElementById('notification');

// Stats Elements
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');
const progressPercentEl = document.getElementById('progressPercent');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    loadTodosFromStorage();
    renderTodos();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.closest('.filter-btn').classList.add('active');
            currentFilter = e.target.closest('.filter-btn').dataset.filter;
            renderTodos();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    sortBtn.addEventListener('click', sortByPriority);
    exportBtn.addEventListener('click', exportTasks);

    // Modal Events
    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveEditedTodo);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();
    const priority = prioritySelect.value;

    if (text === '') {
        showNotification('Please enter a task', 'warning');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: priority,
        createdAt: new Date().toLocaleDateString()
    };

    todos.push(todo);
    saveTodosToStorage();
    todoInput.value = '';
    prioritySelect.value = 'medium';
    renderTodos();
    showNotification('Task added successfully!', 'success');
}

// Toggle Todo Completion
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodosToStorage();
        renderTodos();
        showNotification(
            todo.completed ? 'Task completed!' : 'Task marked as incomplete',
            'success'
        );
    }
}

// Delete Todo
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodosToStorage();
        renderTodos();
        showNotification('Task deleted', 'success');
    }
}

// Open Edit Modal
function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        editingId = id;
        editInput.value = todo.text;
        editPriority.value = todo.priority;
        modal.style.display = 'block';
        editInput.focus();
    }
}

// Save Edited Todo
function saveEditedTodo() {
    const text = editInput.value.trim();
    if (text === '') {
        showNotification('Task cannot be empty', 'warning');
        return;
    }

    const todo = todos.find(t => t.id === editingId);
    if (todo) {
        todo.text = text;
        todo.priority = editPriority.value;
        saveTodosToStorage();
        renderTodos();
        closeModal();
        showNotification('Task updated successfully!', 'success');
    }
}

// Close Modal
function closeModal() {
    modal.style.display = 'none';
    editingId = null;
}

// Clear Completed Todos
function clearCompleted() {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) {
        showNotification('No completed tasks to clear', 'warning');
        return;
    }

    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodosToStorage();
        renderTodos();
        showNotification('Completed tasks cleared', 'success');
    }
}

// Sort by Priority
function sortByPriority() {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    todos.sort((a, b) => {
        if (a.completed === b.completed) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.completed - b.completed;
    });
    saveTodosToStorage();
    renderTodos();
    showNotification('Tasks sorted by priority', 'success');
}

// Export Tasks
function exportTasks() {
    if (todos.length === 0) {
        showNotification('No tasks to export', 'warning');
        return;
    }

    const csvContent = convertToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Tasks exported successfully!', 'success');
}

// Convert to CSV
function convertToCSV() {
    const headers = ['Task', 'Priority', 'Status', 'Created Date'];
    const rows = todos.map(todo => [
        `"${todo.text.replace(/"/g, '""')}"`,
        todo.priority,
        todo.completed ? 'Completed' : 'Active',
        todo.createdAt
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// Render Todos
function renderTodos() {
    todoList.innerHTML = '';
    let filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        emptyState.style.display = 'block';
        todoList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    todoList.style.display = 'flex';

    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.priority} ${todo.completed ? 'completed' : ''}`;
        todoItem.innerHTML = `
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <span class="todo-priority ${todo.priority}">${todo.priority}</span>
            <div class="todo-actions">
                <button class="todo-btn edit-btn" onclick="openEditModal(${todo.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-btn delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        todoList.appendChild(todoItem);
    });

    updateStats();
}

// Get Filtered Todos
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        case 'high':
            return todos.filter(t => t.priority === 'high');
        default:
            return todos;
    }
}

// Update Stats
function updateStats() {
    const total = todos.length;
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
    progressPercentEl.textContent = progress + '%';
}

// Show Notification
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Local Storage Functions
function saveTodosToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodosFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : [];
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}