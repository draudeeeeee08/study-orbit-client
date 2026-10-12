# Study Orbit

**Group Members:** 
* Justine Eduard T. Mercado (Frontend - Core Study Flow & Subject Routing)
* Mark Rayshawn T. Villanueva (Frontend - Card Management & Statistics)
* Cyrus Justine Q. Chu (Backend - API & Database)

## Concept & Data Processing
Study Orbit is a full-stack MERN spaced-repetition flashcard application designed to optimize learning retention. The application processes user study sessions by capturing performance ratings ("Again", "Hard", "Good", "Easy") and feeds them into a custom backend implementation of the SuperMemo-2 (SM-2) algorithm. It dynamically calculates and updates the subsequent review intervals, retention ease factors, and next-due dates for every card, while aggregating session data to compute global user accuracy and identify hardest-to-retain subjects.

## Features
* **Spaced Repetition Engine:** Implements SM-2 logic to automatically schedule flashcard reviews based on individual recall performance.
* **Subject & Deck Management:** Create, organize, and track study materials across distinct subjects.
* **Performance Analytics:** Real-time calculation of overall retention rates, study streaks, and hardest-card reports.
* **Study Session Tracking:** Logs historical session duration, card counts, and accuracy percentages.

## Screenshots
*(Note:Screenshots are in separated folder)*

## Setup Instructions
1. Clone the repository: `git clone https://github.com/draudeeeeee08/study-orbit-client.git`
2. Navigate to the client directory: `cd study-orbit-client`
3. Install dependencies: `npm install`
4. Create a `.env` file in the root directory.
5. Start the Vite development server: `npm run dev`

## Required Environment Variables
Create a `.env` file containing the following variable. (Do not commit this file to Git).
```env
VITE_API_URL=http://localhost:5000/api

