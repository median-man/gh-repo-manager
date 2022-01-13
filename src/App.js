import { useState } from "react";
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <div className="App text-white bg-dark min-vh-100">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand as="h1">GitHub Manager</Navbar.Brand>
          <Navbar.Text className="justify-content-end">
            <Button
              variant={isLoggedIn ? "secondary" : "primary"}
              onClick={() => setIsLoggedIn((state) => !state)}
            >
              {isLoggedIn ? "Logout" : "Login with GitHub"}
            </Button>
          </Navbar.Text>
        </Container>
      </Navbar>
      <Container as="main" className="pt-5">
        {isLoggedIn ? (
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
