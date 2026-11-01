
/**
 * ThesisHub — Main React Application
 *
 * Responsibilities:
 * 1. Manage authentication and current user state.
 * 2. Display registration and login forms for guests.
 * 3. Display the publishing form for signed-in users.
 * 4. Display the public feed for everyone.
 * 5. Refresh the feed after publishing, editing or deleting.
 */

import { useEffect, useState } from "react";

import ThesisForm from "./components/ThesisForm.jsx";
import ThesisFeed from "./components/ThesisFeed.jsx";

// Local Express API.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

function App() {
  // Which authentication form is displayed.
  const [mode, setMode] = useState("login");

  // Controlled authentication form fields.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Authenticated user and JWT.
   *
   * Stored in memory only.
   * Refreshing the page clears the session.
   */
  const [session, setSession] = useState(null);

  // Authentication feedback.
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Backend connectivity indicator.
  const [apiStatus, setApiStatus] = useState(
    "Checking backend..."
  );

  /**
   * Any successful post mutation increments refreshKey.
   *
   * This includes:
   * - Publishing
   * - Editing
   * - Deleting
   */
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Check the Express API connection on page load.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch(
          `${API_URL}/api/health`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        setApiStatus("Backend connected");

      } catch {
        if (!controller.signal.aborted) {
          setApiStatus("Backend unavailable");
        }
      }
    }

    checkBackend();

    return () => controller.abort();
  }, []);

  /**
   * Switch between Login and Register.
   */
  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setError("");
    setNotice("");
  }

  /**
   * Submit login or registration.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const endpoint =
        mode === "register" ? "register" : "login";

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

      if (!response.ok) {
        throw new Error(
          data.error || "Authentication request failed."
        );
      }

      if (mode === "register") {
        // Registration doesn't automatically log in.
        changeMode("login");

        setNotice(
          "Account created! Please sign in."
        );

        return;
      }

      /**
       * Verify the login token using the protected
       * current-user endpoint.
       */
      const profileResponse = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error(
          "Could not verify your session."
        );
      }

      const profile = await profileResponse.json();

      // Save the authenticated account and token.
      setSession({
        token: data.token,
        user: profile.user,
      });

      setPassword("");

    } catch (caughtError) {
      setError(
        caughtError.message || "Authentication failed."
      );

    } finally {
      setLoading(false);
    }
  }

  /**
   * Logout clears the in-memory session.
   */
  function handleLogout() {
    setSession(null);
    setPassword("");
    setError("");
    setNotice("You have signed out.");
  }

  /**
   * Notify the public feed when posts change.
   *
   * React updates refreshKey, causing ThesisFeed's
   * useEffect to request the latest posts.
   */
  function handlePostsChanged() {
    setRefreshKey((previous) => previous + 1);
  }

  return (
    <main className="app">
      {/* Plain React and CSS — no new UI framework or dependency. */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">TH</span>
            <div>
              <h1>ThesisHub</h1>
              <p>Share ideas. Challenge assumptions.</p>
            </div>
          </div>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="#feed">Explore theses</a>
            {session && <a className="header-action" href="#publish">+ Publish</a>}
          </nav>
        </div>
      </header>

      <div className="app-workspace">
        <section className="app-primary" aria-label="Investment thesis workspace">
          {/* A small composer entry point keeps the feed visible on first load. */}
          {session && (
            <details id="publish" className="composer-panel">
              <summary>
                <span className="composer-icon" aria-hidden="true">+</span>
                <span><strong>Share an investment thesis</strong><small>What is your investment idea?</small></span>
                <span className="composer-cta">New thesis</span>
              </summary>
              <ThesisForm
                apiUrl={API_URL}
                token={session.token}
                onPublished={handlePostsChanged}
              />
            </details>
          )}

          <ThesisFeed
            apiUrl={API_URL}
            refreshKey={refreshKey}
            session={session}
            onPostsChanged={handlePostsChanged}
          />
        </section>

        <aside className="app-sidebar" aria-label="Account">
        {/* Account panel for signed-in users. */}
        {session ? (
          <section className="signed-in-panel">
            <div>
              <strong>
                Welcome, {session.user.username}!
              </strong>
  
              <p className="account-email">
                {session.user.email}
              </p>
            </div>
  
            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </section>
        ) : (
          <section className="auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={
                  mode === "login" ? "active" : ""
                }
                aria-pressed={mode === "login"}
                onClick={() => changeMode("login")}
              >
                Log in
              </button>
  
              <button
                type="button"
                className={
                  mode === "register" ? "active" : ""
                }
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
                  minLength={
                    mode === "register"
                      ? 12
                      : undefined
                  }
                  required
                />
              </label>
  
              {error && (
                <p
                  className="message error"
                  role="alert"
                >
                  {error}
                </p>
              )}
  
              {notice && (
                <p
                  className="message success"
                  role="status"
                >
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
          </section>
        )}
          <div className="sidebar-help">
            <strong>Ideas worth discussing</strong>
            <p>Present the thesis, the risks and the conditions that would change your mind.</p>
          </div>
        </aside>
      </div>

      <footer className="app-footer">
        <span className={`status-indicator ${apiStatus === "Backend connected" ? "is-connected" : ""}`} aria-hidden="true"></span>
        {apiStatus} · Local project demo
      </footer>
    </main>
  );
}

export default App;
