const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    testIsolation: false,
    experimentalRunAllSpecs: true,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
});
