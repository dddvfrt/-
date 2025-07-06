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
        this.editingTaskId = null;
        this.taskTimers = new Map(); // Store active task timers

        // Initialize the application
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.createFloatingParticles();
        this.setupCustomCursor();
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

    // Event Listeners Setup
    setupEventListeners() {
        // Task form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderTasks();
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
                this.saveToStorage();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = this.currentSort;
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderTasks();
                this.saveToStorage();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Time tools navigation
        const timeToolsBtn = document.getElementById('time-tools-btn');
        if (timeToolsBtn) {
            timeToolsBtn.addEventListener('click', () => {
                window.location.href = 'time-tools.html';
            });
        }

        // Action buttons
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importFile = document.getElementById('import-file');
        const clearAllBtn = document.getElementById('clear-all-btn');

        if (exportBtn) exportBtn.addEventListener('click', () => this.exportTasks());
        if (importBtn) importBtn.addEventListener('click', () => importFile.click());
        if (importFile) importFile.addEventListener('change', (e) => this.importTasks(e));
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clearAllTasks());

        // Modal functionality
        this.setupModalListeners();
    }

    setupModalListeners() {
        const modal = document.getElementById('task-modal');
        const closeModal = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancel-task-changes');
        const saveBtn = document.getElementById('save-task-changes');

        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveTaskChanges());

        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }

    // Theme Management
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setupTheme();
        this.saveToStorage();
        this.showNotification(
            this.currentTheme === 'dark' ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع الفاتح',
            'info'
        );
    }

    // Task Management
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const titleInput = document.getElementById('task-title');
        const descriptionInput = document.getElementById('task-description');
        const categorySelect = document.getElementById('task-category');
        const prioritySelect = document.getElementById('task-priority');
        const dueDateInput = document.getElementById('task-due-date');
        const timerInput = document.getElementById('task-timer');

        if (!titleInput || !titleInput.value.trim()) {
            this.showNotification('يرجى إدخال عنوان المهمة', 'warning');
            return;
        }

        const task = {
            id: this.generateId(),
            title: titleInput.value.trim(),
            description: descriptionInput ? descriptionInput.value.trim() : '',
            category: categorySelect ? categorySelect.value : 'personal',
            priority: prioritySelect ? prioritySelect.value : 'medium',
            dueDate: dueDateInput && dueDateInput.value ? new Date(dueDateInput.value) : null,
            timerMinutes: timerInput && timerInput.value ? parseInt(timerInput.value) : 0,
            timerRemaining: timerInput && timerInput.value ? parseInt(timerInput.value) * 60 : 0,
            timerActive: false,
            completed: false,
            createdAt: new Date(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.renderTasks();
        this.updateStatistics();
        this.clearForm();
        this.showNotification('تم إضافة المهمة بنجاح', 'success');

        // Trigger confetti if this completes all tasks
        if (this.tasks.length > 0 && this.tasks.every(t => t.completed)) {
            this.triggerConfetti();
        }
    }

    clearForm() {
        const form = document.getElementById('task-form');
        if (form) form.reset();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date() : null;
            this.saveToStorage();
            this.renderTasks();
            this.updateStatistics();

            if (task.completed) {
                this.showNotification('تم إكمال المهمة!', 'success');
                // Check if all tasks are completed
                if (this.tasks.length > 0 && this.tasks.every(t => t.completed)) {
                    setTimeout(() => this.triggerConfetti(), 500);
                }
            }
        }
    }

    deleteTask(taskId) {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
            this.renderTasks();
            this.updateStatistics();
            this.showNotification('تم حذف المهمة', 'info');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.openModal(task);
        }
    }

    // Modal Management
    openModal(task) {
        const modal = document.getElementById('task-modal');
        const titleInput = document.getElementById('modal-task-title');
        const descriptionInput = document.getElementById('modal-task-description');
        const categorySelect = document.getElementById('modal-task-category');
        const prioritySelect = document.getElementById('modal-task-priority');
        const dueDateInput = document.getElementById('modal-task-due-date');
        const timerInput = document.getElementById('modal-task-timer');

        if (modal && task) {
            titleInput.value = task.title;
            descriptionInput.value = task.description || '';
            categorySelect.value = task.category;
            prioritySelect.value = task.priority;

            if (task.dueDate) {
                const date = new Date(task.dueDate);
                dueDateInput.value = date.toISOString().slice(0, 16);
            }

            if (timerInput) {
                timerInput.value = task.timerMinutes || 0;
            }

            modal.style.display = 'flex';
        }
    }

    closeModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.style.display = 'none';
            this.editingTaskId = null;
        }
    }

    saveTaskChanges() {
        if (!this.editingTaskId) return;

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;

        const titleInput = document.getElementById('modal-task-title');
        const descriptionInput = document.getElementById('modal-task-description');
        const categorySelect = document.getElementById('modal-task-category');
        const prioritySelect = document.getElementById('modal-task-priority');
        const dueDateInput = document.getElementById('modal-task-due-date');
        const timerInput = document.getElementById('modal-task-timer');

        if (!titleInput.value.trim()) {
            this.showNotification('يرجى إدخال عنوان المهمة', 'warning');
            return;
        }

        const oldTimerMinutes = task.timerMinutes;
        const newTimerMinutes = timerInput ? parseInt(timerInput.value) || 0 : 0;

        task.title = titleInput.value.trim();
        task.description = descriptionInput.value.trim();
        task.category = categorySelect.value;
        task.priority = prioritySelect.value;
        task.dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;

        // Update timer if changed
        if (newTimerMinutes !== oldTimerMinutes) {
            // Stop current timer if running
            if (task.timerActive) {
                this.pauseTaskTimer(task.id);
            }

            task.timerMinutes = newTimerMinutes;
            task.timerRemaining = newTimerMinutes * 60;
        }

        this.saveToStorage();
        this.renderTasks();
        this.updateStatistics();
        this.closeModal();
        this.showNotification('تم تحديث المهمة بنجاح', 'success');
    }

    // Rendering and Display
    renderTasks() {
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');

        if (!taskList) return;

        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);

        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });

        // Update cursor interactions for new elements
        this.updateCursorInteractions();
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority`;

        // Check if task is overdue
        if (task.dueDate && !task.completed && new Date() > task.dueDate) {
            li.classList.add('overdue');
        }

        const dueDate = task.dueDate ? this.formatDate(task.dueDate) : null;
        const isOverdue = task.dueDate && !task.completed && new Date() > task.dueDate;

        li.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTask('${task.id}')"></div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-tag category">
                            <i class="fas fa-tag"></i>
                            ${this.getCategoryName(task.category)}
                        </span>
                        <span class="task-tag priority">
                            <i class="fas fa-flag"></i>
                            ${this.getPriorityName(task.priority)}
                        </span>
                        ${dueDate ? `<span class="task-tag due-date ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${dueDate}
                        </span>` : ''}
                        ${task.timerMinutes > 0 ? `<span class="task-tag timer ${task.timerActive ? 'active' : ''}">
                            <i class="fas fa-stopwatch"></i>
                            <span class="timer-display" id="timer-${task.id}">${this.formatTimer(task.timerRemaining)}</span>
                        </span>` : ''}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                ${task.timerMinutes > 0 && !task.completed ? `
                    <button class="task-action-btn timer magnetic-element" onclick="taskManager.toggleTaskTimer('${task.id}')" title="${task.timerActive ? 'إيقاف المؤقت' : 'بدء المؤقت'}">
                        <i class="fas fa-${task.timerActive ? 'pause' : 'play'}"></i>
                    </button>
                ` : ''}
                <button class="task-action-btn details magnetic-element" onclick="taskManager.editTask('${task.id}')" title="تفاصيل">
                    <i class="fas fa-info"></i>
                </button>
                <button class="task-action-btn edit magnetic-element" onclick="taskManager.editTask('${task.id}')" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete magnetic-element" onclick="taskManager.deleteTask('${task.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add magnetic class to the task item itself
        li.classList.add('magnetic-element');

        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCategoryName(category) {
        const categories = {
            personal: 'شخصي',
            work: 'عمل',
            study: 'دراسة',
            health: 'صحة',
            shopping: 'تسوق',
            other: 'أخرى'
        };
        return categories[category] || category;
    }

    getPriorityName(priority) {
        const priorities = {
            low: 'منخفضة',
            medium: 'متوسطة',
            high: 'عالية',
            urgent: 'عاجلة'
        };
        return priorities[priority] || priority;
    }

    formatDate(date) {
        const now = new Date();
        const taskDate = new Date(date);
        const diffTime = taskDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'غداً';
        if (diffDays === -1) return 'أمس';
        if (diffDays < 0) return `متأخر ${Math.abs(diffDays)} يوم`;
        if (diffDays <= 7) return `خلال ${diffDays} أيام`;

        return taskDate.toLocaleDateString('ar-SA');
    }

    // Filtering and Sorting
    getFilteredTasks() {
        return this.tasks.filter(task => {
            // Filter by status
            if (this.currentFilter === 'completed' && !task.completed) return false;
            if (this.currentFilter === 'pending' && task.completed) return false;
            if (this.currentFilter === 'overdue' && (!task.dueDate || task.completed || new Date() <= task.dueDate)) return false;

            // Filter by search query
            if (this.searchQuery) {
                const searchLower = this.searchQuery.toLowerCase();
                return task.title.toLowerCase().includes(searchLower) ||
                    (task.description && task.description.toLowerCase().includes(searchLower)) ||
                    this.getCategoryName(task.category).toLowerCase().includes(searchLower) ||
                    this.getPriorityName(task.priority).toLowerCase().includes(searchLower);
            }

            return true;
        });
    }

    getSortedTasks(tasks) {
        return [...tasks].sort((a, b) => {
            switch (this.currentSort) {
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'due-date':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'alphabetical':
                    return a.title.localeCompare(b.title, 'ar');
                case 'created':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    // Statistics and Progress
    updateStatistics() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Update statistics display
        const totalElement = document.getElementById('total-tasks');
        const completedElement = document.getElementById('completed-tasks');
        const pendingElement = document.getElementById('pending-tasks');
        const productivityElement = document.getElementById('productivity-rate');

        if (totalElement) totalElement.textContent = totalTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (pendingElement) pendingElement.textContent = pendingTasks;
        if (productivityElement) productivityElement.textContent = `${productivityRate}%`;

        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            progressBar.style.width = `${productivityRate}%`;
        }

        if (progressText) {
            progressText.textContent = `${completedTasks} من ${totalTasks} مهام مكتملة`;
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Overdue Tasks Check
    checkOverdueTasks() {
        const overdueTasks = this.tasks.filter(task =>
            task.dueDate && !task.completed && new Date() > task.dueDate
        );

        if (overdueTasks.length > 0 && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('مهام متأخرة!', {
                    body: `لديك ${overdueTasks.length} مهام متأخرة`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }

    // Export/Import Functions
    exportTasks() {
        try {
            const dataStr = JSON.stringify(this.tasks, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showNotification('تم تصدير المهام بنجاح', 'success');
        } catch (error) {
            this.showNotification('خطأ في تصدير المهام', 'error');
        }
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);

                if (Array.isArray(importedTasks)) {
                    // Convert date strings back to Date objects
                    importedTasks.forEach(task => {
                        if (task.createdAt) task.createdAt = new Date(task.createdAt);
                        if (task.dueDate) task.dueDate = new Date(task.dueDate);
                        if (task.completedAt) task.completedAt = new Date(task.completedAt);
                        if (!task.id) task.id = this.generateId();
                    });

                    this.tasks = [...this.tasks, ...importedTasks];
                    this.saveToStorage();
                    this.renderTasks();
                    this.updateStatistics();
                    this.showNotification(`تم استيراد ${importedTasks.length} مهام`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('خطأ في استيراد المهام - تأكد من صحة الملف', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    clearAllTasks() {
        if (confirm('هل أنت متأكد من حذف جميع المهام؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            this.tasks = [];
            this.saveToStorage();
            this.renderTasks();
            this.updateStatistics();
            this.showNotification('تم حذف جميع المهام', 'info');
        }
    }

    // Confetti Animation
    triggerConfetti() {
        if (typeof confetti !== 'undefined') {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                }));
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                }));
            }, 250);
        }
    }

    // Custom Cyberpunk Cursor Setup
    setupCustomCursor() {
        const cursor = document.getElementById('custom-cursor');
        if (!cursor) return;

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        const trailElements = [];
        const trailLength = 8;

        // Create cursor trail elements
        for (let i = 0; i < trailLength; i++) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.opacity = (1 - i / trailLength) * 0.7;
            trail.style.transform = `scale(${1 - i / trailLength * 0.5})`;
            document.body.appendChild(trail);
            trailElements.push({
                element: trail,
                x: 0,
                y: 0
            });
        }

        // Mouse move handler
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor animation
        const animateCursor = () => {
            // Smooth cursor movement
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;

            cursor.style.left = cursorX - 10 + 'px';
            cursor.style.top = cursorY - 10 + 'px';

            // Update trail
            trailElements.forEach((trail, index) => {
                const targetX = index === 0 ? cursorX : trailElements[index - 1].x;
                const targetY = index === 0 ? cursorY : trailElements[index - 1].y;

                trail.x += (targetX - trail.x) * 0.3;
                trail.y += (targetY - trail.y) * 0.3;

                trail.element.style.left = trail.x - 3 + 'px';
                trail.element.style.top = trail.y - 3 + 'px';
            });

            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Hover effects for interactive elements
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input, textarea, select');
        const taskItems = document.querySelectorAll('.task-item');
        const statCards = document.querySelectorAll('.stat-card');

        // Button hover effects
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                cursor.classList.add('button');
                if (button.classList.contains('danger') || button.classList.contains('delete')) {
                    cursor.classList.add('danger');
                }
            });

            button.addEventListener('mouseleave', () => {
                cursor.classList.remove('button', 'danger');
            });
        });

        // Input hover effects
        inputs.forEach(input => {
            input.addEventListener('mouseenter', () => {
                cursor.classList.add('text');
            });

            input.addEventListener('mouseleave', () => {
                cursor.classList.remove('text');
            });
        });

        // Task items and stat cards
        [...taskItems, ...statCards].forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
            });

            element.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
            });
        });

        // Text input cursor
        const textInputs = document.querySelectorAll('input[type="text"], textarea, input[type="search"]');
        textInputs.forEach(input => {
            input.addEventListener('mouseenter', () => {
                cursor.classList.add('text');
            });

            input.addEventListener('mouseleave', () => {
                cursor.classList.remove('text');
            });
        });

        // Click effect with ripple
        document.addEventListener('mousedown', (e) => {
            cursor.classList.add('click');
            this.createClickRipple(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            cursor.classList.remove('click');
        });

        // Magnetic effect for special elements
        const magneticElements = document.querySelectorAll('.magnetic-element');
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    // Create click ripple effect
    createClickRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = (x - 50) + 'px';
        ripple.style.top = (y - 50) + 'px';

        document.body.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // Update cursor interactions for dynamically added elements
    updateCursorInteractions() {
        const cursor = document.getElementById('custom-cursor');
        if (!cursor) return;

        // Remove existing event listeners and add new ones
        const interactiveElements = document.querySelectorAll('button, input, textarea, select, .task-item, .stat-card, .magnetic-element');

        interactiveElements.forEach(element => {
            // Remove existing listeners by cloning the element
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);

            // Add new listeners
            newElement.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                newElement.style.transform = 'scale(1.05)';
            });

            newElement.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                newElement.style.transform = '';
            });

            // Magnetic effect for special elements
            if (newElement.classList.contains('magnetic-element')) {
                newElement.addEventListener('mousemove', (e) => {
                    const rect = newElement.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    newElement.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
                });

                newElement.addEventListener('mouseleave', () => {
                    newElement.style.transform = '';
                });
            }
        });

        // Re-setup event listeners for the new elements
        this.setupEventListeners();
    }

    // Floating Particles Animation
    createFloatingParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const colors = ['#00ffff', '#ff0080', '#8000ff', '#00ff41', '#ff4500'];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random properties
            const size = Math.random() * 3 + 1;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 10 + 5;
            const animationDelay = Math.random() * 5;

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${left}%;
                animation-duration: ${animationDuration}s;
                animation-delay: ${animationDelay}s;
                box-shadow: 0 0 ${size * 2}px ${color};
            `;

            particlesContainer.appendChild(particle);
        }
    }

    // Task Timer Functions
    toggleTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        if (task.timerActive) {
            this.pauseTaskTimer(taskId);
        } else {
            this.startTaskTimer(taskId);
        }
    }

    startTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        // Stop any other running timers
        this.tasks.forEach(t => {
            if (t.timerActive && t.id !== taskId) {
                this.pauseTaskTimer(t.id);
            }
        });

        task.timerActive = true;

        const timer = setInterval(() => {
            if (task.timerRemaining <= 0) {
                this.taskTimerFinished(taskId);
                return;
            }

            task.timerRemaining--;
            this.updateTaskTimerDisplay(taskId);
            this.saveToStorage();
        }, 1000);

        this.taskTimers.set(taskId, timer);
        this.saveToStorage();
        this.renderTasks();
        this.showNotification(`تم بدء مؤقت المهمة: ${task.title}`, 'success');
    }

    pauseTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.timerActive = false;

        const timer = this.taskTimers.get(taskId);
        if (timer) {
            clearInterval(timer);
            this.taskTimers.delete(taskId);
        }

        this.saveToStorage();
        this.renderTasks();
        this.showNotification(`تم إيقاف مؤقت المهمة: ${task.title}`, 'info');
    }

    taskTimerFinished(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.pauseTaskTimer(taskId);
        task.timerRemaining = 0;

        this.showNotification(`⏰ انتهى وقت المهمة: ${task.title}`, 'warning');
        this.playTimerSound();
        this.triggerConfetti();

        // Ask if user wants to mark task as complete
        setTimeout(() => {
            if (confirm(`انتهى وقت المهمة "${task.title}". هل تريد تمييزها كمكتملة؟`)) {
                this.toggleTask(taskId);
            }
        }, 1000);
    }

    updateTaskTimerDisplay(taskId) {
        const timerElement = document.getElementById(`timer-${taskId}`);
        const task = this.tasks.find(t => t.id === taskId);

        if (timerElement && task) {
            timerElement.textContent = this.formatTimer(task.timerRemaining);

            // Add warning style when time is running low
            if (task.timerRemaining <= 60 && task.timerActive) {
                timerElement.style.color = 'var(--neon-pink)';
                timerElement.style.animation = 'dangerPulse 0.5s ease-in-out infinite';
            } else {
                timerElement.style.color = '';
                timerElement.style.animation = '';
            }
        }
    }

    formatTimer(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    playTimerSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Create alarm sound pattern
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.6);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    // Enhanced Confetti with Neon Colors
    triggerConfetti() {
        if (typeof confetti !== 'undefined') {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 0,
                colors: ['#00ffff', '#ff0080', '#8000ff', '#00ff41', '#ff4500', '#ffff00']
            };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // Left side
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                }));

                // Right side
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                }));

                // Center burst
                confetti(Object.assign({}, defaults, {
                    particleCount: particleCount * 2,
                    origin: { x: 0.5, y: 0.5 },
                    spread: 180
                }));
            }, 250);

            // Add screen flash effect
            this.createScreenFlash();
        }
    }

    // Screen Flash Effect
    createScreenFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%);
            z-index: 9999;
            pointer-events: none;
            animation: flashEffect 0.5s ease-out;
        `;

        document.body.appendChild(flash);

        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }
}

// Add CSS for flash effect
const style = document.createElement('style');
style.textContent = `
    @keyframes flashEffect {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new AdvancedTaskManager();
});
