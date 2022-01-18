import { HTTPError } from "./errors";

const GH_API_BASE_URL = "https://api.github.com";

function createGitHubHeaders(accessToken) {
  return {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Sends a request to the GitHub Rest API to find the user data for the logged in user.
 *
 * @param {string} accessToken Access token from OAuth Flow
 * @returns User data for the authorized user (from token) from the GitHub Rest API.
 */
export async function fetchGitHubUser(accessToken) {
  const response = await fetch(`${GH_API_BASE_URL}/user`, {
    method: "GET",
    headers: createGitHubHeaders(accessToken),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new HTTPError({
      message: body.message,
      status: response.status,
    });
  }
  return body;
}

/**
 * Sends a "search repositories" request ot GitHub Rest API. Adds a filter to
 * the query to limit results to the provided user.
 *
 * @param {string} accessToken Access token from OAuth Flow
 * @param {Object} params
 * @param {string} params.user User's GitHub login name
 * @param {string} params.search Search string use for finding user's
 * repositories
 * @param {string} [params.perPage=100] Number of results per page. (Max 100)
 * @returns Object containing repository data from GitHub
 */
export async function searchForRepos(
  accessToken,
  { user, search, perPage = 100 }
) {
  let q = `user:${user}`;
  if (search) {
    q = `${search}+${q}`;
  }
  const url = `${GH_API_BASE_URL}/search/repositories?q=${q}&per_page=${perPage}`;
  const response = await fetch(url, {
    method: "GET",
    headers: createGitHubHeaders(accessToken),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new HTTPError({
      message: data.message,
      status: response.status,
    });
  }
  return data;
}
