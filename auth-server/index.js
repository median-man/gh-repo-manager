import { URL } from "url";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config({ path: new URL("../.env", import.meta.url) });
const { REACT_APP_GH_CLIENT_ID, GH_CLIENT_SECRET, CLIENT_URL } = process.env;

function missingEnvParam(param) {
  console.error(`Missing environmental parameter: ${param}`);
  process.exit(1);
}

if (!REACT_APP_GH_CLIENT_ID) {
  missingEnvParam("GH_CLIENT_ID");
}
if (!GH_CLIENT_SECRET) {
  missingEnvParam("GH_CLIENT_SECRET");
}
if (!CLIENT_URL) {
  missingEnvParam("CLIENT_URL");
}

// Error Types
const GIT_HUB_ERROR = "GIT_HUB_ERROR";
const HTTP_ERROR = "HTTP_ERROR";

const app = express();

// Enable cors on specified origin(s) from env. CLIENT_URL may be a string with
// the origin or space separated list of origins.
app.use(cors({ origin: CLIENT_URL.split(/ +/g) }), express.json());

/*
POST /access_token

Use this route to request an access token from GitHub OAuth. Client my first
initiate the web auth flow by requesting an auth code. Then, send a request to
this endpoint with a code field in the body. This route accepts json only.
*/
app.post("/access_token", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      const error = new Error("'code' field required");
      error.type = HTTP_ERROR;
      error.status = 400;
      throw error;
    }

    // Fetch token from GitHub API
    const url = `https://github.com/login/oauth/access_token?client_id=${REACT_APP_GH_CLIENT_ID}&client_secret=${GH_CLIENT_SECRET}&code=${code}`;
    const ghResponse = await fetch(url, {
      method: "post",
      headers: {
        Accept: "application/json",
      },
    });

    // Handle the response from the GitHub API
    if (ghResponse.ok) {
      const body = await ghResponse.json();

      // handle GitHub errors (github uses 200 status for errors)
      if (body.error) {
        const error = new Error(body.error_description);
        error.ghError = body;
        error.type = GIT_HUB_ERROR;
        throw error;
      }

      // send GitHub response if there are no errors
      return res.json(body);
    }

    // handle http errors
    const error = new Error(ghResponse.statusText || "Network Error");
    error.status = ghResponse.status;
    error.type = HTTP_ERROR;
    throw error;
  } catch (error) {
    console.error(error);

    switch (error.type) {
      case GIT_HUB_ERROR:
        return res
          .status(400)
          .json({ error: { message: error.message, ...error } });
      case HTTP_ERROR:
        return res
          .status(error.status)
          .json({ error: { message: error.message, ...error } });
      default:
        return res
          .status(500)
          .json({ error: { message: "Internal server error", ...error } });
    }
  }
});

// Start listening
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`auth-server listening on port ${port}`));
