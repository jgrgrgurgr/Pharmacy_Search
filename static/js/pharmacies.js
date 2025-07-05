// Pharmacies page functionality

class PharmaciesPage {
    constructor() {
        this.app = window.PharmacyApp;
        this.currentPage = 1;
        this.pageSize = 12;
        this.filters = {
            search: '',
            city: '',
            state: '',
            sortBy: 'name'
        };
        this.editingPharmacy = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPharmacies();
        this.loadFilterOptions();
    }

    setupEventListeners() {
        // Add pharmacy button
        const addBtn = document.getElementById('addPharmacyBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddPharmacyModal());
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounceSearch();
            });
        }

        // Filter controls
        const cityFilter = document.getElementById('cityFilter');
        const stateFilter = document.getElementById('stateFilter');
        const sortBy = document.getElementById('sortBy');

        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.loadPharmacies();
            });
        }

        if (stateFilter) {
            stateFilter.addEventListener('change', (e) => {
                this.filters.state = e.target.value;
                this.loadPharmacies();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.loadPharmacies();
            });
        }

        // Pharmacy form
        const pharmacyForm = document.getElementById('pharmacyForm');
        if (pharmacyForm) {
            pharmacyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePharmacySubmit();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closePharmacyModal();
            });
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadPharmacies();
        }, 300);
    }

    async loadPharmacies() {
        const container = document.getElementById('pharmaciesGrid');
        if (!container) return;

        this.app.showLoading(container);

        try {
            const params = new URLSearchParams({
                skip: ((this.currentPage - 1) * this.pageSize).toString(),
                limit: this.pageSize.toString()
            });

            if (this.filters.city) params.append('city', this.filters.city);
            if (this.filters.state) params.append('state', this.filters.state);

            const response = await this.app.apiRequest(`/pharmacies?${params}`);
            if (response.ok) {
                const pharmacies = await response.json();
                this.renderPharmacies(this.filterAndSortPharmacies(pharmacies));
            } else {
                container.innerHTML = '<p>Error loading pharmacies.</p>';
            }
        } catch (error) {
            console.error('Error loading pharmacies:', error);
            container.innerHTML = '<p>Error loading pharmacies.</p>';
        }
    }

    filterAndSortPharmacies(pharmacies) {
        let filtered = pharmacies;

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(pharmacy =>
                pharmacy.name.toLowerCase().includes(searchTerm) ||
                pharmacy.city.toLowerCase().includes(searchTerm) ||
                pharmacy.state.toLowerCase().includes(searchTerm) ||
                pharmacy.owner_name.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'quality_score':
                    return b.quality_score - a.quality_score;
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }

    renderPharmacies(pharmacies) {
        const container = document.getElementById('pharmaciesGrid');
        if (!container) return;

        if (pharmacies.length === 0) {
            container.innerHTML = '<p>No pharmacies found.</p>';
            return;
        }

        container.innerHTML = pharmacies.map(pharmacy => `
            <div class="pharmacy-card">
                <div class="pharmacy-header">
                    <h3>${pharmacy.name}</h3>
                    <div class="quality-score ${this.app.getQualityScoreClass(pharmacy.quality_score)}">
                        ${pharmacy.quality_score.toFixed(1)}
                    </div>
                </div>
                <div class="pharmacy-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${pharmacy.address}</p>
                    <p><i class="fas fa-city"></i> ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zip_code}</p>
                    <p><i class="fas fa-phone"></i> ${pharmacy.phone}</p>
                    <p><i class="fas fa-envelope"></i> ${pharmacy.email}</p>
                    <p><i class="fas fa-user"></i> Owner: ${pharmacy.owner_name}</p>
                    <p><i class="fas fa-certificate"></i> License: ${pharmacy.license_number}</p>
                </div>
                <div class="pharmacy-actions">
                    <button class="btn btn-secondary" onclick="pharmaciesPage.editPharmacy(${pharmacy.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary" onclick="pharmaciesPage.viewPharmacy(${pharmacy.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadFilterOptions() {
        try {
            const response = await this.app.apiRequest('/pharmacies?limit=1000');
            if (response.ok) {
                const pharmacies = await response.json();
                this.populateFilterOptions(pharmacies);
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    populateFilterOptions(pharmacies) {
        const cities = [...new Set(pharmacies.map(p => p.city))].sort();
        const states = [...new Set(pharmacies.map(p => p.state))].sort();

        const cityFilter = document.getElementById('cityFilter');
        const stateFilter = document.getElementById('stateFilter');

        if (cityFilter) {
            cityFilter.innerHTML = '<option value="">All Cities</option>' +
                cities.map(city => `<option value="${city}">${city}</option>`).join('');
        }

        if (stateFilter) {
            stateFilter.innerHTML = '<option value="">All States</option>' +
                states.map(state => `<option value="${state}">${state}</option>`).join('');
        }
    }

    showAddPharmacyModal() {
        this.editingPharmacy = null;
        const modal = document.getElementById('pharmacyModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('pharmacyForm');

        if (title) title.textContent = 'Add New Pharmacy';
        if (form) this.app.resetForm(form);

        this.app.showModal('pharmacyModal');
    }

    async editPharmacy(pharmacyId) {
        try {
            const response = await this.app.apiRequest(`/pharmacies/${pharmacyId}`);
            if (response.ok) {
                const pharmacy = await response.json();
                this.showEditPharmacyModal(pharmacy);
            }
        } catch (error) {
            console.error('Error loading pharmacy:', error);
            this.app.showAlert('Error loading pharmacy details', 'error');
        }
    }

    showEditPharmacyModal(pharmacy) {
        this.editingPharmacy = pharmacy;
        const modal = document.getElementById('pharmacyModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('pharmacyForm');

        if (title) title.textContent = 'Edit Pharmacy';

        // Populate form fields
        if (form) {
            Object.keys(pharmacy).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = pharmacy[key] || '';
                }
            });
        }

        this.app.showModal('pharmacyModal');
    }

    async handlePharmacySubmit() {
        const form = document.getElementById('pharmacyForm');
        if (!form || !this.app.validateForm(form)) {
            this.app.showAlert('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const pharmacyData = Object.fromEntries(formData.entries());

        try {
            let response;
            if (this.editingPharmacy) {
                // Update existing pharmacy
                response = await this.app.apiRequest(`/pharmacies/${this.editingPharmacy.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(pharmacyData)
                });
            } else {
                // Create new pharmacy
                response = await this.app.apiRequest('/pharmacies', {
                    method: 'POST',
                    body: JSON.stringify(pharmacyData)
                });
            }

            if (response.ok) {
                this.closePharmacyModal();
                this.loadPharmacies();
                this.app.showAlert(
                    this.editingPharmacy ? 'Pharmacy updated successfully' : 'Pharmacy created successfully',
                    'success'
                );
            } else {
                const error = await response.json();
                this.app.showAlert(error.detail || 'Error saving pharmacy', 'error');
            }
        } catch (error) {
            console.error('Error saving pharmacy:', error);
            this.app.showAlert('Network error. Please try again.', 'error');
        }
    }

    closePharmacyModal() {
        this.app.closeModal(document.getElementById('pharmacyModal'));
        this.editingPharmacy = null;
    }

    viewPharmacy(pharmacyId) {
        // Navigate to pharmacy detail page or show detailed modal
        window.location.href = `/pharmacies/${pharmacyId}`;
    }
}

// Initialize when DOM is loaded
let pharmaciesPage;
document.addEventListener('DOMContentLoaded', () => {
    pharmaciesPage = new PharmaciesPage();
});