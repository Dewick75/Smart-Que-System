/**
 * Staff Interface Application
 * Interactive alerts, QR scanning, and bus management
 */

class StaffInterface {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.staffId = 1; // In real app, get from authentication
        this.alerts = [];
        this.busInfo = null;
        this.passengers = [];
        this.currentAlert = null;

        this.init();
    }

    async init() {
        console.log('Initializing Staff Interface...');

        // Setup event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadStaffAlerts();
        await this.loadBusInfo();

        // Start real-time updates
        this.startRealTimeUpdates();

        console.log('Staff Interface initialized successfully!');
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('scan-qr-btn').addEventListener('click', () => this.openQRScanner());
        document.getElementById('view-alerts-btn').addEventListener('click', () => this.scrollToAlerts());
        document.getElementById('bus-status-btn').addEventListener('click', () => this.refreshBusInfo());
        document.getElementById('passenger-list-btn').addEventListener('click', () => this.openPassengerList());

        // Alert filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterAlerts(e.target.dataset.filter));
        });

        // QR Scanner modal
        document.getElementById('close-scanner').addEventListener('click', () => this.closeQRScanner());
        document.getElementById('verify-qr').addEventListener('click', () => this.verifyQRCode());
        document.getElementById('qr-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyQRCode();
        });

        // Alert detail modal
        document.getElementById('close-alert-detail').addEventListener('click', () => this.closeAlertDetail());
        document.getElementById('acknowledge-alert').addEventListener('click', () => this.acknowledgeCurrentAlert());
        document.getElementById('resolve-alert').addEventListener('click', () => this.resolveCurrentAlert());

        // Passenger list modal
        document.getElementById('close-passenger-list').addEventListener('click', () => this.closePassengerList());
        document.getElementById('passenger-search').addEventListener('input', (e) => this.filterPassengers(e.target.value));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadStaffAlerts() {
        try {
            const response = await fetch(`${this.API_BASE}/staff/alerts`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.alerts = await response.json();
            this.updateAlertsDisplay();
            this.updateAlertCount();

            console.log(`Loaded ${this.alerts.length} staff alerts`);

        } catch (error) {
            console.error('Error loading staff alerts:', error);
            this.showToast('Error loading alerts', 'error');
        }
    }

    updateAlertsDisplay(filter = 'all') {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        let filteredAlerts = this.alerts;

        // Apply filters
        switch (filter) {
            case 'high':
                filteredAlerts = this.alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical');
                break;
            case 'medium':
                filteredAlerts = this.alerts.filter(alert => alert.severity === 'medium');
                break;
            case 'action':
                filteredAlerts = this.alerts.filter(alert => alert.action_required);
                break;
            default:
                filteredAlerts = this.alerts;
        }

        if (filteredAlerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">No alerts match the current filter</div>';
            return;
        }

        container.innerHTML = filteredAlerts.map(alert => this.createAlertCard(alert)).join('');

        // Add click handlers to alert cards
        container.querySelectorAll('.alert-card').forEach((card, index) => {
            card.addEventListener('click', () => this.openAlertDetail(filteredAlerts[index]));
        });
    }

    createAlertCard(alert) {
        const timeAgo = this.getTimeAgo(new Date(alert.created_at));
        const priorityClass = alert.severity;

        return `
            <div class="alert-card ${priorityClass}" data-alert-id="${alert.id}">
                <div class="alert-header">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-meta">
                        <span class="alert-priority ${priorityClass}">
                            <i class="fas fa-exclamation-triangle"></i>
                            ${alert.severity.toUpperCase()}
                        </span>
                        <span class="alert-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-details">
                    ${alert.bus_number ? `<span><i class="fas fa-bus"></i> Bus: ${alert.bus_number}</span>` : ''}
                    ${alert.route_name ? `<span><i class="fas fa-route"></i> Route: ${alert.route_name}</span>` : ''}
                    ${alert.stop_name ? `<span><i class="fas fa-map-marker-alt"></i> Stop: ${alert.stop_name}</span>` : ''}
                </div>
                ${alert.action_required ? '<div class="action-required"><i class="fas fa-exclamation-circle"></i> Action Required</div>' : ''}
            </div>
        `;
    }

    filterAlerts(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Update display
        this.updateAlertsDisplay(filter);
    }

    updateAlertCount() {
        const alertCount = document.getElementById('alert-count');
        const highPriorityCount = this.alerts.filter(alert =>
            alert.severity === 'high' || alert.severity === 'critical'
        ).length;

        alertCount.textContent = highPriorityCount;
        alertCount.style.display = highPriorityCount > 0 ? 'flex' : 'none';
    }

    async loadBusInfo() {
        try {
            const response = await fetch(`${this.API_BASE}/staff/my-bus?staff_id=${this.staffId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.busInfo = await response.json();
            this.updateBusInfoDisplay();

            console.log('Bus info loaded:', this.busInfo);

        } catch (error) {
            console.error('Error loading bus info:', error);
            this.showToast('Error loading bus information', 'error');
        }
    }

    updateBusInfoDisplay() {
        if (!this.busInfo) return;

        // Update bus details
        document.getElementById('bus-number').textContent = this.busInfo.bus_number || 'N/A';
        document.getElementById('route-name').textContent = this.busInfo.route_name || 'N/A';
        document.getElementById('bus-capacity').textContent = this.busInfo.capacity || '0';
        document.getElementById('driver-name').textContent = this.busInfo.driver_name || 'N/A';

        // Update today's stats
        document.getElementById('today-bookings').textContent = this.busInfo.today_bookings || '0';
        document.getElementById('available-seats').textContent = this.busInfo.available_seats || '0';
        document.getElementById('boarded-count').textContent = this.busInfo.recent_boardings?.length || '0';

        const statusElement = document.getElementById('bus-status');
        statusElement.textContent = this.busInfo.status || 'Unknown';
        statusElement.className = `value status-${this.busInfo.status}`;

        // Update recent boardings
        this.updateRecentBoardings();
    }

    updateRecentBoardings() {
        const container = document.getElementById('recent-boardings');
        if (!container || !this.busInfo.recent_boardings) return;

        if (this.busInfo.recent_boardings.length === 0) {
            container.innerHTML = '<div class="no-boardings">No recent boardings</div>';
            return;
        }

        container.innerHTML = this.busInfo.recent_boardings.map(boarding => `
            <div class="boarding-item">
                <div class="boarding-info">
                    <div class="passenger-name">${boarding.passenger_name}</div>
                    <div class="boarding-details">
                        Seat ${boarding.seat_number} • ${boarding.pickup_stop}
                    </div>
                </div>
                <div class="boarding-time">
                    ${boarding.boarding_time ? new Date(boarding.boarding_time).toLocaleTimeString() : 'Pending'}
                </div>
            </div>
        `).join('');
    }

    openQRScanner() {
        document.getElementById('qr-scanner-modal').style.display = 'block';
        document.getElementById('qr-input').focus();
        document.getElementById('scan-result').style.display = 'none';
    }

    closeQRScanner() {
        document.getElementById('qr-scanner-modal').style.display = 'none';
        document.getElementById('qr-input').value = '';
        document.getElementById('scan-result').style.display = 'none';
    }

    async verifyQRCode() {
        const qrInput = document.getElementById('qr-input');
        const qrCode = qrInput.value.trim();

        if (!qrCode) {
            this.showToast('Please enter a QR code or booking ID', 'warning');
            return;
        }

        try {
            // First verify the booking to show details
            const verifyResponse = await fetch(`${this.API_BASE}/staff/verify-booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qr_code: qrCode.startsWith('QR_') ? qrCode : '',
                    booking_id: !qrCode.startsWith('QR_') ? qrCode : ''
                })
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResult.valid) {
                this.displayScanResult({
                    valid: false,
                    message: verifyResult.error || 'Booking not found'
                });
                return;
            }

            // Show booking details and ask for confirmation if not already boarded
            if (verifyResult.booking.status === 'boarded') {
                this.displayScanResult({
                    valid: false,
                    message: 'This passenger has already boarded',
                    booking: verifyResult.booking
                });
                return;
            }

            if (verifyResult.booking.status === 'cancelled') {
                this.displayScanResult({
                    valid: false,
                    message: 'This booking has been cancelled',
                    booking: verifyResult.booking
                });
                return;
            }

            // Show confirmation dialog for valid booking
            this.showBookingConfirmation(verifyResult.booking, qrCode);

        } catch (error) {
            console.error('Error verifying QR code:', error);
            this.displayScanResult({
                valid: false,
                message: 'Error verifying QR code. Please try again.'
            });
        }
    }

    showBookingConfirmation(booking, qrCode) {
        const resultDiv = document.getElementById('scan-result');
        resultDiv.style.display = 'block';
        resultDiv.className = 'scan-result confirmation';

        resultDiv.innerHTML = `
            <div class="scan-result-header">
                <i class="fas fa-user-check"></i>
                <span>Confirm Passenger Boarding</span>
            </div>
            <div class="passenger-details">
                <div class="detail-item">
                    <div class="detail-label">Passenger Name</div>
                    <div class="detail-value">${booking.passenger_name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${booking.passenger_phone}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Seat Number</div>
                    <div class="detail-value">${booking.seat_number}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Bus Number</div>
                    <div class="detail-value">${booking.bus_info.bus_number}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Route</div>
                    <div class="detail-value">${booking.route_info.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">From</div>
                    <div class="detail-value">${booking.pickup_stop}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">To</div>
                    <div class="detail-value">${booking.dropoff_stop}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Travel Date</div>
                    <div class="detail-value">${new Date(booking.travel_date).toLocaleString()}</div>
                </div>
            </div>
            <div class="confirmation-buttons">
                <button class="btn btn-success" onclick="staffApp.confirmBoarding('${qrCode}')">
                    <i class="fas fa-check"></i> Confirm Boarding
                </button>
                <button class="btn btn-secondary" onclick="staffApp.cancelScan()">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
    }

    async confirmBoarding(qrCode) {
        try {
            const response = await fetch(`${this.API_BASE}/staff/scan-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qr_code: qrCode.startsWith('QR_') ? qrCode : '',
                    booking_id: !qrCode.startsWith('QR_') ? qrCode : '',
                    staff_id: this.staffId
                })
            });

            const result = await response.json();
            this.displayScanResult(result);

        } catch (error) {
            console.error('Error confirming boarding:', error);
            this.displayScanResult({
                valid: false,
                message: 'Error processing boarding. Please try again.'
            });
        }
    }

    cancelScan() {
        document.getElementById('scan-result').style.display = 'none';
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-input').focus();
    }

    displayScanResult(result) {
        const resultDiv = document.getElementById('scan-result');
        resultDiv.style.display = 'block';

        if (result.valid) {
            resultDiv.className = 'scan-result success';
            const bookingInfo = result.booking_info || result.booking;

            resultDiv.innerHTML = `
                <div class="scan-result-header">
                    <i class="fas fa-check-circle"></i>
                    <span>✅ Passenger Successfully Boarded!</span>
                </div>
                <div class="passenger-details">
                    <div class="detail-item">
                        <div class="detail-label">Passenger Name</div>
                        <div class="detail-value">${bookingInfo.passenger_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Seat Number</div>
                        <div class="detail-value">${bookingInfo.seat_number}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Bus Number</div>
                        <div class="detail-value">${bookingInfo.bus_number}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Route</div>
                        <div class="detail-value">${bookingInfo.route_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Pickup Stop</div>
                        <div class="detail-value">${bookingInfo.pickup_stop}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Boarding Time</div>
                        <div class="detail-value">${new Date(bookingInfo.boarding_time).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">QR Code</div>
                        <div class="detail-value">${bookingInfo.qr_code}</div>
                    </div>
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="staffApp.closeQRScanner()">
                        <i class="fas fa-check"></i> Done
                    </button>
                    <button class="btn btn-secondary" onclick="staffApp.cancelScan()">
                        <i class="fas fa-qrcode"></i> Scan Another
                    </button>
                </div>
            `;

            this.showToast('Passenger successfully boarded!', 'success');

            // Refresh bus info to show updated boarding count
            setTimeout(() => {
                this.loadBusInfo();
            }, 1000);

        } else {
            resultDiv.className = 'scan-result error';

            // Check if we have booking info for already boarded passengers
            if (result.booking && result.booking.status === 'boarded') {
                resultDiv.innerHTML = `
                    <div class="scan-result-header">
                        <i class="fas fa-info-circle"></i>
                        <span>Already Boarded</span>
                    </div>
                    <div class="passenger-details">
                        <div class="detail-item">
                            <div class="detail-label">Passenger Name</div>
                            <div class="detail-value">${result.booking.passenger_name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Seat Number</div>
                            <div class="detail-value">${result.booking.seat_number}</div>
                        </div>
                        ${result.booking.boarding_time ? `
                        <div class="detail-item">
                            <div class="detail-label">Boarded At</div>
                            <div class="detail-value">${new Date(result.booking.boarding_time).toLocaleString()}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="info-message">
                        <p>${result.message}</p>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-secondary" onclick="staffApp.cancelScan()">
                            <i class="fas fa-qrcode"></i> Scan Another
                        </button>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="scan-result-header">
                        <i class="fas fa-times-circle"></i>
                        <span>Invalid Ticket</span>
                    </div>
                    <div class="error-message">
                        <p>${result.message || result.error}</p>
                        <p>Please verify the QR code and try again.</p>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-secondary" onclick="staffApp.cancelScan()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                    </div>
                `;
            }

            this.showToast(`${result.message || result.error}`, 'error');
        }
    }

    openAlertDetail(alert) {
        this.currentAlert = alert;

        const modal = document.getElementById('alert-detail-modal');
        const content = document.getElementById('alert-detail-content');

        content.innerHTML = `
            <div class="alert-detail-header">
                <div class="alert-detail-title">${alert.title}</div>
                <div class="alert-detail-meta">
                    <span class="alert-priority ${alert.severity}">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${alert.severity.toUpperCase()} PRIORITY
                    </span>
                    <span class="alert-created">Created: ${new Date(alert.created_at).toLocaleString()}</span>
                </div>
            </div>

            <div class="alert-detail-message">
                <h4>Description:</h4>
                <p>${alert.message}</p>
            </div>

            <div class="alert-detail-context">
                ${alert.bus_number ? `<div class="context-item"><strong>Bus:</strong> ${alert.bus_number}</div>` : ''}
                ${alert.route_name ? `<div class="context-item"><strong>Route:</strong> ${alert.route_name}</div>` : ''}
                ${alert.stop_name ? `<div class="context-item"><strong>Stop:</strong> ${alert.stop_name}</div>` : ''}
            </div>

            ${alert.action_required ? '<div class="action-required-notice"><i class="fas fa-exclamation-circle"></i> This alert requires immediate action</div>' : ''}
        `;

        // Show/hide action buttons based on alert status
        const acknowledgeBtn = document.getElementById('acknowledge-alert');
        const resolveBtn = document.getElementById('resolve-alert');

        if (alert.status === 'active') {
            acknowledgeBtn.style.display = 'inline-flex';
            resolveBtn.style.display = 'inline-flex';
        } else if (alert.status === 'acknowledged') {
            acknowledgeBtn.style.display = 'none';
            resolveBtn.style.display = 'inline-flex';
        } else {
            acknowledgeBtn.style.display = 'none';
            resolveBtn.style.display = 'none';
        }

        modal.style.display = 'block';
    }

    closeAlertDetail() {
        document.getElementById('alert-detail-modal').style.display = 'none';
        this.currentAlert = null;
    }

    async acknowledgeCurrentAlert() {
        if (!this.currentAlert) return;

        try {
            const response = await fetch(`${this.API_BASE}/staff/alerts/${this.currentAlert.id}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.staffId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Alert acknowledged successfully', 'success');
                this.closeAlertDetail();
                await this.loadStaffAlerts(); // Refresh alerts
            } else {
                this.showToast('Failed to acknowledge alert', 'error');
            }

        } catch (error) {
            console.error('Error acknowledging alert:', error);
            this.showToast('Error acknowledging alert', 'error');
        }
    }

    async resolveCurrentAlert() {
        if (!this.currentAlert) return;

        // Could add a resolution notes input here
        const resolution_notes = prompt('Add resolution notes (optional):') || '';

        try {
            const response = await fetch(`${this.API_BASE}/staff/alerts/${this.currentAlert.id}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.staffId,
                    notes: resolution_notes
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Alert resolved successfully', 'success');
                this.closeAlertDetail();
                await this.loadStaffAlerts(); // Refresh alerts
            } else {
                this.showToast('Failed to resolve alert', 'error');
            }

        } catch (error) {
            console.error('Error resolving alert:', error);
            this.showToast('Error resolving alert', 'error');
        }
    }

    async openPassengerList() {
        // First load today's passengers for this bus
        await this.loadTodaysPassengers();

        const modal = document.getElementById('passenger-list-modal');
        modal.style.display = 'block';

        this.updatePassengerTable();
    }

    closePassengerList() {
        document.getElementById('passenger-list-modal').style.display = 'none';
    }

    async loadTodaysPassengers() {
        try {
            // Simulate loading today's passengers - in real app, this would be an API call
            this.passengers = [
                {
                    seat_number: 1,
                    passenger_name: 'John Smith',
                    pickup_stop: 'Central Station',
                    status: 'confirmed',
                    qr_code: 'QR_12345678',
                    booking_id: 'abc123'
                },
                {
                    seat_number: 2,
                    passenger_name: 'Sarah Johnson',
                    pickup_stop: 'Marina Bay',
                    status: 'boarded',
                    qr_code: 'QR_87654321',
                    booking_id: 'def456'
                },
                {
                    seat_number: 3,
                    passenger_name: 'Mike Chen',
                    pickup_stop: 'Raffles Place',
                    status: 'confirmed',
                    qr_code: 'QR_11223344',
                    booking_id: 'ghi789'
                }
            ];

            console.log(`Loaded ${this.passengers.length} passengers for today`);

        } catch (error) {
            console.error('Error loading passengers:', error);
            this.showToast('Error loading passenger list', 'error');
        }
    }

    updatePassengerTable() {
        const tbody = document.getElementById('passenger-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.passengers.map(passenger => `
            <tr>
                <td>${passenger.seat_number}</td>
                <td>${passenger.passenger_name}</td>
                <td>${passenger.pickup_stop}</td>
                <td>
                    <span class="passenger-status ${passenger.status}">
                        ${passenger.status}
                    </span>
                </td>
                <td>
                    <div class="qr-code-mini" title="${passenger.qr_code}">
                        <i class="fas fa-qrcode"></i>
                    </div>
                </td>
                <td>
                    ${passenger.status === 'confirmed' ?
                        `<button class="btn-scan" onclick="staffApp.scanPassengerQR('${passenger.qr_code}', '${passenger.booking_id}')">
                            <i class="fas fa-qrcode"></i> Scan
                        </button>` :
                        '<span class="status-boarded">Boarded</span>'
                    }
                </td>
            </tr>
        `).join('');
    }

    filterPassengers(searchTerm) {
        const rows = document.querySelectorAll('#passenger-table-body tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    async scanPassengerQR(qrCode, bookingId) {
        // Close passenger list and open QR scanner with pre-filled data
        this.closePassengerList();
        this.openQRScanner();

        document.getElementById('qr-input').value = qrCode;

        // Automatically verify
        setTimeout(() => {
            this.verifyQRCode();
        }, 500);
    }

    scrollToAlerts() {
        document.querySelector('.alerts-section').scrollIntoView({
            behavior: 'smooth'
        });
    }

    async refreshBusInfo() {
        this.showToast('Refreshing bus information...', 'info');
        await this.loadBusInfo();
        this.showToast('Bus information updated', 'success');
    }

    startRealTimeUpdates() {
        // Update alerts every 30 seconds
        setInterval(() => {
            this.loadStaffAlerts();
        }, 30000);

        // Update bus info every 60 seconds
        setInterval(() => {
            this.loadBusInfo();
        }, 60000);

        console.log('Real-time updates started');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const messageEl = document.getElementById('toast-message');

        // Set message and type
        messageEl.textContent = message;
        toast.className = `toast ${type}`;

        // Show toast
        toast.style.display = 'flex';

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        const toast = document.getElementById('notification-toast');
        toast.style.display = 'none';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    // Public methods for external access
    async createTestAlert() {
        // For testing purposes - create a test alert
        try {
            const response = await fetch(`${this.API_BASE}/alerts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'overcrowding',
                    message: 'Test alert: High passenger volume at test stop',
                    severity: 'high',
                    assigned_to_role: 'staff'
                })
            });

            if (response.ok) {
                this.showToast('Test alert created', 'success');
                await this.loadStaffAlerts();
            }
        } catch (error) {
            console.error('Error creating test alert:', error);
        }
    }

    // Debug methods
    getSystemStatus() {
        return {
            alerts: this.alerts.length,
            busInfo: this.busInfo ? 'loaded' : 'not loaded',
            passengers: this.passengers.length,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Global functions for onclick handlers
window.hideToast = function() {
    const toast = document.getElementById('notification-toast');
    toast.style.display = 'none';
};

// CSS for additional elements not in main CSS
const additionalStyles = `
.no-alerts {
    text-align: center;
    padding: 2rem;
    color: var(--staff-text-light);
    font-style: italic;
}

.no-boardings {
    text-align: center;
    padding: 2rem;
    color: var(--staff-text-light);
    font-style: italic;
}

.alert-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: var(--staff-text-light);
}

.alert-details span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.action-required {
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--staff-accent);
    border-radius: 6px;
    color: var(--staff-accent);
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.alert-detail-header {
    margin-bottom: 1.5rem;
}

.alert-detail-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--staff-dark);
    margin-bottom: 0.5rem;
}

.alert-detail-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 0.875rem;
}

.alert-detail-message {
    margin-bottom: 1.5rem;
}

.alert-detail-message h4 {
    color: var(--staff-dark);
    margin-bottom: 0.5rem;
}

.alert-detail-context {
    margin-bottom: 1.5rem;
}

.context-item {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.action-required-notice {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--staff-accent);
    border-radius: 6px;
    padding: 1rem;
    color: var(--staff-accent);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.btn-scan {
    background: var(--staff-primary);
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease;
}

.btn-scan:hover {
    background: var(--staff-secondary);
    transform: translateY(-1px);
}

.status-boarded {
    color: var(--staff-success);
    font-weight: 600;
    font-size: 0.875rem;
}

.error-message {
    text-align: center;
    padding: 1rem;
}

.error-message p {
    margin-bottom: 0.5rem;
}
`;

// Add additional styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the staff interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.staffApp = new StaffInterface();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.staffApp) {
        console.log('Staff interface shutting down...');
    }
});

// Expose for debugging
window.StaffInterface = StaffInterface;