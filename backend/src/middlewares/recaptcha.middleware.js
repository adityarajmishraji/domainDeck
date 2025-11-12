import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { throwApiError } from "../utils/apiError.js";

export const verifyRecaptcha = asyncHandler(async (req, res, next) => {
  const recaptchaToken = req.body.recaptchaToken;

  if (!recaptchaToken) {
    throw throwApiError(400, "reCAPTCHA token is required");
  }

  // Validate token format (basic check)
  if (typeof recaptchaToken !== "string" || recaptchaToken.length < 20) {
    throw throwApiError(400, "Invalid reCAPTCHA token format");
  }

  try {
    // Direct call to Google's reCAPTCHA API
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
        remoteip: req.ip || req.connection.remoteAddress,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      }
    );
    console.log(response.data);

    const data = response.data;

    // Detailed logging for debugging
    console.log("reCAPTCHA verification result:", {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
      error_codes: data["error-codes"],
    });

    // Check if verification was successful
    if (!data.success) {
      throw throwApiError(400, "reCAPTCHA verification failed");
    }

    // Check reCAPTCHA score (0.0 to 1.0)
    if (data.score !== undefined && data.score < 0.3) {
      throw throwApiError(403, "Security check failed");
    }

    // Store reCAPTCHA data in request for potential use in controller
    req.recaptchaData = {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
    };
    next();
  } catch (error) {
    // If it's already an API error, re-throw it
    if (error.statusCode) {
      throw error;
    }
    console.error("reCAPTCHA error:", error.message);
    throw throwApiError(500, "reCAPTCHA verification error");
  }
});
