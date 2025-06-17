/// <reference types="cypress" />

describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure a clean state
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('should display login form', () => {
    // Material UI uses id instead of name for form elements
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('button').contains('SIGN IN').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    // In our offline-first approach, we use admin@example.com/admin123 for admin access
    cy.get('#email').type('admin@example.com');
    cy.get('#password').type('admin123');
    cy.get('button').contains('SIGN IN').click();
    
    // Wait for the app to process the login
    cy.wait(1000);
    
    // Verify user is stored in localStorage
    cy.window().then((win) => {
      const user = JSON.parse(win.localStorage.getItem('user'));
      expect(user).to.not.be.null;
      expect(user.email).to.equal('admin@example.com');
    });
  });
  
  it('should accept any credentials in offline mode', () => {
    // In offline-first mode, the app accepts any credentials
    cy.get('#email').type('invalid@example.com');
    cy.get('#password').type('invalid');
    cy.get('button').contains('SIGN IN').click();
    
    // Wait for the app to process the login attempt
    cy.wait(1000);
    
    // In offline mode, we should be redirected to the dashboard
    cy.url().should('not.include', '/login');
    
    // Verify some user data is stored in localStorage
    cy.window().then((win) => {
      const user = win.localStorage.getItem('user');
      expect(user).to.not.be.null;
    });
  });
  
  it('should redirect unauthenticated users from protected routes', () => {
    // Clear localStorage to ensure we're logged out
    cy.clearLocalStorage();
    
    // Try to access the main dashboard
    cy.visit('/');
    
    // We should be redirected to login when localStorage is empty
    // Wait a moment for any redirects to complete
    cy.wait(1000);
    
    // Check if we're on the login page by looking for the login form
    cy.get('#email').should('be.visible');
  });
});
