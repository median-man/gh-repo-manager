import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { HTTPError } from "./errors";

// Bootstrap components
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Spinner from "react-bootstrap/Spinner";

const STORAGE_KEY_LOGIN_STATE = "loginState";
const STORAGE_KEY_ACCESS_TOKEN = "ghAccessToken";

const GH_API_BASE_URL = "https://api.github.com";

function App() {
  const [ghAccessToken, setGhAccessToken] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [user, setUser] = useState(null);

  // manage auth flow
  useEffect(() => {
    let token = sessionStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
    let ghUserData = null;
    const loginState = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LOGIN_STATE)
    );
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    const codeParam = params.get("code");

    // Use replace state to avoid using using back button to re-run the auth.
    // The presence of the params is used to determine if the page loaded after
    // GitHub login redirect.
    window.history.replaceState({}, document.title, window.location.pathname);

    const isStateFresh = loginState && loginState.exp > Date.now();
    if (!token && !isStateFresh) {
      // User is not logged in and auth flow is not in progress
      return;
    }

    setAuthPending(true);

    (async () => {
      try {
        // Verify state and request access token if there is no token
        if (!token && stateParam === loginState.value) {
          const response = await fetch(process.env.REACT_APP_AUTH_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: codeParam }),
          });
          const body = await response.json();
          if (!response.ok) {
            throw new HTTPError({
              message: body.error?.message,
              status: response.status,
            });
          }
          token = body.access_token;
        }

        // Fetch the user data from GitHub if token exists
        {
          const response = await fetch(`${GH_API_BASE_URL}/user`, {
            method: "GET",
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token}`,
            },
          });
          const body = await response.json();
          if (!response.ok) {
            throw new HTTPError({
              message: body.message,
              status: response.status,
            });
          }
          ghUserData = body;
        }

        // Persist token and update App state
        sessionStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, token);
        setGhAccessToken(token);
        setUser(ghUserData);
      } catch (error) {
        console.error(error);
        alert("Unable to login.");
      } finally {
        localStorage.removeItem(STORAGE_KEY_LOGIN_STATE);
        setAuthPending(false);
      }
    })();
  }, []);

  const handleToggleLoginClick = async () => {
    if (authPending) {
      return;
    }
    try {
      if (ghAccessToken) {
        // Currently user is logged in. Clear the access token to logout.
        sessionStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
        setGhAccessToken("");
        setUser(null);
        return;
      }
      // Random state Sourced from
      // https://medium.com/@dazcyril/generating-cryptographic-random-state-in-javascript-in-the-browser-c538b3daae50.
      // Thank you Daz.
      const validChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let array = new Uint8Array(40);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < array.length; i += 1) {
        array[i] = validChars.charCodeAt(array[i] % validChars.length);
      }
      array = array.map((x) => validChars.charCodeAt(x % validChars.length));
      const loginState = {
        value: String.fromCharCode.apply(null, array),
        exp: Date.now() + 59000,
      };

      // Store state in local storage to compare after github redirects back to
      // the app
      localStorage.setItem(STORAGE_KEY_LOGIN_STATE, JSON.stringify(loginState));

      // Direct user to GitHub for OAuth code
      const gitHubLoginUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GH_CLIENT_ID}&state=${loginState.value}&scope=repo delete_repo`;
      window.location.assign(gitHubLoginUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App text-white bg-dark min-vh-100">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand as="h1">GitHub Manager</Navbar.Brand>
          <Navbar.Text className="justify-content-end">
            <AuthButton
              isPending={authPending}
              isLoggedIn={ghAccessToken !== ""}
              onClick={handleToggleLoginClick}
            />
          </Navbar.Text>
        </Container>
      </Navbar>
      <Container as="main" className="pt-5">
        {authPending ? (
          <p>Logging in with GitHub.</p>
        ) : ghAccessToken ? (
          <RepositoriesView user={user} ghAccessToken={ghAccessToken} />
        ) : (
          <p>You must login to view your repos.</p>
        )}
      </Container>
    </div>
  );
}

function RepositoriesView({ user, ghAccessToken }) {
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [repoData, setRepoData] = useState(null);
  useEffect(() => {
    console.info("repoData:", repoData);
  }, [repoData]);
  const handleSearchFormSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    try {
      let q = `user:${user.login}`;
      if (search.trim()) {
        q = `${search.trim()}+${q}`;
      }
      const url = `${GH_API_BASE_URL}/search/repositories?q=${q}&per_page=100`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${ghAccessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HTTPError({
          message: data.message,
          status: response.status,
        });
      }
      setRepoData(data);
    } catch (error) {
      alert("Uh oh. Something went wrong. Unable to fetch your repos.");
      console.log(error);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <header>
        <h2>Repositories</h2>
      </header>
      <Form className="pt-5" onSubmit={handleSearchFormSubmit}>
        <Row>
          <Col lg={6}>
            <InputGroup className="mb-3">
              <FormControl
                placeholder="Search repo names"
                aria-label="Search repo names"
                aria-describedby="find-repos-btn"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button variant="primary" id="find-repos-btn" type="submit">
                Find repos
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </Form>
      {/* Hide controls for repos if there aren't any. Use visibility to avoid UI jumps */}
      <Row className={`mt-3 ${repoData?.items.length ? "" : "invisible"}`}>
        <Col>
          <ButtonGroup aria-label="Basic example">
            <Button variant="danger">Delete</Button>
            <Button variant="secondary">Clear</Button>
          </ButtonGroup>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col lg={8}>
          {pending && <p>Searching GitHub for your repositories...</p>}
          {!pending && !repoData && (
            <p>
              Enter a search and click "Find repos" to search your repositories
              on GitHub. Leave the search blank to find all your repos. (Can
              only display up to 100 repositories.)
            </p>
          )}
          {repoData?.total_count === 0 && (
            <p>There were no repos matching your search.</p>
          )}
          {repoData?.items.length > 0 && <p>Displaying {repoData.items.length} of {repoData.total_count} matching repositories.</p>}
          {repoData?.items.length > 0 && (
            <Table variant="dark" size="sm" responsive="sm" className="mt-5">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Issues</th>
                  <th>Visibility</th>
                  <th>Stars</th>
                  <th>Forks</th>
                  <th>GH Pages</th>
                </tr>
              </thead>
              <tbody>
                {repoData.items.map((repo) => {
                  return (
                    <tr key={repo.id}>
                      <td>
                        <div key="checkbox" className="mb-3">
                          <Form.Check type="checkbox" id={`check-api-checkbox`}>
                            <Form.Check.Input
                              type="checkbox"
                              aria-label="check to include the repo in the selection for editing"
                            />
                          </Form.Check>
                        </div>
                      </td>
                      <td>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {repo.name}
                        </a>
                      </td>
                      <td>{repo.created_at.split("T")[0]}</td>
                      <td>{repo.updated_at.split("T")[0]}</td>
                      <td>{repo.open_issues}</td>
                      <td>{repo.private ? "private" : "public"}</td>
                      <td>{repo.stargazers_count}</td>
                      <td>{repo.forks_count}</td>
                      <td>{repo.has_pages ? "yes" : "no"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
    </>
  );
}

RepositoriesView.propTypes = {
  user: PropTypes.object.isRequired,
  ghAccessToken: PropTypes.string.isRequired,
};

function AuthButton({ isPending, isLoggedIn, onClick }) {
  return (
    <Button
      variant={isPending || isLoggedIn ? "secondary" : "primary"}
      onClick={onClick}
      disabled={isPending}
    >
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className={isPending ? "" : "d-none"}
      />{" "}
      {isPending
        ? "Logging in ..."
        : isLoggedIn
        ? "Logout"
        : "Login with GitHub"}
    </Button>
  );
}

AuthButton.propTypes = {
  isPending: PropTypes.bool.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default App;
