// Inventory page functionality

class InventoryPage {
    constructor() {
        this.app = window.PharmacyApp;
        this.editingItem = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInventory();
        this.loadPharmacies();
        this.loadMedicines();
    }

    setupEventListeners() {
        // Add inventory button
        const addBtn = document.getElementById('addInventoryBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddInventoryModal());
        }

        // Filter controls
        const pharmacyFilter = document.getElementById('pharmacyFilter');
        const stockFilter = document.getElementById('stockFilter');
        const searchInput = document.getElementById('searchInventory');

        if (pharmacyFilter) {
            pharmacyFilter.addEventListener('change', () => this.loadInventory());
        }

        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.loadInventory());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.debounceSearch();
            });
        }

        // Inventory form
        const inventoryForm = document.getElementById('inventoryForm');
        if (inventoryForm) {
            inventoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleInventorySubmit();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelInventoryBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeInventoryModal();
            });
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadInventory();
        }, 300);
    }

    async loadInventory() {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="9" class="loading"><div class="spinner"></div></td></tr>';

        try {
            const params = new URLSearchParams();
            
            const pharmacyFilter = document.getElementById('pharmacyFilter');
            const stockFilter = document.getElementById('stockFilter');

            if (pharmacyFilter && pharmacyFilter.value) {
                params.append('pharmacy_id', pharmacyFilter.value);
            }

            if (stockFilter && stockFilter.value === 'low') {
                params.append('low_stock', 'true');
            }

            const response = await this.app.apiRequest(`/inventory?${params}`);
            if (response.ok) {
                const inventory = await response.json();
                this.renderInventory(inventory);
            } else {
                tbody.innerHTML = '<tr><td colspan="9">Error loading inventory.</td></tr>';
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            tbody.innerHTML = '<tr><td colspan="9">Error loading inventory.</td></tr>';
        }
    }

    renderInventory(inventory) {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">No inventory items found.</td></tr>';
            return;
        }

        tbody.innerHTML = inventory.map(item => {
            const status = this.getInventoryStatus(item);
            const expiryDate = new Date(item.expiry_date);
            const isExpired = expiryDate < new Date();
            const isExpiringSoon = expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return `
                <tr>
                    <td>Medicine ID: ${item.medicine_id}</td>
                    <td>Pharmacy ID: ${item.pharmacy_id}</td>
                    <td>${item.quantity}</td>
                    <td>${item.reorder_level}</td>
                    <td>${this.app.formatCurrency(item.unit_cost)}</td>
                    <td class="${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : ''}">
                        ${this.app.formatDate(item.expiry_date)}
                    </td>
                    <td>${item.batch_number}</td>
                    <td>
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="inventoryPage.editInventoryItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="inventoryPage.deleteInventoryItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getInventoryStatus(item) {
        const expiryDate = new Date(item.expiry_date);
        const now = new Date();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (expiryDate < now) {
            return { class: 'status-expired', text: 'Expired' };
        } else if (expiryDate < thirtyDaysFromNow) {
            return { class: 'status-expiring', text: 'Expiring Soon' };
        } else if (item.quantity <= item.reorder_level) {
            return { class: 'status-low-stock', text: 'Low Stock' };
        } else {
            return { class: 'status-normal', text: 'Normal' };
        }
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
        const selects = ['pharmacyFilter', 'inventoryPharmacy'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const isFilter = selectId === 'pharmacyFilter';
                select.innerHTML = (isFilter ? '<option value="">All Pharmacies</option>' : '<option value="">Select Pharmacy</option>') +
                    pharmacies.map(pharmacy => 
                        `<option value="${pharmacy.id}">${pharmacy.name} - ${pharmacy.city}</option>`
                    ).join('');
            }
        });
    }

    async loadMedicines() {
        // For demo purposes, we'll create some sample medicines
        // In a real app, this would come from a medicines API endpoint
        const sampleMedicines = [
            { id: 1, name: 'Aspirin 100mg' },
            { id: 2, name: 'Ibuprofen 200mg' },
            { id: 3, name: 'Paracetamol 500mg' },
            { id: 4, name: 'Amoxicillin 250mg' },
            { id: 5, name: 'Metformin 500mg' }
        ];

        const select = document.getElementById('inventoryMedicine');
        if (select) {
            select.innerHTML = '<option value="">Select Medicine</option>' +
                sampleMedicines.map(medicine => 
                    `<option value="${medicine.id}">${medicine.name}</option>`
                ).join('');
        }
    }

    showAddInventoryModal() {
        this.editingItem = null;
        const modal = document.getElementById('inventoryModal');
        const title = document.getElementById('inventoryModalTitle');
        const form = document.getElementById('inventoryForm');

        if (title) title.textContent = 'Add Inventory Item';
        if (form) this.app.resetForm(form);

        this.app.showModal('inventoryModal');
    }

    async editInventoryItem(itemId) {
        try {
            const response = await this.app.apiRequest(`/inventory/${itemId}`);
            if (response.ok) {
                const item = await response.json();
                this.showEditInventoryModal(item);
            }
        } catch (error) {
            console.error('Error loading inventory item:', error);
            this.app.showAlert('Error loading inventory item', 'error');
        }
    }

    showEditInventoryModal(item) {
        this.editingItem = item;
        const modal = document.getElementById('inventoryModal');
        const title = document.getElementById('inventoryModalTitle');
        const form = document.getElementById('inventoryForm');

        if (title) title.textContent = 'Edit Inventory Item';

        // Populate form fields
        if (form) {
            Object.keys(item).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (key === 'expiry_date') {
                        // Format date for input field
                        input.value = new Date(item[key]).toISOString().split('T')[0];
                    } else {
                        input.value = item[key] || '';
                    }
                }
            });
        }

        this.app.showModal('inventoryModal');
    }

    async handleInventorySubmit() {
        const form = document.getElementById('inventoryForm');
        if (!form || !this.app.validateForm(form)) {
            this.app.showAlert('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const inventoryData = Object.fromEntries(formData.entries());

        // Convert numeric fields
        inventoryData.pharmacy_id = parseInt(inventoryData.pharmacy_id);
        inventoryData.medicine_id = parseInt(inventoryData.medicine_id);
        inventoryData.quantity = parseInt(inventoryData.quantity);
        inventoryData.reorder_level = parseInt(inventoryData.reorder_level);
        inventoryData.unit_cost = parseFloat(inventoryData.unit_cost);

        try {
            let response;
            if (this.editingItem) {
                // Update existing item
                response = await this.app.apiRequest(`/inventory/${this.editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(inventoryData)
                });
            } else {
                // Create new item
                response = await this.app.apiRequest('/inventory', {
                    method: 'POST',
                    body: JSON.stringify(inventoryData)
                });
            }

            if (response.ok) {
                this.closeInventoryModal();
                this.loadInventory();
                this.app.showAlert(
                    this.editingItem ? 'Inventory item updated successfully' : 'Inventory item created successfully',
                    'success'
                );
            } else {
                const error = await response.json();
                this.app.showAlert(error.detail || 'Error saving inventory item', 'error');
            }
        } catch (error) {
            console.error('Error saving inventory item:', error);
            this.app.showAlert('Network error. Please try again.', 'error');
        }
    }

    async deleteInventoryItem(itemId) {
        if (!confirm('Are you sure you want to delete this inventory item?')) {
            return;
        }

        try {
            const response = await this.app.apiRequest(`/inventory/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadInventory();
                this.app.showAlert('Inventory item deleted successfully', 'success');
            } else {
                const error = await response.json();
                this.app.showAlert(error.detail || 'Error deleting inventory item', 'error');
            }
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            this.app.showAlert('Network error. Please try again.', 'error');
        }
    }

    closeInventoryModal() {
        this.app.closeModal(document.getElementById('inventoryModal'));
        this.editingItem = null;
    }
}

// Initialize when DOM is loaded
let inventoryPage;
document.addEventListener('DOMContentLoaded', () => {
    inventoryPage = new InventoryPage();
});