import apiClient from "./apiClient";

/**
 * Client-side wrapper to request rental confirmation email
 * This calls the server API which sends the actual email
 */
export const sendRentalConfirmationEmail = async (rentalData) => {
  try {
    const response = await apiClient.post(
      "/api/email/rental-confirmation",
      rentalData
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting rental confirmation email:", error);
    throw error;
  }
};

/**
 * Send general email via API
 */
export const sendEmail = async (emailData) => {
  try {
    const response = await apiClient.post("/api/email/send", emailData);
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default {
  sendRentalConfirmationEmail,
  sendEmail,
};
