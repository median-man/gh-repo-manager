import { useState, useEffect } from "react";
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

// TODO: finish GH Authorization web flow
function App() {
  const [ghAccessToken, setGhAccessToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const authState = params.get("state");
    const ghAuthCode = params.get("code");
    const loginState = JSON.parse(localStorage.getItem("loginState"));
    if (
      !loginState ||
      loginState.exp < Date.now() ||
      authState !== loginState.value
    ) {
      return "";
    }
    return ghAuthCode;
  });

  useEffect(() => {
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
    (async () => {
      try {
        const response = await fetch(process.env.REACT_APP_AUTH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: ghAuthCode }),
        });
        const body = await response.json();
        console.log(body);
        if (!response.ok) {
          const httpError = new Error(body.error?.message || "HTTP Error");
          httpError.status = response.status;
          httpError.type = "HTTP_ERROR";
          throw httpError;
        }
        setGhAccessToken(body.access_token);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const handleLoginClick = async () => {
    // Random state Sourced from
    // https://medium.com/@dazcyril/generating-cryptographic-random-state-in-javascript-in-the-browser-c538b3daae50.
    // Thank you Daz.
    try {
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
      localStorage.setItem("loginState", JSON.stringify(loginState));

      const url = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GH_CLIENT_ID}&state=${loginState.value}&scope=repo delete_repo`;
      window.location.assign(url);
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
              onClick={handleLoginClick}
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
          <>
            <p>You must login to view your repos.</p>
          </>
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
