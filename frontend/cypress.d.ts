/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in a user
     * @example cy.login('admin', 'admin')
     */
    login(username: string, password: string): Chainable<Element>;

    /**
     * Custom command to set up mock products in localStorage
     * @example cy.setupMockProducts()
     */
    setupMockProducts(): Chainable<Element>;

    /**
     * Custom command to set up mock services in localStorage
     * @example cy.setupMockServices()
     */
    setupMockServices(): Chainable<Element>;

    /**
     * Custom command to set up mock bills in localStorage
     * @example cy.setupMockBills()
     */
    setupMockBills(): Chainable<Element>;

    /**
     * Custom command to save localStorage
     * @example cy.saveLocalStorage()
     */
    saveLocalStorage(): Chainable<Element>;

    /**
     * Custom command to restore localStorage
     * @example cy.restoreLocalStorage()
     */
    restoreLocalStorage(): Chainable<Element>;

    /**
     * Custom command to set localStorage item
     * @example cy.setLocalStorage('key', 'value')
     */
    setLocalStorage(key: string, value: string): Chainable<Element>;

    /**
     * Custom command to get localStorage item
     * @example cy.getLocalStorageItem('key')
     */
    getLocalStorageItem(key: string): Chainable<string>;

    /**
     * Custom command to navigate via sidebar
     * @example cy.navigateVia('Dashboard')
     */
    navigateVia(linkText: string): Chainable<Element>;
  }
}
