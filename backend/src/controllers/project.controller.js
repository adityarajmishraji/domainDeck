import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.model.js";
import { Customer } from "../models/customer.model.js";
import { sendResponse } from "../utils/apiResponse.js";
import { throwApiError } from "../utils/apiError.js";
import {
  createProjectFolder,
  generateProjectFile,
  renameProjectFolder,
  deleteOldFile,
} from "../utils/fileGenerator.js";
import { ALLOWED_FILE_FORMATS } from "../config/constants.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { User } from "../models/user.model.js";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log Razorpay keys for debugging (remove in production)
console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log(
  "Razorpay Key Secret:",
  process.env.RAZORPAY_KEY_SECRET ? "****" : "Not set"
);

export const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    customer,
    domainName,
    domainStartDate,
    domainEndDate,
    status,
    budget,
    fileFormat,
  } = req.body;

  if (!title) {
    throw throwApiError(400, "Title is required");
  }

  if (customer && !mongoose.Types.ObjectId.isValid(customer)) {
    throw throwApiError(400, "Invalid customer ID");
  }

  if (fileFormat && !ALLOWED_FILE_FORMATS.includes(fileFormat)) {
    throw throwApiError(
      400,
      `Invalid file format. Allowed: ${ALLOWED_FILE_FORMATS.join(", ")}`
    );
  }

  const project = await Project.create({
    title,
    description,
    customer: customer || null,
    createdBy: req.user._id,
    domainName,
    domainStartDate,
    domainEndDate,
    status,
    budget,
    isActive: true,
  });

  const populatedProject = await Project.findById(project._id)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname");

  let filePath = null;
  let fileError = null;

  if (fileFormat) {
    try {
      const baseDir = process.env.PROJECTS_DIR || "projects/";
      const folderPath = await createProjectFolder(title, baseDir);
      filePath = await generateProjectFile(
        populatedProject.toObject(),
        fileFormat,
        folderPath
      );
      project.filePath = filePath;
      await project.save();
    } catch (error) {
      fileError = `Failed to generate project file: ${error.message}`;
    }
  }

  sendResponse(
    res,
    201,
    {
      project: populatedProject,
      filePath,
      fileError,
    },
    fileError
      ? `Project created, but ${fileError}`
      : "Project created successfully"
  );
});

export const getAllProjects = asyncHandler(async (req, res) => {
  const { status, search, isActive } = req.query;

  let query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }
  if (status && status !== "all") {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { domainName: { $regex: search, $options: "i" } },
    ];
  }

  const projects = await Project.find(query)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname")
    .select(
      "title domainName domainStartDate domainEndDate status budget isActive customer createdBy renewalHistory"
    );
  sendResponse(res, 200, projects, "Projects fetched successfully");
});

export const totalProjects = asyncHandler(async (req, res) => {
  const total = await Project.countDocuments();
  sendResponse(res, 200, { total }, "Total projects retrieved successfully");
});

export const totalActiveProjects = asyncHandler(async (req, res) => {
  const total = await Project.countDocuments({ isActive: true });
  sendResponse(
    res,
    200,
    { total },
    "Total active projects retrieved successfully"
  );
});

export const getPersonalProjects = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  let query = { customer: null };
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const projects = await Project.find(query)
    .populate("createdBy", "username fullname")
    .select(
      "title domainName domainStartDate domainEndDate status budget isActive createdBy renewalHistory"
    );
  sendResponse(res, 200, projects, "Personal projects fetched successfully");
});

export const getProjectsByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { isActive } = req.query;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw throwApiError(400, "Invalid customer ID");
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }

  let query = { customer: customerId };
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const projects = await Project.find(query)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname")
    .select(
      "title domainName domainStartDate domainEndDate status budget isActive createdBy renewalHistory"
    );
  sendResponse(res, 200, projects, "Customer projects fetched successfully");
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname");
  if (!project) {
    throw throwApiError(404, "Project not found");
  }
  sendResponse(res, 200, project, "Project fetched successfully");
});

export const updateProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    customer,
    domainName,
    domainStartDate,
    domainEndDate,
    status,
    budget,
    isActive,
    fileFormat,
  } = req.body;

  if (customer && !mongoose.Types.ObjectId.isValid(customer)) {
    throw throwApiError(400, "Invalid customer ID");
  }
  if (fileFormat && !ALLOWED_FILE_FORMATS.includes(fileFormat)) {
    throw throwApiError(
      400,
      `Invalid file format. Allowed: ${ALLOWED_FILE_FORMATS.join(", ")}`
    );
  }
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw throwApiError(404, "Project not found");
  }
  const oldTitle = project.title;
  let filePath = project.filePath;
  let fileError = null;
  project.title = title || project.title;
  project.description = description || project.description;
  project.customer =
    customer !== undefined ? customer || null : project.customer;
  project.domainName = domainName || project.domainName;
  project.domainStartDate = domainStartDate || project.domainStartDate;
  project.domainEndDate = domainEndDate || project.domainEndDate;
  project.status = status || project.status;
  project.budget = budget || project.budget;
  project.isActive = isActive !== undefined ? isActive : project.isActive;

  await project.save();
  if (fileFormat || (title && title !== oldTitle)) {
    try {
      const baseDir = process.env.PROJECTS_DIR || "projects/";
      let folderPath = null;

      // If title changed, rename folder
      if (title && title !== oldTitle) {
        folderPath = await renameProjectFolder(oldTitle, title, baseDir);
        // If folder was renamed, delete old file
        if (folderPath && filePath) {
          await deleteOldFile(filePath);
          filePath = null;
        }
      }

      // If no folder path (e.g., deleted or first time), create new folder
      if (!folderPath && fileFormat) {
        folderPath = await createProjectFolder(project.title, baseDir);
      }

      // Generate new file if fileFormat provided
      if (fileFormat && folderPath) {
        const populatedProject = await Project.findById(project._id)
          .populate("customer", "name email")
          .populate("createdBy", "username fullname");
        filePath = await generateProjectFile(
          populatedProject.toObject(),
          fileFormat,
          folderPath
        );
        project.filePath = filePath;
        await project.save();
      }
    } catch (error) {
      fileError = `Failed to update project file: ${error.message}`;
    }
  }
  const populatedProject = await Project.findById(project._id)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname");

  sendResponse(
    res,
    200,
    {
      project: populatedProject,
      filePath,
      fileError,
    },
    fileError
      ? `Project updated, but ${fileError}`
      : "Project updated successfully"
  );
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { action = "soft" } = req.query;
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw throwApiError(404, "Project not found");
  }

  if (action === "hard") {
    await Project.deleteOne({ _id: req.params.id });
    sendResponse(res, 200, null, "Project permanently deleted");
  } else if (action === "soft") {
    project.isActive = false;
    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate("customer", "name email")
      .populate("createdBy", "username fullname");
    sendResponse(
      res,
      200,
      populatedProject,
      "Project deactivated successfully"
    );
  } else if (action === "reactivate") {
    project.isActive = true;
    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate("customer", "name email")
      .populate("createdBy", "username fullname");
    sendResponse(
      res,
      200,
      populatedProject,
      "Project reactivated successfully"
    );
  } else {
    throw throwApiError(
      400,
      "Invalid action. Use 'hard', 'soft', or 'reactivate'"
    );
  }
});

export const getExpiringProjects = asyncHandler(async (req, res) => {
  const now = new Date();
  const projects = await Project.find({
    isActive: true,
    domainEndDate: { $ne: null },
  })
    .select("title domainEndDate isActive renewalHistory")
    .sort({ domainEndDate: 1 });

  sendResponse(res, 200, projects, "Expiring projects fetched successfully");
});

export const initiateProjectRenewalPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { duration } = req.body; // Duration in years, e.g., 1, 2

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid project ID");
  }

  if (!duration || !Number.isInteger(duration) || duration < 1) {
    throw throwApiError(400, "Valid duration (in years) is required");
  }

  const project = await Project.findById(id);
  if (!project) {
    throw throwApiError(404, "Project not found");
  }

  // if (project.createdBy.toString() !== req.user._id.toString()) {
  //   throw throwApiError(403, "Unauthorized to renew this project");
  // }

  // Use default renewalPrice if not set in project
  const renewalPrice = project.renewalPrice || 50000; // Fallback to ₹500 (50000 paise)
  const amount = renewalPrice * duration; // Amount in paise

  // Validate minimum amount (100 paise = ₹1.00)
  if (amount < 100) {
    throw throwApiError(400, "Amount must be at least 100 paise (₹1.00)");
  }

  // Generate a shorter receipt (max 40 characters)
  const shortProjectId = project._id.toString().slice(0, 12);
  const shortTimestamp = Date.now().toString().slice(-8);
  const receipt = `proj_${shortProjectId}_${shortTimestamp}`; // e.g., proj_686176cce7e6_17512178

  const orderParams = {
    amount,
    currency: "INR",
    receipt,
    notes: {
      projectId: project._id.toString(),
      userId: req.user._id.toString(),
      duration,
    },
  };

  console.log("Order params:", orderParams);

  try {
    const order = await razorpay.orders.create(orderParams);
    sendResponse(
      res,
      200,
      {
        orderId: order.id,
        amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      "Payment order created successfully"
    );
  } catch (error) {
    console.error("Razorpay order creation error:", {
      rawError: error,
      message: error.message,
      code: error.error?.code,
      description: error.error?.description,
      source: error.error?.source,
      step: error.error?.step,
      reason: error.error?.reason,
      metadata: error.error?.metadata,
    });
    throw throwApiError(
      500,
      `Failed to create payment order: ${error.error?.description || error.message || "Unknown error"}`
    );
  }
});

export const confirmProjectRenewal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    duration,
    fileFormat,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid project ID");
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw throwApiError(400, "Payment details are required");
  }

  if (!duration || !Number.isInteger(duration) || duration < 1) {
    throw throwApiError(400, "Valid duration (in years) is required");
  }

  if (fileFormat && !ALLOWED_FILE_FORMATS.includes(fileFormat)) {
    throw throwApiError(
      400,
      `Invalid file format. Allowed: ${ALLOWED_FILE_FORMATS.join(", ")}`
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    throw throwApiError(404, "Project not found");
  }

  // Verify payment signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw throwApiError(400, "Invalid payment signature");
  }

  // Check if payment ID already used
  if (
    project.renewalHistory.some(
      (entry) => entry.paymentId === razorpay_payment_id
    )
  ) {
    throw throwApiError(400, "Payment already processed");
  }

  // Calculate new end date
  const currentEndDate = project.domainEndDate || new Date();
  const newEndDate = new Date(currentEndDate);
  newEndDate.setFullYear(newEndDate.getFullYear() + duration);

  // Update project
  project.domainEndDate = newEndDate;
  project.isActive = true;
  project.status =
    project.status === "completed" ? "in-progress" : project.status;
  project.renewalHistory.push({
    renewedAt: new Date(),
    newEndDate,
    renewedBy: req.user._id,
    paymentId: razorpay_payment_id,
    amount: (project.renewalPrice || 50000) * duration, // Use fallback
  });

  // Save project to ensure updates are persisted
  await project.save();

  let filePath = project.filePath;
  let fileError = null;

  if (fileFormat) {
    try {
      const baseDir = process.env.PROJECTS_DIR || "projects/";
      let folderPath = await createProjectFolder(project.title, baseDir);

      if (filePath) {
        await deleteOldFile(filePath);
      }

      // Fetch populated project after saving to ensure updated data
      const populatedProject = await Project.findById(project._id)
        .populate("customer", "name email")
        .populate("createdBy", "username fullname");

      // Log project data for debugging
      console.log(
        "Project data for file generation:",
        populatedProject.toObject()
      );

      filePath = await generateProjectFile(
        populatedProject.toObject(),
        fileFormat,
        folderPath
      );
      project.filePath = filePath;

      // Save filePath to project
      await project.save();
    } catch (error) {
      fileError = `Failed to generate project file: ${error.message}`;
      console.error("File generation error:", error);
    }
  }

  // Send payment and renewal confirmation emails
  const user = await User.findById(req.user._id);
  const amountInRupees = ((project.renewalPrice || 50000) * duration) / 100; // Convert paise to rupees
  const emailText = `Dear ${user.fullname},\n\nYour payment of ₹${amountInRupees} for renewing project "${project.title}" has been successful (Payment ID: ${razorpay_payment_id}). The new domain expiry date is ${newEndDate.toLocaleDateString()}.\n\nBest regards,\nAdmin Dashboard Team\n\nAmit Mishra\n407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village\nChanod Vapi, Gujarat 396191, India`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Project Renewal Confirmation</h2>
      <p>Dear ${user.fullname},</p>
      <p>Your payment of ₹${amountInRupees} for renewing project <strong>${project.title}</strong> has been successful (Payment ID: ${razorpay_payment_id}).</p>
      <p>The new domain expiry date is ${newEndDate.toLocaleDateString()}.</p>
      <p>Best regards,<br>Admin Dashboard Team</p>
      <hr style="border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Amit Mishra<br>
        407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village<br>
        Chanod Vapi, Gujarat 396191, India
      </p>
    </div>
  `;

  try {
    await sendEmail(
      user.email,
      "Project Renewal Confirmation",
      emailText,
      emailHtml
    );
  } catch (error) {
    console.error(`Failed to send email to ${user.email}: ${error.message}`);
    fileError = fileError
      ? `${fileError}; Email failed: ${error.message}`
      : `Email failed: ${error.message}`;
  }

  const populatedProject = await Project.findById(project._id)
    .populate("customer", "name email")
    .populate("createdBy", "username fullname");

  sendResponse(
    res,
    200,
    {
      project: populatedProject,
      filePath,
      fileError,
    },
    fileError
      ? `Project renewed, but ${fileError}`
      : "Project renewed successfully"
  );
});
