import axios from "axios";

const API_URL = window.__RUNTIME_CONFIG__?.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
});

export default api;
