// src/api.ts
/**
 * Axios API client configuration for interacting with the Aspiro AI backend.
 *
 * This module sets up a global Axios instance with a base URL and an interceptor
 * to automatically attach JWT authentication tokens to outgoing requests.
 */
import axios from 'axios';

/**
 * The base URL for all API requests.
 * It attempts to read `VITE_API_BASE_URL` from environment variables (common in Vite projects),
 * defaulting to 'http://localhost:5000/api' if not set.
 * @see {@link https://vitejs.dev/guide/env-and-mode.html} for Vite environment variables.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Global Axios client instance.
 * Configured with:
 *  - `baseURL`: Set from `API_BASE_URL`.
 *  - `timeout`: 10 seconds for requests.
 *  - Default `Content-Type` header to `application/json`. This may be overridden
 *    for specific requests (e.g., file uploads using `multipart/form-data`).
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios request interceptor.
 * This function is called before each request is sent.
 * It retrieves the JWT token (named 'aspiroAuthToken') from localStorage
 * and adds it to the `Authorization` header as a Bearer token if found.
 *
 * This automates the process of sending the auth token with protected API requests.
 */
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('aspiroAuthToken'); // Key matches what's set in AuthContext
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // Handle request errors (e.g., network issues before sending)
    // console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Example of a response interceptor (currently commented out):
// This could be used for global response handling, e.g., redirecting on 401 errors
// or transforming response data.
// apiClient.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response) {
//       // Server responded with a status code outside the 2xx range
//       console.error("API Error Response:", error.response.data);
//       // Example: Handle 401 Unauthorized globally (e.g., logout user)
//       // if (error.response.status === 401) {
//       //   // Call logout function from AuthContext or redirect to login
//       // }
//     } else if (error.request) {
//       // Request was made but no response received
//       console.error("API No Response:", error.request);
//     } else {
//       // Error setting up the request
//       console.error("API Request Setup Error:", error.message);
//     }
//     return Promise.reject(error);
//   }
// );

export default apiClient;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Example for response error handling (can be more sophisticated)
// apiClient.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.error("API Error Response:", error.response.data);
//       console.error("Status:", error.response.status);
//       console.error("Headers:", error.response.headers);
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error("API No Response:", error.request);
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       console.error("API Request Setup Error:", error.message);
//     }
//     // You might want to throw the error again or return a custom error object
//     return Promise.reject(error);
//   }
// );

export default apiClient;
