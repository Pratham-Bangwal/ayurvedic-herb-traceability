import axios from 'axios';

const API_URL = window.__RUNTIME_CONFIG__?.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: API_URL });

// Unwrap backend { data: ... } envelope for convenience
api.interceptors.response.use(
  (res) => {
    if (res?.data && Object.prototype.hasOwnProperty.call(res.data, 'data')) {
      return { ...res, data: res.data.data, _raw: res.data };
    }
    return res;
  },
  (err) => Promise.reject(err)
);

export default api;
