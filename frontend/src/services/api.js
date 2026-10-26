import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // sends the HttpOnly JWT cookie on every request
});

// pull the error message out of an axios error — falls back gracefully
export const errMsg = (e) =>
  e.response?.data?.message || e.message || "Something went wrong";

export default api;
