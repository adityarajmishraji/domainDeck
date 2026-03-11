import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; // ← upar aaya
import { connectDB } from "./database/db.js";

import userRouter from "./routes/user.routes.js";
import customerRouter from "./routes/customer.routes.js";
import projectRouter from "./routes/project.routes.js";

dotenv.config();

const requiredEnvVars = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RECAPTCHA_SITE_KEY",
  "RECAPTCHA_SECRET_KEY",
  "SENDGRID_API_KEY",
  "EMAIL_FROM",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: ${varName} is not defined`);
    process.exit(1);
  }
});

const app = express();

const globalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://domain-deck-lovat.vercel.app", // ← tumhara frontend URL
  ],
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser());
app.use(globalRateLimiter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/projects", projectRouter);

app.get("/", (req, res) => {
  res.json({ message: "Running" });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not found 404",
    errorMessage: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation Error", error: err.message });
  }
  console.error("Server Error:", err.stack);
  return res.status(500).json({ message: "Internal Server Error", errorMessage: err.message });
});

await connectDB(process.env.MONGODB_URI);

export default app;