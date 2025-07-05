// Feedback page functionality

class FeedbackPage {
    constructor() {
        this.app = window.PharmacyApp;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFeedback();
        this.loadPharmacies();
    }

    setupEventListeners() {
        // Add feedback button
        const addBtn = document.getElementById('addFeedbackBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddFeedbackModal());
        }

        // Filter controls
        const pharmacyFilter = document.getElementById('feedbackPharmacyFilter');
        const typeFilter = document.getElementById('feedbackTypeFilter');
        const ratingFilter = document.getElementById('ratingFilter');

        if (pharmacyFilter) {
            pharmacyFilter.addEventListener('change', () => this.loadFeedback());
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.loadFeedback());
        }

        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => this.loadFeedback());
        }

        // Feedback form
        const feedbackForm = document.getElementById('feedbackForm');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFeedbackSubmit();
            });
        }

        // Rating slider
        const ratingSlider = document.getElementById('rating');
        const ratingValue = document.getElementById('ratingValue');
        if (ratingSlider && ratingValue) {
            ratingSlider.addEventListener('input', (e) => {
                ratingValue.textContent = e.target.value;
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelFeedbackBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeFeedbackModal();
            });
        }
    }

    async loadFeedback() {
        const container = document.getElementById('feedbackGrid');
        if (!container) return;

        this.app.showLoading(container);

        try {
            const params = new URLSearchParams();
            
            const pharmacyFilter = document.getElementById('feedbackPharmacyFilter');
            if (pharmacyFilter && pharmacyFilter.value) {
                params.append('pharmacy_id', pharmacyFilter.value);
            }

            const response = await this.app.apiRequest(`/feedback?${params}`);
            if (response.ok) {
                const feedback = await response.json();
                this.renderFeedback(this.filterFeedback(feedback));
            } else {
                container.innerHTML = '<p>Error loading feedback.</p>';
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
            container.innerHTML = '<p>Error loading feedback.</p>';
        }
    }

    filterFeedback(feedback) {
        let filtered = feedback;

        const typeFilter = document.getElementById('feedbackTypeFilter');
        const ratingFilter = document.getElementById('ratingFilter');

        if (typeFilter && typeFilter.value) {
            filtered = filtered.filter(item => item.feedback_type === typeFilter.value);
        }

        if (ratingFilter && ratingFilter.value) {
            const targetRating = parseInt(ratingFilter.value);
            filtered = filtered.filter(item => Math.floor(item.rating) === targetRating);
        }

        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return filtered;
    }

    renderFeedback(feedback) {
        const container = document.getElementById('feedbackGrid');
        if (!container) return;

        if (feedback.length === 0) {
            container.innerHTML = '<p>No feedback found.</p>';
            return;
        }

        container.innerHTML = feedback.map(item => `
            <div class="feedback-card">
                <div class="feedback-header">
                    <div class="customer-info">
                        <h3>${item.customer_name}</h3>
                        <p>${item.customer_email}</p>
                    </div>
                    <div class="rating">
                        ${this.app.createStarRating(item.rating).map(star => star.outerHTML).join('')}
                        <span class="rating-value">${item.rating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="feedback-content">
                    <div class="feedback-type">
                        <span class="type-badge">${this.formatFeedbackType(item.feedback_type)}</span>
                    </div>
                    <p class="feedback-pharmacy">Pharmacy ID: ${item.pharmacy_id}</p>
                    ${item.comments ? `<p class="feedback-comments">"${item.comments}"</p>` : ''}
                    <small class="feedback-date">${this.app.formatDateTime(item.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    formatFeedbackType(type) {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async loadPharmacies() {
        try {
            const response = await this.app.apiRequest('/pharmacies');
            if (response.ok) {
                const pharmacies = await response.json();
                this.populatePharmacySelects(pharmacies);
            }
        } catch (error) {
            console.error('Error loading pharmacies:', error);
        }
    }

    populatePharmacySelects(pharmacies) {
        const selects = ['feedbackPharmacyFilter', 'feedbackPharmacy'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const isFilter = selectId === 'feedbackPharmacyFilter';
                select.innerHTML = (isFilter ? '<option value="">All Pharmacies</option>' : '<option value="">Select Pharmacy</option>') +
                    pharmacies.map(pharmacy => 
                        `<option value="${pharmacy.id}">${pharmacy.name} - ${pharmacy.city}</option>`
                    ).join('');
            }
        });
    }

    showAddFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        const form = document.getElementById('feedbackForm');

        if (form) {
            this.app.resetForm(form);
            // Reset rating slider
            const ratingSlider = document.getElementById('rating');
            const ratingValue = document.getElementById('ratingValue');
            if (ratingSlider && ratingValue) {
                ratingSlider.value = 5;
                ratingValue.textContent = '5';
            }
        }

        this.app.showModal('feedbackModal');
    }

    async handleFeedbackSubmit() {
        const form = document.getElementById('feedbackForm');
        if (!form || !this.app.validateForm(form)) {
            this.app.showAlert('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const feedbackData = Object.fromEntries(formData.entries());

        // Convert numeric fields
        feedbackData.pharmacy_id = parseInt(feedbackData.pharmacy_id);
        feedbackData.rating = parseFloat(feedbackData.rating);

        try {
            const response = await this.app.apiRequest('/feedback', {
                method: 'POST',
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                this.closeFeedbackModal();
                this.loadFeedback();
                this.app.showAlert('Feedback submitted successfully', 'success');
            } else {
                const error = await response.json();
                this.app.showAlert(error.detail || 'Error submitting feedback', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.app.showAlert('Network error. Please try again.', 'error');
        }
    }

    closeFeedbackModal() {
        this.app.closeModal(document.getElementById('feedbackModal'));
    }
}

// Initialize when DOM is loaded
let feedbackPage;
document.addEventListener('DOMContentLoaded', () => {
    feedbackPage = new FeedbackPage();
});