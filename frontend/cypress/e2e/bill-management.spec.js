/// <reference types="cypress" />

describe('Bill Management Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin');
    cy.get('button[type="submit"]').click();
    
    // Setup mock data
    cy.setupMockProducts();
    cy.setupMockServices();
    cy.setupMockBills();
  });

  describe('Bill List Tests', () => {
    beforeEach(() => {
      // Navigate to bill list page
      cy.visit('/bills');
    });

    it('should display bill list with data', () => {
      // Verify page title
      cy.contains('Bills').should('be.visible');
      
      // Verify bill table is present
      cy.get('[data-testid="bill-table"]').should('be.visible');
      
      // Verify bills are displayed
      cy.get('[data-testid="bill-table"] tbody tr').should('have.length.at.least', 2);
      
      // Verify bill details are correct
      cy.get('[data-testid="bill-table"] tbody tr').first().within(() => {
        cy.contains('BILL-002').should('be.visible'); // Most recent bill
        cy.contains('Jane Smith').should('be.visible');
        cy.contains('138.58').should('be.visible');
      });
    });

    it('should filter bills by customer name', () => {
      // Enter search term
      cy.get('[data-testid="search-input"]').type('John');
      
      // Verify filtered results
      cy.get('[data-testid="bill-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="bill-table"] tbody tr').first().should('contain', 'John Doe');
      
      // Clear search and verify all bills are shown
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="bill-table"] tbody tr').should('have.length.at.least', 2);
    });

    it('should navigate to bill details when clicking on a bill', () => {
      // Click on first bill
      cy.get('[data-testid="bill-table"] tbody tr').first().click();
      
      // Verify navigation to bill details
      cy.url().should('include', '/bills/');
      
      // Verify bill details page shows correct information
      cy.contains('Bill Details').should('be.visible');
      cy.contains('BILL-002').should('be.visible');
      cy.contains('Jane Smith').should('be.visible');
    });

    it('should generate PDF for a bill', () => {
      // Spy on window.open which is called when generating PDF
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      // Click PDF button for first bill
      cy.get('[data-testid="generate-pdf-button"]').first().click();
      
      // Verify PDF generation was triggered
      cy.get('@windowOpen').should('be.called');
    });
  });

  describe('New Bill Tests', () => {
    beforeEach(() => {
      // Navigate to new bill page
      cy.visit('/bills/new');
    });

    it('should display new bill form', () => {
      // Verify page title
      cy.contains('New Bill').should('be.visible');
      
      // Verify form sections
      cy.contains('Customer Information').should('be.visible');
      cy.contains('Vehicle Information').should('be.visible');
      cy.contains('Products').should('be.visible');
      cy.contains('Services').should('be.visible');
      cy.contains('Payment Information').should('be.visible');
    });

    it('should add products to bill', () => {
      // Fill customer information
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="customerPhone"]').type('555-123-4567');
      
      // Fill vehicle information
      cy.get('input[name="vehicleMake"]').type('Test Make');
      cy.get('input[name="vehicleModel"]').type('Test Model');
      cy.get('input[name="vehicleYear"]').type('2022');
      cy.get('input[name="licensePlate"]').type('TEST123');
      
      // Add a product
      cy.get('[data-testid="add-product-button"]').click();
      cy.get('[data-testid="product-select"]').click();
      cy.contains('Engine Oil').click();
      cy.get('input[name="productQuantity"]').clear().type('2');
      
      // Verify product is added
      cy.get('[data-testid="product-list"]').should('contain', 'Engine Oil');
      cy.get('[data-testid="product-list"]').should('contain', '2');
      
      // Verify subtotal is updated
      cy.get('[data-testid="subtotal"]').should('contain', '51.98'); // 25.99 * 2
    });

    it('should add services to bill', () => {
      // Fill customer information
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="customerPhone"]').type('555-123-4567');
      
      // Fill vehicle information
      cy.get('input[name="vehicleMake"]').type('Test Make');
      cy.get('input[name="vehicleModel"]').type('Test Model');
      cy.get('input[name="vehicleYear"]').type('2022');
      cy.get('input[name="licensePlate"]').type('TEST123');
      
      // Add a service
      cy.get('[data-testid="add-service-button"]').click();
      cy.get('[data-testid="service-select"]').click();
      cy.contains('Oil Change').click();
      
      // Verify service is added
      cy.get('[data-testid="service-list"]').should('contain', 'Oil Change');
      
      // Verify subtotal is updated
      cy.get('[data-testid="subtotal"]').should('contain', '49.99');
    });

    it('should calculate totals correctly', () => {
      // Fill customer information
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="customerPhone"]').type('555-123-4567');
      
      // Fill vehicle information
      cy.get('input[name="vehicleMake"]').type('Test Make');
      cy.get('input[name="vehicleModel"]').type('Test Model');
      cy.get('input[name="vehicleYear"]').type('2022');
      cy.get('input[name="licensePlate"]').type('TEST123');
      
      // Add a product
      cy.get('[data-testid="add-product-button"]').click();
      cy.get('[data-testid="product-select"]').click();
      cy.contains('Engine Oil').click();
      cy.get('input[name="productQuantity"]').clear().type('1');
      
      // Add a service
      cy.get('[data-testid="add-service-button"]').click();
      cy.get('[data-testid="service-select"]').click();
      cy.contains('Oil Change').click();
      
      // Verify calculations
      const subtotal = 25.99 + 49.99;
      const tax = subtotal * 0.1; // Assuming 10% tax rate
      const total = subtotal + tax;
      
      cy.get('[data-testid="subtotal"]').should('contain', subtotal.toFixed(2));
      cy.get('[data-testid="tax"]').should('contain', tax.toFixed(2));
      cy.get('[data-testid="total"]').should('contain', total.toFixed(2));
    });

    it('should save bill to localStorage', () => {
      // Get initial bill count
      let initialBillCount;
      cy.window().then((win) => {
        const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
        initialBillCount = bills.length;
      });
      
      // Fill customer information
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="customerPhone"]').type('555-123-4567');
      
      // Fill vehicle information
      cy.get('input[name="vehicleMake"]').type('Test Make');
      cy.get('input[name="vehicleModel"]').type('Test Model');
      cy.get('input[name="vehicleYear"]').type('2022');
      cy.get('input[name="licensePlate"]').type('TEST123');
      
      // Add a product
      cy.get('[data-testid="add-product-button"]').click();
      cy.get('[data-testid="product-select"]').click();
      cy.contains('Engine Oil').click();
      
      // Add a service
      cy.get('[data-testid="add-service-button"]').click();
      cy.get('[data-testid="service-select"]').click();
      cy.contains('Oil Change').click();
      
      // Select payment method
      cy.get('[data-testid="payment-method-select"]').click();
      cy.contains('Cash').click();
      
      // Save bill
      cy.get('[data-testid="save-bill-button"]').click();
      
      // Verify redirect to bill list
      cy.url().should('include', '/bills');
      
      // Verify bill was added to localStorage
      cy.window().then((win) => {
        const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
        expect(bills.length).to.equal(initialBillCount + 1);
        
        // Verify new bill details
        const newBill = bills[bills.length - 1];
        expect(newBill.customer.name).to.equal('Test Customer');
        expect(newBill.customer.vehicleInfo.licensePlate).to.equal('TEST123');
        expect(newBill.products.length).to.equal(1);
        expect(newBill.services.length).to.equal(1);
        expect(newBill.paymentMethod).to.equal('cash');
      });
    });

    it('should validate required fields', () => {
      // Try to save without filling required fields
      cy.get('[data-testid="save-bill-button"]').click();
      
      // Verify validation errors
      cy.contains('Customer name is required').should('be.visible');
      cy.contains('Vehicle make is required').should('be.visible');
      
      // Fill one required field and verify error is gone
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.contains('Customer name is required').should('not.exist');
    });
  });

  describe('Bill Details Tests', () => {
    beforeEach(() => {
      // Navigate to bill details page for the first bill
      cy.window().then((win) => {
        const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
        if (bills.length > 0) {
          cy.visit(`/bills/${bills[0].id}`);
        }
      });
    });

    it('should display bill details correctly', () => {
      // Verify page title
      cy.contains('Bill Details').should('be.visible');
      
      // Verify bill sections
      cy.contains('Customer Information').should('be.visible');
      cy.contains('Vehicle Information').should('be.visible');
      cy.contains('Products').should('be.visible');
      cy.contains('Services').should('be.visible');
      cy.contains('Payment Information').should('be.visible');
      
      // Verify customer details
      cy.contains('John Doe').should('be.visible');
      cy.contains('123-456-7890').should('be.visible');
      
      // Verify vehicle details
      cy.contains('Toyota').should('be.visible');
      cy.contains('Camry').should('be.visible');
      cy.contains('ABC123').should('be.visible');
      
      // Verify products and services
      cy.contains('Engine Oil').should('be.visible');
      cy.contains('Oil Change').should('be.visible');
      
      // Verify totals
      cy.contains('93.47').should('be.visible');
    });

    it('should generate PDF for bill details', () => {
      // Spy on window.open which is called when generating PDF
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      // Click generate PDF button
      cy.get('[data-testid="generate-pdf-button"]').click();
      
      // Verify PDF generation was triggered
      cy.get('@windowOpen').should('be.called');
    });

    it('should navigate back to bill list', () => {
      // Click back button
      cy.get('[data-testid="back-button"]').click();
      
      // Verify navigation to bill list
      cy.url().should('include', '/bills');
      cy.url().should('not.include', '/bills/');
    });
  });
});
