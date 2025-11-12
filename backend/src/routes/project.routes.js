import express from "express";
import {
  createProject,
  getAllProjects,
  getPersonalProjects,
  getProjectsByCustomer,
  getProjectById,
  updateProject,
  deleteProject,
  totalProjects,
  totalActiveProjects,
  getExpiringProjects,
  initiateProjectRenewalPayment,
  confirmProjectRenewal,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create a project
router.route("/").post(verifyJWT, createProject);

// Get all projects (external + personal)
router.route("/").get(verifyJWT, getAllProjects);

// Get all projects
router.route("/total-projects").get(verifyJWT, totalProjects);

// Get all projects which are active
router.route("/total-active-projects").get(verifyJWT, totalActiveProjects);

// Get personal projects (customer: null)
router.route("/personal").get(verifyJWT, getPersonalProjects);

// Get projects for a specific customer
router.route("/customer/:customerId").get(verifyJWT, getProjectsByCustomer);

// Get expiring projects
router.route("/expiring").get(verifyJWT, getExpiringProjects);

// Get a specific project by ID
router.route("/:id").get(verifyJWT, getProjectById);

// Update a project
router.route("/:id").patch(verifyJWT, updateProject);

// Delete a project
router.route("/:id").delete(verifyJWT, deleteProject);

// Initiate project renewal payment
router
  .route("/:id/renew/initiate")
  .post(verifyJWT, initiateProjectRenewalPayment);

// Confirm project renewal after payment
router.route("/:id/renew/confirm").post(verifyJWT, confirmProjectRenewal);

export default router;
