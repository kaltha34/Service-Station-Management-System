# Smart Service Station Management System

## Overview
A comprehensive web-based management system for service stations that streamlines daily operations including vehicle servicing, product sales, customer billing, inventory management, and report generation.

## Core Features
- Task & Product Management
- Customer Billing System
- Daily Report Generation
- Inventory Management
- Service History Tracking
- Analytics Dashboard
- User Role Management
- Multi-Device Support
- Data Backup & Export
- Login & Security

## Technology Stack
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT
- **PDF Generation**: jsPDF
- **Charts**: Chart.js

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Setup Instructions
1. Clone the repository
   ```
   git clone https://github.com/yourusername/Service-Station-Management-System.git
   ```

2. Install dependencies for backend
   ```
   cd Service-Station-Management-System/backend
   npm install
   ```

3. Install dependencies for frontend
   ```
   cd ../frontend
   npm install
   ```

4. Configure environment variables
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