import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

/**
 * Send rental confirmation email
 */
export const sendRentalConfirmationEmail = async (user, rentals, books) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("⚠️ Email credentials not configured - skipping email");
      return { success: false, message: "Email not configured" };
    }

    const rentalItems = rentals
      .map((rental, index) => {
        const book = books[index];
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${
            book.title
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(
            rental.startDate
          ).toLocaleDateString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(
            rental.dueDate
          ).toLocaleDateString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs.${rental.rentalPrice.toFixed(
            2
          )}</td>
        </tr>
      `;
      })
      .join("");

    const totalPrice = rentals.reduce(
      (sum, rental) => sum + rental.rentalPrice,
      0
    );

    const mailOptions = {
      from: `"BookHub Rentals" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your BookHub Rental Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">BookHub Rental Confirmation</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear ${user.fullName},</p>
            <p>Thank you for renting with BookHub! Your order has been successfully processed.</p>
            
            <h2 style="color: #4F46E5;">Rental Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left;">Book Title</th>
                  <th style="padding: 10px; text-align: left;">Rental Date</th>
                  <th style="padding: 10px; text-align: left;">Due Date</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${rentalItems}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; font-weight: bold;">Rs.${totalPrice.toFixed(
                    2
                  )}</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="background-color: #e9f7fe; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #0277bd;">Important Information</h3>
              <p>Please return all books by their due dates to avoid late fees. Late fees are Rs.10 per day per book.</p>
            </div>
            
            <p style="margin-top: 30px;">Happy reading!</p>
            <p>The BookHub Team</p>
          </div>
          
          <div style="text-align: center; padding: 15px; background-color: #f2f2f2; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} BookHub. All rights reserved.</p>
            <p style="margin: 5px 0;">If you have any questions, please contact us at support@bookhub.com</p>
          </div>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Rental confirmation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending rental confirmation email:", error);
    throw error;
  }
};

/**
 * Send general email
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("⚠️ Email credentials not configured");
      return { success: false, message: "Email not configured" };
    }

    const info = await transporter.sendMail({
      from: `"BookHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

export default {
  sendRentalConfirmationEmail,
  sendEmail,
};
