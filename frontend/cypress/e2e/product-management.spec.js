/// <reference types="cypress" />

describe('Product Management Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('#email').type('admin@example.com');
    cy.get('#password').type('admin123');
    cy.get('button').contains('SIGN IN').click();
    
    // Setup mock products
    cy.setupMockProducts();
    
    // Navigate to products page
    cy.visit('/products');
  });

  describe('Product List Tests', () => {
    it('should display product list with data', () => {
      // Verify page title
      cy.contains('Products').should('be.visible');
      
      // Verify product table is present
      cy.get('[data-testid="product-table"]').should('be.visible');
      
      // Verify products are displayed
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', 5);
      
      // Verify product details are correct
      cy.get('[data-testid="product-table"] tbody tr').first().within(() => {
        cy.contains('Engine Oil').should('be.visible');
        cy.contains('25.99').should('be.visible');
        cy.contains('Oils').should('be.visible');
      });
    });

    it('should search products by name', () => {
      // Enter search term
      cy.get('[data-testid="search-input"]').type('Filter');
      
      // Verify filtered results
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', 2); // Oil Filter and Air Filter
      cy.get('[data-testid="product-table"] tbody tr').first().should('contain', 'Oil Filter');
      cy.get('[data-testid="product-table"] tbody tr').last().should('contain', 'Air Filter');
      
      // Clear search and verify all products are shown
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', 5);
    });

    it('should filter products by category', () => {
      // Select category filter
      cy.get('[data-testid="category-filter"]').click();
      cy.contains('Filters').click();
      
      // Verify filtered results
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', 2); // Oil Filter and Air Filter
      
      // Clear filter and verify all products are shown
      cy.get('[data-testid="category-filter"]').click();
      cy.contains('All Categories').click();
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', 5);
    });

    it('should open product form when add button is clicked', () => {
      // Click add product button
      cy.get('[data-testid="add-product-button"]').click();
      
      // Verify product form dialog is open
      cy.get('[data-testid="product-form-dialog"]').should('be.visible');
      cy.contains('Add Product').should('be.visible');
    });

    it('should open edit form when edit button is clicked', () => {
      // Click edit button for first product
      cy.get('[data-testid="edit-product-button"]').first().click();
      
      // Verify product form dialog is open in edit mode
      cy.get('[data-testid="product-form-dialog"]').should('be.visible');
      cy.contains('Edit Product').should('be.visible');
      
      // Verify form is pre-filled with product data
      cy.get('input[name="name"]').should('have.value', 'Engine Oil');
      cy.get('input[name="price"]').should('have.value', '25.99');
    });

    it('should delete product when delete button is clicked', () => {
      // Get initial product count
      let initialProductCount;
      cy.get('[data-testid="product-table"] tbody tr').then(($rows) => {
        initialProductCount = $rows.length;
      });
      
      // Click delete button for first product
      cy.get('[data-testid="delete-product-button"]').first().click();
      
      // Confirm deletion in dialog
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      // Verify product was removed from table
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', initialProductCount - 1);
      
      // Verify product was removed from localStorage
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        expect(products.length).to.equal(initialProductCount - 1);
        expect(products.map(p => p.name)).to.not.include('Engine Oil');
      });
    });
  });

  describe('Product Form Tests', () => {
    beforeEach(() => {
      // Open product form
      cy.get('[data-testid="add-product-button"]').click();
    });

    it('should add new product when form is submitted', () => {
      // Get initial product count
      let initialProductCount;
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        initialProductCount = products.length;
      });
      
      // Fill product form
      cy.get('input[name="name"]').type('Test Product');
      cy.get('textarea[name="description"]').type('Test Description');
      cy.get('input[name="price"]').type('19.99');
      cy.get('[data-testid="category-select"]').click();
      cy.contains('Accessories').click();
      cy.get('input[name="stock"]').type('10');
      
      // Submit form
      cy.get('[data-testid="save-product-button"]').click();
      
      // Verify product form is closed
      cy.get('[data-testid="product-form-dialog"]').should('not.exist');
      
      // Verify product was added to table
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', initialProductCount + 1);
      cy.contains('Test Product').should('be.visible');
      
      // Verify product was added to localStorage
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        expect(products.length).to.equal(initialProductCount + 1);
        expect(products.map(p => p.name)).to.include('Test Product');
        
        // Verify product details
        const newProduct = products.find(p => p.name === 'Test Product');
        expect(newProduct.description).to.equal('Test Description');
        expect(newProduct.price).to.equal(19.99);
        expect(newProduct.category).to.equal('Accessories');
        expect(newProduct.stock).to.equal(10);
      });
    });

    it('should edit existing product', () => {
      // Close add form
      cy.get('[data-testid="cancel-button"]').click();
      
      // Click edit button for first product
      cy.get('[data-testid="edit-product-button"]').first().click();
      
      // Update product details
      cy.get('input[name="name"]').clear().type('Updated Product');
      cy.get('input[name="price"]').clear().type('29.99');
      
      // Submit form
      cy.get('[data-testid="save-product-button"]').click();
      
      // Verify product was updated in table
      cy.contains('Updated Product').should('be.visible');
      cy.contains('29.99').should('be.visible');
      
      // Verify product was updated in localStorage
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        expect(products.map(p => p.name)).to.include('Updated Product');
        
        // Verify product details
        const updatedProduct = products.find(p => p.name === 'Updated Product');
        expect(updatedProduct.price).to.equal(29.99);
      });
    });

    it('should validate required fields', () => {
      // Try to submit form without filling required fields
      cy.get('[data-testid="save-product-button"]').click();
      
      // Verify validation errors
      cy.contains('Name is required').should('be.visible');
      cy.contains('Price is required').should('be.visible');
      
      // Fill one required field and verify error is gone
      cy.get('input[name="name"]').type('Test Product');
      cy.contains('Name is required').should('not.exist');
    });

    it('should validate price format', () => {
      // Fill product form with invalid price
      cy.get('input[name="name"]').type('Test Product');
      cy.get('input[name="price"]').type('invalid');
      
      // Submit form
      cy.get('[data-testid="save-product-button"]').click();
      
      // Verify validation error
      cy.contains('Price must be a valid number').should('be.visible');
      
      // Fix price and verify error is gone
      cy.get('input[name="price"]').clear().type('19.99');
      cy.contains('Price must be a valid number').should('not.exist');
    });

    it('should cancel form without saving', () => {
      // Get initial product count
      let initialProductCount;
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        initialProductCount = products.length;
      });
      
      // Fill product form
      cy.get('input[name="name"]').type('Test Product');
      cy.get('input[name="price"]').type('19.99');
      
      // Cancel form
      cy.get('[data-testid="cancel-button"]').click();
      
      // Verify product form is closed
      cy.get('[data-testid="product-form-dialog"]').should('not.exist');
      
      // Verify product was not added
      cy.get('[data-testid="product-table"] tbody tr').should('have.length', initialProductCount);
      cy.contains('Test Product').should('not.exist');
      
      // Verify product was not added to localStorage
      cy.window().then((win) => {
        const products = JSON.parse(win.localStorage.getItem('products') || '[]');
        expect(products.length).to.equal(initialProductCount);
        expect(products.map(p => p.name)).to.not.include('Test Product');
      });
    });
  });
});
