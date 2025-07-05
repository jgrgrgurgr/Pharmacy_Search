// Dashboard functionality

class Dashboard {
    constructor() {
        this.app = window.PharmacyApp;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
    }

    setupEventListeners() {
        const timeFilter = document.getElementById('timeFilter');
        const regionFilter = document.getElementById('regionFilter');

        if (timeFilter) {
            timeFilter.addEventListener('change', () => this.loadDashboardData());
        }

        if (regionFilter) {
            regionFilter.addEventListener('change', () => this.loadDashboardData());
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadQualityChart(),
                this.loadRecentFeedback(),
                this.loadLowStockAlerts(),
                this.loadTopPharmacies()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadQualityChart() {
        try {
            const response = await this.app.apiRequest('/pharmacies');
            if (response.ok) {
                const pharmacies = await response.json();
                this.renderQualityChart(pharmacies);
            }
        } catch (error) {
            console.error('Error loading quality chart:', error);
        }
    }

    renderQualityChart(pharmacies) {
        const ctx = document.getElementById('qualityChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.quality) {
            this.charts.quality.destroy();
        }

        // Group pharmacies by quality score ranges
        const scoreRanges = {
            'Excellent (4.5-5.0)': 0,
            'Good (3.5-4.4)': 0,
            'Average (2.5-3.4)': 0,
            'Poor (0-2.4)': 0
        };

        pharmacies.forEach(pharmacy => {
            const score = pharmacy.quality_score;
            if (score >= 4.5) scoreRanges['Excellent (4.5-5.0)']++;
            else if (score >= 3.5) scoreRanges['Good (3.5-4.4)']++;
            else if (score >= 2.5) scoreRanges['Average (2.5-3.4)']++;
            else scoreRanges['Poor (0-2.4)']++;
        });

        this.charts.quality = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(scoreRanges),
                datasets: [{
                    data: Object.values(scoreRanges),
                    backgroundColor: [
                        '#28a745',
                        '#17a2b8',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadRecentFeedback() {
        try {
            const response = await this.app.apiRequest('/feedback?limit=5');
            if (response.ok) {
                const feedback = await response.json();
                this.renderRecentFeedback(feedback);
            }
        } catch (error) {
            console.error('Error loading recent feedback:', error);
        }
    }

    renderRecentFeedback(feedback) {
        const container = document.getElementById('recentFeedback');
        if (!container) return;

        if (feedback.length === 0) {
            container.innerHTML = '<p>No recent feedback available.</p>';
            return;
        }

        container.innerHTML = feedback.map(item => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <strong>${item.customer_name}</strong>
                    <div class="rating">
                        ${this.app.createStarRating(item.rating).map(star => star.outerHTML).join('')}
                    </div>
                </div>
                <p class="feedback-type">${item.feedback_type.replace('_', ' ').toUpperCase()}</p>
                <p class="feedback-comment">${item.comments || 'No comments provided'}</p>
                <small class="feedback-date">${this.app.formatDateTime(item.created_at)}</small>
            </div>
        `).join('');
    }

    async loadLowStockAlerts() {
        try {
            const response = await this.app.apiRequest('/inventory?low_stock=true&limit=10');
            if (response.ok) {
                const inventory = await response.json();
                this.renderLowStockAlerts(inventory);
            }
        } catch (error) {
            console.error('Error loading low stock alerts:', error);
        }
    }

    renderLowStockAlerts(inventory) {
        const container = document.getElementById('lowStockAlerts');
        if (!container) return;

        if (inventory.length === 0) {
            container.innerHTML = '<p>No low stock alerts.</p>';
            return;
        }

        container.innerHTML = inventory.map(item => `
            <div class="alert-item">
                <div class="alert-header">
                    <strong>Medicine ID: ${item.medicine_id}</strong>
                    <span class="status-badge status-low-stock">Low Stock</span>
                </div>
                <p>Pharmacy ID: ${item.pharmacy_id}</p>
                <p>Current Stock: ${item.quantity} (Reorder Level: ${item.reorder_level})</p>
                <small>Batch: ${item.batch_number}</small>
            </div>
        `).join('');
    }

    async loadTopPharmacies() {
        try {
            const response = await this.app.apiRequest('/pharmacies');
            if (response.ok) {
                const pharmacies = await response.json();
                // Sort by quality score and take top 5
                const topPharmacies = pharmacies
                    .sort((a, b) => b.quality_score - a.quality_score)
                    .slice(0, 5);
                this.renderTopPharmacies(topPharmacies);
            }
        } catch (error) {
            console.error('Error loading top pharmacies:', error);
        }
    }

    renderTopPharmacies(pharmacies) {
        const container = document.getElementById('topPharmacies');
        if (!container) return;

        if (pharmacies.length === 0) {
            container.innerHTML = '<p>No pharmacy data available.</p>';
            return;
        }

        container.innerHTML = pharmacies.map((pharmacy, index) => `
            <div class="pharmacy-item">
                <div class="pharmacy-rank">#${index + 1}</div>
                <div class="pharmacy-info">
                    <strong>${pharmacy.name}</strong>
                    <p>${pharmacy.city}, ${pharmacy.state}</p>
                    <div class="quality-score ${this.app.getQualityScoreClass(pharmacy.quality_score)}">
                        ${pharmacy.quality_score.toFixed(1)} - ${this.app.getQualityScoreText(pharmacy.quality_score)}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});