import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom"; // Added for navigation
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="h-12 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalActiveProjects, setTotalActiveProjects] = useState(0);
  const [expiringProjectsCount, setExpiringProjectsCount] = useState(0); // New state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [customersRes, projectsRes, activeProjectsRes, expiringRes] =
          await Promise.all([
            axiosInstance.get("/customers/total-customers"),
            axiosInstance.get("/projects/total-projects"),
            axiosInstance.get("/projects/total-active-projects"),
            axiosInstance.get("/projects/expiring"), // New API call
          ]);

        setTotalCustomers(customersRes.data.data.total);
        setTotalProjects(projectsRes.data.data.total);
        setTotalActiveProjects(activeProjectsRes.data.data.total);
        setExpiringProjectsCount(expiringRes.data.data.length); // Count expiring projects
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard /> {/* Added for new card */}
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {totalCustomers}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {totalProjects}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {totalActiveProjects}
                </p>
              </CardContent>
            </Card>
            <Card asChild>
              <Link to="/expiring-projects">
                <CardHeader>
                  <CardTitle>Domain Expiry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600">
                    {expiringProjectsCount}
                  </p>
                </CardContent>
              </Link>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
