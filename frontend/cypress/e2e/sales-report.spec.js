/// <reference types="cypress" />

describe('Sales Report Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('#email').type('admin@example.com');
    cy.get('#password').type('admin123');
    cy.get('button').contains('SIGN IN').click();
    
    // Setup mock data
    cy.setupMockProducts();
    cy.setupMockServices();
    cy.setupMockBills();
    
    // Navigate to sales report page
    cy.visit('/reports/sales');
  });

  it('should display sales report page with data', () => {
    // Verify page title
    cy.contains('Sales Report').should('be.visible');
    
    // Verify report type selector is present
    cy.get('[data-testid="report-type-select"]').should('be.visible');
    
    // Verify date selector is present
    cy.get('[data-testid="date-selector"]').should('be.visible');
    
    // Verify summary cards are present
    cy.get('[data-testid="total-sales-card"]').should('be.visible');
    cy.get('[data-testid="total-bills-card"]').should('be.visible');
    cy.get('[data-testid="product-sales-card"]').should('be.visible');
    cy.get('[data-testid="service-sales-card"]').should('be.visible');
    
    // Verify transaction table is present
    cy.get('[data-testid="transactions-table"]').should('be.visible');
    
    // Verify transactions are displayed
    cy.get('[data-testid="transactions-table"] tbody tr').should('have.length.at.least', 1);
  });

  it('should display correct metrics for daily report', () => {
    // Select daily report type
    cy.get('[data-testid="report-type-select"]').click();
    cy.contains('Daily').click();
    
    // Set date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    cy.get('[data-testid="date-selector"]').clear().type(formattedDate);
    
    // Get bills from localStorage
    cy.window().then((win) => {
      const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
      
      // Filter bills for today
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.createdAt);
        return billDate >= todayStart && billDate <= todayEnd;
      });
      
      // Calculate expected metrics
      const totalSales = todayBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const totalBills = todayBills.length;
      
      // Calculate product sales
      let productSales = 0;
      todayBills.forEach(bill => {
        if (bill.products && bill.products.length > 0) {
          bill.products.forEach(product => {
            productSales += (product.price || 0) * (product.quantity || 1);
          });
        }
      });
      
      // Calculate service sales
      let serviceSales = 0;
      todayBills.forEach(bill => {
        if (bill.services && bill.services.length > 0) {
          bill.services.forEach(service => {
            serviceSales += (service.price || 0) * (service.quantity || 1);
          });
        }
      });
      
      // Verify metrics on report
      cy.get('[data-testid="total-sales-card"]').should('contain', totalSales.toFixed(2));
      cy.get('[data-testid="total-bills-card"]').should('contain', totalBills);
      cy.get('[data-testid="product-sales-card"]').should('contain', productSales.toFixed(2));
      cy.get('[data-testid="service-sales-card"]').should('contain', serviceSales.toFixed(2));
      
      // Verify transaction count
      cy.get('[data-testid="transactions-table"] tbody tr').should('have.length', totalBills);
    });
  });

  it('should change report data when switching report types', () => {
    // Get metrics for daily report
    let dailyTotalSales, dailyTotalBills;
    cy.get('[data-testid="report-type-select"]').click();
    cy.contains('Daily').click();
    cy.get('[data-testid="total-sales-card"]').invoke('text').then((text) => {
      dailyTotalSales = parseFloat(text.match(/\d+\.\d+/)[0]);
    });
    cy.get('[data-testid="total-bills-card"]').invoke('text').then((text) => {
      dailyTotalBills = parseInt(text.match(/\d+/)[0]);
    });
    
    // Switch to weekly report
    cy.get('[data-testid="report-type-select"]').click();
    cy.contains('Weekly').click();
    
    // Verify metrics changed
    cy.get('[data-testid="total-sales-card"]').invoke('text').then((text) => {
      const weeklyTotalSales = parseFloat(text.match(/\d+\.\d+/)[0]);
      // Weekly sales should be greater than or equal to daily sales
      expect(weeklyTotalSales).to.be.at.least(dailyTotalSales);
    });
    cy.get('[data-testid="total-bills-card"]').invoke('text').then((text) => {
      const weeklyTotalBills = parseInt(text.match(/\d+/)[0]);
      // Weekly bills should be greater than or equal to daily bills
      expect(weeklyTotalBills).to.be.at.least(dailyTotalBills);
    });
  });

  it('should navigate between date periods', () => {
    // Select daily report type
    cy.get('[data-testid="report-type-select"]').click();
    cy.contains('Daily').click();
    
    // Get current date
    let currentDate;
    cy.get('[data-testid="date-selector"]').invoke('val').then((val) => {
      currentDate = val;
    });
    
    // Click previous button
    cy.get('[data-testid="previous-button"]').click();
    
    // Verify date changed
    cy.get('[data-testid="date-selector"]').invoke('val').then((val) => {
      expect(val).not.to.equal(currentDate);
      
      // Update current date
      currentDate = val;
    });
    
    // Click next button
    cy.get('[data-testid="next-button"]').click();
    
    // Verify date changed back
    cy.get('[data-testid="date-selector"]').invoke('val').then((val) => {
      expect(val).not.to.equal(currentDate);
    });
  });

  it('should display payment method distribution', () => {
    // Verify payment method chart is present
    cy.get('[data-testid="payment-method-chart"]').should('be.visible');
    
    // Get bills from localStorage
    cy.window().then((win) => {
      const bills = JSON.parse(win.localStorage.getItem('bills') || '[]');
      
      // Calculate payment method distribution
      const paymentMethods = {
        cash: 0,
        card: 0,
        online: 0,
        other: 0
      };
      
      bills.forEach(bill => {
        const method = bill.paymentMethod || 'other';
        const amount = bill.total || 0;
        
        if (paymentMethods.hasOwnProperty(method)) {
          paymentMethods[method] += amount;
        } else {
          paymentMethods.other += amount;
        }
      });
      
      // Verify payment methods are displayed
      Object.keys(paymentMethods).forEach(method => {
        if (paymentMethods[method] > 0) {
          const capitalizedMethod = method.charAt(0).toUpperCase() + method.slice(1);
          cy.get('[data-testid="payment-method-chart"]').should('contain', capitalizedMethod);
        }
      });
    });
  });

  it('should generate PDF report', () => {
    // Spy on window.open which is called when generating PDF
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    
    // Click generate PDF button
    cy.get('[data-testid="generate-pdf-button"]').click();
    
    // Verify PDF generation was triggered
    cy.get('@windowOpen').should('be.called');
  });

  it('should handle empty data gracefully', () => {
    // Clear bills from localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('bills', JSON.stringify([]));
    });
    
    // Refresh page
    cy.reload();
    
    // Verify "No data" message is displayed
    cy.contains('No transactions found for this period').should('be.visible');
    
    // Verify metrics show zeros
    cy.get('[data-testid="total-sales-card"]').should('contain', '0.00');
    cy.get('[data-testid="total-bills-card"]').should('contain', '0');
    cy.get('[data-testid="product-sales-card"]').should('contain', '0.00');
    cy.get('[data-testid="service-sales-card"]').should('contain', '0.00');
  });

  it('should restrict access to non-admin users', () => {
    // Logout
    cy.get('[data-testid="logout-button"]').click();
    
    // Login as regular user
    cy.get('input[name="username"]').type('user');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    // Try to access sales report
    cy.visit('/reports/sales');
    
    // Verify access is denied
    cy.url().should('include', '/unauthorized');
    cy.contains('Unauthorized').should('be.visible');
  });
});
