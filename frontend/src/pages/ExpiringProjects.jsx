import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";
import { Label } from "recharts";

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function formatTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now; // Difference in milliseconds

  if (diffMs < 0) {
    // Overdue
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Overdue by ${days} days, ${hours} hours, ${minutes} minutes`;
  }

  // Not overdue
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${days} days, ${hours} hours, ${minutes} minutes`;
}

function ExpiringProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [duration, setDuration] = useState("1");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/projects/expiring");
        setProjects(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch expiring projects");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Real-time timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects((prev) => [...prev]); // Trigger re-render
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Load Razorpay checkout.js dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById("razorpay-script")) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay checkout script"));
      document.body.appendChild(script);
    });
  };

  // Handle project renewal
  const handleRenew = async (project) => {
    setSelectedProject(project);
    setIsRenewOpen(true);
  };

  const initiatePayment = async () => {
    if (
      !duration ||
      !Number.isInteger(parseInt(duration)) ||
      parseInt(duration) < 1
    ) {
      toast.error("Please select a valid duration");
      return;
    }

    setIsProcessing(true);
    try {
      // Call /renew/initiate
      const response = await axiosInstance.post(
        `/projects/${selectedProject._id}/renew/initiate`,
        { duration: parseInt(duration) }
      );
      const { orderId, amount, currency, keyId } = response.data.data;

      // Load Razorpay script
      await loadRazorpayScript();

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Project Renewal",
        description: `Renew ${selectedProject.title} for ${duration} year(s)`,
        handler: async (response) => {
          try {
            // Call /renew/confirm
            const confirmResponse = await axiosInstance.post(
              `/projects/${selectedProject._id}/renew/confirm`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                duration: parseInt(duration),
                fileFormat: "pdf", // Default to PDF
              }
            );
            // Update project in state
            setProjects((prev) =>
              prev.map((p) =>
                p._id === selectedProject._id
                  ? confirmResponse.data.data.project
                  : p
              )
            );
            toast.success(
              confirmResponse.data.data.fileError
                ? `Project renewed, but ${confirmResponse.data.data.fileError}`
                : "Project renewed successfully"
            );
            if (confirmResponse.data.data.filePath) {
              toast.info(
                `File generated at: ${confirmResponse.data.data.filePath}`
              );
            }
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Failed to confirm payment"
            );
          } finally {
            setIsProcessing(false);
            setIsRenewOpen(false);
            setSelectedProject(null);
            setDuration("1");
          }
        },
        prefill: {
          email: selectedProject.customer?.email || "",
          name:
            selectedProject.customer?.name ||
            selectedProject.createdBy?.fullname ||
            "",
        },
        theme: {
          color: "#2563eb", // Match your blue theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to initiate payment"
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
        Expiring Projects
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : projects.length > 0 ? (
          projects.map((project) => {
            const endDate = new Date(project.domainEndDate);
            const daysRemaining =
              (endDate - new Date()) / (1000 * 60 * 60 * 24);
            const isOverdue = daysRemaining < 0;
            const isCritical = daysRemaining > 0 && daysRemaining <= 2;
            const canRenew = project.isActive; // Show Renew button for all active projects

            return (
              <Card
                key={project._id}
                className="hover:bg-blue-50 dark:hover:bg-gray-800"
              >
                <CardHeader>
                  <CardTitle className="text-blue-800 dark:text-blue-400">
                    {project.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">
                    End Date:{" "}
                    {endDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p
                    className={`${
                      isOverdue
                        ? "text-red-600"
                        : isCritical
                        ? "text-orange-600"
                        : "text-green-600"
                    } font-semibold`}
                  >
                    {formatTimeRemaining(project.domainEndDate)}
                  </p>
                  {canRenew && (
                    <Button
                      onClick={() => handleRenew(project)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-full"
                      disabled={isProcessing}
                    >
                      {isProcessing && selectedProject?._id === project._id ? (
                        <>
                          <Label className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        "Renew"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-3 text-center text-gray-500 dark:text-gray-400">
            No expiring projects found
          </div>
        )}
      </div>

      {/* Renew Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-800 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-800 dark:text-blue-400">
              Renew Project: {selectedProject?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="duration">Renewal Duration (Years)</Label>
              <Select
                value={duration}
                onValueChange={setDuration}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-10 border rounded-md">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRenewOpen(false);
                  setSelectedProject(null);
                  setDuration("1");
                }}
                className="rounded-full"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={initiatePayment}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <p className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Proceed to Pay"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpiringProjects;
