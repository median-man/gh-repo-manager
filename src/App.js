import { useState, useEffect } from "react";
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

const STORAGE_KEY_LOGIN_STATE = "loginState";
const STORAGE_KEY_ACCESS_TOKEN = "ghAccessToken";

function App() {
  const [ghAccessToken, setGhAccessToken] = useState(
    () => sessionStorage.getItem(STORAGE_KEY_ACCESS_TOKEN) || ""
  );
  const [user, setUser] = useState(null);

  // Send request for an access_code if the url params from GitHub redirect are
  // present.
  useEffect(() => {
    // Check for code in params to do the auth flow
    const params = new URLSearchParams(window.location.search);
    const authState = params.get("state");
    const ghAuthCode = params.get("code");
    const loginState = JSON.parse(localStorage.getItem("loginState"));
    if (
      !ghAuthCode ||
      !loginState ||
      loginState.exp < Date.now() ||
      authState !== loginState.value
    ) {
      return;
    }

    // This function sends a request for the access_token and completes the
    // login flow.
    (async () => {
      try {
        // Send request
        const response = await fetch(process.env.REACT_APP_AUTH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: ghAuthCode }),
        });
        const body = await response.json();
        if (!response.ok) {
          throw new HTTPError({
            message: body.error?.message,
            status: response.status,
          });
        }
        setGhAccessToken(body.access_token);
      } catch (error) {
        console.error(error);
        alert("Unable to authenticate with GitHub.");
      } finally {
        // Clear login state from local storage
        localStorage.removeItem(STORAGE_KEY_LOGIN_STATE);
      }
    })();
  }, []);

  useEffect(() => {
    // synchronize session storage with access token
    sessionStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, ghAccessToken);

    if (!ghAccessToken) {
      return;
    }

    // If the user is logged in (ghAccessToken is set), then remove the
    // ?code=... params from the url. Use replace state to avoid using using
    // back button to re-run the auth.
    window.history.replaceState({}, document.title, window.location.pathname);

    // Fetch user
    (async () => {
      try {
        const ghUserResponse = await fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${ghAccessToken}`,
          },
        });
        const body = await ghUserResponse.json();
        if (!ghUserResponse.ok) {
          throw new HTTPError({
            message: body.message,
            status: ghUserResponse.status,
          });
        }
        setUser(body);
      } catch (error) {
        console.log(error);
        alert(
          "There was a problem logging in. Unable to fetch your username and info."
        );
      }
    })();
  }, [ghAccessToken]);

  const handleToggleLoginClick = async () => {
    try {
      if (ghAccessToken) {
        // Currently user is logged in. Clear the access token to logout.
        setGhAccessToken("");
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
            <Button
              variant={ghAccessToken ? "secondary" : "primary"}
              onClick={handleToggleLoginClick}
            >
              {ghAccessToken ? "Logout" : "Login with GitHub"}
            </Button>
          </Navbar.Text>
        </Container>
      </Navbar>
      <Container as="main" className="pt-5">
        {ghAccessToken ? (
          <RepositoriesView />
        ) : (
          <p>You must login to view your repos.</p>
        )}
      </Container>
    </div>
  );
}

function RepositoriesView() {
  return (
    <>
      <header>
        <h2>Repositories</h2>
      </header>
      <Form className="pt-5">
        <Row>
          <Col lg={6}>
            <InputGroup className="mb-3">
              <FormControl
                placeholder="Search repo names"
                aria-label="Search repo names"
                aria-describedby="find-repos-btn"
              />
              <Button variant="primary" id="find-repos-btn">
                Find repos
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </Form>
      <Row className="mt-3">
        <Col>
          <ButtonGroup aria-label="Basic example">
            <Button variant="danger">Delete</Button>
            <Button variant="secondary">Clear</Button>
          </ButtonGroup>
        </Col>
      </Row>
      <Row>
        <Col lg={8}>
          <Table variant="dark" size="sm" responsive="sm" className="mt-5">
            <thead>
              <tr>
                <th>Select</th>
                <th>Name</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
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
                    href="https://github.com/median-man/demo-proj"
                    target="_blank"
                    rel="noreferrer"
                  >
                    demo-proj
                  </a>
                </td>
                <td>4-22-2021</td>
                <td>5-16-2021</td>
              </tr>
              <tr>
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
                    href="https://github.com/median-man/demo-proj"
                    target="_blank"
                    rel="noreferrer"
                  >
                    demo-proj
                  </a>
                </td>
                <td>4-22-2021</td>
                <td>5-16-2021</td>
              </tr>
              <tr>
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
                    href="https://github.com/median-man/demo-proj"
                    target="_blank"
                    rel="noreferrer"
                  >
                    demo-proj
                  </a>
                </td>
                <td>4-22-2021</td>
                <td>5-16-2021</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}

export default App;
