// /**
//  * Smart Queue Management System - Frontend Application
//  * Real working functionality with backend integration
//  */

// class SmartQueueApp {
//     constructor() {
//         this.API_BASE = 'http://localhost:5000/api';
//         this.routes = [];
//         this.buses = [];
//         this.currentBooking = null;
//         this.queueData = {};
//         this.alertsData = [];
//         this.realTimeUpdateInterval = null;
        
//         this.init();
//     }
    
//     async init() {
//         console.log('Initializing Smart Queue Management System...');
        
//         // Setup event listeners
//         this.setupEventListeners();
        
//         // Load initial data
//         await this.loadRoutes();
//         await this.loadDashboardStats();
//         await this.loadQueueStatus();
//         await this.loadAlerts();
        
//         // Start real-time updates
//         this.startRealTimeUpdates();
        
//         // Setup auto-refresh for queue data
//         setInterval(() => {
//             this.loadQueueStatus();
//         }, 30000); // Update every 30 seconds
        
//         console.log('SmartQueue System initialized successfully!');
//     }
    
//     setupEventListeners() {
//         // Mobile menu toggle
//         const mobileMenu = document.getElementById('mobile-menu');
//         const navLinks = document.getElementById('nav-links');
        
//         mobileMenu?.addEventListener('click', () => {
//             navLinks.classList.toggle('active');
//         });
        
//         // Smooth scrolling for navigation
//         document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//             anchor.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 const target = document.querySelector(anchor.getAttribute('href'));
//                 if (target) {
//                     target.scrollIntoView({ behavior: 'smooth' });
//                 }
//             });
//         });
        
//         // Booking form submission
//         const bookingForm = document.getElementById('booking-form');
//         bookingForm?.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
//         // Route selection change
//         const routeSelect = document.getElementById('route-select');
//         routeSelect?.addEventListener('change', (e) => this.handleRouteChange(e));
        
//         // Pickup stop change for AI prediction
//         const pickupStop = document.getElementById('pickup-stop');
//         pickupStop?.addEventListener('change', (e) => this.handlePickupStopChange(e));
        
//         // Modal close
//         const closeModal = document.getElementById('close-modal');
//         closeModal?.addEventListener('click', () => this.closeBookingModal());
        
//         // Close modal when clicking outside
//         const modal = document.getElementById('booking-modal');
//         modal?.addEventListener('click', (e) => {
//             if (e.target === modal) {
//                 this.closeBookingModal();
//             }
//         });
        
//         // Set minimum date to today
//         const travelDate = document.getElementById('travel-date');
//         if (travelDate) {
//             const now = new Date();
//             now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
//             travelDate.min = now.toISOString().slice(0, 16);
//         }
//     }
    
//     async loadRoutes() {
//         try {
//             this.showLoading(true);
//             const response = await fetch(`${this.API_BASE}/routes`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const routes = await response.json();
//             this.routes = routes;
            
//             this.populateRouteSelect(routes);
//             console.log('Routes loaded:', routes.length);
            
//         } catch (error) {
//             console.error('Error loading routes:', error);
//             this.showNotification('Error loading routes. Please try again.', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }
    
//     populateRouteSelect(routes) {
//         const routeSelect = document.getElementById('route-select');
//         if (!routeSelect) return;
        
//         routeSelect.innerHTML = '<option value="">Choose a route...</option>';
        
//         routes.forEach(route => {
//             const option = document.createElement('option');
//             option.value = route.id;
//             option.textContent = `${route.name} - ${route.start_point} to ${route.end_point} ($${route.price})`;
//             option.dataset.duration = route.duration;
//             option.dataset.price = route.price;
//             routeSelect.appendChild(option);
//         });
//     }
    
//     async handleRouteChange(event) {
//         const routeId = event.target.value;
//         if (!routeId) {
//             this.clearStopsAndBuses();
//             return;
//         }
        
//         const selectedRoute = this.routes.find(r => r.id == routeId);
//         if (!selectedRoute) return;
        
//         // Populate stops
//         this.populateStops(selectedRoute.stops);
        
//         // Load buses for this route
//         await this.loadBusesForRoute(routeId);
//     }
    
//     populateStops(stops) {
//         const pickupSelect = document.getElementById('pickup-stop');
//         const dropoffSelect = document.getElementById('dropoff-stop');
        
//         if (!pickupSelect || !dropoffSelect) return;
        
//         // Clear existing options
//         pickupSelect.innerHTML = '<option value="">Select pickup stop...</option>';
//         dropoffSelect.innerHTML = '<option value="">Select drop-off stop...</option>';
        
//         stops.forEach(stop => {
//             const pickupOption = document.createElement('option');
//             pickupOption.value = stop.id;
//             pickupOption.textContent = stop.name;
//             pickupSelect.appendChild(pickupOption);
            
//             const dropoffOption = document.createElement('option');
//             dropoffOption.value = stop.id;
//             dropoffOption.textContent = stop.name;
//             dropoffSelect.appendChild(dropoffOption);
//         });
//     }
    
//     async loadBusesForRoute(routeId) {
//         try {
//             const response = await fetch(`${this.API_BASE}/buses/${routeId}`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const buses = await response.json();
//             this.buses = buses;
            
//             this.populateBusSelect(buses);
            
//         } catch (error) {
//             console.error('Error loading buses:', error);
//             this.showNotification('Error loading buses. Please try again.', 'error');
//         }
//     }
    
//     populateBusSelect(buses) {
//         const busSelect = document.getElementById('bus-select');
//         if (!busSelect) return;
        
//         busSelect.innerHTML = '<option value="">Choose a bus...</option>';
        
//         buses.forEach(bus => {
//             const option = document.createElement('option');
//             option.value = bus.id;
//             option.textContent = `Bus ${bus.bus_number} - ${bus.available_seats} seats available`;
//             option.disabled = bus.available_seats === 0;
//             busSelect.appendChild(option);
//         });
//     }
    
//     async handlePickupStopChange(event) {
//         const stopId = event.target.value;
//         if (!stopId) {
//             this.hideAIPrediction();
//             return;
//         }
        
//         // Get AI prediction for this stop
//         await this.loadAIPrediction(stopId);
//     }
    
//     async loadAIPrediction(stopId) {
//         try {
//             const response = await fetch(`${this.API_BASE}/queue/${stopId}`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const queueInfo = await response.json();
//             this.showAIPrediction(queueInfo);
            
//         } catch (error) {
//             console.error('Error loading AI prediction:', error);
//         }
//     }
    
//     showAIPrediction(queueInfo) {
//         const predictionDiv = document.getElementById('ai-prediction');
//         const predictionText = document.getElementById('prediction-text');
//         const predictedQueue = document.getElementById('predicted-queue');
//         const predictedWait = document.getElementById('predicted-wait');
        
//         if (!predictionDiv) return;
        
//         const current = queueInfo.current_queue;
//         const predicted = queueInfo.predicted_next_hour;
        
//         let message = '';
//         if (current.length <= 5) {
//             message = '✅ Great timing! Low queue expected at your pickup stop.';
//         } else if (current.length <= 10) {
//             message = '⚠️ Moderate queue expected. Consider booking early.';
//         } else {
//             message = '🚨 High queue predicted. We recommend choosing a different time or stop.';
//         }
        
//         predictionText.textContent = message;
//         predictedQueue.textContent = current.length;
//         predictedWait.textContent = current.waiting_time;
        
//         predictionDiv.style.display = 'block';
//     }
    
//     hideAIPrediction() {
//         const predictionDiv = document.getElementById('ai-prediction');
//         if (predictionDiv) {
//             predictionDiv.style.display = 'none';
//         }
//     }
    
//     async handleBookingSubmit(event) {
//         event.preventDefault();
        
//         const formData = new FormData(event.target);
//         const bookingData = {
//             passenger_name: formData.get('passenger_name'),
//             passenger_email: formData.get('passenger_email'),
//             passenger_phone: formData.get('passenger_phone'),
//             bus_id: parseInt(formData.get('bus_id')),
//             route_id: parseInt(formData.get('route_id')),
//             pickup_stop_id: parseInt(formData.get('pickup_stop_id')),
//             dropoff_stop_id: parseInt(formData.get('dropoff_stop_id')),
//             travel_date: formData.get('travel_date')
//         };
        
//         // Validation
//         if (!this.validateBookingData(bookingData)) {
//             return;
//         }
        
//         try {
//             this.showLoading(true);
            
//             const response = await fetch(`${this.API_BASE}/book`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(bookingData)
//             });
            
//             const result = await response.json();
            
//             if (!response.ok) {
//                 throw new Error(result.error || 'Booking failed');
//             }
            
//             this.currentBooking = result;
//             this.showBookingConfirmation(result);
//             this.resetBookingForm();
//             this.showNotification('Booking confirmed successfully!', 'success');
            
//         } catch (error) {
//             console.error('Booking error:', error);
//             this.showNotification(error.message || 'Booking failed. Please try again.', 'error');
//         } finally {
//             this.showLoading(false);
//         }
//     }
    
//     validateBookingData(data) {
//         const requiredFields = [
//             'passenger_name', 'passenger_email', 'passenger_phone',
//             'bus_id', 'route_id', 'pickup_stop_id', 'dropoff_stop_id', 'travel_date'
//         ];
        
//         for (const field of requiredFields) {
//             if (!data[field]) {
//                 this.showNotification(`Please fill in all required fields.`, 'error');
//                 return false;
//             }
//         }
        
//         // Email validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(data.passenger_email)) {
//             this.showNotification('Please enter a valid email address.', 'error');
//             return false;
//         }
        
//         // Phone validation
//         const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
//         if (!phoneRegex.test(data.passenger_phone.replace(/\s/g, ''))) {
//             this.showNotification('Please enter a valid phone number.', 'error');
//             return false;
//         }
        
//         // Date validation
//         const travelDate = new Date(data.travel_date);
//         const now = new Date();
//         if (travelDate <= now) {
//             this.showNotification('Travel date must be in the future.', 'error');
//             return false;
//         }
        
//         return true;
//     }
    
//     showBookingConfirmation(bookingData) {
//         const modal = document.getElementById('booking-modal');
//         const bookingDetails = document.getElementById('booking-details');
//         const qrCodeDisplay = document.getElementById('qr-code-display');
        
//         if (!modal || !bookingDetails) return;
        
//         // Get route and bus information
//         const route = this.routes.find(r => r.id === bookingData.route_id);
//         const bus = this.buses.find(b => b.id === bookingData.bus_id);
        
//         bookingDetails.innerHTML = `
//             <div class="booking-info-grid">
//                 <div class="info-item">
//                     <strong>Booking ID:</strong>
//                     <span>${bookingData.booking_id}</span>
//                 </div>
//                 <div class="info-item">
//                     <strong>Seat Number:</strong>
//                     <span>${bookingData.seat_number}</span>
//                 </div>
//                 <div class="info-item">
//                     <strong>Bus Number:</strong>
//                     <span>${bus ? bus.bus_number : 'N/A'}</span>
//                 </div>
//                 <div class="info-item">
//                     <strong>Route:</strong>
//                     <span>${route ? route.name : 'N/A'}</span>
//                 </div>
//             </div>
//         `;
        
//         // Generate QR Code (simplified representation)
//         qrCodeDisplay.innerHTML = `
//             <div class="qr-code-placeholder">
//                 <div class="qr-pattern"></div>
//                 <div class="qr-code-text">${bookingData.qr_code}</div>
//             </div>
//         `;
        
//         modal.style.display = 'block';
//     }
    
//     closeBookingModal() {
//         const modal = document.getElementById('booking-modal');
//         if (modal) {
//             modal.style.display = 'none';
//         }
//     }
    
//     resetBookingForm() {
//         const form = document.getElementById('booking-form');
//         if (form) {
//             form.reset();
//             this.clearStopsAndBuses();
//             this.hideAIPrediction();
//         }
//     }
    
//     clearStopsAndBuses() {
//         const pickupSelect = document.getElementById('pickup-stop');
//         const dropoffSelect = document.getElementById('dropoff-stop');
//         const busSelect = document.getElementById('bus-select');
        
//         if (pickupSelect) pickupSelect.innerHTML = '<option value="">Select pickup stop...</option>';
//         if (dropoffSelect) dropoffSelect.innerHTML = '<option value="">Select drop-off stop...</option>';
//         if (busSelect) busSelect.innerHTML = '<option value="">Choose a bus...</option>';
//     }
    
//     async loadQueueStatus() {
//         try {
//             const response = await fetch(`${this.API_BASE}/realtime/queue`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const queueData = await response.json();
//             this.queueData = queueData;
            
//             this.updateQueueDisplay(queueData);
//             this.updateDashboardQueues(queueData);
            
//         } catch (error) {
//             console.error('Error loading queue status:', error);
//         }
//     }
    
//     updateQueueDisplay(queueData) {
//         const queueGrid = document.getElementById('queue-grid');
//         if (!queueGrid) return;
        
//         queueGrid.innerHTML = '';
        
//         // Get stop names from routes
//         const stopNames = {};
//         this.routes.forEach(route => {
//             route.stops.forEach(stop => {
//                 stopNames[stop.id] = stop.name;
//             });
//         });
        
//         Object.entries(queueData).forEach(([stopId, data]) => {
//             const card = this.createQueueCard(stopId, stopNames[stopId] || `Stop ${stopId}`, data);
//             queueGrid.appendChild(card);
//         });
//     }
    
//     createQueueCard(stopId, stopName, queueInfo) {
//         const card = document.createElement('div');
//         card.className = 'queue-card';
        
//         const queueLevel = this.getQueueLevel(queueInfo.length);
//         card.classList.add(queueLevel);
        
//         card.innerHTML = `
//             <div class="queue-card-header">
//                 <h3>${stopName}</h3>
//                 <span class="status-indicator ${queueLevel}"></span>
//             </div>
//             <div class="queue-stats">
//                 <div class="stat">
//                     <span class="stat-number">${queueInfo.length}</span>
//                     <span class="stat-label">People in Queue</span>
//                 </div>
//                 <div class="stat">
//                     <span class="stat-number">${queueInfo.waiting_time}</span>
//                     <span class="stat-label">Wait Time (min)</span>
//                 </div>
//             </div>
//             <div class="queue-timestamp">
//                 <i class="fas fa-clock"></i>
//                 Last updated: ${new Date(queueInfo.last_updated).toLocaleTimeString()}
//             </div>
//         `;
        
//         return card;
//     }
    
//     getQueueLevel(queueLength) {
//         if (queueLength <= 5) return 'low';
//         if (queueLength <= 10) return 'medium';
//         return 'high';
//     }
    
//     async loadDashboardStats() {
//         try {
//             const response = await fetch(`${this.API_BASE}/dashboard/stats`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const stats = await response.json();
//             this.updateDashboardStats(stats);
//             this.updateHeroStats(stats);
            
//         } catch (error) {
//             console.error('Error loading dashboard stats:', error);
//         }
//     }
    
//     updateDashboardStats(stats) {
//         // Update dashboard metrics
//         const elements = {
//             'dash-total-bookings': stats.total_bookings,
//             'dash-today-bookings': stats.today_bookings,
//             'dash-active-buses': stats.total_buses
//         };
        
//         Object.entries(elements).forEach(([id, value]) => {
//             const element = document.getElementById(id);
//             if (element) {
//                 this.animateNumber(element, value);
//             }
//         });
//     }
    
//     updateHeroStats(stats) {
//         // Update hero section stats
//         const totalBookingsEl = document.getElementById('total-bookings');
//         const busesOnlineEl = document.getElementById('buses-online');
//         const avgWaitTimeEl = document.getElementById('avg-wait-time');
        
//         if (totalBookingsEl) this.animateNumber(totalBookingsEl, stats.today_bookings);
//         if (busesOnlineEl) this.animateNumber(busesOnlineEl, stats.total_buses);
//         if (avgWaitTimeEl) this.animateNumber(avgWaitTimeEl, 8); // Average wait time
//     }
    
//     animateNumber(element, targetValue) {
//         const currentValue = parseInt(element.textContent) || 0;
//         const increment = Math.ceil((targetValue - currentValue) / 20);
        
//         if (currentValue < targetValue) {
//             element.textContent = Math.min(currentValue + increment, targetValue);
//             setTimeout(() => this.animateNumber(element, targetValue), 50);
//         } else {
//             element.textContent = targetValue;
//         }
//     }
    
//     async loadAlerts() {
//         try {
//             const response = await fetch(`${this.API_BASE}/alerts`);
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const alerts = await response.json();
//             this.alertsData = alerts;
            
//             this.updateAlertsDisplay(alerts);
            
//         } catch (error) {
//             console.error('Error loading alerts:', error);
//         }
//     }
    
//     updateAlertsDisplay(alerts) {
//         const alertsContainer = document.getElementById('alerts-container');
//         if (!alertsContainer) return;
        
//         if (alerts.length === 0) {
//             alertsContainer.innerHTML = '<p class="no-alerts">No active alerts</p>';
//             return;
//         }
        
//         alertsContainer.innerHTML = '';
        
//         alerts.slice(0, 5).forEach(alert => {
//             const alertElement = this.createAlertElement(alert);
//             alertsContainer.appendChild(alertElement);
//         });
//     }
    
//     createAlertElement(alert) {
//         const alertDiv = document.createElement('div');
//         alertDiv.className = `alert alert-${alert.severity}`;
        
//         const icon = this.getAlertIcon(alert.type);
//         const timeAgo = this.getTimeAgo(new Date(alert.created_at));
        
//         alertDiv.innerHTML = `
//             <div class="alert-content">
//                 <div class="alert-header">
//                     <i class="${icon}"></i>
//                     <span class="alert-type">${alert.type.toUpperCase()}</span>
//                     <span class="alert-time">${timeAgo}</span>
//                 </div>
//                 <div class="alert-message">${alert.message}</div>
//                 ${alert.bus_number ? `<div class="alert-meta">Bus: ${alert.bus_number}</div>` : ''}
//                 ${alert.route_name ? `<div class="alert-meta">Route: ${alert.route_name}</div>` : ''}
//             </div>
//         `;
        
//         return alertDiv;
//     }
    
//     getAlertIcon(type) {
//         const icons = {
//             'delay': 'fas fa-clock',
//             'overcrowding': 'fas fa-users',
//             'maintenance': 'fas fa-wrench',
//             'emergency': 'fas fa-exclamation-triangle'
//         };
//         return icons[type] || 'fas fa-info-circle';
//     }
    
//     getTimeAgo(date) {
//         const now = new Date();
//         const diffMs = now - date;
//         const diffMins = Math.floor(diffMs / 60000);
        
//         if (diffMins < 1) return 'Just now';
//         if (diffMins < 60) return `${diffMins}m ago`;
        
//         const diffHours = Math.floor(diffMins / 60);
//         if (diffHours < 24) return `${diffHours}h ago`;
        
//         const diffDays = Math.floor(diffHours / 24);
//         return `${diffDays}d ago`;
//     }
    
//     updateDashboardQueues(queueData) {
//         const realtimeQueues = document.getElementById('realtime-queues');
//         if (!realtimeQueues) return;
        
//         realtimeQueues.innerHTML = '';
        
//         // Get stop names
//         const stopNames = {};
//         this.routes.forEach(route => {
//             route.stops.forEach(stop => {
//                 stopNames[stop.id] = stop.name;
//             });
//         });
        
//         const queueTable = document.createElement('table');
//         queueTable.className = 'queue-table';
//         queueTable.innerHTML = `
//             <thead>
//                 <tr>
//                     <th>Stop Name</th>
//                     <th>Queue Length</th>
//                     <th>Wait Time</th>
//                     <th>Status</th>
//                     <th>Last Update</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 ${Object.entries(queueData).map(([stopId, data]) => `
//                     <tr>
//                         <td>${stopNames[stopId] || `Stop ${stopId}`}</td>
//                         <td>${data.length} people</td>
//                         <td>${data.waiting_time} min</td>
//                         <td><span class="status-badge ${this.getQueueLevel(data.length)}">${this.getQueueLevel(data.length).toUpperCase()}</span></td>
//                         <td>${new Date(data.last_updated).toLocaleTimeString()}</td>
//                     </tr>
//                 `).join('')}
//             </tbody>
//         `;
        
//         realtimeQueues.appendChild(queueTable);
//     }
    
//     startRealTimeUpdates() {
//         // Update queue status every 30 seconds
//         this.realTimeUpdateInterval = setInterval(() => {
//             this.loadQueueStatus();
//             this.loadDashboardStats();
//             this.loadAlerts();
//         }, 30000);
//     }
    
//     showLoading(show) {
//         const loadingOverlay = document.getElementById('loading-overlay');
//         if (loadingOverlay) {
//             loadingOverlay.style.display = show ? 'flex' : 'none';
//         }
//     }
    
//     showNotification(message, type = 'info') {
//         const container = document.getElementById('notification-container');
//         if (!container) return;
        
//         const notification = document.createElement('div');
//         notification.className = `notification notification-${type}`;
        
//         const icon = type === 'success' ? 'fas fa-check' : 
//                     type === 'error' ? 'fas fa-times' : 
//                     type === 'warning' ? 'fas fa-exclamation' : 'fas fa-info';
        
//         notification.innerHTML = `
//             <i class="${icon}"></i>
//             <span>${message}</span>
//             <button class="notification-close" onclick="this.parentElement.remove()">
//                 <i class="fas fa-times"></i>
//             </button>
//         `;
        
//         container.appendChild(notification);
        
//         // Auto remove after 5 seconds
//         setTimeout(() => {
//             if (notification.parentElement) {
//                 notification.remove();
//             }
//         }, 5000);
//     }
    
//     // Public methods for external access
//     async searchBooking(bookingId) {
//         try {
//             const response = await fetch(`${this.API_BASE}/booking/${bookingId}`);
            
//             if (!response.ok) {
//                 throw new Error('Booking not found');
//             }
            
//             return await response.json();
            
//         } catch (error) {
//             console.error('Error searching booking:', error);
//             throw error;
//         }
//     }
    
//     // Clean up on page unload
//     destroy() {
//         if (this.realTimeUpdateInterval) {
//             clearInterval(this.realTimeUpdateInterval);
//         }
//     }
// }

// // Initialize the application when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     window.smartQueueApp = new SmartQueueApp();
// });

// // Clean up when page is unloaded
// window.addEventListener('beforeunload', () => {
//     if (window.smartQueueApp) {
//         window.smartQueueApp.destroy();
//     }
// });

// // Additional utility functions
// function formatCurrency(amount) {
//     return new Intl.NumberFormat('en-SG', {
//         style: 'currency',
//         currency: 'SGD'
//     }).format(amount);
// }

// function formatDateTime(dateString) {
//     return new Date(dateString).toLocaleString('en-SG', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//     });
// }

// // Service Worker registration for offline functionality (optional)
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('SW registered: ', registration);
//             })
//             .catch(registrationError => {
//                 console.log('SW registration failed: ', registrationError);
//             });
//     });
// }

/**
 * Enhanced Smart Queue Management System - Complete Frontend Application
 * Real working functionality with backend integration and enhanced QR codes
 */

class SmartQueueApp {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.routes = [];
        this.buses = [];
        this.currentBooking = null;
        this.queueData = {};
        this.alertsData = [];
        this.realTimeUpdateInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Enhanced Smart Queue Management System...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadRoutes();
        await this.loadDashboardStats();
        await this.loadQueueStatus();
        await this.loadAlerts();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        console.log('Enhanced SmartQueue System initialized successfully!');
    }
    
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenu = document.getElementById('mobile-menu');
        const navLinks = document.getElementById('nav-links');
        
        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
        
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Booking form submission
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        }
        
        // Route selection change
        const routeSelect = document.getElementById('route-select');
        if (routeSelect) {
            routeSelect.addEventListener('change', (e) => this.handleRouteChange(e));
        }
        
        // Pickup stop change for AI prediction
        const pickupStop = document.getElementById('pickup-stop');
        if (pickupStop) {
            pickupStop.addEventListener('change', (e) => this.handlePickupStopChange(e));
        }
        
        // Modal close handlers
        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeBookingModal());
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeBookingModal();
                }
            });
        }
        
        // Set minimum date to today
        const travelDate = document.getElementById('travel-date');
        if (travelDate) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            travelDate.min = now.toISOString().slice(0, 16);
        }
    }
    
    async loadRoutes() {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.API_BASE}/routes`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const routes = await response.json();
            this.routes = routes;
            
            this.populateRouteSelect(routes);
            console.log('Enhanced routes loaded:', routes.length);
            
        } catch (error) {
            console.error('Error loading routes:', error);
            this.showNotification('Error loading routes. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    populateRouteSelect(routes) {
        const routeSelect = document.getElementById('route-select');
        if (!routeSelect) return;
        
        routeSelect.innerHTML = '<option value="">Choose a route...</option>';
        
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = `${route.name} - ${route.start_point} to ${route.end_point} ($${route.price})`;
            option.dataset.duration = route.duration;
            option.dataset.price = route.price;
            option.dataset.frequency = route.frequency;
            routeSelect.appendChild(option);
        });
    }
    
    async handleRouteChange(event) {
        const routeId = event.target.value;
        if (!routeId) {
            this.clearStopsAndBuses();
            return;
        }
        
        const selectedRoute = this.routes.find(r => r.id == routeId);
        if (!selectedRoute) return;
        
        // Populate stops
        this.populateStops(selectedRoute.stops);
        
        // Load buses for this route
        await this.loadBusesForRoute(routeId);
    }
    
    populateStops(stops) {
        const pickupSelect = document.getElementById('pickup-stop');
        const dropoffSelect = document.getElementById('dropoff-stop');
        
        if (!pickupSelect || !dropoffSelect) return;
        
        // Clear existing options
        pickupSelect.innerHTML = '<option value="">Select pickup stop...</option>';
        dropoffSelect.innerHTML = '<option value="">Select drop-off stop...</option>';
        
        stops.forEach(stop => {
            const pickupOption = document.createElement('option');
            pickupOption.value = stop.id;
            pickupOption.textContent = stop.name;
            pickupSelect.appendChild(pickupOption);
            
            const dropoffOption = document.createElement('option');
            dropoffOption.value = stop.id;
            dropoffOption.textContent = stop.name;
            dropoffSelect.appendChild(dropoffOption);
        });
    }
    
    async loadBusesForRoute(routeId) {
        try {
            const response = await fetch(`${this.API_BASE}/buses/${routeId}`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const buses = await response.json();
            this.buses = buses;
            
            this.populateBusSelect(buses);
            
        } catch (error) {
            console.error('Error loading buses:', error);
            this.showNotification('Error loading buses. Please try again.', 'error');
        }
    }
    
    populateBusSelect(buses) {
        const busSelect = document.getElementById('bus-select');
        if (!busSelect) return;
        
        busSelect.innerHTML = '<option value="">Choose a bus...</option>';
        
        buses.forEach(bus => {
            const option = document.createElement('option');
            option.value = bus.id;
            option.textContent = `Bus ${bus.bus_number} - ${bus.available_seats} seats available`;
            option.disabled = bus.available_seats === 0;
            if (bus.driver_name) {
                option.textContent += ` (Driver: ${bus.driver_name})`;
            }
            busSelect.appendChild(option);
        });
    }
    
    async handlePickupStopChange(event) {
        const stopId = event.target.value;
        if (!stopId) {
            this.hideAIPrediction();
            return;
        }
        
        // Get AI prediction for this stop
        await this.loadAIPrediction(stopId);
    }
    
    async loadAIPrediction(stopId) {
        try {
            const response = await fetch(`${this.API_BASE}/queue/${stopId}`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const queueInfo = await response.json();
            this.showAIPrediction(queueInfo);
            
        } catch (error) {
            console.error('Error loading AI prediction:', error);
            // Don't show error for this, just hide prediction
            this.hideAIPrediction();
        }
    }
    
    showAIPrediction(queueInfo) {
        const predictionDiv = document.getElementById('ai-prediction');
        const predictionText = document.getElementById('prediction-text');
        const predictedQueue = document.getElementById('predicted-queue');
        const predictedWait = document.getElementById('predicted-wait');
        
        if (!predictionDiv || !predictionText || !predictedQueue || !predictedWait) return;
        
        const current = queueInfo.current_queue;
        const predicted = queueInfo.predicted_next_hour;
        
        let message = '';
        let alertClass = '';
        
        if (current.length <= 5) {
            message = '✅ Great timing! Low queue expected at your pickup stop.';
            alertClass = 'success';
        } else if (current.length <= 10) {
            message = '⚠️ Moderate queue expected. Consider booking early.';
            alertClass = 'warning';
        } else {
            message = '🚨 High queue predicted. We recommend choosing a different time or stop.';
            alertClass = 'danger';
        }
        
        predictionText.textContent = message;
        predictedQueue.textContent = current.length;
        predictedWait.textContent = current.waiting_time;
        
        predictionDiv.className = `ai-prediction ${alertClass}`;
        predictionDiv.style.display = 'block';
    }
    
    hideAIPrediction() {
        const predictionDiv = document.getElementById('ai-prediction');
        if (predictionDiv) {
            predictionDiv.style.display = 'none';
        }
    }
    
    async handleBookingSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const bookingData = {
            passenger_name: formData.get('passenger_name'),
            passenger_email: formData.get('passenger_email'),
            passenger_phone: formData.get('passenger_phone'),
            bus_id: parseInt(formData.get('bus_id')),
            route_id: parseInt(formData.get('route_id')),
            pickup_stop_id: parseInt(formData.get('pickup_stop_id')),
            dropoff_stop_id: parseInt(formData.get('dropoff_stop_id')),
            travel_date: formData.get('travel_date')
        };
        
        // Validation
        if (!this.validateBookingData(bookingData)) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            // Use enhanced booking endpoint with proper CORS handling
            const response = await fetch(`${this.API_BASE}/book-enhanced`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.currentBooking = result;
            this.showEnhancedBookingConfirmation(result);
            this.resetBookingForm();
            this.showNotification('Booking confirmed successfully with enhanced QR code!', 'success');
            
        } catch (error) {
            console.error('Booking error:', error);
            this.showNotification(error.message || 'Booking failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    validateBookingData(data) {
        const requiredFields = [
            'passenger_name', 'passenger_email', 'passenger_phone',
            'bus_id', 'route_id', 'pickup_stop_id', 'dropoff_stop_id', 'travel_date'
        ];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`Please fill in all required fields.`, 'error');
                return false;
            }
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.passenger_email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            return false;
        }
        
        // Phone validation
        const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
        if (!phoneRegex.test(data.passenger_phone.replace(/\s/g, ''))) {
            this.showNotification('Please enter a valid phone number.', 'error');
            return false;
        }
        
        // Date validation
        const travelDate = new Date(data.travel_date);
        const now = new Date();
        if (travelDate <= now) {
            this.showNotification('Travel date must be in the future.', 'error');
            return false;
        }
        
        // Stop validation
        if (data.pickup_stop_id === data.dropoff_stop_id) {
            this.showNotification('Pickup and drop-off stops must be different.', 'error');
            return false;
        }
        
        return true;
    }
    
    showEnhancedBookingConfirmation(bookingData) {
        const modal = document.getElementById('booking-modal');
        const bookingDetails = document.getElementById('booking-details');
        const qrCodeDisplay = document.getElementById('qr-code-display');
        
        if (!modal || !bookingDetails) return;
        
        bookingDetails.innerHTML = `
            <div class="booking-info-grid">
                <div class="info-item">
                    <strong>Booking ID:</strong>
                    <span>${bookingData.booking_id}</span>
                </div>
                <div class="info-item">
                    <strong>Seat Number:</strong>
                    <span>${bookingData.seat_number}</span>
                </div>
                <div class="info-item">
                    <strong>Bus Number:</strong>
                    <span>${bookingData.bus_number || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Route:</strong>
                    <span>${bookingData.route_name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Pickup Stop:</strong>
                    <span>${bookingData.pickup_stop || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Status:</strong>
                    <span class="status-confirmed">${bookingData.status || 'Confirmed'}</span>
                </div>
            </div>
        `;
        
        // Display enhanced QR code image
        if (qrCodeDisplay) {
            if (bookingData.qr_image) {
                qrCodeDisplay.innerHTML = `
                    <div class="enhanced-qr-container">
                        <img src="data:image/png;base64,${bookingData.qr_image}" 
                             alt="Enhanced QR Code" 
                             class="enhanced-qr-image" />
                        <div class="qr-code-text">${bookingData.qr_code}</div>
                        <p class="qr-instructions">Show this QR code when boarding</p>
                    </div>
                `;
            } else {
                // Fallback QR display
                qrCodeDisplay.innerHTML = `
                    <div class="qr-code-placeholder">
                        <div class="qr-pattern"></div>
                        <div class="qr-code-text">${bookingData.qr_code || 'QR_CODE'}</div>
                        <p>Show this code when boarding</p>
                    </div>
                `;
            }
        }
        
        modal.style.display = 'block';
        
        // Auto-focus close button for accessibility
        setTimeout(() => {
            const closeBtn = document.getElementById('close-modal');
            if (closeBtn) closeBtn.focus();
        }, 100);
    }
    
    closeBookingModal() {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    resetBookingForm() {
        const form = document.getElementById('booking-form');
        if (form) {
            form.reset();
            this.clearStopsAndBuses();
            this.hideAIPrediction();
        }
    }
    
    clearStopsAndBuses() {
        const pickupSelect = document.getElementById('pickup-stop');
        const dropoffSelect = document.getElementById('dropoff-stop');
        const busSelect = document.getElementById('bus-select');
        
        if (pickupSelect) pickupSelect.innerHTML = '<option value="">Select pickup stop...</option>';
        if (dropoffSelect) dropoffSelect.innerHTML = '<option value="">Select drop-off stop...</option>';
        if (busSelect) busSelect.innerHTML = '<option value="">Choose a bus...</option>';
    }
    
    async loadQueueStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/realtime/queue`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const queueData = await response.json();
            this.queueData = queueData;
            
            this.updateQueueDisplay(queueData);
            
        } catch (error) {
            console.error('Error loading queue status:', error);
            // Don't show error notification for this background task
        }
    }
    
    updateQueueDisplay(queueData) {
        const queueGrid = document.getElementById('queue-grid');
        if (!queueGrid) return;
        
        queueGrid.innerHTML = '';
        
        Object.entries(queueData).forEach(([stopId, data]) => {
            const card = this.createQueueCard(stopId, data.stop_name || `Stop ${stopId}`, data);
            queueGrid.appendChild(card);
        });
    }
    
    createQueueCard(stopId, stopName, queueInfo) {
        const card = document.createElement('div');
        card.className = 'queue-card';
        
        const queueLevel = this.getQueueLevel(queueInfo.length);
        card.classList.add(queueLevel);
        
        const trendIcon = this.getTrendIcon(queueInfo.trend);
        
        card.innerHTML = `
            <div class="queue-card-header">
                <h3>${stopName}</h3>
                <div class="queue-status">
                    <span class="status-indicator ${queueLevel}"></span>
                    <span class="trend-indicator">${trendIcon}</span>
                </div>
            </div>
            <div class="queue-stats">
                <div class="stat">
                    <span class="stat-number">${queueInfo.length}</span>
                    <span class="stat-label">People in Queue</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${queueInfo.waiting_time}</span>
                    <span class="stat-label">Wait Time (min)</span>
                </div>
            </div>
            <div class="queue-timestamp">
                <i class="fas fa-clock"></i>
                Last updated: ${new Date(queueInfo.last_updated).toLocaleTimeString()}
            </div>
        `;
        
        return card;
    }
    
    getQueueLevel(queueLength) {
        if (queueLength <= 5) return 'low';
        if (queueLength <= 10) return 'medium';
        return 'high';
    }
    
    getTrendIcon(trend) {
        switch (trend) {
            case 'increasing': return '📈';
            case 'decreasing': return '📉';
            case 'stable': return '➡️';
            default: return '➡️';
        }
    }
    
    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.API_BASE}/dashboard/stats`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stats = await response.json();
            this.updateDashboardStats(stats);
            this.updateHeroStats(stats);
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Provide fallback stats
            this.updateHeroStats({
                today_bookings: 0,
                total_buses: 0,
                total_revenue: 0
            });
        }
    }
    
    updateDashboardStats(stats) {
        // Update dashboard metrics if elements exist
        const elements = {
            'dash-total-bookings': stats.total_bookings,
            'dash-today-bookings': stats.today_bookings,
            'dash-active-buses': stats.total_buses,
            'dash-total-revenue': `$${stats.total_revenue.toLocaleString()}`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (typeof value === 'number') {
                    this.animateNumber(element, value);
                } else {
                    element.textContent = value;
                }
            }
        });
    }
    
    updateHeroStats(stats) {
        // Update hero section stats
        const totalBookingsEl = document.getElementById('total-bookings');
        const busesOnlineEl = document.getElementById('buses-online');
        const avgWaitTimeEl = document.getElementById('avg-wait-time');
        
        if (totalBookingsEl) this.animateNumber(totalBookingsEl, stats.today_bookings || 0);
        if (busesOnlineEl) this.animateNumber(busesOnlineEl, stats.total_buses || 0);
        if (avgWaitTimeEl) this.animateNumber(avgWaitTimeEl, 8); // Average wait time
    }
    
    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        if (currentValue < targetValue) {
            element.textContent = Math.min(currentValue + increment, targetValue);
            setTimeout(() => this.animateNumber(element, targetValue), 50);
        } else {
            element.textContent = targetValue;
        }
    }
    
    async loadAlerts() {
        try {
            const response = await fetch(`${this.API_BASE}/alerts`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const alerts = await response.json();
            this.alertsData = alerts;
            
            this.updateAlertsDisplay(alerts);
            
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }
    
    updateAlertsDisplay(alerts) {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) return;
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="no-alerts">No active alerts</p>';
            return;
        }
        
        alertsContainer.innerHTML = '';
        
        alerts.slice(0, 5).forEach(alert => {
            const alertElement = this.createAlertElement(alert);
            alertsContainer.appendChild(alertElement);
        });
    }
    
    createAlertElement(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.severity}`;
        
        const icon = this.getAlertIcon(alert.type);
        const timeAgo = this.getTimeAgo(new Date(alert.created_at));
        
        alertDiv.innerHTML = `
            <div class="alert-content">
                <div class="alert-header">
                    <i class="${icon}"></i>
                    <span class="alert-type">${alert.type.toUpperCase()}</span>
                    <span class="alert-time">${timeAgo}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
                ${alert.bus_number ? `<div class="alert-meta">Bus: ${alert.bus_number}</div>` : ''}
                ${alert.route_name ? `<div class="alert-meta">Route: ${alert.route_name}</div>` : ''}
            </div>
        `;
        
        return alertDiv;
    }
    
    getAlertIcon(type) {
        const icons = {
            'delay': 'fas fa-clock',
            'overcrowding': 'fas fa-users',
            'maintenance': 'fas fa-wrench',
            'emergency': 'fas fa-exclamation-triangle'
        };
        return icons[type] || 'fas fa-info-circle';
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
    
    startRealTimeUpdates() {
        // Update queue status every 30 seconds
        this.realTimeUpdateInterval = setInterval(() => {
            this.loadQueueStatus();
            this.loadDashboardStats();
            this.loadAlerts();
        }, 30000);
        
        console.log('Real-time updates started (every 30 seconds)');
    }
    
    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) {
            // Fallback: use alert if no notification container
            alert(message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check' : 
                    type === 'error' ? 'fas fa-times' : 
                    type === 'warning' ? 'fas fa-exclamation' : 'fas fa-info';
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Public methods for external access
    async searchBooking(bookingId) {
        try {
            const response = await fetch(`${this.API_BASE}/booking/${bookingId}`, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Booking not found');
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error searching booking:', error);
            throw error;
        }
    }
    
    // Debug methods
    getSystemStatus() {
        return {
            routes: this.routes.length,
            buses: this.buses.length,
            currentBooking: this.currentBooking ? 'loaded' : 'none',
            queueData: Object.keys(this.queueData).length,
            alerts: this.alertsData.length,
            realTimeUpdates: this.realTimeUpdateInterval ? 'running' : 'stopped',
            lastUpdate: new Date().toISOString()
        };
    }
    
    // Clean up on page unload
    destroy() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
    }
}

// Additional utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD'
    }).format(amount);
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartQueueApp = new SmartQueueApp();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.smartQueueApp) {
        window.smartQueueApp.destroy();
    }
});

// Service Worker registration for offline functionality (optional)
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

// Expose for debugging
window.SmartQueueApp = SmartQueueApp;

// Additional CSS for enhanced features (will be injected)
const enhancedStyles = `
/* Enhanced QR Code Styles */
.enhanced-qr-container {
    text-align: center;
    margin: 1rem auto;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px solid #e9ecef;
}

.enhanced-qr-image {
    max-width: 250px;
    height: auto;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.qr-code-text {
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: #495057;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: #e9ecef;
    border-radius: 4px;
    display: inline-block;
}

.qr-instructions {
    font-size: 0.85rem;
    color: #6c757d;
    margin: 0;
    font-style: italic;
}

/* AI Prediction Enhanced Styles */
.ai-prediction {
    margin: 1.5rem 0;
    animation: slideInUp 0.5s ease;
    border-radius: 8px;
    overflow: hidden;
}

.ai-prediction.success {
    background: linear-gradient(135deg, #d4edda, #c3e6cb);
    border: 1px solid #c3e6cb;
}

.ai-prediction.warning {
    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
    border: 1px solid #ffeaa7;
}

.ai-prediction.danger {
    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
    border: 1px solid #f5c6cb;
}

.prediction-card {
    padding: 1.5rem;
    text-align: center;
}

.prediction-card h4 {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.1rem;
}

.prediction-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 1rem;
    gap: 1rem;
}

.prediction-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    flex: 1;
}

.prediction-stat strong {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 0.25rem;
}

/* Enhanced Queue Cards */
.queue-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.queue-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.trend-indicator {
    font-size: 1.2rem;
}

/* Status Indicators */
.status-confirmed {
    color: #28a745;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
}

/* Enhanced Notifications */
.notification {
    animation: slideInRight 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 8px;
    backdrop-filter: blur(10px);
}

.notification-success {
    background: linear-gradient(135deg, rgba(40, 167, 69, 0.95), rgba(25, 135, 84, 0.95));
    color: white;
    border: none;
}

.notification-error {
    background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(176, 42, 55, 0.95));
    color: white;
    border: none;
}

.notification-warning {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 143, 0, 0.95));
    color: white;
    border: none;
}

.notification-info {
    background: linear-gradient(135deg, rgba(13, 110, 253, 0.95), rgba(10, 88, 202, 0.95));
    color: white;
    border: none;
}

/* Enhanced Alert Styles */
.alert {
    border-radius: 8px;
    margin-bottom: 1rem;
    animation: fadeInUp 0.5s ease;
}

.alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.alert-time {
    margin-left: auto;
    font-size: 0.8rem;
    opacity: 0.7;
}

.alert-meta {
    font-size: 0.85rem;
    color: #6c757d;
    margin-top: 0.5rem;
}

/* Loading Enhancements */
.loading-overlay {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(5px);
    border-radius: 8px;
}

.loading-spinner i {
    animation: spin 1s linear infinite;
}

/* Responsive Enhancements */
@media (max-width: 768px) {
    .enhanced-qr-image {
        max-width: 200px;
    }
    
    .prediction-stats {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .notification {
        margin: 0 1rem;
        min-width: auto;
    }
}

/* Animation Keyframes */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(100px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Accessibility Enhancements */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Focus Styles */
button:focus,
select:focus,
input:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
    .enhanced-qr-image {
        border: 3px solid #000;
    }
    
    .prediction-card {
        border: 2px solid #000;
    }
    
    .notification {
        border: 2px solid #000;
    }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Print Styles */
@media print {
    .notification-container,
    .loading-overlay {
        display: none !important;
    }
    
    .enhanced-qr-container {
        border: 2px solid #000;
        background: #fff;
    }
    
    .ai-prediction {
        border: 1px solid #000;
        background: #fff !important;
    }
}
`;

// Inject enhanced styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);

// Console welcome message
console.log(`
🚌 Enhanced Smart Queue Management System Loaded!
==========================================
Features:
✅ Enhanced QR Code Generation
✅ AI Queue Predictions
✅ Real-time Updates
✅ Interactive Notifications
✅ Mobile Responsive Design

Debug Commands:
- window.smartQueueApp.getSystemStatus()
- window.smartQueueApp.loadRoutes()
- window.smartQueueApp.searchBooking('booking-id')

API Base: ${window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api'}
==========================================
`);

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.smartQueueApp) {
        window.smartQueueApp.showNotification(
            'A system error occurred. Please refresh the page if issues persist.',
            'error'
        );
    }
});

// Online/Offline status handling
window.addEventListener('online', () => {
    if (window.smartQueueApp) {
        window.smartQueueApp.showNotification('Connection restored', 'success');
        // Restart real-time updates
        window.smartQueueApp.startRealTimeUpdates();
    }
});

window.addEventListener('offline', () => {
    if (window.smartQueueApp) {
        window.smartQueueApp.showNotification('Connection lost. Some features may be limited.', 'warning');
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartQueueApp;
}

// AMD support
if (typeof define === 'function' && define.amd) {
    define([], function() {
        return SmartQueueApp;
    });
}