# VaultX Portfolio Aggregator 🚀

**Live Demo:** [vaultx-lake.vercel.app](https://vaultx-lake.vercel.app)

VaultX is a modern, responsive, and highly secure portfolio management and wealth aggregation platform built with React, Vite, and Firebase. It allows users to track diverse asset classes, manage portfolios collaboratively using a family-based architecture, and access real-time market insights.

---

## 🌟 Key Features

- **🔒 Secure Google Authentication:** Seamless user onboarding and secure session management using Firebase Authentication.
- **👨‍👩‍👧‍👦 Family-Based Architecture:** Shared portfolio management. Assets are tied to a `familyId`, enabling real-time collaboration where linked accounts can access, manage, and view shared family assets.
- **📈 Live Market Data Aggregation:** Fetches real-time asset pricing (stocks, crypto, mutual funds) using Yahoo Finance integration (via Vite API proxy to bypass CORS/401s).
- **📊 Dynamic Dashboards & Analytics:** Interactive and visually appealing charts (Performance, Asset Allocation) built with Recharts.
- **☁️ Cloud-Native Backend:** Entirely powered by Firebase Firestore for robust, real-time data synchronization and persistence. Say goodbye to hardcoded mock data!
- **📥 Data Export:** One-click export of portfolio data to PDF (via jsPDF/AutoTable) and Excel (via XLSX).
- **🤖 AI Insights:** Intelligent portfolio breakdown and market analysis.
- **🎨 Modern UI/UX:** Features a beautiful, responsive design with support for Custom Appearances (Dark/Light modes, custom themes).

---

## 🛠️ Architecture & Tech Stack

**Frontend:**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) - Lightning-fast development and optimized production builds.
- [React Router DOM v7](https://reactrouter.com/) - Declarative application routing.
- [Recharts](https://recharts.org/) - Composable charting library.
- [Lucide React](https://lucide.dev/) - Beautiful, consistent iconography.
- [Tailwind CSS / Vanilla CSS modules] - Scalable styling and custom theming.

**Backend & Data Services:**
- [Firebase Auth](https://firebase.google.com/docs/auth) - Identity management (Google Sign-In).
- [Firebase Firestore](https://firebase.google.com/docs/firestore) - NoSQL document database for user profiles, families, and asset tracking.
- **Yahoo Finance API Proxy** - Fetching live market metrics (`query2.finance.yahoo.com` mapped through Vite proxy).

**Utilities:**
- `jsPDF` & `jsPDF-AutoTable` (PDF Generation)
- `xlsx` (Excel Exports)
- `ESLint` (Code Quality)

---

## 📂 Project Structure

```text
VaultX Portfolio Aggregator/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components (Navbar, Modals, Charts, Tables)
│   ├── context/            # Global state management (Auth Context, Theme Context)
│   ├── pages/              # Route-level components (Dashboard, Login, FamilyManagement, etc.)
│   ├── services/           # External integrations (e.g., priceService.js for Yahoo Finance)
│   ├── utils/              # Helper functions and formatters
│   ├── App.jsx             # Main application layout and routing configuration
│   ├── main.jsx            # React entry point
│   └── firebase.config.js  # Firebase initialization and service exports
├── index.html              # Vite entry template
├── vite.config.js          # Vite and proxy configuration
└── package.json            # Dependencies and scripts
```


---

*Built with ❤️ for modern wealth management.*
