# 🍳 KitchenFlow — Kitchen Order Management System

KitchenFlow is a production-style MVP restaurant kitchen management system built with **Next.js 15**, **MongoDB Atlas**, and **Tailwind CSS**. It is designed to streamline communication between front-of-house staff and the kitchen, providing real-time order tracking and deep business analytics.

---

## 🚀 Key Features

### 1. Advanced Order Workflow
- **Kanban Dashboard**: Interactive dashboard for managing active orders through states: `PENDING`, `COOKING`, and `READY`.
- **Status Lifecycle**: Automated timestamp tracking for each phase (Accepted, Ready, Completed, Cancelled).
- **Soft Delete Strategy**: No data loss. Orders are archived for historical tracking and reporting.

### 2. Visual Analytics & Charts (New!)
- **Performance Trends**: Interactive charts using `Recharts` to visualize business data:
    - **Kitchen Activity Trends**: Area chart showing order volume per hour to identify peak times.
    - **Order Status Breakdown**: Pie chart showing the distribution of Completed vs. Cancelled vs. Active orders.

### 3. Business Intelligence (KPIs)
- **Live Metrics**: Real-time server-side calculation of key performance indicators:
    - **Average Preparation Time**: From accepted to ready.
    - **Average Delivery Time**: From ready to completed.
    - **Daily Stats**: Timezone-aware breakdown of today's total and archived orders.

### 4. Shift Management System
- **Session Tracking**: Start and end work shifts to group orders and track performance per session.
- **Data Integrity**: Only one active shift can exist at a time.

### 5. Professional Excel Export (.xlsx)
- **Formatted Reports**: Styled restaurant reports using `ExcelJS`.
    - **Color-Coded Statuses**: Visual identification of order results.
    - **Zebra Stripes**: Alternating row colors for professional readability.
    - **Complete Timestamps**: Full history of the order lifecycle.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Spreadsheets**: [ExcelJS](https://github.com/exceljs/exceljs)
- **Logic**: Server Components & Server Actions (Next.js)

---

## 📁 Project Structure

```txt
src/
├── app/
│   ├── actions/        # Server Actions (Orders, Shifts, Exports)
│   ├── reports/        # Analytics, Charts & Management Reports
│   └── shifts/         # Shift Management UI
├── components/         # Reusable UI & Chart Components
├── lib/                # Database connection & KPI Utilities
└── types/              # TypeScript Interfaces (Order, Shift)
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- A MongoDB Atlas cluster or local MongoDB instance.

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=kitchen_flow
```

### 3. Installation
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📄 License

This project was developed as a professional-grade MVP for restaurant management. Feel free to extend and modify for your specific business needs.

---
*Updated with Visual Analytics by Antigravity AI*