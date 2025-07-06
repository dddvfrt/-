/**
 * Cyberpunk Time Tools - Advanced Time Management System
 * Features: Digital Clock, Timer, World Clock, Alarm, Stopwatch, Pomodoro
 */

class CyberpunkTimeTools {
    constructor() {
        this.timers = {
            timer: null,
            stopwatch: null,
            pomodoro: null
        };

        this.states = {
            timer: { running: false, time: 0 },
            stopwatch: { running: false, time: 0, laps: [] },
            pomodoro: {
                running: false,
                time: 25 * 60,
                phase: 'work',
                sessions: 0,
                breaks: 0,
                workTime: 25 * 60,
                shortBreak: 5 * 60,
                longBreak: 15 * 60
            }
        };

        this.alarms = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.startDigitalClock();
        this.startWorldClocks();
        this.loadAlarms();
        this.updatePomodoroDisplay();

        // Initialize custom cursor for this page
        if (window.taskManager) {
            window.taskManager.setupCustomCursor();
            window.taskManager.createFloatingParticles();
        } else {
            // Create basic cursor and particles for time tools page
            this.setupBasicCursor();
            this.createBasicParticles();
        }
    }

    setupEventListeners() {
        // Navigation
        const backBtn = document.getElementById('back-to-tasks');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Timer controls
        document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());

        // Stopwatch controls
        document.getElementById('stopwatch-start')?.addEventListener('click', () => this.toggleStopwatch());
        document.getElementById('stopwatch-lap')?.addEventListener('click', () => this.addLap());
        document.getElementById('stopwatch-reset')?.addEventListener('click', () => this.resetStopwatch());

        // Alarm controls
        document.getElementById('alarm-set')?.addEventListener('click', () => this.addAlarm());

        // Pomodoro controls
        document.getElementById('pomodoro-start')?.addEventListener('click', () => this.togglePomodoro());
        document.getElementById('pomodoro-pause')?.addEventListener('click', () => this.pausePomodoro());
        document.getElementById('pomodoro-reset')?.addEventListener('click', () => this.resetPomodoro());

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('timeToolsTheme', newTheme);

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        this.showNotification(
            newTheme === 'dark' ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع الفاتح',
            'info'
        );
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('timeToolsTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Digital Clock
    startDigitalClock() {
        const updateClock = () => {
            const now = new Date();
            const timeElement = document.getElementById('digital-time');
            const dateElement = document.getElementById('digital-date');
            const timezoneElement = document.getElementById('timezone');

            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('ar-SA', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }

            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            if (timezoneElement) {
                const offset = now.getTimezoneOffset();
                const hours = Math.floor(Math.abs(offset) / 60);
                const minutes = Math.abs(offset) % 60;
                const sign = offset <= 0 ? '+' : '-';
                timezoneElement.textContent = `GMT${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    // World Clocks
    startWorldClocks() {
        const updateWorldClocks = () => {
            const timezones = [
                { id: 'riyadh-time', timezone: 'Asia/Riyadh' },
                { id: 'newyork-time', timezone: 'America/New_York' },
                { id: 'london-time', timezone: 'Europe/London' },
                { id: 'tokyo-time', timezone: 'Asia/Tokyo' }
            ];

            timezones.forEach(({ id, timezone }) => {
                const element = document.getElementById(id);
                if (element) {
                    const time = new Date().toLocaleTimeString('en-US', {
                        timeZone: timezone,
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    element.textContent = time;
                }
            });
        };

        updateWorldClocks();
        setInterval(updateWorldClocks, 1000);
    }

    // Timer Functions
    startTimer() {
        const hours = parseInt(document.getElementById('timer-hours')?.value || 0);
        const minutes = parseInt(document.getElementById('timer-minutes')?.value || 0);
        const seconds = parseInt(document.getElementById('timer-seconds')?.value || 0);

        if (hours === 0 && minutes === 0 && seconds === 0) {
            this.showNotification('يرجى إدخال وقت صحيح', 'warning');
            return;
        }

        this.states.timer.time = hours * 3600 + minutes * 60 + seconds;
        this.states.timer.running = true;

        this.timers.timer = setInterval(() => {
            if (this.states.timer.time <= 0) {
                this.timerFinished();
                return;
            }
            this.states.timer.time--;
            this.updateTimerDisplay();
        }, 1000);

        this.updateTimerDisplay();
        this.showNotification('تم بدء المؤقت', 'success');
    }

    pauseTimer() {
        this.states.timer.running = false;
        if (this.timers.timer) {
            clearInterval(this.timers.timer);
            this.timers.timer = null;
        }
        this.showNotification('تم إيقاف المؤقت مؤقتاً', 'info');
    }

    resetTimer() {
        this.pauseTimer();
        this.states.timer.time = 0;
        this.updateTimerDisplay();
        this.showNotification('تم إعادة تعيين المؤقت', 'info');
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (display) {
            const hours = Math.floor(this.states.timer.time / 3600);
            const minutes = Math.floor((this.states.timer.time % 3600) / 60);
            const seconds = this.states.timer.time % 60;
            display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Add pulsing effect when time is running low
            if (this.states.timer.time <= 10 && this.states.timer.running) {
                display.style.animation = 'dangerPulse 0.5s ease-in-out infinite';
                display.style.color = 'var(--neon-pink)';
            } else {
                display.style.animation = '';
                display.style.color = 'var(--neon-orange)';
            }
        }
    }

    timerFinished() {
        this.pauseTimer();
        this.showNotification('انتهى الوقت! 🔔', 'success');
        this.playNotificationSound();
        this.createCelebrationEffect();
    }

    // Stopwatch Functions
    toggleStopwatch() {
        if (this.states.stopwatch.running) {
            this.pauseStopwatch();
        } else {
            this.startStopwatch();
        }
    }

    startStopwatch() {
        this.states.stopwatch.running = true;
        const startTime = Date.now() - this.states.stopwatch.time;

        this.timers.stopwatch = setInterval(() => {
            this.states.stopwatch.time = Date.now() - startTime;
            this.updateStopwatchDisplay();
        }, 10);

        document.getElementById('stopwatch-start').innerHTML = '<i class="fas fa-pause"></i> إيقاف';
        this.showNotification('تم بدء ساعة الإيقاف', 'success');
    }

    pauseStopwatch() {
        this.states.stopwatch.running = false;
        if (this.timers.stopwatch) {
            clearInterval(this.timers.stopwatch);
            this.timers.stopwatch = null;
        }
        document.getElementById('stopwatch-start').innerHTML = '<i class="fas fa-play"></i> بدء';
        this.showNotification('تم إيقاف ساعة الإيقاف', 'info');
    }

    resetStopwatch() {
        this.pauseStopwatch();
        this.states.stopwatch.time = 0;
        this.states.stopwatch.laps = [];
        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
        this.showNotification('تم إعادة تعيين ساعة الإيقاف', 'info');
    }

    addLap() {
        if (this.states.stopwatch.running) {
            const lapTime = this.states.stopwatch.time;
            this.states.stopwatch.laps.push(lapTime);
            this.updateLapsDisplay();
            this.showNotification(`تم تسجيل اللفة ${this.states.stopwatch.laps.length}`, 'info');
        }
    }

    updateStopwatchDisplay() {
        const timeDisplay = document.getElementById('stopwatch-display');
        const msDisplay = document.getElementById('stopwatch-ms');

        if (timeDisplay && msDisplay) {
            const totalMs = this.states.stopwatch.time;
            const hours = Math.floor(totalMs / 3600000);
            const minutes = Math.floor((totalMs % 3600000) / 60000);
            const seconds = Math.floor((totalMs % 60000) / 1000);
            const milliseconds = totalMs % 1000;

            timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            msDisplay.textContent = milliseconds.toString().padStart(3, '0');
        }
    }

    updateLapsDisplay() {
        const lapsList = document.getElementById('laps-list');
        if (lapsList) {
            lapsList.innerHTML = '';
            this.states.stopwatch.laps.forEach((lapTime, index) => {
                const lapItem = document.createElement('div');
                lapItem.className = 'lap-item';

                const hours = Math.floor(lapTime / 3600000);
                const minutes = Math.floor((lapTime % 3600000) / 60000);
                const seconds = Math.floor((lapTime % 60000) / 1000);
                const milliseconds = lapTime % 1000;

                lapItem.innerHTML = `
                    <span class="lap-number">اللفة ${index + 1}</span>
                    <span class="lap-time">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}</span>
                `;

                lapsList.appendChild(lapItem);
            });
        }
    }

    // Alarm Functions
    addAlarm() {
        const timeInput = document.getElementById('alarm-time');
        const labelInput = document.getElementById('alarm-label');

        if (!timeInput?.value) {
            this.showNotification('يرجى تحديد وقت المنبه', 'warning');
            return;
        }

        const alarm = {
            id: Date.now(),
            time: timeInput.value,
            label: labelInput?.value || 'منبه',
            active: true
        };

        this.alarms.push(alarm);
        this.saveAlarms();
        this.renderAlarms();

        // Clear inputs
        timeInput.value = '';
        if (labelInput) labelInput.value = '';

        this.showNotification('تم إضافة المنبه بنجاح', 'success');
    }

    renderAlarms() {
        const alarmsList = document.getElementById('alarms-list');
        if (!alarmsList) return;

        alarmsList.innerHTML = '';
        this.alarms.forEach(alarm => {
            const alarmItem = document.createElement('div');
            alarmItem.className = 'alarm-item';
            alarmItem.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-time-display">${alarm.time}</div>
                    <div class="alarm-label-display">${alarm.label}</div>
                </div>
                <div class="alarm-actions">
                    <button class="alarm-btn toggle magnetic-element" onclick="timeTools.toggleAlarm(${alarm.id})" title="${alarm.active ? 'إيقاف' : 'تفعيل'}">
                        <i class="fas fa-${alarm.active ? 'toggle-on' : 'toggle-off'}"></i>
                    </button>
                    <button class="alarm-btn delete magnetic-element" onclick="timeTools.deleteAlarm(${alarm.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            alarmsList.appendChild(alarmItem);
        });
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.active = !alarm.active;
            this.saveAlarms();
            this.renderAlarms();
            this.showNotification(`تم ${alarm.active ? 'تفعيل' : 'إيقاف'} المنبه`, 'info');
        }
    }

    deleteAlarm(id) {
        this.alarms = this.alarms.filter(a => a.id !== id);
        this.saveAlarms();
        this.renderAlarms();
        this.showNotification('تم حذف المنبه', 'info');
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);

        this.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentTime) {
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        this.showNotification(`🔔 ${alarm.label} - ${alarm.time}`, 'warning');
        this.playNotificationSound();
        this.createCelebrationEffect();

        // Auto-disable alarm after triggering
        alarm.active = false;
        this.saveAlarms();
        this.renderAlarms();
    }

    saveAlarms() {
        localStorage.setItem('cyberpunkAlarms', JSON.stringify(this.alarms));
    }

    loadAlarms() {
        const saved = localStorage.getItem('cyberpunkAlarms');
        if (saved) {
            this.alarms = JSON.parse(saved);
            this.renderAlarms();
        }

        // Check alarms every minute
        setInterval(() => this.checkAlarms(), 60000);
    }

    // Pomodoro Functions
    togglePomodoro() {
        if (this.states.pomodoro.running) {
            this.pausePomodoro();
        } else {
            this.startPomodoro();
        }
    }

    startPomodoro() {
        this.states.pomodoro.running = true;

        this.timers.pomodoro = setInterval(() => {
            if (this.states.pomodoro.time <= 0) {
                this.pomodoroPhaseComplete();
                return;
            }
            this.states.pomodoro.time--;
            this.updatePomodoroDisplay();
        }, 1000);

        document.getElementById('pomodoro-start').innerHTML = '<i class="fas fa-pause"></i> إيقاف';
        this.showNotification(`تم بدء ${this.states.pomodoro.phase === 'work' ? 'جلسة العمل' : 'الاستراحة'}`, 'success');
    }

    pausePomodoro() {
        this.states.pomodoro.running = false;
        if (this.timers.pomodoro) {
            clearInterval(this.timers.pomodoro);
            this.timers.pomodoro = null;
        }
        document.getElementById('pomodoro-start').innerHTML = '<i class="fas fa-play"></i> بدء';
        this.showNotification('تم إيقاف البومودورو مؤقتاً', 'info');
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.states.pomodoro.phase = 'work';
        this.states.pomodoro.time = this.states.pomodoro.workTime;
        this.updatePomodoroDisplay();
        this.showNotification('تم إعادة تعيين البومودورو', 'info');
    }

    pomodoroPhaseComplete() {
        this.pausePomodoro();

        if (this.states.pomodoro.phase === 'work') {
            this.states.pomodoro.sessions++;

            // Determine break type
            if (this.states.pomodoro.sessions % 4 === 0) {
                this.states.pomodoro.phase = 'longBreak';
                this.states.pomodoro.time = this.states.pomodoro.longBreak;
                this.showNotification('🎉 جلسة عمل مكتملة! وقت الاستراحة الطويلة', 'success');
            } else {
                this.states.pomodoro.phase = 'shortBreak';
                this.states.pomodoro.time = this.states.pomodoro.shortBreak;
                this.showNotification('✅ جلسة عمل مكتملة! وقت الاستراحة القصيرة', 'success');
            }
        } else {
            this.states.pomodoro.breaks++;
            this.states.pomodoro.phase = 'work';
            this.states.pomodoro.time = this.states.pomodoro.workTime;
            this.showNotification('⚡ انتهت الاستراحة! وقت العمل', 'info');
        }

        this.updatePomodoroDisplay();
        this.playNotificationSound();
        this.createCelebrationEffect();
    }

    updatePomodoroDisplay() {
        const timeDisplay = document.getElementById('pomodoro-display');
        const phaseDisplay = document.getElementById('pomodoro-phase');
        const sessionsDisplay = document.getElementById('pomodoro-sessions');
        const breaksDisplay = document.getElementById('pomodoro-breaks');
        const circle = document.getElementById('pomodoro-circle');

        if (timeDisplay) {
            const minutes = Math.floor(this.states.pomodoro.time / 60);
            const seconds = this.states.pomodoro.time % 60;
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (phaseDisplay) {
            const phases = {
                work: 'جلسة عمل',
                shortBreak: 'استراحة قصيرة',
                longBreak: 'استراحة طويلة'
            };
            phaseDisplay.textContent = phases[this.states.pomodoro.phase];
        }

        if (sessionsDisplay) {
            sessionsDisplay.textContent = this.states.pomodoro.sessions;
        }

        if (breaksDisplay) {
            breaksDisplay.textContent = this.states.pomodoro.breaks;
        }

        // Update progress circle
        if (circle) {
            const totalTime = this.states.pomodoro.phase === 'work' ? this.states.pomodoro.workTime :
                this.states.pomodoro.phase === 'shortBreak' ? this.states.pomodoro.shortBreak :
                    this.states.pomodoro.longBreak;

            const progress = (totalTime - this.states.pomodoro.time) / totalTime;
            const circumference = 2 * Math.PI * 54;
            const offset = circumference - (progress * circumference);

            circle.style.strokeDashoffset = offset;

            // Change color based on phase
            const colors = {
                work: 'var(--neon-orange)',
                shortBreak: 'var(--neon-green)',
                longBreak: 'var(--neon-purple)'
            };
            circle.style.stroke = colors[this.states.pomodoro.phase];
        }
    }



    // Utility Functions
    showNotification(message, type = 'info') {
        // Create notification element
        const container = document.getElementById('notification-container') || this.createNotificationContainer();

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

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
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

    // Basic Cursor and Particles for Time Tools Page
    setupBasicCursor() {
        const cursor = document.getElementById('custom-cursor');
        if (!cursor) return;

        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX - 10 + 'px';
            cursor.style.top = mouseY - 10 + 'px';
        });

        // Basic hover effects
        const interactiveElements = document.querySelectorAll('button, input, textarea, select, .magnetic-element');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
            });

            element.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
            });
        });
    }

    createBasicParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const colors = ['#00ffff', '#ff0080', '#8000ff', '#00ff41', '#ff4500'];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

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

    playNotificationSound() {
        // Create audio context for notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    createCelebrationEffect() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00ffff', '#ff0080', '#8000ff', '#00ff41', '#ff4500']
            });
        }
    }
}

// Initialize Time Tools when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.timeTools = new CyberpunkTimeTools();
});
