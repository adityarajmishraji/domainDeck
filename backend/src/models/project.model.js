import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [3, "Project title must be at least 3 characters"],
      maxlength: [100, "Project title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User who created the project is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in-progress", "completed", "on-hold"],
        message:
          "Status must be one of: pending, in-progress, completed, on-hold",
      },
      default: "pending",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.startDate || !value || value >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    domainName: {
      type: String,
      trim: true,
      match: [
        /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid domain name (e.g., example.com)",
      ],
      index: true,
    },
    domainStartDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value <= new Date();
        },
        message: "Domain start date cannot be in the future",
      },
    },
    domainEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return (
            !this.domainStartDate || !value || value >= this.domainStartDate
          );
        },
        message: "Domain end date must be after domain start date",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    renewalPrice: {
      type: Number,
      min: [0, "Renewal price cannot be negative"],
      default: 50000,
    },
    renewalHistory: [
      {
        renewedAt: {
          type: Date,
          default: Date.now,
        },
        newEndDate: {
          type: Date,
          required: [true, "New end date is required"],
          validate: {
            validator: function (value) {
              return !this.domainStartDate || value >= this.domainStartDate;
            },
            message: "New end date must be after domain start date",
          },
        },
        renewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "User who renewed the project is required"],
        },
        paymentId: {
          type: String,
          required: [true, "Payment ID is required"],
        },
        amount: {
          type: Number,
          required: [true, "Payment amount is required"],
          min: [0, "Payment amount cannot be negative"],
        },
      },
    ],
  },
  { timestamps: true }
);

projectSchema.pre("save", async function (next) {
  try {
    // Validate customer existence only if customer is provided
    if (this.customer) {
      const customerExists = await mongoose
        .model("Customer")
        .exists({ _id: this.customer });
      if (!customerExists) {
        return next(new Error("Customer does not exist"));
      }
    }
    // Validate user existence
    const userExists = await mongoose
      .model("User")
      .exists({ _id: this.createdBy });
    if (!userExists) {
      return next(new Error("User does not exist"));
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const Project = mongoose.model("Project", projectSchema);
