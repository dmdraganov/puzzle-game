# Project Overview

This project is a web-based puzzle game. Users can select a difficulty level, which determines the grid size of the puzzle. The game loads an image and splits it into draggable pieces. The objective is to drag and drop these pieces into their correct positions on the board.

The game includes a timer, a scoring system, and a hint feature. Progress is automatically saved to the browser's local storage, allowing users to resume their game later.

## Key Technologies

-   **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3
-   **Bundler/Build Tool:** None. The project is structured with native ES Modules and does not require a build step.

## Architecture

The project follows a Model-View-Controller (MVC) like pattern:

-   **`index.html`**: The main entry point for the application.
-   **`src/main.js`**: Initializes the game by creating instances of the `Game` and `View` classes.
-   **Model (`src/game/`)**:
    -   `game.js`: Contains the core game logic, including piece creation, position validation, and win conditions.
    -   `piece.js`: A simple class representing a single puzzle piece.
-   **View (`src/view/view.js`)**: Manages all rendering and user interactions, such as drag-and-drop, piece snapping, and UI updates.
-   **Utilities (`src/utils/`)**: A collection of helper modules for features like the timer (`timer.js`), local storage (`storage.js`), and audio feedback (`audio.js`).
-   **Styles (`src/styles/main.css`)**: Contains all the CSS for styling the application.

# Building and Running

## Running the Application

This project does not require a build step. To run the game, you can serve the project directory using a simple local web server.

1.  **Start a local server.** A common way to do this is with Python's built-in server. In your terminal, from the project root directory, run:
    ```bash
    python3 -m http.server
    ```
    Or, if you have Node.js installed:
    ```bash
    npx server
    ```
2.  **Open the game in your browser.** Navigate to the local address provided by the server (e.g., `http://localhost:8000`).

## Running Tests

There are no automated tests for this project.

# Development Conventions

-   **Modularity:** The codebase is organized into ES Modules, separating concerns between game logic, view, and utilities.
-   **State Management:** Game state is managed within the `Game` class, while view-related state is handled by the `View` class. The `storage.js` utility is used for persisting the game state.
-   **User Interaction:** Drag-and-drop functionality is implemented from scratch, supporting both mouse and touch events.
-   **Styling:** CSS variables are used for theming and maintaining consistency in the UI.
