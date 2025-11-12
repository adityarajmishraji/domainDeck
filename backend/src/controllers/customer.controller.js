import { asyncHandler } from "../utils/asyncHandler.js";
import { Customer } from "../models/customer.model.js";
import { Project } from "../models/project.model.js";
import { sendResponse } from "../utils/apiResponse.js";
import { throwApiError } from "../utils/apiError.js";

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, notes } = req.body;

  if (!name || !email) {
    throw throwApiError(400, "Name and email are required");
  }

  const existingCustomer = await Customer.findOne({
    email: email.toLowerCase(),
  });
  if (existingCustomer) {
    throw throwApiError(409, "Customer with this email already exists");
  }

  const customer = await Customer.create({
    name,
    email: email.toLowerCase(),
    phone,
    address,
    company,
    notes,
    isActive: true,
  });

  sendResponse(res, 201, customer, "Customer created successfully");
});

export const getAllCustomers = asyncHandler(async (req, res) => {
  const { isActive, search } = req.query;

  let query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const customers = await Customer.find(query).select(
    "name email phone address company notes isActive"
  );
  // Check if no customers found
  if (!customers || customers.length === 0) {
    return sendResponse(res, 200, [], "No customers found");
  }
  sendResponse(res, 200, customers, "Customers fetched successfully");
});

export const totalCustomers = asyncHandler(async (req, res) => {
  // Count all active customers
  const total = await Customer.countDocuments({ isActive: true });

  // Send response with total count
  sendResponse(res, 200, { total }, "Total customers retrieved successfully");
});

export const getCustomersForDropdown = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = { isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const customers = await Customer.find(query).select("name email _id");
  sendResponse(res, 200, customers, "Active customers fetched successfully");
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select("-__v");
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }
  sendResponse(res, 200, customer, "Customer fetched successfully");
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, notes } = req.body;

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }

  if (email && email.toLowerCase() !== customer.email) {
    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase(),
    });
    if (existingCustomer) {
      throw throwApiError(409, "Customer with this email already exists");
    }
  }

  customer.name = name || customer.name;
  customer.email = email ? email.toLowerCase() : customer.email;
  customer.phone = phone || customer.phone;
  customer.address = address || customer.address;
  customer.company = company || customer.company;
  customer.notes = notes || customer.notes;
  customer.isActive = true;

  await customer.save();
  sendResponse(res, 200, customer, "Customer updated successfully");
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { action = "soft" } = req.query;
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }

  if (action === "hard") {
    await Project.deleteMany({ customer: req.params.id });
    await customer.deleteOne();
    sendResponse(
      res,
      200,
      null,
      "Customer and associated projects deleted successfully"
    );
  } else if (action === "soft") {
    customer.isActive = false;
    await customer.save();
    sendResponse(res, 200, null, "Customer deactivated successfully");
  } else {
    throw throwApiError(400, "Invalid action. Use 'hard' or 'soft'");
  }
});
