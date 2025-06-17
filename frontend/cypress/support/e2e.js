// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

// Mock localStorage for offline functionality
beforeEach(() => {
  // Preserve localStorage between tests
  cy.restoreLocalStorage();
});

afterEach(() => {
  // Save localStorage between tests
  cy.saveLocalStorage();
});

// Add localStorage helpers
Cypress.Commands.add('saveLocalStorage', () => {
  Object.keys(localStorage).forEach(key => {
    cy.setLocalStorage(key, localStorage[key]);
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  cy.getLocalStorageItem('user').then(value => {
    if (value) {
      localStorage.setItem('user', value);
    }
  });
  cy.getLocalStorageItem('products').then(value => {
    if (value) {
      localStorage.setItem('products', value);
    }
  });
  cy.getLocalStorageItem('services').then(value => {
    if (value) {
      localStorage.setItem('services', value);
    }
  });
  cy.getLocalStorageItem('bills').then(value => {
    if (value) {
      localStorage.setItem('bills', value);
    }
  });
});

Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then(win => {
    win.localStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getLocalStorageItem', (key) => {
  return cy.window().then(win => {
    return win.localStorage.getItem(key);
  });
});
