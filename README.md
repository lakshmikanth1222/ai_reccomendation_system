# Smart AI Internship Recommender 🚀

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![Flask](https://img.shields.io/badge/Flask-Backend-green)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Machine%20Learning-orange)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple)

A full-stack web application that intelligently matches students with internship opportunities. The system uses **Natural Language Processing (NLP)** to analyze resumes and **Content-Based Filtering** to recommend the most relevant positions based on skills, education, and sector interests.

# 🌟 Key Features

* **📄 AI Resume Parser:** Automatically extracts technical skills from PDF resumes using `PyMuPDF` and Regex pattern matching.
* **🧠 Intelligent Recommendation Engine:** Uses **TF-IDF Vectorization** and **Cosine Similarity** to compare user profiles against internship descriptions semanticially.
* **📊 Explainable Results:** Provides detailed feedback for every recommendation, showing exactly which skills matched and which are missing (identifying learning opportunities).
* **🎯 Smart Filtering:** Refines matches based on Education Level (Bachelor's/Master's), Branch, and Location preferences.
* **✨ Modern UI:** A responsive, glassmorphism-styled interface built with Bootstrap 5 and vanilla JavaScript.

## 🛠️ Tech Stack

### Backend
* **Python:** Core programming language.
* **Flask:** Web server and API handling (`/recommend`, `/analyze-resume`).
* **Scikit-Learn:** Machine Learning library used for `TfidfVectorizer` and `cosine_similarity`.
* **PyMuPDF (fitz):** Library for parsing text from PDF resumes.

### Frontend
* **HTML5 & CSS3:** Custom styling with CSS variables for theming.
* **Bootstrap 5:** Responsive grid layout and components.
* **JavaScript:** Handles asynchronous API calls and dynamic DOM manipulation.

### Data
* **JSON:** Uses a local `internships.json` file as the database for internship listings.
* # 🛠️ Installation & Execution Guide

Follow these steps to download, set up, and run the project on your local machine.

## 1. Download the Project

### **Option A: Download ZIP (Easiest)**
1.  Locate the green **Code** button at the top right of this repository.
2.  Click it and select **Download ZIP**.
3.  Once downloaded, right-click the `.zip` file and select **Extract All** to unzip it into a folder.

### **Option B: Using Git**
If you have Git installed, run the following command in your terminal:
bash
git clone <your-repository-url>
cd <your-project-folder>

2. Prerequisites
Before running the project, ensure you have Python installed.

Check if Python is installed by typing python --version in your terminal.

If not installed, download it from python.org.

3. Install Dependencies
The project relies on specific Python libraries (Flask, Scikit-Learn, PyMuPDF).

Open your Command Prompt (Windows) or Terminal (Mac/Linux).

Navigate to the folder where you extracted the project:

cd path/to/extracted-folder
Run the installation command:

Bash

pip install -r requirements.txt
(Note: This installs Flask, Flask-Cors, NumPy, Scikit-Learn, and PyMuPDF)
4. Run the Backend Server
You must start the Python server to handle the AI logic.

In the same terminal, run:

Bash

python app.py
You should see a message confirming the server is running:

Running on http://127.0.0.1:5000

⚠️ Important: Keep this terminal window OPEN. If you close it, the AI features will stop working.

5. Launch the Application
Go to the project folder in your file explorer.

Find the file named index.html.

Double-click index.html to open it in your default web browser (Chrome, Edge, Firefox, etc.).

You are now ready to use the Smart AI Internship Recommender! 🚀

## 📂 Project Structure


├── app.py                 # Main Flask application & ML Logic
├── internships.json       # Database of internship listings
├── requirements.txt       # Python dependencies
├── index.html             # User Interface
├── script.js              # Frontend logic (API calls)
└── README.md              # Project Documentation



