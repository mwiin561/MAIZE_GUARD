# Maize Guard Backend (The "Brain")

This folder contains the code that runs behind the scenes. It saves your scans and handles user accounts.

## 🚀 How to Run It (The Easy Way)

Since you have **Docker Desktop**, you don't need to install anything complicated.

1.  **Open your terminal** in this `backend` folder.
2.  **Run this command:**
    ```bash
    docker-compose up
    ```
3.  **That's it!**
    *   Your Backend is now alive at: `http://localhost:5001`
    *   Your Database (MongoDB) is also running.

## 🛠️ How to Make Changes

1.  **Edit the code:** Open any file in this folder (like `server.js`) and change it.
2.  **Save the file:** The Docker container will see your change and restart automatically.

## 📂 What are these files?

*   **`server.js`**: The main front door. It starts everything.
*   **`models/`**: The blueprints.
    *   `User.js`: Defines what a "User" looks like (name, email, password).
    *   `Scan.js`: Defines what a "Scan" looks like (image, disease name, date).
*   **`routes/`**: The menu.
    *   `auth.js`: Handles Login/Signup.
    *   `scans.js`: Handles saving/getting scans.
*   **`docker-compose.yml`**: The instruction manual for Docker to run everything for you.
