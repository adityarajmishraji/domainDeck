import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Edit, Trash, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import ReactSelect from "react-select";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteAction, setDeleteAction] = useState("soft");
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer: null,
    domainName: "",
    domainStartDate: "",
    domainEndDate: "",
    status: "pending",
    budget: "",
    isActive: true,
    fileFormat: "csv",
  });
  const [errors, setErrors] = useState({});

  // File format options
  const fileFormatOptions = [
    { value: "csv", label: "CSV" },
    { value: "pdf", label: "PDF" },
    { value: "txt", label: "TXT" },
  ];

  // Fetch projects and customers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm;
        if (isActiveFilter !== "all")
          params.isActive = isActiveFilter === "active";

        const [projectsResponse, customersResponse] = await Promise.all([
          axiosInstance.get("/projects", { params }),
          axiosInstance.get("/customers/dropdown"),
        ]);

        setProjects(projectsResponse.data.data || []);
        setCustomers(customersResponse.data.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, debouncedSearchTerm, isActiveFilter]);

  // Restore focus after re-render
  useEffect(() => {
    if (
      searchInputRef.current &&
      document.activeElement === searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  // Validate form
  const validateForm = () => {
    let newErrors = {};
    if (!formData.title?.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (
      formData.domainName &&
      !/^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(
        formData.domainName
      )
    ) {
      newErrors.domainName = "Invalid domain name (e.g., example.com)";
    }
    if (
      formData.domainStartDate &&
      new Date(formData.domainStartDate) > new Date()
    ) {
      newErrors.domainStartDate = "Domain start date cannot be in the future";
    }
    if (
      formData.domainEndDate &&
      formData.domainStartDate &&
      new Date(formData.domainEndDate) < new Date(formData.domainStartDate)
    ) {
      newErrors.domainEndDate = "Domain end date must be after start date";
    }
    if (
      formData.budget &&
      (isNaN(formData.budget) || Number(formData.budget) < 0)
    ) {
      newErrors.budget = "Budget must be a non-negative number";
    }
    if (!["pdf", "csv", "txt"].includes(formData.fileFormat)) {
      newErrors.fileFormat = "Invalid file format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      customer: selectedOption ? selectedOption.value : null,
    }));
    if (errors.customer) {
      setErrors((prev) => ({ ...prev, customer: "" }));
    }
  };

  // Handle file format selection
  const handleFileFormatChange = (value) => {
    setFormData((prev) => ({ ...prev, fileFormat: value }));
    if (errors.fileFormat) {
      setErrors((prev) => ({ ...prev, fileFormat: "" }));
    }
  };

  // Handle create project
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        customer: formData.customer || null,
        budget: formData.budget ? Number(formData.budget) : undefined,
        domainStartDate: formData.domainStartDate || undefined,
        domainEndDate: formData.domainEndDate || undefined,
        fileFormat: formData.fileFormat,
      };
      const response = await axiosInstance.post("/projects", payload);
      setProjects([...projects, response.data.data.project]);
      setFormData({
        title: "",
        description: "",
        customer: null,
        domainName: "",
        domainStartDate: "",
        domainEndDate: "",
        status: "pending",
        budget: "",
        isActive: true,
        fileFormat: "csv",
      });
      setIsCreateOpen(false);
      toast.success(
        response.data.data.fileError
          ? `Project created, but ${response.data.data.fileError}`
          : "Project created successfully"
      );
      if (response.data.data.filePath) {
        toast.info(`File generated at: ${response.data.data.filePath}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project");
    }
  };

  // Handle edit project
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        customer: formData.customer || null,
        budget: formData.budget ? Number(formData.budget) : undefined,
        domainStartDate: formData.domainStartDate || undefined,
        domainEndDate: formData.domainEndDate || undefined,
        fileFormat: formData.fileFormat,
      };
      const response = await axiosInstance.patch(
        `/projects/${selectedProject._id}`,
        payload
      );
      setProjects(
        projects.map((p) =>
          p._id === selectedProject._id ? response.data.data : p
        )
      );
      setIsEditOpen(false);
      setFormData({
        title: "",
        description: "",
        customer: null,
        domainName: "",
        domainStartDate: "",
        domainEndDate: "",
        status: "pending",
        budget: "",
        isActive: true,
        fileFormat: "csv",
      });
      setSelectedProject(null);
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update project");
    }
  };

  // Handle delete or reactivate project
  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(
        `/projects/${selectedProject._id}`,
        {
          params: { action: deleteAction },
        }
      );
      if (deleteAction === "hard") {
        setProjects(projects.filter((p) => p._id !== selectedProject._id));
      } else {
        setProjects(
          projects.map((p) =>
            p._id === selectedProject._id ? response.data.data : p
          )
        );
      }
      setIsDeleteOpen(false);
      setSelectedProject(null);
      setDeleteAction("soft");
      toast.success(
        deleteAction === "hard"
          ? "Project permanently deleted"
          : deleteAction === "soft"
          ? "Project deactivated successfully"
          : "Project reactivated successfully"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  // Open edit dialog
  const openEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title || "",
      description: project.description || "",
      customer: project.customer?._id || null,
      domainName: project.domainName || "",
      domainStartDate: project.domainStartDate
        ? new Date(project.domainStartDate).toISOString().split("T")[0]
        : "",
      domainEndDate: project.domainEndDate
        ? new Date(project.domainEndDate).toISOString().split("T")[0]
        : "",
      status: project.status || "pending",
      budget: project.budget || "",
      isActive: project.isActive,
      fileFormat: "csv",
    });
    setIsEditOpen(true);
  };

  // Format customer options for react-select
  const customerOptions = [
    { value: null, label: "Personal Project" },
    ...customers.map((customer) => ({
      value: customer._id,
      label: `${customer.name} - ${customer.email}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
        Projects
      </h1>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search by title or domain name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md text-blue-500 dark:text-blue-400"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-40 dark:bg-gray-dark-800 bg-gray-200 dark:bg-gray-700 rounded-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={isActiveFilter}
          onValueChange={(value) => setIsActiveFilter(value)}
        >
          <SelectTrigger className="w-40 dark:bg-gray-dark-800 bg-gray-200 dark:bg-gray-700 rounded-full">
            <SelectValue placeholder="Filter by active status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700  text-white dark:bg-blue-700 dark:hover:bg-blue-600 rounded-full px-5">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-blue-800 dark:text-blue-400">
                Create Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter project title"
                    className="h-10 border rounded-md"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.title}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter description"
                    className="h-10 border rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <ReactSelect
                    options={customerOptions}
                    value={customerOptions.find(
                      (option) => option.value === formData.customer
                    )}
                    onChange={handleCustomerChange}
                    placeholder="Select a customer or personal project"
                    className="h-10 border rounded-md"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "#fff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0.375rem",
                        height: "2.5rem",
                        "&:hover": { borderColor: "#cbd5e1" },
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "#fff",
                        borderRadius: "0.375rem",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#2563eb"
                          : state.isFocused
                          ? "#f1f5f9"
                          : "#fff",
                        color: state.isSelected ? "#fff" : "#1f2937",
                      }),
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="domainName">Domain Name (Optional)</Label>
                  <Input
                    id="domainName"
                    name="domainName"
                    value={formData.domainName}
                    onChange={handleChange}
                    placeholder="e.g., example.com"
                    className="h-10 border rounded-md"
                  />
                  {errors.domainName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.domainName}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="domainStartDate">
                      Domain Start Date (Optional)
                    </Label>
                    <Input
                      id="domainStartDate"
                      name="domainStartDate"
                      type="date"
                      value={formData.domainStartDate}
                      onChange={handleChange}
                      className="h-10 border rounded-md"
                    />
                    {errors.domainStartDate && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.domainStartDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="domainEndDate">
                      Domain End Date (Optional)
                    </Label>
                    <Input
                      id="domainEndDate"
                      name="domainEndDate"
                      type="date"
                      value={formData.domainEndDate}
                      onChange={handleChange}
                      className="h-10 border rounded-md"
                    />
                    {errors.domainEndDate && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.domainEndDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="h-10 border rounded-md">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="Enter budget"
                    className="h-10 border rounded-md"
                  />
                  {errors.budget && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.budget}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fileFormat">File Format (Optional)</Label>
                  <Select
                    value={formData.fileFormat}
                    onValueChange={handleFileFormatChange}
                  >
                    <SelectTrigger className="h-10 border rounded-md">
                      <SelectValue placeholder="Select file format" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileFormatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fileFormat && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.fileFormat}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 rounded-full">
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Domain Name</TableHead>
                <TableHead>Domain Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Is Active</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[250px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow
                    key={project._id}
                    className="hover:bg-blue-50 dark:hover:bg-gray-600"
                  >
                    <TableCell>{project.title}</TableCell>
                    <TableCell>
                      {project.customer && project.customer.name
                        ? `${project.customer.name} (${project.customer.email})`
                        : "Personal Project"}
                    </TableCell>
                    <TableCell>{project.domainName || "-"}</TableCell>
                    <TableCell>
                      {project.domainStartDate
                        ? `${new Date(
                            project.domainStartDate
                          ).toLocaleDateString()} - ${
                            project.domainEndDate
                              ? new Date(
                                  project.domainEndDate
                                ).toLocaleDateString()
                              : "-"
                          }`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.isActive ? "default" : "secondary"}
                        className={
                          project.isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                        }
                      >
                        {project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          project.isActive
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                        }
                      >
                        {project.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.budget ? `$${project.budget}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(project)}
                          className="border-blue-500 text-blue-500 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedProject(project);
                            setDeleteAction(
                              project.isActive ? "soft" : "reactivate"
                            );
                            setIsDeleteOpen(true);
                          }}
                          className="border-red-500 text-red-500 hover:bg-red-100 dark:border-blue-400 dark:text-red-400 dark:hover:bg-blue-600"
                        >
                          {project.isActive ? (
                            <Trash className="h-4 w-4" />
                          ) : null}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 dark:text-gray-400"
                  >
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete/Reactivate Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-800 dark:text-blue-400">
              Confirm Action for {selectedProject?.title}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            Choose how you want to handle this project:
          </AlertDialogDescription>

          <RadioGroup
            value={deleteAction}
            onValueChange={setDeleteAction}
            className="space-y-2"
          >
            {selectedProject?.isActive && (
              <>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="soft" id="soft" />
                  <Label
                    htmlFor="soft"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Deactivate (can be reactivated later)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label
                    htmlFor="hard"
                    className="text-red-600 dark:text-red-400"
                  >
                    Permanently Delete (cannot be undone)
                  </Label>
                </div>
              </>
            )}
            {!selectedProject?.isActive && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reactivate" id="reactivate" />
                <Label
                  htmlFor="reactivate"
                  className="text-green-600 dark:text-green-400"
                >
                  Reactivate Project
                </Label>
              </div>
            )}
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              onClick={() => setDeleteAction("soft")}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={`${
                deleteAction === "hard"
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                  : deleteAction === "reactivate"
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              } rounded-full`}
            >
              {deleteAction === "hard"
                ? "Permanently Delete"
                : deleteAction === "reactivate"
                ? "Reactivate"
                : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-800 dark:text-blue-400">
              Edit Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter project title"
                  className="h-10 border rounded-md"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.title}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  className="h-10 border rounded-md"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer">Customer (Optional)</Label>
                <ReactSelect
                  options={customerOptions}
                  value={customerOptions.find(
                    (option) => option.value === formData.customer
                  )}
                  onChange={handleCustomerChange}
                  placeholder="Select a customer or personal project"
                  className="h-10 border rounded-md"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#fff",
                      borderColor: "#e2e8f0",
                      borderRadius: "0.375rem",
                      height: "2.5rem",
                      "&:hover": { borderColor: "#cbd5e1" },
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#fff",
                      borderRadius: "0.375rem",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#2563eb"
                        : state.isFocused
                        ? "#f1f5f9"
                        : "#fff",
                      color: state.isSelected ? "#fff" : "#1f2937",
                    }),
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="domainName">Domain Name (Optional)</Label>
                <Input
                  id="domainName"
                  name="domainName"
                  value={formData.domainName}
                  onChange={handleChange}
                  placeholder="e.g., example.com"
                  className="h-10 border rounded-md"
                />
                {errors.domainName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.domainName}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="domainStartDate">
                    Domain Start Date (Optional)
                  </Label>
                  <Input
                    id="domainStartDate"
                    name="domainStartDate"
                    type="date"
                    value={formData.domainStartDate}
                    onChange={handleChange}
                    className="h-10 border rounded-md"
                  />
                  {errors.domainStartDate && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.domainStartDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="domainEndDate">
                    Domain End Date (Optional)
                  </Label>
                  <Input
                    id="domainEndDate"
                    name="domainEndDate"
                    type="date"
                    value={formData.domainEndDate}
                    onChange={handleChange}
                    className="h-10 border rounded-md"
                  />
                  {errors.domainEndDate && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.domainEndDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="h-10 border rounded-md">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Enter budget"
                  className="h-10 border rounded-md"
                />
                {errors.budget && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.budget}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="fileFormat">File Format (Optional)</Label>
                <Select
                  value={formData.fileFormat}
                  onValueChange={handleFileFormatChange}
                >
                  <SelectTrigger className="h-10 border rounded-md">
                    <SelectValue placeholder="Select file format" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileFormatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fileFormat && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.fileFormat}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 rounded-full">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
