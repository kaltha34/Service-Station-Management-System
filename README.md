# Service Station Management System

## Overview
A simplified web-based management system for service stations that streamlines daily operations including vehicle servicing, product sales, and customer billing. This system uses localStorage for data persistence, making it easy to set up and use without requiring a backend server.

## Core Features
- Service Management
- Product Management
- Customer Billing System
- Bill Generation and PDF Export
- Dashboard with Quick Access

## Technology Stack
- **Frontend**: React.js with Material-UI
- **Data Storage**: Browser localStorage
- **PDF Generation**: jsPDF
- **State Management**: React Context API

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions
1. Clone the repository
   ```
   git clone https://github.com/kaltha34/Service-Station-Management-System.git
   ```

2. Install dependencies for frontend
   ```
   cd Service-Station-Management-System/frontend
   npm install
   ```

3. Start the application
   ```
   npm start
   ```

4. Access the application
   Open your browser and navigate to `http://localhost:3000`
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/service-station
     JWT_SECRET=your_jwt_secret
     ```

5. Start the backend server
   ```
   cd ../backend
   npm run dev
   ```

6. Start the frontend development server
   ```
   cd ../frontend
   npm start
   ```

## User Roles
- **Admin**: Full access to all features
- **Staff**: Can add services/products to bills
- **Inventory Manager**: Manages stock levels
- **Cashier**: View & generate bills only

## License
MIT