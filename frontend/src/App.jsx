import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppLayout from "./components/AppLayout";
import Customers from "./pages/Customers.jsx";
import Projects from "./pages/Projects.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import ExpiringProjects from "./pages/ExpiringProjects";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { path: "dashboard", element: <Dashboard /> },
            { path: "customers", element: <Customers /> },
            { path: "projects", element: <Projects /> },
            { path: "profile", element: <Profile /> },
            { path: "expiring-projects", element: <ExpiringProjects /> }, // New route
          ],
        },
      ],
    },
    {
      path: "/",
      element: <PublicRoute />,
      children: [
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "forgot-password", element: <ForgotPassword /> },
        { path: "reset-password", element: <ResetPassword /> },
        { path: "", element: <Login /> },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
