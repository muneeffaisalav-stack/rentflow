# RentFlow | Modern Property Management

Streamline your property management with RentFlow. This application is built with Next.js, Firebase (Firestore & Auth), and Genkit (for AI-powered insights).

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase Project

### Installation
1. Clone the repository (once pushed to GitHub).
2. Install dependencies: `npm install`
3. Set up your Firebase configuration in `src/firebase/config.ts`.
4. Run the development server: `npm run dev`

## GitHub Integration

To push this project to your GitHub repository, run the following commands in your terminal:

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit your changes
git commit -m "Initial commit of RentFlow"

# 4. Add your remote repository (Replace <YOUR_REPO_URL> with yours)
git remote add origin <YOUR_REPO_URL>

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

## Features
- **Dashboard**: Real-time overview of portfolio performance.
- **Properties**: Manage your real estate assets.
- **Tenants**: Directory with automated billing tracking.
- **Invoices**: Generate, track, and export billing records.
- **WhatsApp Integration**: One-click professional reminders for tenants.
- **Admin Panel**: Global platform management for super-admins.
- **Security**: Robust Firestore rules protecting landlord and tenant data.

## Deployment
This app is ready for deployment on **Firebase App Hosting**. Ensure your `apphosting.yaml` is configured correctly for your environment.
