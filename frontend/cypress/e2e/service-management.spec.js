/// <reference types="cypress" />

describe('Service Management Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('#email').type('admin@example.com');
    cy.get('#password').type('admin123');
    cy.get('button').contains('SIGN IN').click();
    
    // Setup mock services
    cy.setupMockServices();
    
    // Navigate to services page
    cy.visit('/services');
  });

  describe('Service List Tests', () => {
    it('should display service list with data', () => {
      // Verify page title
      cy.contains('Services').should('be.visible');
      
      // Verify service table is present
      cy.get('[data-testid="service-table"]').should('be.visible');
      
      // Verify services are displayed
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', 5);
      
      // Verify service details are correct
      cy.get('[data-testid="service-table"] tbody tr').first().within(() => {
        cy.contains('Oil Change').should('be.visible');
        cy.contains('49.99').should('be.visible');
        cy.contains('30').should('be.visible'); // Duration
      });
    });

    it('should search services by name', () => {
      // Enter search term
      cy.get('[data-testid="search-input"]').type('Brake');
      
      // Verify filtered results
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="service-table"] tbody tr').first().should('contain', 'Brake Service');
      
      // Clear search and verify all services are shown
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', 5);
    });

    it('should filter services by duration', () => {
      // Select duration filter
      cy.get('[data-testid="duration-filter"]').click();
      cy.contains('60 min').click();
      
      // Verify filtered results - should show services with 60 min duration
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', 2); // Brake Service and A/C Service
      
      // Clear filter and verify all services are shown
      cy.get('[data-testid="duration-filter"]').click();
      cy.contains('All Durations').click();
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', 5);
    });

    it('should open service form when add button is clicked', () => {
      // Click add service button
      cy.get('[data-testid="add-service-button"]').click();
      
      // Verify service form dialog is open
      cy.get('[data-testid="service-form-dialog"]').should('be.visible');
      cy.contains('Add Service').should('be.visible');
    });

    it('should open edit form when edit button is clicked', () => {
      // Click edit button for first service
      cy.get('[data-testid="edit-service-button"]').first().click();
      
      // Verify service form dialog is open in edit mode
      cy.get('[data-testid="service-form-dialog"]').should('be.visible');
      cy.contains('Edit Service').should('be.visible');
      
      // Verify form is pre-filled with service data
      cy.get('input[name="name"]').should('have.value', 'Oil Change');
      cy.get('input[name="price"]').should('have.value', '49.99');
      cy.get('input[name="duration"]').should('have.value', '30');
    });

    it('should delete service when delete button is clicked', () => {
      // Get initial service count
      let initialServiceCount;
      cy.get('[data-testid="service-table"] tbody tr').then(($rows) => {
        initialServiceCount = $rows.length;
      });
      
      // Click delete button for first service
      cy.get('[data-testid="delete-service-button"]').first().click();
      
      // Confirm deletion in dialog
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      // Verify service was removed from table
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', initialServiceCount - 1);
      
      // Verify service was removed from localStorage
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        expect(services.length).to.equal(initialServiceCount - 1);
        expect(services.map(s => s.name)).to.not.include('Oil Change');
      });
    });
  });

  describe('Service Form Tests', () => {
    beforeEach(() => {
      // Open service form
      cy.get('[data-testid="add-service-button"]').click();
    });

    it('should add new service when form is submitted', () => {
      // Get initial service count
      let initialServiceCount;
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        initialServiceCount = services.length;
      });
      
      // Fill service form
      cy.get('input[name="name"]').type('Test Service');
      cy.get('textarea[name="description"]').type('Test Description');
      cy.get('input[name="price"]').type('59.99');
      cy.get('input[name="duration"]').type('45');
      
      // Submit form
      cy.get('[data-testid="save-service-button"]').click();
      
      // Verify service form is closed
      cy.get('[data-testid="service-form-dialog"]').should('not.exist');
      
      // Verify service was added to table
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', initialServiceCount + 1);
      cy.contains('Test Service').should('be.visible');
      
      // Verify service was added to localStorage
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        expect(services.length).to.equal(initialServiceCount + 1);
        expect(services.map(s => s.name)).to.include('Test Service');
        
        // Verify service details
        const newService = services.find(s => s.name === 'Test Service');
        expect(newService.description).to.equal('Test Description');
        expect(newService.price).to.equal(59.99);
        expect(newService.duration).to.equal(45);
      });
    });

    it('should edit existing service', () => {
      // Close add form
      cy.get('[data-testid="cancel-button"]').click();
      
      // Click edit button for first service
      cy.get('[data-testid="edit-service-button"]').first().click();
      
      // Update service details
      cy.get('input[name="name"]').clear().type('Updated Service');
      cy.get('input[name="price"]').clear().type('59.99');
      cy.get('input[name="duration"]').clear().type('45');
      
      // Submit form
      cy.get('[data-testid="save-service-button"]').click();
      
      // Verify service was updated in table
      cy.contains('Updated Service').should('be.visible');
      cy.contains('59.99').should('be.visible');
      cy.contains('45').should('be.visible');
      
      // Verify service was updated in localStorage
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        expect(services.map(s => s.name)).to.include('Updated Service');
        
        // Verify service details
        const updatedService = services.find(s => s.name === 'Updated Service');
        expect(updatedService.price).to.equal(59.99);
        expect(updatedService.duration).to.equal(45);
      });
    });

    it('should validate required fields', () => {
      // Try to submit form without filling required fields
      cy.get('[data-testid="save-service-button"]').click();
      
      // Verify validation errors
      cy.contains('Name is required').should('be.visible');
      cy.contains('Price is required').should('be.visible');
      cy.contains('Duration is required').should('be.visible');
      
      // Fill one required field and verify error is gone
      cy.get('input[name="name"]').type('Test Service');
      cy.contains('Name is required').should('not.exist');
    });

    it('should validate price format', () => {
      // Fill service form with invalid price
      cy.get('input[name="name"]').type('Test Service');
      cy.get('input[name="price"]').type('invalid');
      cy.get('input[name="duration"]').type('45');
      
      // Submit form
      cy.get('[data-testid="save-service-button"]').click();
      
      // Verify validation error
      cy.contains('Price must be a valid number').should('be.visible');
      
      // Fix price and verify error is gone
      cy.get('input[name="price"]').clear().type('59.99');
      cy.contains('Price must be a valid number').should('not.exist');
    });

    it('should validate duration format', () => {
      // Fill service form with invalid duration
      cy.get('input[name="name"]').type('Test Service');
      cy.get('input[name="price"]').type('59.99');
      cy.get('input[name="duration"]').type('invalid');
      
      // Submit form
      cy.get('[data-testid="save-service-button"]').click();
      
      // Verify validation error
      cy.contains('Duration must be a valid number').should('be.visible');
      
      // Fix duration and verify error is gone
      cy.get('input[name="duration"]').clear().type('45');
      cy.contains('Duration must be a valid number').should('not.exist');
    });

    it('should cancel form without saving', () => {
      // Get initial service count
      let initialServiceCount;
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        initialServiceCount = services.length;
      });
      
      // Fill service form
      cy.get('input[name="name"]').type('Test Service');
      cy.get('input[name="price"]').type('59.99');
      cy.get('input[name="duration"]').type('45');
      
      // Cancel form
      cy.get('[data-testid="cancel-button"]').click();
      
      // Verify service form is closed
      cy.get('[data-testid="service-form-dialog"]').should('not.exist');
      
      // Verify service was not added
      cy.get('[data-testid="service-table"] tbody tr').should('have.length', initialServiceCount);
      cy.contains('Test Service').should('not.exist');
      
      // Verify service was not added to localStorage
      cy.window().then((win) => {
        const services = JSON.parse(win.localStorage.getItem('services') || '[]');
        expect(services.length).to.equal(initialServiceCount);
        expect(services.map(s => s.name)).to.not.include('Test Service');
      });
    });
  });
});
