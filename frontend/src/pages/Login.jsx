import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

export const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  const validateForm = () => {
    let newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Username or email is required";
    } else if (formData.email.length < 3) {
      newErrors.email = "Username or email must be at least 3 characters long";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters long";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const recaptchaToken = await recaptchaRef.current.executeAsync();
      if (!recaptchaToken) {
        throw new Error("reCAPTCHA token generation failed");
      }

      await axiosInstance.post("/users/login", {
        email: formData.email,
        username: formData.email,
        password: formData.password,
        recaptchaToken,
      });

      setFormData({
        email: "",
        password: "",
      });
      recaptchaRef.current.reset();
      navigate("/dashboard");
    } catch (error) {
      let errorMessage;
      if (error.response) {
        errorMessage =
          error.response.data.message || "An error occurred during login.";
      } else if (error.request) {
        errorMessage =
          "Unable to connect to the server. Please check your network.";
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
      }
      if (errorMessage.toLowerCase().includes("recaptcha")) {
        errorMessage = "Bot verification failed. Please try again.";
      }
      toast.error(errorMessage);
      recaptchaRef.current.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 transition-all">
      <Card className="w-full max-w-md shadow-lg bg-white dark:bg-slate-800 rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="text-slate-700 dark:text-slate-300"
              >
                Username or Email
              </Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Enter username or email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Password
                </Label>
                <Link
                  to="/app/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              size="invisible"
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-all hover:scale-105"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/app/register"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
