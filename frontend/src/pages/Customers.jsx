import { useState, useEffect } from "react";
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
import { Search, Plus, Edit, Trash } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

function SkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 dark:bg-gray-800">
          {Array(8)
            .fill()
            .map((_, index) => (
              <TableHead key={index}>
                <div className="animate-pulse">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </TableHead>
            ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array(3)
          .fill()
          .map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array(8)
                .fill()
                .map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="animate-pulse">
                      <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </TableCell>
                ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteAction, setDeleteAction] = useState("soft");
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: { street: "", city: "", state: "", postalCode: "", country: "" },
    company: "",
    notes: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const params = {};
        if (statusFilter !== "all") params.isActive = statusFilter === "active";
        if (searchTerm.trim()) params.search = searchTerm;
        const response = await axiosInstance.get("/customers", { params });
        setCustomers(response.data.data || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch customers"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [statusFilter, searchTerm]);

  // Validate form
  const validateForm = () => {
    let newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.phone && !/^\+?[\d\s-]{8,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle create customer
  async function handleCreate(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axiosInstance.post("/customers", {
        ...formData,
        isActive: true,
      });
      setCustomers([...customers, response.data.data]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        company: "",
        notes: "",
        isActive: true,
      });
      setIsCreateOpen(false);
      toast.success("Customer created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create customer");
    }
  }

  // Handle edit customer
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axiosInstance.patch(
        `/customers/${selectedCustomer._id}`,
        {
          ...formData,
          isActive: true,
        }
      );
      setCustomers(
        customers.map((c) =>
          c._id === selectedCustomer._id ? response.data.data : c
        )
      );
      setIsEditOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        company: "",
        notes: "",
        isActive: true,
      });
      setSelectedCustomer(null);
      toast.success("Customer updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    }
  };

  // Handle delete customer
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/customers/${selectedCustomer._id}`, {
        params: { action: deleteAction },
      });
      setCustomers(customers.filter((c) => c._id !== selectedCustomer._id));
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
      setDeleteAction("soft"); // Reset to default
      toast.success(
        deleteAction === "hard"
          ? "Customer permanently deleted"
          : "Customer deactivated successfully"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  // Open edit dialog
  const openEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      company: customer.company || "",
      notes: customer.notes || "",
      isActive: customer.isActive ?? true,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
        Customers
      </h1>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search by name or email"
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600 rounded-full px-5">
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-blue-800 dark:text-blue-400">
                Create Customer
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name-1">Name</Label>
                    <Input
                      id="name-1"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      className="h-10 border rounded-md"
                    />
                    {errors.name && (
                      <p className="text-sm text-500 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-1">Email</Label>
                    <Input
                      id="email-1"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      className="h-10 border rounded-md"
                    />
                    {errors.email && (
                      <p className="text-sm text-500 dark:text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone-1">Phone (Optional)</Label>
                    <Input
                      id="phone-1"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone"
                      className="h-10 border rounded-md"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 dark:text-red-400">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="company-1">Company (Optional)</Label>
                    <Input
                      id="company-1"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Enter company"
                      className="h-10 border rounded-md"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="street-1">Street (Optional)</Label>
                  <Input
                    id="street-1"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Enter street"
                    className="h-10 border rounded-md"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city-1">City (Optional)</Label>
                    <Input
                      id="city-1"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      className="h-10 border rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state-1">State (Optional)</Label>
                    <Input
                      id="state-1"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      className="h-10 border rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="postalCode-1">Postal Code (Optional)</Label>
                    <Input
                      id="postalCode-1"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      placeholder="Enter postal code"
                      className="h-10 border rounded-md"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country-1">Country (Optional)</Label>
                  <Input
                    id="country-1"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className="h-10 border rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes-1">Notes (Optional)</Label>
                  <Input
                    id="notes-1"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter notes"
                    className="h-10 border rounded-md"
                  />
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

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow
                      key={customer._id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>{customer.company || "-"}</TableCell>
                      <TableCell>
                        {customer.address &&
                        Object.values(customer.address).some((val) => val)
                          ? `${customer.address.street || ""}, ${
                              customer.address.city || ""
                            }, ${customer.address.state || ""} ${
                              customer.address.postalCode || ""
                            }, ${customer.address.country || ""}`
                              .trim()
                              .replace(/,\s*$/, "")
                          : "-"}
                      </TableCell>
                      <TableCell>{customer.notes || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.isActive ? "default" : "secondary"}
                          className={
                            customer.isActive
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                          }
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit(customer)}
                            className="border-blue-500 text-blue-500 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDeleteAction("soft"); // Reset to default
                              setIsDeleteOpen(true);
                            }}
                            className="border-red-500 text-red-500 hover:bg-red-100 dark:border-blue-red-400 dark:text-blue-red-400 dark:hover:bg-red-900"
                          >
                            <Trash className="h-4 w-4" />
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
                      No Customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-800 dark:text-blue-400">
              Confirm Deletion for {selectedCustomer?.name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Choose how you want to handle this customer:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup
            value={deleteAction}
            onValueChange={setDeleteAction}
            className="space-y-2"
          >
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
              <Label htmlFor="hard" className="text-red-600 dark:text-red-400">
                Permanently Delete (cannot be undone, removes customer and
                associated projects)
              </Label>
            </div>
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              onClick={() => {
                setDeleteAction("soft"); // Reset to default
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={`${
                deleteAction === "hard"
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              } rounded-full`}
            >
              {deleteAction === "hard" ? "Permanently Delete" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-800 dark:text-blue-400">
              Edit Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name-2">Name</Label>
                  <Input
                    id="name-2"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    className="h-10 border rounded-md"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email-2">Email</Label>
                  <Input
                    id="email-2"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="h-10 border rounded-md"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone-2">Phone (Optional)</Label>
                  <Input
                    id="phone-2"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone"
                    className="h-10 border rounded-md"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company-2">Company (Optional)</Label>
                  <Input
                    id="company-2"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter company"
                    className="h-10 border rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="street-2">Street (Optional):</Label>
                <Input
                  id="street-2"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Enter street"
                  className="h-10 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="city-2">City (Optional):</Label>
                  <Input
                    id="city-2"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="h-10 border rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state-2">State (Optional):</Label>
                  <Input
                    id="state-2"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className="h-10 border rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postalCode-2">Postal Code (Optional):</Label>
                  <Input
                    id="postalCode-2"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                    className="h-10 border rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="country-2">Country (Optional):</Label>
                <Input
                  id="country-2"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className="h-10 border rounded-md"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes-2">Notes (Optional):</Label>
                <Input
                  id="notes-2"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter notes"
                  className="h-10 border rounded-md"
                />
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
