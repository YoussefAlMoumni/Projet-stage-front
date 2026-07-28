# Intelligent Credit Granting Platform - Frontend

This is the frontend for the Intelligent Credit Granting Platform. It is a single-page application built using **Angular 22** and **TailwindCSS**.

## Key Technologies

- **Angular 22**
- **TypeScript**
- **TailwindCSS** (for styling)
- **RxJS** (for state management and reactive programming)

## Prerequisites

- **Node.js** (v20 or higher recommended)
- **npm** (Node Package Manager)

## Setup & Running Locally

1. Open a terminal and navigate to this directory (`projet_stage_front`).
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
   *(This runs `ng serve` under the hood).*

4. Navigate to `http://localhost:4200/` in your browser.

> **Note**: The frontend expects the Spring Boot backend to be running on `http://localhost:8081`. Ensure the backend is properly configured and running to authenticate and fetch data.

## Project Structure

- `src/app/core/`: Core services (`ApiService`, `AuthService`, `DataStateService`), models, and guards.
- `src/app/features/`: Feature modules and components (e.g., `analyst/dossiers`).
- `src/app/shared/`: Shared UI components, pipes, and directives.
- `src/styles.scss` / `tailwind.config.js`: Global styles and Tailwind configuration.
