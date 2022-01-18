import { HTTPError } from "./errors";

const GH_API_BASE_URL = "https://api.github.com";

function createGitHubHeaders(accessToken) {
  return {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchGitHubJSON(path, accessToken, options = {}) {
  const response = await fetch(GH_API_BASE_URL + path, {
    method: "GET",
    headers: createGitHubHeaders(accessToken),
    ...options,
  });
  let body = null;
  const isJSON =
    response.headers.has("content-type") &&
    response.headers.get("content-type").includes("application/json");
  if (isJSON) {
    body = await response.json();
  }
  if (!response.ok) {
    throw new HTTPError({
      message:
        body?.message || `HTTP Error response. Status: ${response.status}`,
      status: response.status,
    });
  }
  return body;
}

/**
 * Sends a request to the GitHub Rest API to find the user data for the logged in user.
 *
 * @param {string} accessToken Access token from OAuth Flow
 * @returns User data for the authorized user (from token) from the GitHub Rest API.
 */
export async function fetchGitHubUser(accessToken) {
  return fetchGitHubJSON("/user", accessToken);
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
export async function searchGitHubForRepos(
  accessToken,
  { user, search, perPage = 100 }
) {
  let q = `user:${user}`;
  if (search) {
    q = `${search}+${q}`;
  }
  return fetchGitHubJSON(
    `/search/repositories?q=${q}&per_page=${perPage}`,
    accessToken
  );
}

/**
 *
 * @param {string} accessToken accessToken Access token from OAuth Flow
 * @param {Object} params
 * @param {string} params.owner User's GitHub login name (assuming user it the owner)
 * @param {string} params.repoName The name of the repo to delete
 * @returns Object containing response data from the GitHub Rest API
 */
export async function deleteRepo(accessToken, { owner, repoName }) {
  return fetchGitHubJSON(`/repos/${owner}/${repoName}`, accessToken, {
    method: "DELETE",
  });
}
