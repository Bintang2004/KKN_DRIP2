class WaterTankManager {
    constructor() {
        this.depletionHours = parseInt(localStorage.getItem('depletionHours')) || 72;
        this.startTime = parseInt(localStorage.getItem('tankStartTime')) || Date.now();
        this.lastRefillTime = localStorage.getItem('lastRefillTime') || null;
        this.refillHistory = JSON.parse(localStorage.getItem('refillHistory')) || [];
        this.lastResetDate = localStorage.getItem('lastResetDate') || null;
        
        this.init();
    }

    init() {
        this.checkDailyReset();
        this.updateDisplay();
        this.setupEventListeners();
        
        // Update display every minute
        setInterval(() => {
            this.updateDisplay();
            this.checkDailyReset();
        }, 60000);
    }

    setupEventListeners() {
        // Depletion hours input
        const depletionInput = document.getElementById('depletionHours');
        depletionInput.addEventListener('change', (e) => {
            this.updateDepletionHours(parseInt(e.target.value));
        });

        // Manual refill button
        document.getElementById('manualRefillBtn').addEventListener('click', () => {
            this.showRefillModal();
        });

        // Reset timer button
        document.getElementById('resetTimerBtn').addEventListener('click', () => {
            this.resetTimer();
        });

        // View history button
        document.getElementById('viewHistoryBtn').addEventListener('click', () => {
            this.showHistoryModal();
        });

        // Modal event listeners
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Refill modal
        const refillModal = document.getElementById('refillModal');
        const closeRefillModal = document.getElementById('closeRefillModal');
        const cancelRefill = document.getElementById('cancelRefill');
        const confirmRefill = document.getElementById('confirmRefill');

        closeRefillModal.addEventListener('click', () => {
            refillModal.style.display = 'none';
        });

        cancelRefill.addEventListener('click', () => {
            refillModal.style.display = 'none';
        });

        confirmRefill.addEventListener('click', () => {
            this.manualRefill();
            refillModal.style.display = 'none';
        });

        // History modal
        const historyModal = document.getElementById('historyModal');
        const closeHistoryModal = document.getElementById('closeHistoryModal');

        closeHistoryModal.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === refillModal) {
                refillModal.style.display = 'none';
            }
            if (e.target === historyModal) {
                historyModal.style.display = 'none';
            }
        });
    }

    calculateTankLevel() {
        const elapsed = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
        const depletion = (elapsed / this.depletionHours) * 100;
        return Math.max(0, Math.min(100, 100 - depletion));
    }

    calculateTimeRemaining() {
        const elapsed = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
        const remaining = Math.max(0, this.depletionHours - elapsed);
        
        if (remaining === 0) {
            return 'Tank kosong';
        }
        
        const days = Math.floor(remaining / 24);
        const hours = Math.floor(remaining % 24);
        const minutes = Math.floor((remaining % 1) * 60);
        
        if (days > 0) {
            return `${days} hari ${hours} jam tersisa`;
        } else if (hours > 0) {
            return `${hours} jam ${minutes} menit tersisa`;
        } else {
            return `${minutes} menit tersisa`;
        }
    }

    getTankStatus(level) {
        if (level >= 80) return { status: 'full', text: 'FULL', class: 'full' };
        if (level >= 40) return { status: 'good', text: 'GOOD', class: 'good' };
        if (level >= 20) return { status: 'low', text: 'LOW', class: 'low' };
        return { status: 'empty', text: 'EMPTY', class: 'empty' };
    }

    updateDisplay() {
        const level = this.calculateTankLevel();
        const timeRemaining = this.calculateTimeRemaining();
        const tankStatus = this.getTankStatus(level);

        // Update tank percentage and visual
        document.getElementById('tankPercentage').textContent = `${Math.round(level)}%`;
        document.getElementById('timeRemaining').textContent = timeRemaining;
        document.getElementById('currentLevel').textContent = `${Math.round(level)}%`;

        // Update tank status badge
        const statusBadge = document.getElementById('tankStatusBadge');
        statusBadge.textContent = tankStatus.text;
        statusBadge.className = `tank-status-badge ${tankStatus.class}`;

        // Update SVG water level
        this.updateTankVisual(level);

        // Update last refill display
        const lastRefillElement = document.getElementById('lastRefill');
        if (this.lastRefillTime) {
            lastRefillElement.textContent = this.lastRefillTime;
        } else {
            lastRefillElement.textContent = 'Belum ada data';
        }

        // Update next reset time
        const nextReset = new Date();
        nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);
        document.getElementById('nextReset').textContent = 
            nextReset.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });

        // Show alerts if needed
        this.checkAlerts(level);
    }

    updateTankVisual(level) {
        const waterLevel = document.getElementById('waterLevel');
        if (waterLevel) {
            // Calculate the height of water based on level
            const maxHeight = 156; // SVG tank height
            const waterHeight = (level / 100) * maxHeight;
            const yPosition = 22 + (maxHeight - waterHeight); // Start from bottom
            
            waterLevel.setAttribute('y', yPosition);
            waterLevel.setAttribute('height', waterHeight);
            
            // Update color based on level
            let gradient = '#3498db';
            if (level < 20) gradient = '#e74c3c';
            else if (level < 40) gradient = '#e67e22';
            else if (level < 80) gradient = '#f39c12';
            
            waterLevel.setAttribute('fill', gradient);
        }
    }

    checkAlerts(level) {
        if (level <= 5 && level > 0) {
            this.showNotification('Tank kosong - segera isi ulang!', 'error');
        } else if (level <= 20 && level > 5) {
            this.showNotification('Tank level rendah - pertimbangkan pengisian', 'warning');
        }
    }

    updateDepletionHours(hours) {
        if (hours >= 1 && hours <= 168) {
            this.depletionHours = hours;
            localStorage.setItem('depletionHours', hours.toString());
            this.updateDisplay();
            this.showNotification(`Durasi depletion diubah menjadi ${hours} jam`, 'success');
        }
    }

    showRefillModal() {
        const level = this.calculateTankLevel();
        document.getElementById('currentLevelModal').textContent = `${Math.round(level)}%`;
        document.getElementById('refillModal').style.display = 'block';
    }

    manualRefill() {
        const currentLevel = this.calculateTankLevel();
        const timestamp = new Date().toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        // Reset tank
        this.startTime = Date.now();
        this.lastRefillTime = timestamp;

        // Add to history
        this.refillHistory.unshift({
            timestamp: timestamp,
            previousLevel: Math.round(currentLevel),
            newLevel: 100,
            type: 'Manual'
        });

        // Keep only last 50 entries
        if (this.refillHistory.length > 50) {
            this.refillHistory = this.refillHistory.slice(0, 50);
        }

        this.saveToStorage();
        this.updateDisplay();
        this.showNotification(`Tank berhasil diisi ulang pada ${timestamp}`, 'success');
    }

    resetTimer() {
        if (confirm('Apakah Anda yakin ingin mereset timer tangki?')) {
            this.startTime = Date.now();
            this.saveToStorage();
            this.updateDisplay();
            this.showNotification('Timer tangki berhasil direset', 'success');
        }
    }

    checkDailyReset() {
        const now = new Date();
        const today = now.toDateString();
        
        if (this.lastResetDate !== today) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Check if yesterday had low tank (this is a simplified check)
            // In a real implementation, you'd store daily tank status
            const currentLevel = this.calculateTankLevel();
            
            if (now.getHours() === 0 && now.getMinutes() < 5 && currentLevel < 20) {
                this.autoReset();
            }
            
            this.lastResetDate = today;
            localStorage.setItem('lastResetDate', today);
        }
    }

    autoReset() {
        const timestamp = new Date().toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        this.startTime = Date.now();
        
        // Add to history
        this.refillHistory.unshift({
            timestamp: timestamp,
            previousLevel: 0,
            newLevel: 100,
            type: 'Auto Reset'
        });

        this.saveToStorage();
        this.showNotification('Timer tangki direset otomatis - hari baru dimulai', 'success');
    }

    showHistoryModal() {
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (this.refillHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #7f8c8d;">Belum ada riwayat pengisian</td></tr>';
        } else {
            this.refillHistory.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.timestamp}</td>
                    <td>${entry.previousLevel}%</td>
                    <td>${entry.newLevel}%</td>
                    <td><span class="badge ${entry.type.toLowerCase().replace(' ', '-')}">${entry.type}</span></td>
                `;
                tbody.appendChild(row);
            });
        }

        document.getElementById('historyModal').style.display = 'block';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    container.removeChild(notification);
                }, 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }

    saveToStorage() {
        localStorage.setItem('tankStartTime', this.startTime.toString());
        localStorage.setItem('lastRefillTime', this.lastRefillTime || '');
        localStorage.setItem('refillHistory', JSON.stringify(this.refillHistory));
        localStorage.setItem('depletionHours', this.depletionHours.toString());
    }
}

// Add CSS for notification slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .badge {
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .badge.manual {
        background: rgba(52, 152, 219, 0.2);
        color: #3498db;
    }
    
    .badge.auto-reset {
        background: rgba(46, 204, 113, 0.2);
        color: #27ae60;
    }
`;
document.head.appendChild(style);