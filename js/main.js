// Main application initialization
class SmartIrrigationApp {
    constructor() {
        this.tankManager = null;
        this.irrigationSystem = null;
        this.scheduler = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        // Initialize date and time display
        this.initDateTime();
        
        // Initialize tank manager
        this.tankManager = new WaterTankManager();
        
        // Initialize irrigation system
        this.irrigationSystem = new IrrigationSystem();
        
        // Initialize scheduler
        this.scheduler = new IrrigationScheduler(this.irrigationSystem);
        
        // Initialize system status
        this.initSystemStatus();
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        console.log('Smart Irrigation System initialized successfully');
    }

    initDateTime() {
        const updateDateTime = () => {
            const now = new Date();
            
            // Update date
            const dateOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            document.getElementById('currentDate').textContent = 
                now.toLocaleDateString('id-ID', dateOptions);
            
            // Update time
            const timeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            document.getElementById('currentTime').textContent = 
                now.toLocaleTimeString('id-ID', timeOptions);
        };

        // Update immediately and then every second
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    initSystemStatus() {
        const statusDot = document.getElementById('systemStatus');
        const statusText = document.getElementById('systemStatusText');
        
        // Simulate system health check
        const checkSystemHealth = () => {
            // In a real application, this would check actual system components
            const isHealthy = Math.random() > 0.05; // 95% uptime simulation
            
            if (isHealthy) {
                statusDot.style.background = '#2ecc71';
                statusText.textContent = 'System Online';
                statusText.style.color = '#2ecc71';
            } else {
                statusDot.style.background = '#e74c3c';
                statusText.textContent = 'System Error';
                statusText.style.color = '#e74c3c';
                
                // Show error notification
                this.showSystemNotification('System health check failed - please check connections', 'error');
            }
        };

        // Check system health every 5 minutes
        checkSystemHealth();
        setInterval(checkSystemHealth, 300000);
    }

    setupGlobalEventListeners() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R for manual refill
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.tankManager.showRefillModal();
            }
            
            // Ctrl/Cmd + H for history
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.tankManager.showHistoryModal();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                });
            }
        });

        // Handle visibility change (when tab becomes active/inactive)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Tab became active - refresh data
                this.tankManager.updateDisplay();
                this.irrigationSystem.updateZoneDisplays();
                this.irrigationSystem.updateStatistics();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showSystemNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showSystemNotification('Connection lost - running in offline mode', 'warning');
        });
    }

    showSystemNotification(message, type = 'info') {
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

        // Auto remove after 6 seconds for system notifications
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    container.removeChild(notification);
                }, 300);
            }
        }, 6000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }

    // Public methods for external access
    getTankStatus() {
        return {
            level: this.tankManager.calculateTankLevel(),
            timeRemaining: this.tankManager.calculateTimeRemaining(),
            lastRefill: this.tankManager.lastRefillTime
        };
    }

    getIrrigationStatus() {
        return {
            zones: this.irrigationSystem.zones,
            waterUsage: this.irrigationSystem.waterUsageToday,
            activeTime: this.irrigationSystem.activeTimeToday
        };
    }

    // Emergency stop all irrigation
    emergencyStop() {
        Object.keys(this.irrigationSystem.zones).forEach(zoneId => {
            if (this.irrigationSystem.zones[zoneId].active) {
                this.irrigationSystem.manualStart(parseInt(zoneId));
            }
        });
        this.showSystemNotification('Emergency stop activated - all irrigation stopped', 'warning');
    }
}

// Initialize the application
const app = new SmartIrrigationApp();

// Make app globally accessible for debugging
window.irrigationApp = app;

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Add some helpful console commands for debugging
console.log(`
🌱 Smart Irrigation System Debug Commands:
- irrigationApp.getTankStatus() - Get current tank status
- irrigationApp.getIrrigationStatus() - Get irrigation system status
- irrigationApp.emergencyStop() - Emergency stop all irrigation
- irrigationApp.tankManager.manualRefill() - Manual tank refill
- irrigationApp.irrigationSystem.manualStart(zoneId) - Start/stop zone irrigation

Keyboard Shortcuts:
- Ctrl/Cmd + R - Manual refill modal
- Ctrl/Cmd + H - History modal
- Escape - Close modals
`);