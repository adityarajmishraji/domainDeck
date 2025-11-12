import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number"],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);
export const Customer = mongoose.model("Customer", customerSchema);
