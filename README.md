# FinanceFlow - Modern Personal Finance & Expense Tracker

A full-stack, responsive personal finance tracking web application built with **Next.js 16 App Router**, **TypeScript**, **MongoDB / Mongoose**, **Recharts**, and **Tailwind CSS**.

Exclusively designed for personal use to manage income, expenses, available balance, financial survival runway, category distributions, and month-to-month trends.

---

## Key Features

- **Authoritative Balance Calculation**:
  $$\text{Remaining Balance} = \text{Opening Balance} + \text{Total Recorded Income Through Today} - \text{Total Recorded Expenses Through Today}$$
  *Future-dated transactions are strictly excluded from current available funds.*
- **Financial Survival Days Runway Calculator**:
  $$\text{Daily Burn Rate} = \frac{\text{Eligible Window Expenses}}{\text{Historical Window Days}}$$
  $$\text{Estimated Survival Days} = \left\lfloor \frac{\text{Current Available Balance}}{\text{Daily Burn Rate}} \right\rfloor$$
  *Configurable across 7, 30, 60, and 90-day historical windows with transparent depletion date projection.*
- **Interactive Donut & Bar Charts**:
  - Expense category donut chart powered by Recharts with total monthly spending centered.
  - Income distribution bar chart.
  - Interactive click on any category or slice drills down to an itemized modal where transactions can be viewed, edited, or deleted.
- **Unified Transactions Management**:
  - Combined income & expense ledger.
  - Real-time search, category filtering, date range selector, and amount/date sorting.
  - Filtered summary bar calculating total income, total expenses, and net cash flow for the active view.
  - Responsive desktop table and mobile cards with pagination.
- **Month-to-Month Comparison**:
  - Compare any base month with a target month.
  - Difference and percentage change calculations.
  - Grouped bar charts, 6-month historical trend line, and category shift table.
- **Configurable Settings**:
  - Currency preference (default: Bangladeshi Taka `BDT ৳`, supporting `USD $`, `EUR €`, `GBP £`, `INR ₹`, etc.).
  - Configurable Opening Balance.
  - Custom categories creation, color styling, and non-destructive disable/enable toggling.
  - Demo data reset button.

---

## Technology Stack

- **Frontend & Framework**: Next.js 16 (App Router with `layout.tsx` & `page.tsx`), React 19, TypeScript, Tailwind CSS, Recharts, Lucide React, date-fns.
- **Backend & Route Handlers**: Next.js 16 Route Handlers (`app/api/**/route.ts`) backed by shared database and calculation modules.
- **Database**: MongoDB / Mongoose with automatic fallback to high-performance local persistent JSON document storage in sandbox environments.

---

## Next.js 16 App Router Structure

```
app/
├── layout.tsx                  # Root Server Layout with metadata & HTML head
├── page.tsx                    # Dashboard page
├── globals.css                 # Tailwind CSS styles
├── providers.tsx               # Client state providers, navigation shell & modals
├── transactions/
│   └── page.tsx                # Transactions management page
├── comparison/
│   └── page.tsx                # Month-to-month comparison page
├── settings/
│   └── page.tsx                # Application preferences & categories page
└── api/                        # Next.js 16 Route Handlers
    ├── expenses/route.ts
    ├── expenses/[id]/route.ts
    ├── income/route.ts
    ├── income/[id]/route.ts
    ├── dashboard/route.ts
    ├── comparison/route.ts
    ├── balance/route.ts
    ├── survival-estimate/route.ts
    ├── categories/route.ts
    ├── settings/route.ts
    └── clear/route.ts
```

---

## Installation & Setup

1. **Clone or unzip the project**:
   ```bash
   cd financeflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Optionally configure your MongoDB connection:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/personal_finance?retryWrites=true&w=majority"
   ```
   *(If omitted, FinanceFlow automatically persists records in `data/db.json` using the exact same document models.)*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard?month=YYYY-MM` | Complete dashboard metrics, category breakdowns & survival runway |
| `GET` | `/api/expenses` | List/search/filter expenses with pagination |
| `POST` | `/api/expenses` | Log a new expense (validated via Zod) |
| `PATCH` | `/api/expenses/:id` | Update an existing expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense record |
| `GET` | `/api/income` | List/search/filter income with pagination |
| `POST` | `/api/income` | Log an income record (validated via Zod) |
| `PATCH` | `/api/income/:id` | Update an income record |
| `DELETE` | `/api/income/:id` | Delete an income record |
| `GET` | `/api/comparison?from=YYYY-MM&to=YYYY-MM` | Month-over-month financial comparison |
| `GET` | `/api/survival-estimate?days=30` | Financial survival days calculation |
| `GET` / `POST` | `/api/categories` | Manage expense & income categories |
| `GET` / `PATCH` | `/api/settings` | Retrieve or update user preferences |
| `POST` | `/api/seed` | Reset database with fresh sample records |
