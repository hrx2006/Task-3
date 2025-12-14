// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.nextId = this.getNextId();
        this.initializeEventListeners();
        this.renderTasks();
        this.updateStats();
    }

    getNextId() {
        return this.tasks.length > 0 ? Math.max(...this.tasks.map(task => task.id)) + 1 : 1;
    }

    initializeEventListeners() {
        // Add task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Edit modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();

        if (taskText === '') return;

        const newTask = {
            id: this.nextId++,
            text: taskText,
            completed: false,
            createdAt: new Date(),
            completedAt: null
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Clear input
        taskInput.value = '';
        taskInput.focus();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    saveEditedTask() {
        const taskId = parseInt(document.getElementById('editTaskId').value);
        const newText = document.getElementById('editTaskInput').value.trim();

        if (newText === '') return;

        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
        }
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update task lists
        document.querySelectorAll('.task-list').forEach(list => {
            list.classList.remove('active');
        });
        document.getElementById(`${tabName}TasksList`).classList.add('active');
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString();
    }

    renderTasks() {
        // Render all tasks
        const allTasksContainer = document.getElementById('allTasksContainer');
        const pendingTasksContainer = document.getElementById('pendingTasksContainer');
        const completedTasksContainer = document.getElementById('completedTasksContainer');

        // Clear containers
        allTasksContainer.innerHTML = '';
        pendingTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';

        if (this.tasks.length === 0) {
            allTasksContainer.innerHTML = '<div class="empty-state">No tasks yet. Add a new task to get started!</div>';
            pendingTasksContainer.innerHTML = '<div class="empty-state">No pending tasks.</div>';
            completedTasksContainer.innerHTML = '<div class="empty-state">No completed tasks yet.</div>';
            return;
        }

        // Sort tasks by creation date (newest first)
        const sortedTasks = [...this.tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Render all tasks
        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            allTasksContainer.appendChild(taskElement);

            if (task.completed) {
                completedTasksContainer.appendChild(this.createTaskElement(task));
            } else {
                pendingTasksContainer.appendChild(this.createTaskElement(task));
            }
        });

        // Show empty states if needed
        if (pendingTasksContainer.children.length === 0) {
            pendingTasksContainer.innerHTML = '<div class="empty-state">No pending tasks.</div>';
        }

        if (completedTasksContainer.children.length === 0) {
            completedTasksContainer.innerHTML = '<div class="empty-state">No completed tasks yet.</div>';
        }
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <div>Created: ${this.formatDate(task.createdAt)}</div>
                    ${task.completed ? `<div>Completed: ${this.formatDate(task.completedAt)}</div>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners
        const checkbox = taskDiv.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            this.toggleComplete(task.id);
        });

        const editBtn = taskDiv.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            this.editTask(task.id);
        });

        const deleteBtn = taskDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(task.id);
            }
        });

        return taskDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});