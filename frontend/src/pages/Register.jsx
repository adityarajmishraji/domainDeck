import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstanse from "@/utils/axios";
import { toast } from "react-toastify";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullname: "",
    password: "",
    avatar: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, and underscores allowed";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }
    if (!formData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    } else if (formData.fullname.length < 3) {
      newErrors.fullname = "Full name must be at least 3 characters long";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 7 characters long";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    setLoading(true);

    setErrors({});

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("fullname", formData.fullname);
    data.append("password", formData.password);
    if (formData.avatar) {
      data.append("avatar", formData.avatar);
    }
    try {
      await axiosInstanse.post("/users/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData({
        username: "",
        email: "",
        fullname: "",
        password: "",
        avatar: null,
      });
      if (avatarInputRef.current) avatarInputRef.current.value = "";

      navigate("/app/login");
    } catch (error) {
      let errorMessage =
        error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
      console.log(error, "Error while creating the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 transition-all">
      <Card className="w-full max-w-md shadow-lg bg-white dark:bg-slate-800 rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="username"
                className="text-slate-700 dark:text-slate-300"
              >
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
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
                placeholder="Enter email"
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
              <Label
                htmlFor="fullname"
                className="text-slate-700 dark:text-slate-300"
              >
                Full Name
              </Label>
              <Input
                id="fullname"
                name="fullname"
                type="text"
                placeholder="Enter full name"
                value={formData.fullname}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {errors.fullname && (
                <p className="mt-2 text-sm text-red-600">{errors.fullname}</p>
              )}
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-slate-700 dark:text-slate-300"
              >
                Password
              </Label>
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
            <div>
              <Label
                htmlFor="avatar"
                className="text-slate-700 dark:text-slate-300"
              >
                Avatar (Optional)
              </Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleChange}
                disabled={loading}
                ref={avatarInputRef}
                className="mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-all hover:scale-105"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                "Register"
              )}
            </Button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
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

export default Register;
