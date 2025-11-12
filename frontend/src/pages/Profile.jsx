import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Lock,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/utils/axios";

const Profile = () => {
  const [adminData, setAdminData] = useState({
    username: "",
    email: "",
    fullname: "",
    avatar: null,
    isActive: false,
    createdAt: "",
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/users/me");
        setAdminData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-800 bg-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-800 bg-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Cover/Header Section */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Info Section */}
          <CardContent className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-center space-x-6 -mt-16">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={adminData.avatar}
                    alt={adminData.fullname}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {adminData.fullname
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {adminData.isActive && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Name and Status */}
              <div className="pt-16">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {adminData.fullname}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  @{adminData.username}
                </p>
                <div className="flex items-center mt-2">
                  <Badge
                    variant={adminData.isActive ? "default" : "secondary"}
                    className={`flex items-center space-x-1 ${
                      adminData.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{adminData.isActive ? "Active" : "Inactive"}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="mt-6 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {adminData.username}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {adminData.email}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Member Since
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(adminData.createdAt)}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(adminData.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
