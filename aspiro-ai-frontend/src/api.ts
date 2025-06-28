// src/api.ts
import axios from 'axios';

// Create an axios instance with a base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Flask backend API base URL
  timeout: 10000, // Optional: timeout after 10 seconds
  headers: {
    'Content-Type': 'application/json',
    // You can add other default headers here if needed, e.g., for auth tokens later
  },
});

// Optional: You can add interceptors for request or response handling globally
// For example, to automatically add an auth token to requests:
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('aspiroAuthToken'); // Use the correct key from AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
