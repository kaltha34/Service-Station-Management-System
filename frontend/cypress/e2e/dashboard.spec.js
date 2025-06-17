/// <reference types="cypress" />

describe('Dashboard Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin');
    cy.get('button[type="submit"]').click();
    
    // Setup mock data
    cy.setupMockProducts();
    cy.setupMockServices();
    cy.setupMockBills();
    
    // Navigate to dashboard
    cy.visit('/dashboard');
  });

  it('should display dashboard with all cards', () => {
    // Verify dashboard title
    cy.contains('Dashboard').should('be.visible');
    
    // Verify all cards are present
    cy.contains('Total Bills').should('be.visible');
    cy.contains('Total Revenue').should('be.visible');
    cy.contains('Products').should('be.visible');
    cy.contains('Services').should('be.visible');
  });

  it('should display correct metrics based on localStorage data', () => {
    // Get bills from localStorage
    cy.window().then((win) => {
      const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
      const products = JSON.parse(win.localStorage.getItem('products') || '[]');
      const services = JSON.parse(win.localStorage.getItem('services') || '[]');
      
      // Calculate expected metrics
      const totalBills = bills.length;
      const totalRevenue = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const totalProducts = products.length;
      const totalServices = services.length;
      
      // Verify metrics on dashboard
      cy.get('[data-testid="total-bills"]').should('contain', totalBills);
      cy.get('[data-testid="total-revenue"]').should('contain', totalRevenue.toFixed(2));
      cy.get('[data-testid="total-products"]').should('contain', totalProducts);
      cy.get('[data-testid="total-services"]').should('contain', totalServices);
    });
  });

  it('should navigate to correct pages when clicking on cards', () => {
    // Click on Bills card and verify navigation
    cy.get('[data-testid="bills-card"]').click();
    cy.url().should('include', '/bills');
    cy.go('back');
    
    // Click on Products card and verify navigation
    cy.get('[data-testid="products-card"]').click();
    cy.url().should('include', '/products');
    cy.go('back');
    
    // Click on Services card and verify navigation
    cy.get('[data-testid="services-card"]').click();
    cy.url().should('include', '/services');
  });

  it('should display recent bills section with data', () => {
    // Verify recent bills section is present
    cy.contains('Recent Bills').should('be.visible');
    
    // Verify bills are displayed
    cy.get('[data-testid="recent-bills-table"]').should('be.visible');
    cy.get('[data-testid="recent-bills-table"] tbody tr').should('have.length.at.least', 1);
    
    // Verify bill details are correct
    cy.get('[data-testid="recent-bills-table"] tbody tr').first().within(() => {
      cy.contains('BILL-002').should('be.visible'); // Most recent bill
      cy.contains('Jane Smith').should('be.visible');
      cy.contains('138.58').should('be.visible');
    });
  });

  it('should refresh dashboard data when new bill is added', () => {
    // Get initial bill count
    let initialBillCount;
    cy.get('[data-testid="total-bills"]').invoke('text').then((text) => {
      initialBillCount = parseInt(text);
    });
    
    // Add a new bill to localStorage
    cy.window().then((win) => {
      const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
      bills.push({
        id: '3',
        billNumber: 'BILL-003',
        customer: {
          name: 'New Customer',
          phone: '555-555-5555',
          email: 'new@example.com',
          vehicleInfo: {
            make: 'Ford',
            model: 'F-150',
            year: '2021',
            licensePlate: 'NEW123'
          }
        },
        products: [],
        services: [
          { id: '2', name: 'Tire Rotation', price: 29.99, quantity: 1 }
        ],
        subtotal: 29.99,
        tax: 3.00,
        total: 32.99,
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      });
      win.localStorage.setItem('bills', JSON.stringify(bills));
    });
    
    // Refresh dashboard
    cy.reload();
    
    // Verify bill count increased
    cy.get('[data-testid="total-bills"]').invoke('text').then((text) => {
      const newBillCount = parseInt(text);
      expect(newBillCount).to.equal(initialBillCount + 1);
    });
    
    // Verify new bill appears in recent bills
    cy.get('[data-testid="recent-bills-table"] tbody').contains('BILL-003').should('be.visible');
  });
});
