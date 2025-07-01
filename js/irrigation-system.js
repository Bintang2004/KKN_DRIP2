class IrrigationSystem {
    constructor() {
        this.zones = {
            1: {
                name: 'Zone 1 - Vegetables',
                active: true,
                schedule: 'daily',
                duration: 30,
                soilMoisture: 65,
                lastWatered: null,
                nextWatering: null
            },
            2: {
                name: 'Zone 2 - Fruits',
                active: false,
                schedule: 'daily',
                duration: 45,
                soilMoisture: 42,
                lastWatered: null,
                nextWatering: null
            }
        };
        
        this.waterUsageToday = 245; // Liters
        this.activeTimeToday = 2.5; // Hours
        this.activeZones = 1;
        this.avgSoilMoisture = 53;
        
        this.init();
    }

    init() {
        this.updateZoneDisplays();
        this.updateStatistics();
        this.setupEventListeners();
        this.simulateSoilMoisture();
        
        // Update every 30 seconds
        setInterval(() => {
            this.updateZoneDisplays();
            this.simulateSoilMoisture();
        }, 30000);
    }

    setupEventListeners() {
        // Manual start buttons
        document.querySelectorAll('.zone-card').forEach(card => {
            const zoneId = card.dataset.zone;
            const button = card.querySelector('.btn-small');
            
            button.addEventListener('click', () => {
                this.manualStart(parseInt(zoneId));
            });
        });

        // Schedule changes
        document.querySelectorAll('.schedule-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const zoneCard = e.target.closest('.zone-card');
                const zoneId = parseInt(zoneCard.dataset.zone);
                this.updateSchedule(zoneId, e.target.value);
            });
        });

        // Duration changes
        document.querySelectorAll('.control-item input[type="number"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const zoneCard = e.target.closest('.zone-card');
                const zoneId = parseInt(zoneCard.dataset.zone);
                this.updateDuration(zoneId, parseInt(e.target.value));
            });
        });
    }

    updateZoneDisplays() {
        Object.keys(this.zones).forEach(zoneId => {
            const zone = this.zones[zoneId];
            const card = document.querySelector(`[data-zone="${zoneId}"]`);
            
            if (card) {
                // Update status
                const statusElement = card.querySelector('.zone-status');
                statusElement.textContent = zone.active ? 'Active' : 'Inactive';
                statusElement.className = `zone-status ${zone.active ? 'active' : 'inactive'}`;
                
                // Update soil moisture
                const moistureFill = card.querySelector('.moisture-fill');
                const moistureText = card.querySelector('.moisture-level span');
                
                moistureFill.style.width = `${zone.soilMoisture}%`;
                moistureText.textContent = `${zone.soilMoisture}%`;
                
                // Update button state
                const button = card.querySelector('.btn-small');
                if (zone.active) {
                    button.textContent = 'Stop Irrigation';
                    button.className = 'btn btn-small btn-secondary';
                } else {
                    button.textContent = 'Manual Start';
                    button.className = 'btn btn-small btn-primary';
                }
            }
        });
    }

    updateStatistics() {
        // Update water usage
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = `${this.waterUsageToday}L`;
        
        // Update active time
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = `${this.activeTimeToday}h`;
        
        // Update active zones
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = `${this.activeZones}/2`;
        
        // Update average soil moisture
        document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = `${this.avgSoilMoisture}%`;
    }

    manualStart(zoneId) {
        const zone = this.zones[zoneId];
        
        if (zone.active) {
            // Stop irrigation
            zone.active = false;
            this.showNotification(`${zone.name} irrigation stopped`, 'info');
            this.activeZones--;
        } else {
            // Start irrigation
            zone.active = true;
            zone.lastWatered = new Date().toLocaleString('id-ID');
            this.showNotification(`${zone.name} irrigation started manually`, 'success');
            this.activeZones++;
            
            // Auto stop after duration
            setTimeout(() => {
                if (zone.active) {
                    zone.active = false;
                    this.activeZones--;
                    this.updateZoneDisplays();
                    this.showNotification(`${zone.name} irrigation completed`, 'success');
                    
                    // Increase soil moisture
                    zone.soilMoisture = Math.min(100, zone.soilMoisture + Math.random() * 20 + 10);
                    this.updateWaterUsage(zone.duration);
                }
            }, zone.duration * 1000); // Convert minutes to milliseconds for demo (use * 60000 for real minutes)
        }
        
        this.updateZoneDisplays();
        this.updateStatistics();
    }

    updateSchedule(zoneId, schedule) {
        this.zones[zoneId].schedule = schedule;
        this.showNotification(`Zone ${zoneId} schedule updated to ${schedule}`, 'success');
    }

    updateDuration(zoneId, duration) {
        if (duration >= 5 && duration <= 120) {
            this.zones[zoneId].duration = duration;
            this.showNotification(`Zone ${zoneId} duration updated to ${duration} minutes`, 'success');
        }
    }

    simulateSoilMoisture() {
        // Simulate gradual decrease in soil moisture
        Object.keys(this.zones).forEach(zoneId => {
            const zone = this.zones[zoneId];
            if (!zone.active && zone.soilMoisture > 0) {
                // Decrease moisture by 0.1-0.5% every 30 seconds
                zone.soilMoisture = Math.max(0, zone.soilMoisture - (Math.random() * 0.4 + 0.1));
                zone.soilMoisture = Math.round(zone.soilMoisture * 10) / 10; // Round to 1 decimal
            }
        });
        
        // Update average
        const moistures = Object.values(this.zones).map(zone => zone.soilMoisture);
        this.avgSoilMoisture = Math.round(moistures.reduce((a, b) => a + b, 0) / moistures.length);
        
        this.updateStatistics();
    }

    updateWaterUsage(duration) {
        // Estimate water usage (liters per minute)
        const waterPerMinute = 8; // 8 liters per minute average
        const usage = duration * waterPerMinute;
        this.waterUsageToday += usage;
        this.activeTimeToday += duration / 60; // Convert to hours
        
        this.updateStatistics();
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

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    container.removeChild(notification);
                }, 300);
            }
        }, 4000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }
}

// Auto-schedule functionality
class IrrigationScheduler {
    constructor(irrigationSystem) {
        this.system = irrigationSystem;
        this.schedules = [];
        this.init();
    }

    init() {
        // Check schedules every minute
        setInterval(() => {
            this.checkSchedules();
        }, 60000);
        
        // Set up default schedules
        this.setupDefaultSchedules();
    }

    setupDefaultSchedules() {
        // Zone 1: Daily at 06:00
        this.addSchedule(1, '06:00', 'daily');
        
        // Zone 2: Daily at 07:00
        this.addSchedule(2, '07:00', 'daily');
    }

    addSchedule(zoneId, time, frequency) {
        this.schedules.push({
            zoneId: zoneId,
            time: time,
            frequency: frequency,
            lastRun: null
        });
    }

    checkSchedules() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const today = now.toDateString();

        this.schedules.forEach(schedule => {
            if (schedule.time === currentTime && schedule.lastRun !== today) {
                const zone = this.system.zones[schedule.zoneId];
                
                // Check if zone needs watering (soil moisture < 60%)
                if (zone.soilMoisture < 60) {
                    this.system.manualStart(schedule.zoneId);
                    schedule.lastRun = today;
                    
                    this.system.showNotification(
                        `Scheduled irrigation started for ${zone.name}`, 
                        'info'
                    );
                }
            }
        });
    }
}