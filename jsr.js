/**
 * Advanced Task Manager - Professional Task Management Application
 * Features: Categories, Priorities, Due Dates, Local Storage, Dark Mode, Export/Import
 */

class AdvancedTaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentSort = 'created';
        this.searchQuery = '';
        this.currentTheme = 'light';

        // Initialize the application
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.renderTasks();
        this.updateStatistics();
        this.checkOverdueTasks();

        // Check for overdue tasks every minute
        setInterval(() => this.checkOverdueTasks(), 60000);
    }

    // Storage Management
    saveToStorage() {
        try {
            localStorage.setItem('advancedTasks', JSON.stringify(this.tasks));
            localStorage.setItem('taskManagerSettings', JSON.stringify({
                theme: this.currentTheme,
                filter: this.currentFilter,
                sort: this.currentSort
            }));
        } catch (error) {
            this.showNotification('خطأ في حفظ البيانات', 'error');
        }
    }

    loadFromStorage() {
        try {
            const savedTasks = localStorage.getItem('advancedTasks');
            const savedSettings = localStorage.getItem('taskManagerSettings');

            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // Convert date strings back to Date objects
                this.tasks.forEach(task => {
                    if (task.createdAt) task.createdAt = new Date(task.createdAt);
                    if (task.dueDate) task.dueDate = new Date(task.dueDate);
                    if (task.completedAt) task.completedAt = new Date(task.completedAt);
                });
            }

            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.currentTheme = settings.theme || 'light';
                this.currentFilter = settings.filter || 'all';
                this.currentSort = settings.sort || 'created';
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    const toggleEmptyState = () => {
        emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
    };

    const updateProgress = (checkCompletion = true) => {
        const totalTasks = taskList.children.length;
        const completeTasks = taskList.querySelectorAll('.checkbox:checked').length;

        progressBar.style.width = totalTasks ? `${(completeTasks / totalTasks) * 100}%` : '0%';
        progressNumbers.textContent = `${completeTasks} / ${totalTasks}`;
        if (checkCompletion && totalTasks > 0 && completeTasks === totalTasks) {
            triggerConfetti();
        }
    };

    const addTask = (text = '', completed = false) => {
        const taskText = text || taskInput.value.trim();
        if (!taskText) return;

        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''} />
            <span>${taskText}</span>
            <div class="task-buttons">
                <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        const checkbox = li.querySelector('.checkbox');
        const editBtn = li.querySelector('.edit-btn');

        if (completed) {
            li.classList.add('completed');
            editBtn.disabled = true;
        }

        checkbox.addEventListener('change', () => {
            li.classList.toggle('completed', checkbox.checked);
            editBtn.disabled = checkbox.checked;
            updateProgress();
        });

        editBtn.addEventListener('click', () => {
            if (!checkbox.checked) {
                taskInput.value = li.querySelector('span').textContent;
                li.remove();
                toggleEmptyState();
                updateProgress();
            }
        });

        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            toggleEmptyState();
            updateProgress();
        });

        taskList.appendChild(li);
        taskInput.value = '';
        toggleEmptyState();
        updateProgress();
    };

    addTaskBtn.addEventListener('click', () => addTask());
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
});

const triggerConfetti = () => {
    const end = Date.now() + 2 * 1000;
    const colors = ["#000000", "#0023dd"];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
        });

        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
};
});