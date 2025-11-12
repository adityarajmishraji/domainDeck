import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstanse from "@/utils/axios";
import { toast } from "react-toastify";

function ForgotPassword() {
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
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
      const response = await axiosInstanse.post(
        "/users/forgot-password",
        {
          email: formData.email,
        },
        { withCredentials: true }
      );

      toast.success(
        response.data?.message || "Password reset link sent to your email!"
      );
      setFormData({ email: "" });
    } catch (error) {
      let errorMessage;
      if (error.response) {
        errorMessage =
          error.response.data.message || "Failed to send reset link.";
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 transition-all">
      <Card className="w-full max-w-md shadow-lg bg-white dark:bg-slate-800 rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="text-slate-700 dark:text-slate-300"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-all hover:scale-105"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Back to{" "}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword;
