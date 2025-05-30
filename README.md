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

## Usage Guide

### Dashboard
The dashboard provides quick access to all main features of the application:
- Create new bills
- View existing bills
- Manage services
- Manage products

### Managing Services
1. Navigate to the Services section
2. Add new services with details like name, description, price, and duration
3. Edit or delete existing services as needed

### Managing Products
1. Navigate to the Products section
2. Add new products with details like name, description, price, and quantity
3. Edit or delete existing products as needed

### Creating Bills
1. Navigate to the New Bill section
2. Enter customer and vehicle information
3. Add services and products to the bill
4. Apply discounts if needed
5. Select payment method
6. Generate and save the bill

### Viewing Bills
1. Navigate to the Bills section
2. View a list of all created bills
3. Use filters to find specific bills
4. Click on a bill to view details
5. Generate PDF invoices for printing

## Data Persistence
This application uses browser localStorage for data persistence. This means:
- All data is stored locally in your browser
- Data will persist between sessions on the same browser
- Data will NOT be shared between different browsers or devices
- Clearing browser data will erase all application data

## PDF Generation
The application includes built-in PDF generation for bills and invoices using jsPDF. Generated PDFs include:
- Customer and vehicle information
- Itemized list of services and products
- Price calculations including subtotal, tax, and discounts
- Payment information

## Simplified Authentication
This application uses a simplified authentication system with localStorage. There are no complex user roles - anyone with access to the application can perform all operations.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.