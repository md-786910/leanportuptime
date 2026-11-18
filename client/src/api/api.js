// Development (`npm start`) talks to the local API from client/.env
// (REACT_APP_API_URL, default http://localhost:5000); production builds always
// use the live API.
// Other endpoints: "https://leanuptime.duckdns.org"
const API_ENDPOINT =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_API_URL || "http://localhost:5000"
    : "https://app.sitelyze.io";

export { API_ENDPOINT };
