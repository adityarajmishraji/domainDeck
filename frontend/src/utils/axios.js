import axios from "axios";
import { createBrowserHistory } from "history";

// Create history for navigation outside React components
const history = createBrowserHistory();

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");
        const response = await axiosInstance.post("/users/refresh-token");
        console.log("✅ Token refreshed successfully", response.data);

        processQueue(null);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log(
          "❌ Refresh failed",
          refreshError.response?.data || refreshError.message
        );

        processQueue(refreshError, null);
        isRefreshing = false;

        // Check if already on login page to prevent redirect loop
        if (window.location.pathname !== "/login") {
          console.log("Redirecting to login");
          history.push("/login?message=Session%20expired");
        } else {
          console.log("Already on login page, no redirect needed");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
