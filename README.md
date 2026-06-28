# 🩸 AnemiaCheck-BD

**AI-powered Anemia Screening & Health Tracking Web Application**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview

AnemiaCheck-BD is a comprehensive healthcare web application designed to help users screen for anemia, track their health metrics, and receive personalized AI-driven insights. Built for the context of Bangladesh, it provides a bilingual interface (Bangla/English) to make healthcare more accessible.

### ✨ Key Features

*   **AI-Powered Anemia Screening**: Analyzes CBC reports (Hb, MCV, etc.) using a deterministic rule engine to predict anemia and its type.
*   **Personalized Health Tracking**: Log daily symptoms, track hemoglobin (HB) trends over time, and monitor your overall health progress.
*   **Multilingual Support**: Fully supports both **Bangla** and **English**, with seamless switching via a language context.
*   **Secure User Authentication**: User registration and login are managed securely with Firebase Authentication.
*   **Interactive Dashboard**: A clean and modern dashboard provides a quick overview of your health stats, latest screening results, and personalized health tips.
*   **Comprehensive History**: View, manage, and delete past screening records, all displayed in your preferred language.

## 🏗️ Tech Stack

*   **Frontend**: React, Tailwind CSS, Lucide Icons
*   **Backend**: FastAPI (Python)
*   **Database & Auth**: Firebase Firestore & Firebase Authentication
*   **Deployment**: (Specify where you plan to deploy, e.g., Vercel, Render)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:
*   **Node.js** (v16 or later) and **npm** / **yarn**
*   **Python** (v3.8 or later) and **pip**
*   A **Firebase** account and project

### 1. Clone the Repository

```bash
git clone https://github.com/Solayman498/anemia-check-bd.git
cd anemia-check-bd
```

### 2. Backend Setup

Navigate to the backend directory, install dependencies, and set up environment variables.

```bash
cd backend
python -m venv venv  # Create a virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder and add your Firebase credentials and Groq API keys:

```
GROQ_API_KEY_1=your_groq_api_key_1
GROQ_API_KEY_2=your_groq_api_key_2
GROQ_API_KEY_3=your_groq_api_key_3
```

### 3. Frontend Setup

Navigate to the frontend directory, install dependencies, and set up environment variables.

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Running the Application

1.  **Start the Backend**:
    ```bash
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Start the Frontend**:
    ```bash
    cd frontend
    npm start
    ```

The frontend will typically be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Solayman498/anemia-check-bd/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Solayman498**

*   GitHub: [@Solayman498](https://github.com/Solayman498)