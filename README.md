# 🎓 IEEE DU Certificate Admin Web App

A full-stack certificate management system for the IEEE Executive Committee at DU.  
This web application allows admins to add, view, update, and manage participant certificate data, all stored in **Google Sheets** (Sheet1).

Built with:

- 🧑‍💻 **Frontend**: [Next.js](https://ieeedu-admin-certificate.vercel.app/)
- 🐍 **Backend**: [Flask](https://ieeedu-admincertificate.onrender.com)
- 📄 **Database**: Google Sheets (Sheet1)

---

## 📌 Features

- ✅ View all participants and their certificate details
- 📝 Add new participant entries
- 🔄 Syncs in real-time with Google Sheets
- 🗑️ (Optional) Delete or edit participants
- 🔒 (Optional) Admin password/modal-based UI for secure updates
- ☁️ Deployable on Vercel (frontend) and Render (backend)

---

## 📁 Folder Structure

```bash
ieee-certificate-admin/
├── backend/
│ ├── app.py # Flask API for Google Sheets operations
│ ├── credentials.json # Google Sheets API service account credentials
│ └── requirements.txt # Python dependencies
├── frontend/
│ ├── pages/ # Next.js pages (Home, Add, Edit)
│ ├── components/ # Reusable React components
│ ├── public/ # Static assets (logo, images)
│ └── utils/ # Axios client, helpers
├── README.md
```

---

## 🔧 Setup Instructions

### 🔐 Step 1: Google Cloud & Sheets API Setup
```bash
1. **Create a Google Cloud Project**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable APIs**

   - Google Sheets API  
   - Google Drive API

3. **Create a Service Account**

   - Navigate to: IAM & Admin > Service Accounts
   - Click **Create Service Account**
   - Name: `sheets-api-access`
   - No need to assign a role
   - Go to the **Keys** tab → Add Key → JSON
   - Download the key and save it as `credentials.json` in the `backend/` folder

4. **Share the Google Sheet**

   - Open your Google Sheet
   - Share it with the service account email (`xxx@xxx.iam.gserviceaccount.com`)
   - Grant **Editor** access

```
---

## 🐍 Step 2: Backend Setup (Flask)

### 📦 Install Python Requirements

```bash
cd backend
pip install -r requirements.txt

```
### ▶️ Run Flask Backend
```bash
python app.py
Flask will run on: http://localhost:5000
```

## ⚛️ Step 3: Frontend Setup (Next.js)
### 📦 Install Dependencies
```bash

cd frontend
npm install
```
▶️ Run the Development Server
```bash

npm run dev
Your frontend will run on: http://localhost:3000
```
🔗 Backend API URL
Make sure your Axios/fetch requests point to:

```bash

http://localhost:5000/participants
Or use a .env.local in the frontend:


NEXT_PUBLIC_API_URL=http://localhost:5000
Update axios.get() and axios.post() to use this env variable.
```
---

## 🚀 Deployment
### 🔵 Deploy Backend (Flask) on Render

```bash
Push your backend/ folder to GitHub

Create a new Render service:

Type: Web Service

Language: Python

Start Command: python backend/app.py

Add credentials.json as a Secret File

Add build environment: pip install -r requirements.txt
```
### ⚪ Deploy Frontend (Next.js) on Vercel

```bash
Push your frontend/ folder to GitHub

Import your project in Vercel

Add the following environment variable:


NEXT_PUBLIC_API_URL=https://<your-backend-url>.onrender.com
Deploy!
```
---

## 🛡️ Optional Enhancements
```bash
🔄 Add PUT/DELETE routes in Flask for edit/delete functionality

🔐 Modal-based password input in frontend for admin-only actions

📄 Certificate preview/download feature (PDF or hosted image)

📥 Export Sheet data as CSV

📧 Email participant on new certificate issued
```

## 🙋 Support & Contribution
If you want help expanding the features (e.g., adding login, PDF generation, or real-time email sending), feel free to contribute or reach out.