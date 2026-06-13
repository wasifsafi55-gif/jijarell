# JIJARELL Genève | Premium Luxury AI 3D Marketplace

JIJARELL Genève is a high-end luxury e-commerce platform featuring active 3D visualization, semantic AI product searches, real-time administrative auditing, automated customer confirmation pipelines, and a full-featured admin management panel.

This system is completely decoupled from any local or temporary JSON-file file storage (`db.json`) and has been fully migrated to use **Google Cloud Firestore** as its secure, enterprise-grade cloud database. All products, categories, active promotions, customers, orders, live tracking updates, audit logs, active discount coupons, product reviews, and system parameters are stored in Firestore and persist indefinitely across container restarts.

---

## 🛠️ Required Software & Environment Setup (Windows PC)

To run, test, and develop this application locally on Windows, ensure you have the following software installed:

1. **Node.js**: Recommended Version **v18.x** or **v20.x** (LTS). Installing Node.js automatically installs `npm` (Node Package Manager).
   * Download from: [https://nodejs.org/](https://nodejs.org/)
2. **Git**: (Optional) For cloning or source control.
   * Download from: [https://git-scm.com/](https://git-scm.com/)
3. **IDE / Editor**: Visual Studio Code (VS Code) is recommended for modern TypeScript and React support.

---

## 🔑 Firebase Cloud Integration Setup

The application connects directly to Firebase to power persistent storage (Firestore). Follow these steps to link your own live Firebase database instance:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g., `jijarell-geneve`).
3. (Optional) Enable Google Analytics and click **Create Project**.

### Step 2: Provision Cloud Firestore
1. In the left navigation menu, click **Firestore Database** under Build.
2. Click **Create Database**.
3. Select your Database Location (e.g., closest to your user base/servers) and set security rules in **Start in test mode** initially.
4. Click **Create**.

### Step 3: Extract Firebase Web App Configuration
1. In the Firebase Console home page, click the **Web icon `(</>)`** to register a new Web App.
2. Name the app (e.g., `jijarell-web-prod`).
3. Firebase will generate a `firebaseConfig` object resembling:
   ```json
   {
     "apiKey": "your-api-key",
     "authDomain": "your-project-id.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project-id.appspot.com",
     "messagingSenderId": "your-sender-id",
     "appId": "your-app-id",
     "firestoreDatabaseId": "(default)"
   }
   ```
4. Copy this configuration JSON.

### Step 4: Configure the Project Config File
Create a new file in the root of your project directory called **`firebase-applet-config.json`** (this is where the backend looks for Firebase credentials) containing your configuration:
```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project-id.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project-id.appspot.com",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id",
  "firestoreDatabaseId": "(default)"
}
```

### Step 5: Apply Firestore Security Rules
Ensure safe, secure, and authenticated access to database paths by saving the contents of the local **`firestore.rules`** file located in this directory to your Firebase Console under the **Firestore Database ➔ Rules** tab.

---

## 🌍 Environment Variables

Create a file named **`.env`** in the root of the project directory and supply appropriate values. Reference **`.env.example`** for a template:

```env
# GEMINI_API_KEY: Used for semantic AI chat concierge and product parsing.
# Acquire one via Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY="your_actual_gemini_api_key"

# APP_URL: The self-referential base URL (used for absolute redirection paths).
APP_URL="http://localhost:3000"

# GMAIL SMTP CONFIGURATION (For luxury white-glove order dispatch notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="jijarell.official@gmail.com"
SMTP_PASS="your_16_character_gmail_app_password"
```

*Note: For Gmail SMTP integration, do NOT enter your normal account password. You should visit your Google Account Security settings, enable 2-Step Verification, and generate a 16-character **App Password** for SMTP.*

---

## 🚀 Execution & Command Reference

Open a Command Prompt, PowerShell, or bash terminal in the project directory with Windows and execute the following commands:

### 1. Install Project Dependencies
Pull and install all development and production workspace packages:
```bash
npm install
```

### 2. Launch Local Development Server
Start the Express + Vite hybrid environment (hot-reload is active for server logic and frontend React components):
```bash
npm run dev
```
Once succeeded, open your browser and navigate to:
👉 **`http://localhost:3000`**

### 3. Compile and Build for Production
Bundle frontend static assets and compile backend TypeScript handlers directly into a high-performance, single-bundle, self-contained `dist/server.cjs` file:
```bash
npm run build
```

### 4. Direct Production Run
Test the production build under exact production parameters:
```bash
npm run start
```

---

## 🔒 Administrative Login Credentials
* **Admin Section URL**: Navigate to the dashboard, scroll down to page margins and click open the administrative gate or configure manually.
* **Default Database Admin Password**: `wasif1234` (Stored safely and customizable inside the `settings` collection under the `store_settings` document).
