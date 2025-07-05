// Home page specific functionality

class HomePage {
    constructor() {
        this.app = window.PharmacyApp;
        this.init();
    }

    init() {
        this.loadStats();
    }

    async loadStats() {
        try {
            // Load pharmacy stats
            const pharmaciesResponse = await this.app.apiRequest('/pharmacies?limit=1000');
            if (pharmaciesResponse.ok) {
                const pharmacies = await pharmaciesResponse.json();
                this.updatePharmacyStats(pharmacies);
            }

            // Load feedback stats
            const feedbackResponse = await this.app.apiRequest('/feedback?limit=1000');
            if (feedbackResponse.ok) {
                const feedback = await feedbackResponse.json();
                this.updateFeedbackStats(feedback);
            }

            // Load inventory stats
            const inventoryResponse = await this.app.apiRequest('/inventory?limit=1000');
            if (inventoryResponse.ok) {
                const inventory = await inventoryResponse.json();
                this.updateInventoryStats(inventory);
            }

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updatePharmacyStats(pharmacies) {
        const totalPharmaciesEl = document.getElementById('totalPharmacies');
        const avgQualityScoreEl = document.getElementById('avgQualityScore');

        if (totalPharmaciesEl) {
            totalPharmaciesEl.textContent = pharmacies.length;
        }

        if (avgQualityScoreEl && pharmacies.length > 0) {
            const avgScore = pharmacies.reduce((sum, pharmacy) => sum + pharmacy.quality_score, 0) / pharmacies.length;
            avgQualityScoreEl.textContent = avgScore.toFixed(1);
        }
    }

    updateFeedbackStats(feedback) {
        const totalFeedbackEl = document.getElementById('totalFeedback');
        
        if (totalFeedbackEl) {
            totalFeedbackEl.textContent = feedback.length;
        }
    }

    updateInventoryStats(inventory) {
        const activeInventoryEl = document.getElementById('activeInventory');
        
        if (activeInventoryEl) {
            activeInventoryEl.textContent = inventory.length;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});