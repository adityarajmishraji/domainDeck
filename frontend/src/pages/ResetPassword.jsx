import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstanse from "@/utils/axios";
import { toast } from "react-toastify";

function ResetPassword() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const validateForm = () => {
    let newErrors = {};
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 7) {
      newErrors.newPassword = "New password must be at least 7 characters long";
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

    if (!token) {
      toast.error("Invalid reset link. Please try again.");
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await axiosInstanse.post(
        "/users/reset-password-token",
        {
          token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        },
        { withCredentials: true }
      );

      toast.success("Password reset successfully! Redirecting to login...");
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => navigate("/app/login"), 3000);
    } catch (error) {
      let errorMessage;
      if (error.response) {
        errorMessage =
          error.response.data.message || "Failed to reset password.";
      } else if (error.request) {
        errorMessage =
          "Unable to connect to the server. Please check your network.";
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
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
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="newPassword"
                className="text-slate-700 dark:text-slate-300"
              >
                New Password
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 dark:text-slate-300"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
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
                  Resetting...
                </div>
              ) : (
                "Reset Password"
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

export default ResetPassword;
