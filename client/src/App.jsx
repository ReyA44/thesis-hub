
/**
 * ThesisHub — Main React Component
 *
 * Responsibilities:
 * 1. Display the initial application interface.
 * 2. Check whether the backend is available.
 * 3. Display the backend connection status.
 */

// Import React hooks.
//
// useState: Stores information that can change over time.
// useEffect: Runs side effects, such as API requests.
import { useEffect, useState } from "react";

/**
 * App()
 *
 * The main React component.
 *
 * A React component is a function that returns JSX,
 * describing what should appear on the webpage.
 *
 * Returns:
 * JSX elements representing the ThesisHub interface.
 */
function App() {

  /**
   * STATE
   *
   * useState() creates a state variable and an updater.
   *
   * apiStatus: The current connection status message.
   * setApiStatus: Function that updates apiStatus.
   *
   * Initial value: "Checking backend..."
   *
   * Updating state causes React to re-render the component.
   */
  const [apiStatus, setApiStatus] = useState(
    "Checking backend..."
  );

  /**
   * SIDE EFFECT — API CONNECTION CHECK
   *
   * useEffect runs after React renders the component.
   *
   * We use it to request information from the backend.
   */
  useEffect(() => {

    /**
     * checkBackend()
     *
     * An asynchronous function that contacts our Express API.
     */
    async function checkBackend() {

      try {

        // Send an HTTP GET request to the backend.
        //
        // fetch() returns a Promise containing the response.
        // The default HTTP method is GET.
        const response = await fetch(
          "http://localhost:3000/api/health"
        );

        // response.ok is true for HTTP status codes 200–299.
        //
        // If the server returned an unsuccessful status,
        // throw an error to enter the catch block.
        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        // Convert the JSON response into a JavaScript object.
        //
        // Expected data:
        // {
        //   status: "ok",
        //   service: "thesis-hub-api"
        // }
        const data = await response.json();

        // Update React state with the server's name.
        // React automatically updates the displayed message.
        setApiStatus(`Connected: ${data.service}`);

      } catch (error) {

        // Log the error for debugging.
        console.error("API connection error:", error);

        // Inform the user that the backend is unavailable.
        setApiStatus("Backend unavailable");
      }
    }

    // Execute the asynchronous function defined above.
    checkBackend();

  }, []);

  // The empty dependency array [] tells React to run this
  // effect on mount, rather than after every state update.
  //
  // In React's development Strict Mode, it may run twice
  // to help detect issues with side effects.

  /**
   * RENDER
   *
   * return (...) contains JSX.
   *
   * JSX resembles HTML but is written inside JavaScript.
   * React converts it into the user interface.
   */
  return (
    <main>
      <h1>ThesisHub</h1>

      <p>Structured Investment Thesis Network</p>
      <p>Backend status: {apiStatus}</p>
    </main>
  );
}

// Export the component so other files can import it.
// In particular, main.jsx imports App to render our application.
export default App;
