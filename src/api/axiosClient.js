import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const client = axios.create({
  baseURL,
  withCredentials: true, // send cookies
  headers: { "Content-Type": "application/json" }
});

export default client;