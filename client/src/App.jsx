
/**
 * ThesisHub — Authentication UI
 *
 * Provides:
 * - Login and registration forms
 * - API communication
 * - Validation and error messages
 * - Authenticated account display
 * - Client-side logout
 */

import { useEffect, useState } from "react";

// Our existing Express backend.
const API_URL = "http://localhost:3000";

function App() {
  // Which form is displayed: "login" or "register".
  const [mode, setMode] = useState("login");

  // Controlled form inputs: React stores their values.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // The current session contains the user and JWT.
  // It exists only in memory; refreshing logs the user out.
  const [session, setSession] = useState(null);

  // Feedback displayed to the user.
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  /**
   * Check the API connection when the component mounts.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch(`${API_URL}/api/health`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        setApiStatus("Backend connected");
      } catch {
        // Ignore requests cancelled during React cleanup.
        if (!controller.signal.aborted) {
          setApiStatus("Backend unavailable");
        }
      }
    }

    checkBackend();

    return () => controller.abort();
  }, []);

  /**
   * Change between registration and login.
   */
  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setError("");
    setNotice("");
  }

  /**
   * Submit either the registration or login form.
   *
   * event.preventDefault() prevents the browser from
   * reloading the page when the form is submitted.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const endpoint =
        mode === "register" ? "register" : "login";

      // Registration needs a username; login does not.
      const payload =
        mode === "register"
          ? { username, email, password }
          : { email, password };

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      // Display the backend's validation error.
      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      if (mode === "register") {
        // After registration, show the login form.
        changeMode("login");
        setNotice("Account created! Please sign in.");
        return;
      }

      // Verify our new token using a protected endpoint.
      const profileResponse = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Could not verify your session.");
      }

      const profile = await profileResponse.json();

      // Save the authenticated session in React state.
      setSession({
        token: data.token,
        user: profile.user,
      });

      // Don't keep the submitted password in form state.
      setPassword("");
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      // Re-enable the form whether the request succeeded
      // or failed.
      setLoading(false);
    }
  }

  /**
   * Logout means discarding the client-side token.
   * Server-side JWT revocation is outside this MVP.
   */
  function handleLogout() {
    setSession(null);
    setPassword("");
    setError("");
    setNotice("You have signed out.");
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>ThesisHub</h1>
        <p>Share ideas. Challenge assumptions.</p>
      </header>

      <section className="auth-card">
        {session ? (
          // Authenticated screen.
          <>
            <h2>Welcome, {session.user.username}!</h2>

            <p>You are successfully authenticated.</p>
            <p className="account-email">
              {session.user.email}
            </p>

            <button onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          // Registration / login screen.
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                aria-pressed={mode === "login"}
                onClick={() => changeMode("login")}
              >
                Log in
              </button>

              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                aria-pressed={mode === "register"}
                onClick={() => changeMode("register")}
              >
                Register
              </button>
            </div>

            <h2>
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <label htmlFor="username">
                  Username
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    pattern="[A-Za-z0-9_]+"
                    required
                  />
                </label>
              )}

              <label htmlFor="email">
                Email
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label htmlFor="password">
                Password
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete={
                    mode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={mode === "register" ? 12 : undefined}
                  required
                />
              </label>

              {error && (
                <p className="message error" role="alert">
                  {error}
                </p>
              )}

              {notice && (
                <p className="message success" role="status">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>
          </>
        )}
      </section>

      <footer className="app-footer">
        {apiStatus}
      </footer>
    </main>
  );
}

export default App;
