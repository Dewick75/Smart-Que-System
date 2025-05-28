/**
 * Manager Dashboard Application - Complete JavaScript
 * Full analytics, reports, and management interface
 */

class ManagerDashboard {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.managerId = 1; // In real app, get from authentication
        this.currentSection = 'overview';
        this.charts = {};
        this.updateInterval = null;
        this.data = {
            overview: null,
            routes: [],
            alerts: [],
            analytics: null,
            bookings: []
        };
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        this.currentFilters = {
            status: 'all',
            date: 'all',
            search: ''
        };

        this.init();
    }

    async init() {
        console.log('Initializing Manager Dashboard...');

        // Setup event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadOverviewData();
        await this.loadRoutesData();

        // Initialize charts
        this.initializeCharts();

        // Start real-time updates
        this.startRealTimeUpdates();

        console.log('Manager Dashboard initialized successfully!');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Chart controls
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.target.dataset.metric;
                if (metric) {
                    this.updateRoutePerformanceChart(metric);
                }
            });
        });

        // Analytics filters
        const timeframeSelect = document.getElementById('analytics-timeframe');
        const routeSelect = document.getElementById('analytics-route');

        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => this.updateAnalytics());
        }

        if (routeSelect) {
            routeSelect.addEventListener('change', () => this.updateAnalytics());
        }

        // Report generation
        const generateReportBtn = document.getElementById('generate-report-btn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        // Route cards click handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.route-card')) {
                const routeCard = e.target.closest('.route-card');
                const routeId = routeCard.dataset.routeId;
                if (routeId) {
                    this.showRouteDetail(routeId);
                }
            }
        });

        // Alert cards click handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.manager-alert-card')) {
                const alertCard = e.target.closest('.manager-alert-card');
                const alertId = alertCard.dataset.alertId;
                if (alertId) {
                    this.showAlertDetail(alertId);
                }
            }
        });

        // Modal close handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Booking filters
        const statusFilter = document.getElementById('booking-status-filter');
        const dateFilter = document.getElementById('booking-date-filter');
        const searchInput = document.getElementById('booking-search');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentFilters.status = statusFilter.value;
                this.currentPage = 1;
                this.loadBookingsData();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.currentFilters.date = dateFilter.value;
                this.currentPage = 1;
                this.loadBookingsData();
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = searchInput.value;
                    this.currentPage = 1;
                    this.loadBookingsData();
                }, 500);
            });
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(s => {
            s.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = section;

        // Load section-specific data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'overview':
                await this.loadOverviewData();
                break;
            case 'bookings':
                await this.loadBookingsData();
                break;
            case 'routes':
                await this.loadRoutesData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'alerts':
                await this.loadManagerAlerts();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
        }
    }

    async loadOverviewData() {
        try {
            const response = await fetch(`${this.API_BASE}/manager/overview?manager_id=${this.managerId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.data.overview = data;

            this.updateKPICards(data.overview);
            this.updateSystemHealth(data.system_health);
            this.updateLastUpdated();

            console.log('Overview data loaded:', data);

        } catch (error) {
            console.error('Error loading overview data:', error);
            // Use fallback data for demo
            this.loadFallbackOverviewData();
        }
    }

    loadFallbackOverviewData() {
        const fallbackData = {
            overview: {
                total_revenue: 45678.90,
                total_bookings: 1234,
                average_occupancy: 78.5,
                active_buses: 12
            },
            system_health: {
                operational_buses: 10,
                delayed_buses: 1,
                maintenance_buses: 1,
                active_alerts: 3
            }
        };

        this.data.overview = fallbackData;
        this.updateKPICards(fallbackData.overview);
        this.updateSystemHealth(fallbackData.system_health);
        this.updateLastUpdated();
    }

    updateKPICards(data) {
        // Update revenue with animation
        this.animateValue('total-revenue', 0, data.total_revenue, 2000, (value) => {
            return `$${value.toLocaleString()}`;
        });

        // Update bookings
        this.animateValue('total-bookings', 0, data.total_bookings, 1500, (value) => {
            return value.toLocaleString();
        });

        // Update occupancy
        this.animateValue('avg-occupancy', 0, Math.round(data.average_occupancy), 1800, (value) => {
            return `${value}%`;
        });

        // Update buses
        this.animateValue('active-buses', 0, data.active_buses, 1200, (value) => {
            return value.toString();
        });
    }

    animateValue(elementId, start, end, duration, formatter = null) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const range = end - start;

        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (range * easeOutCubic);

            const displayValue = formatter ? formatter(Math.round(currentValue)) : Math.round(currentValue);
            element.textContent = displayValue;

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };

        requestAnimationFrame(updateValue);
    }

    updateSystemHealth(data) {
        const healthElements = {
            'operational-buses': data.operational_buses || 0,
            'delayed-buses': data.delayed_buses || 0,
            'maintenance-buses': data.maintenance_buses || 0,
            'system-alerts': data.active_alerts || 0
        };

        Object.entries(healthElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(id, 0, value, 1000);
            }
        });
    }

    updateLastUpdated() {
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date().toLocaleString();
        }
    }

    async loadRoutesData() {
        try {
            const response = await fetch(`${this.API_BASE}/routes`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const routes = await response.json();
            this.data.routes = routes;

            this.updateRoutesGrid(routes);
            this.populateAnalyticsRouteFilter(routes);

            console.log('Routes data loaded:', routes.length);

        } catch (error) {
            console.error('Error loading routes data:', error);
            this.loadFallbackRoutesData();
        }
    }

    loadFallbackRoutesData() {
        const fallbackRoutes = [
            {
                id: 1,
                name: 'Downtown Express',
                start_point: 'Central Station',
                end_point: 'Business District',
                price: 5.50,
                frequency: 10,
                stops: [{id: 1, name: 'Central Station'}, {id: 2, name: 'Marina Bay'}]
            },
            {
                id: 2,
                name: 'Airport Shuttle',
                start_point: 'City Center',
                end_point: 'Changi Airport',
                price: 8.00,
                frequency: 15,
                stops: [{id: 3, name: 'City Center'}, {id: 4, name: 'Airport'}]
            },
            {
                id: 3,
                name: 'University Line',
                start_point: 'North Campus',
                end_point: 'South Campus',
                price: 3.00,
                frequency: 8,
                stops: [{id: 5, name: 'North Campus'}, {id: 6, name: 'South Campus'}]
            }
        ];

        this.data.routes = fallbackRoutes;
        this.updateRoutesGrid(fallbackRoutes);
        this.populateAnalyticsRouteFilter(fallbackRoutes);
    }

    updateRoutesGrid(routes) {
        const routesGrid = document.getElementById('routes-grid');
        if (!routesGrid) return;

        routesGrid.innerHTML = routes.map(route => this.createRouteCard(route)).join('');
    }

    createRouteCard(route) {
        // Generate mock performance data
        const mockBookings = Math.floor(Math.random() * 200) + 50;
        const mockRevenue = mockBookings * route.price;
        const mockOccupancy = Math.floor(Math.random() * 40) + 60;
        const mockRating = (Math.random() * 1.5 + 3.5).toFixed(1);

        return `
            <div class="route-card" data-route-id="${route.id}">
                <div class="route-card-header">
                    <h3>${route.name}</h3>
                    <p>${route.start_point} → ${route.end_point}</p>
                </div>
                <div class="route-card-content">
                    <div class="route-metrics">
                        <div class="route-metric">
                            <div class="route-metric-value">${mockBookings}</div>
                            <div class="route-metric-label">Bookings</div>
                        </div>
                        <div class="route-metric">
                            <div class="route-metric-value">$${mockRevenue.toFixed(0)}</div>
                            <div class="route-metric-label">Revenue</div>
                        </div>
                        <div class="route-metric">
                            <div class="route-metric-value">${mockOccupancy}%</div>
                            <div class="route-metric-label">Occupancy</div>
                        </div>
                        <div class="route-metric">
                            <div class="route-metric-value">${mockRating}</div>
                            <div class="route-metric-label">Rating</div>
                        </div>
                    </div>
                    <div class="route-details">
                        <p><strong>Price:</strong> $${route.price}</p>
                        <p><strong>Frequency:</strong> Every ${route.frequency} min</p>
                        <p><strong>Stops:</strong> ${route.stops ? route.stops.length : 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    populateAnalyticsRouteFilter(routes) {
        const routeSelect = document.getElementById('analytics-route');
        if (!routeSelect) return;

        routeSelect.innerHTML = '<option value="all">All Routes</option>';
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            routeSelect.appendChild(option);
        });
    }

    async loadManagerAlerts() {
        try {
            const response = await fetch(`${this.API_BASE}/manager/alerts`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const alerts = await response.json();
            this.data.alerts = alerts;

            this.updateManagerAlerts(alerts);

            console.log('Manager alerts loaded:', alerts.length);

        } catch (error) {
            console.error('Error loading manager alerts:', error);
            this.loadFallbackManagerAlerts();
        }
    }

    loadFallbackManagerAlerts() {
        const fallbackAlerts = [
            {
                id: 1,
                title: 'Route Optimization Opportunity',
                message: 'Downtown Express route shows potential for capacity increase during peak hours.',
                severity: 'medium',
                priority: 3,
                route_name: 'Downtown Express',
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                title: 'Revenue Target Achievement',
                message: 'Monthly revenue target exceeded by 15%. Consider expanding service.',
                severity: 'high',
                priority: 4,
                created_at: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: 3,
                title: 'Maintenance Schedule Review',
                message: 'Multiple buses due for maintenance next week. Plan service adjustments.',
                severity: 'medium',
                priority: 2,
                created_at: new Date(Date.now() - 10800000).toISOString()
            }
        ];

        this.data.alerts = fallbackAlerts;
        this.updateManagerAlerts(fallbackAlerts);
    }

    updateManagerAlerts(alerts) {
        const container = document.getElementById('manager-alerts-container');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">No manager alerts at this time</div>';
            return;
        }

        container.innerHTML = alerts.map(alert => this.createManagerAlertCard(alert)).join('');

        // Update alert counts
        this.updateAlertSummary(alerts);
    }

    createManagerAlertCard(alert) {
        return `
            <div class="manager-alert-card ${alert.severity}" data-alert-id="${alert.id}">
                <div class="alert-header">
                    <h4>${alert.title}</h4>
                    <span class="alert-priority ${alert.severity}">${alert.severity.toUpperCase()}</span>
                </div>
                <p>${alert.message}</p>
                <div class="alert-meta">
                    ${alert.route_name ? `Route: ${alert.route_name}` : ''}
                    <span class="alert-time">${this.formatTimeAgo(new Date(alert.created_at))}</span>
                </div>
            </div>
        `;
    }

    updateAlertSummary(alerts) {
        const criticalCount = alerts.filter(a => a.severity === 'critical').length;
        const highCount = alerts.filter(a => a.severity === 'high').length;
        const mediumCount = alerts.filter(a => a.severity === 'medium').length;

        const criticalEl = document.getElementById('critical-alerts');
        const highEl = document.getElementById('high-alerts');
        const mediumEl = document.getElementById('medium-alerts');

        if (criticalEl) criticalEl.textContent = criticalCount;
        if (highEl) highEl.textContent = highCount;
        if (mediumEl) mediumEl.textContent = mediumCount;
    }

    async loadAnalyticsData() {
        try {
            // Load analytics data from various endpoints
            await this.updateQueueAnalytics();
            await this.updatePeakHoursAnalysis();
            await this.updateRouteEfficiency();

            console.log('Analytics data loaded');

        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.loadFallbackAnalyticsData();
        }
    }

    loadFallbackAnalyticsData() {
        // Generate fallback analytics data
        this.updateQueueAnalytics();
        this.updatePeakHoursAnalysis();
        this.updateRouteEfficiency();
    }

    updateQueueAnalytics() {
        const queueChart = document.getElementById('queue-analytics-chart');
        if (!queueChart) return;

        // Destroy existing chart if it exists
        if (this.charts.queueAnalytics) {
            this.charts.queueAnalytics.destroy();
        }

        this.charts.queueAnalytics = new Chart(queueChart, {
            type: 'line',
            data: {
                labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
                datasets: [{
                    label: 'Average Queue Length',
                    data: [2, 8, 4, 6, 3, 5, 12, 7],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Queue Length'
                        }
                    }
                }
            }
        });
    }

    updatePeakHoursAnalysis() {
        const peakChart = document.getElementById('peak-hours-chart');
        if (!peakChart) return;

        // Destroy existing chart if it exists
        if (this.charts.peakHours) {
            this.charts.peakHours.destroy();
        }

        this.charts.peakHours = new Chart(peakChart, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Peak Hour Bookings',
                    data: [45, 52, 48, 61, 55, 38, 42],
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Bookings'
                        }
                    }
                }
            }
        });
    }

    updateRouteEfficiency() {
        const efficiencyList = document.getElementById('route-efficiency-list');
        if (!efficiencyList) return;

        const efficiencyData = [
            { name: 'Downtown Express', score: 92 },
            { name: 'University Line', score: 88 },
            { name: 'Airport Shuttle', score: 85 }
        ];

        efficiencyList.innerHTML = efficiencyData.map(item => `
            <div class="route-efficiency-item">
                <span class="efficiency-name">${item.name}</span>
                <span class="efficiency-score">${item.score}%</span>
            </div>
        `).join('');
    }

    async loadReportsData() {
        try {
            // Load report data
            const dailyTrips = Math.floor(Math.random() * 50) + 80;
            const dailyPassengers = Math.floor(Math.random() * 500) + 800;
            const dailyRevenue = Math.floor(Math.random() * 2000) + 3000;

            // Update report cards
            const dailyTripsEl = document.getElementById('daily-trips');
            const dailyPassengersEl = document.getElementById('daily-passengers');
            const dailyRevenueEl = document.getElementById('daily-revenue');

            if (dailyTripsEl) dailyTripsEl.textContent = dailyTrips;
            if (dailyPassengersEl) dailyPassengersEl.textContent = dailyPassengers.toLocaleString();
            if (dailyRevenueEl) dailyRevenueEl.textContent = `$${dailyRevenue.toLocaleString()}`;

            console.log('Reports data loaded');

        } catch (error) {
            console.error('Error loading reports data:', error);
        }
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Daily Revenue',
                        data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Route Performance Chart
        const routeCtx = document.getElementById('route-performance-chart');
        if (routeCtx) {
            this.charts.routePerformance = new Chart(routeCtx, {
                type: 'bar',
                data: {
                    labels: ['Downtown Express', 'Airport Shuttle', 'University Line'],
                    datasets: [{
                        label: 'Bookings',
                        data: [165, 145, 128],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    updateRoutePerformanceChart(metric) {
        if (!this.charts.routePerformance) return;

        // Update chart buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-metric="${metric}"]`).classList.add('active');

        // Update chart data based on metric
        let newData, newLabel;

        switch (metric) {
            case 'bookings':
                newData = [165, 145, 128];
                newLabel = 'Bookings';
                break;
            case 'revenue':
                newData = [1825, 1160, 384];
                newLabel = 'Revenue ($)';
                break;
            default:
                return;
        }

        this.charts.routePerformance.data.datasets[0].data = newData;
        this.charts.routePerformance.data.datasets[0].label = newLabel;
        this.charts.routePerformance.update();
    }

    showRouteDetail(routeId) {
        const route = this.data.routes.find(r => r.id == routeId);
        if (!route) return;

        const modal = document.getElementById('route-detail-modal');
        const content = document.getElementById('route-detail-content');

        if (!modal || !content) return;

        content.innerHTML = `
            <div class="route-detail-header">
                <h3>${route.name}</h3>
                <p>${route.start_point} → ${route.end_point}</p>
            </div>
            <div class="route-detail-metrics">
                <div class="detail-metric">
                    <h4>Performance Metrics</h4>
                    <p>Detailed analytics for ${route.name} route</p>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    showAlertDetail(alertId) {
        const alert = this.data.alerts.find(a => a.id == alertId);
        if (!alert) return;

        console.log('Showing alert detail for:', alert);
        // Implement alert detail modal
    }

    generateReport() {
        console.log('Generating comprehensive report...');
        // Implement report generation
        alert('Report generation feature - Would integrate with backend to generate PDF/Excel reports');
    }

    updateAnalytics() {
        const timeframe = document.getElementById('analytics-timeframe')?.value;
        const route = document.getElementById('analytics-route')?.value;

        console.log(`Updating analytics for timeframe: ${timeframe}, route: ${route}`);

        // Reload analytics data with new filters
        this.loadAnalyticsData();
    }

    startRealTimeUpdates() {
        // Update data every 2 minutes
        this.updateInterval = setInterval(() => {
            if (this.currentSection === 'overview') {
                this.loadOverviewData();
            }

            // Update alerts regardless of current section
            this.loadManagerAlerts();

        }, 120000); // 2 minutes

        console.log('Real-time updates started for Manager Dashboard');
    }

    formatTimeAgo(date) {
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

    // Public methods for debugging
    getSystemStatus() {
        return {
            currentSection: this.currentSection,
            dataLoaded: {
                overview: !!this.data.overview,
                routes: this.data.routes.length,
                alerts: this.data.alerts.length
            },
            chartsInitialized: Object.keys(this.charts).length,
            realTimeUpdatesActive: !!this.updateInterval
        };
    }

    refreshAllData() {
        console.log('Refreshing all dashboard data...');
        this.loadOverviewData();
        this.loadRoutesData();
        this.loadManagerAlerts();
        this.loadAnalyticsData();
        this.loadReportsData();
        this.loadBookingsData();
    }

    // ==================== BOOKING MANAGEMENT ====================

    async loadBookingsData() {
        try {
            this.showBookingsLoading(true);

            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.itemsPerPage,
                status: this.currentFilters.status,
                date: this.currentFilters.date
            });

            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
            }

            const response = await fetch(`${this.API_BASE}/manager/bookings?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.data.bookings = data.bookings;
            this.totalPages = data.pagination.pages;

            this.updateBookingsTable(data.bookings);
            this.updateBookingSummary(data.summary);
            this.updatePagination(data.pagination);

            console.log('Bookings data loaded:', data.bookings.length);

        } catch (error) {
            console.error('Error loading bookings data:', error);
            this.loadFallbackBookingsData();
        } finally {
            this.showBookingsLoading(false);
        }
    }

    loadFallbackBookingsData() {
        const fallbackBookings = [
            {
                id: 1,
                booking_id: 'BK001234',
                passenger_name: 'John Smith',
                passenger_email: 'john.smith@email.com',
                passenger_phone: '+1-555-0123',
                seat_number: 15,
                booking_time: new Date(Date.now() - 3600000).toISOString(),
                travel_date: new Date(Date.now() + 86400000).toISOString(),
                status: 'confirmed',
                qr_code: 'QR_BK001234',
                bus_info: { bus_number: 'BUS-001' },
                route_info: { name: 'Downtown Express', price: 5.50 },
                pickup_stop: 'Central Station',
                dropoff_stop: 'Business District'
            },
            {
                id: 2,
                booking_id: 'BK001235',
                passenger_name: 'Sarah Johnson',
                passenger_email: 'sarah.j@email.com',
                passenger_phone: '+1-555-0124',
                seat_number: 8,
                booking_time: new Date(Date.now() - 7200000).toISOString(),
                travel_date: new Date(Date.now() + 43200000).toISOString(),
                status: 'boarded',
                qr_code: 'QR_BK001235',
                bus_info: { bus_number: 'BUS-002' },
                route_info: { name: 'Airport Shuttle', price: 8.00 },
                pickup_stop: 'City Center',
                dropoff_stop: 'Changi Airport'
            }
        ];

        const fallbackSummary = {
            total_bookings: 156,
            confirmed_bookings: 89,
            boarded_bookings: 45,
            cancelled_bookings: 12,
            today_bookings: 23
        };

        this.data.bookings = fallbackBookings;
        this.updateBookingsTable(fallbackBookings);
        this.updateBookingSummary(fallbackSummary);
        this.updatePagination({ page: 1, pages: 1, total: fallbackBookings.length });
    }

    updateBookingsTable(bookings) {
        const tbody = document.getElementById('bookings-table-body');
        const noBookings = document.getElementById('no-bookings');

        if (!tbody) return;

        if (bookings.length === 0) {
            tbody.innerHTML = '';
            if (noBookings) noBookings.style.display = 'block';
            return;
        }

        if (noBookings) noBookings.style.display = 'none';

        tbody.innerHTML = bookings.map(booking => this.createBookingRow(booking)).join('');
    }

    createBookingRow(booking) {
        const statusClass = this.getStatusClass(booking.status);
        const statusIcon = this.getStatusIcon(booking.status);

        return `
            <tr>
                <td>
                    <div class="booking-id">
                        <span class="id-text">${booking.booking_id}</span>
                        <small class="qr-code">${booking.qr_code}</small>
                    </div>
                </td>
                <td>
                    <div class="passenger-info">
                        <div class="passenger-name">${booking.passenger_name}</div>
                        <small class="passenger-email">${booking.passenger_email}</small>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <span class="phone">${booking.passenger_phone}</span>
                    </div>
                </td>
                <td>
                    <div class="route-info">
                        <div class="route-name">${booking.route_info.name}</div>
                        <small class="route-price">$${booking.route_info.price}</small>
                    </div>
                </td>
                <td>
                    <span class="bus-number">${booking.bus_info.bus_number}</span>
                </td>
                <td>
                    <span class="seat-number">${booking.seat_number}</span>
                </td>
                <td>
                    <div class="travel-date">
                        ${new Date(booking.travel_date).toLocaleDateString()}
                        <small>${new Date(booking.travel_date).toLocaleTimeString()}</small>
                    </div>
                </td>
                <td>
                    <span class="booking-status ${statusClass}">
                        ${statusIcon} ${booking.status.toUpperCase()}
                    </span>
                </td>
                <td>
                    <div class="booking-actions">
                        <button class="btn-action view" onclick="managerApp.viewBookingDetail('${booking.booking_id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${booking.status === 'confirmed' ? `
                            <button class="btn-action cancel" onclick="managerApp.cancelBooking('${booking.booking_id}')" title="Cancel Booking">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusClass(status) {
        const statusClasses = {
            'confirmed': 'status-confirmed',
            'boarded': 'status-boarded',
            'cancelled': 'status-cancelled',
            'pending': 'status-pending'
        };
        return statusClasses[status] || 'status-unknown';
    }

    getStatusIcon(status) {
        const statusIcons = {
            'confirmed': '✅',
            'boarded': '🚌',
            'cancelled': '❌',
            'pending': '⏳'
        };
        return statusIcons[status] || '❓';
    }

    updateBookingSummary(summary) {
        const elements = {
            'total-bookings-count': summary.total_bookings,
            'confirmed-bookings-count': summary.confirmed_bookings,
            'boarded-bookings-count': summary.boarded_bookings,
            'today-bookings-count': summary.today_bookings
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 0;
            }
        });
    }

    updatePagination(pagination) {
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (pageInfo) {
            pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = !pagination.has_prev;
        }

        if (nextBtn) {
            nextBtn.disabled = !pagination.has_next;
        }
    }

    showBookingsLoading(show) {
        const loading = document.getElementById('bookings-loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    async viewBookingDetail(bookingId) {
        try {
            const response = await fetch(`${this.API_BASE}/manager/booking/${bookingId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.showBookingDetailModal(data);

        } catch (error) {
            console.error('Error loading booking details:', error);
            alert('Error loading booking details. Please try again.');
        }
    }

    showBookingDetailModal(data) {
        const modal = document.getElementById('booking-detail-modal');
        const content = document.getElementById('booking-detail-content');

        if (!modal || !content) return;

        const booking = data.booking;
        const busInfo = data.bus_info;
        const routeInfo = data.route_info;
        const stopsInfo = data.stops_info;

        content.innerHTML = `
            <div class="booking-detail-grid">
                <div class="detail-section">
                    <h3><i class="fas fa-user"></i> Passenger Information</h3>
                    <div class="detail-items">
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>${booking.passenger_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${booking.passenger_email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${booking.passenger_phone}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-ticket-alt"></i> Booking Information</h3>
                    <div class="detail-items">
                        <div class="detail-item">
                            <label>Booking ID:</label>
                            <span>${booking.booking_id}</span>
                        </div>
                        <div class="detail-item">
                            <label>QR Code:</label>
                            <span>${booking.qr_code}</span>
                        </div>
                        <div class="detail-item">
                            <label>Seat Number:</label>
                            <span>${booking.seat_number}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="booking-status ${this.getStatusClass(booking.status)}">
                                ${this.getStatusIcon(booking.status)} ${booking.status.toUpperCase()}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Booking Time:</label>
                            <span>${new Date(booking.booking_time).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Travel Date:</label>
                            <span>${new Date(booking.travel_date).toLocaleString()}</span>
                        </div>
                        ${booking.boarding_time ? `
                        <div class="detail-item">
                            <label>Boarding Time:</label>
                            <span>${new Date(booking.boarding_time).toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-route"></i> Journey Information</h3>
                    <div class="detail-items">
                        <div class="detail-item">
                            <label>Route:</label>
                            <span>${routeInfo.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>From:</label>
                            <span>${stopsInfo.pickup_stop.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>To:</label>
                            <span>${stopsInfo.dropoff_stop.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Price:</label>
                            <span>$${routeInfo.price}</span>
                        </div>
                        <div class="detail-item">
                            <label>Duration:</label>
                            <span>${routeInfo.duration} minutes</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-bus"></i> Bus Information</h3>
                    <div class="detail-items">
                        <div class="detail-item">
                            <label>Bus Number:</label>
                            <span>${busInfo.bus_number}</span>
                        </div>
                        <div class="detail-item">
                            <label>Capacity:</label>
                            <span>${busInfo.capacity} seats</span>
                        </div>
                        <div class="detail-item">
                            <label>Driver:</label>
                            <span>${busInfo.driver_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Current Location:</label>
                            <span>${busInfo.current_location}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${data.staff_actions && data.staff_actions.length > 0 ? `
            <div class="detail-section">
                <h3><i class="fas fa-history"></i> Staff Actions</h3>
                <div class="staff-actions-list">
                    ${data.staff_actions.map(action => `
                        <div class="staff-action-item">
                            <div class="action-type">${action.action_type.replace('_', ' ').toUpperCase()}</div>
                            <div class="action-time">${new Date(action.timestamp).toLocaleString()}</div>
                            <div class="action-staff">Staff ID: ${action.staff_id}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;

        modal.style.display = 'block';
    }

    closeBookingDetail() {
        const modal = document.getElementById('booking-detail-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/manager/booking/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    manager_id: this.managerId,
                    reason: 'Cancelled by manager'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Booking cancelled successfully');
            this.loadBookingsData(); // Refresh the table

        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking. Please try again.');
        }
    }

    refreshBookings() {
        this.loadBookingsData();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadBookingsData();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadBookingsData();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded! Please include Chart.js before this script.');
        return;
    }

    window.managerApp = new ManagerDashboard();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.managerApp && window.managerApp.updateInterval) {
        clearInterval(window.managerApp.updateInterval);
    }
});

// Expose for debugging
window.ManagerDashboard = ManagerDashboard;