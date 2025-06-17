// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  // Clear localStorage to ensure a clean state
  cy.clearLocalStorage();
  
  // Visit the login page
  cy.visit('/login');
  
  // Enter email and password
  cy.get('#email').type(email);
  cy.get('#password').type(password || 'admin123');
  
  // Click login button
  cy.get('button').contains('SIGN IN').click();
  
  // Verify redirect to dashboard
  cy.url().should('include', '/');
  
  // Set user in localStorage to simulate successful login if needed
  // This may not be necessary if your app already sets localStorage on login
  cy.window().then((win) => {
    if (!win.localStorage.getItem('user')) {
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: email,
        name: 'Test User',
        role: email === 'admin@example.com' ? 'admin' : 'user',
        token: 'fake-jwt-token'
      }));
    }
  });
});

// Command to add mock products to localStorage
Cypress.Commands.add('setupMockProducts', () => {
  cy.window().then((win) => {
    const products = [
      { id: '1', name: 'Engine Oil', description: 'Synthetic engine oil', price: 25.99, category: 'Oils', stock: 50 },
      { id: '2', name: 'Oil Filter', description: 'Premium oil filter', price: 8.99, category: 'Filters', stock: 30 },
      { id: '3', name: 'Air Filter', description: 'High performance air filter', price: 12.99, category: 'Filters', stock: 25 },
      { id: '4', name: 'Brake Pads', description: 'Front brake pads', price: 35.99, category: 'Brakes', stock: 15 },
      { id: '5', name: 'Wiper Blades', description: '20" wiper blades', price: 15.99, category: 'Accessories', stock: 40 }
    ];
    win.localStorage.setItem('products', JSON.stringify(products));
  });
});

// Command to add mock services to localStorage
Cypress.Commands.add('setupMockServices', () => {
  cy.window().then((win) => {
    const services = [
      { id: '1', name: 'Oil Change', description: 'Full synthetic oil change', price: 49.99, duration: 30 },
      { id: '2', name: 'Tire Rotation', description: 'Rotate and balance tires', price: 29.99, duration: 45 },
      { id: '3', name: 'Brake Service', description: 'Inspect and replace brake pads', price: 89.99, duration: 60 },
      { id: '4', name: 'Engine Tune-up', description: 'Complete engine tune-up', price: 129.99, duration: 90 },
      { id: '5', name: 'A/C Service', description: 'A/C system check and recharge', price: 79.99, duration: 60 }
    ];
    win.localStorage.setItem('services', JSON.stringify(services));
  });
});

// Command to add mock bills to localStorage
Cypress.Commands.add('setupMockBills', () => {
  cy.window().then((win) => {
    const bills = [
      {
        id: '1',
        billNumber: 'BILL-001',
        customer: {
          name: 'John Doe',
          phone: '123-456-7890',
          email: 'john@example.com',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: '2020',
            licensePlate: 'ABC123'
          }
        },
        products: [
          { id: '1', name: 'Engine Oil', price: 25.99, quantity: 1 },
          { id: '2', name: 'Oil Filter', price: 8.99, quantity: 1 }
        ],
        services: [
          { id: '1', name: 'Oil Change', price: 49.99, quantity: 1 }
        ],
        subtotal: 84.97,
        tax: 8.50,
        total: 93.47,
        paymentMethod: 'cash',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        createdBy: 'admin'
      },
      {
        id: '2',
        billNumber: 'BILL-002',
        customer: {
          name: 'Jane Smith',
          phone: '987-654-3210',
          email: 'jane@example.com',
          vehicleInfo: {
            make: 'Honda',
            model: 'Civic',
            year: '2019',
            licensePlate: 'XYZ789'
          }
        },
        products: [
          { id: '4', name: 'Brake Pads', price: 35.99, quantity: 1 }
        ],
        services: [
          { id: '3', name: 'Brake Service', price: 89.99, quantity: 1 }
        ],
        subtotal: 125.98,
        tax: 12.60,
        total: 138.58,
        paymentMethod: 'card',
        createdAt: new Date().toISOString(), // Today
        createdBy: 'admin'
      }
    ];
    win.localStorage.setItem('bills', JSON.stringify(bills));
  });
});

// Command to verify toast notification
Cypress.Commands.add('verifyToast', (message) => {
  cy.get('.Toastify__toast-body').should('contain', message);
});

// Command to navigate to a specific page via the sidebar
Cypress.Commands.add('navigateVia', (linkText) => {
  cy.get('.MuiDrawer-root').should('be.visible');
  cy.get('.MuiDrawer-root').contains(linkText).click();
});

// localStorage commands for persistence between tests
Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getLocalStorageItem', (key) => {
  return cy.window().then((win) => {
    return win.localStorage.getItem(key);
  });
});
