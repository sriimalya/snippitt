import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Base URL for all requests
  withCredentials: true, // Required for cookies
});

// Optional: Global error handling (e.g., redirect on 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/auth/sign-in"; // Redirect to Sign-In Page
    }
    return Promise.reject(error);
  }
);

export default api;