import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Validate phone number format
export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // If no phone provided, we'll accept it
  
  // Log for debugging
  console.log("Validating phone:", phone);
  
  // Clean the phone number first - keep only + and digits
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  // Very basic validation - just make sure it has a reasonable length with digits
  const isValid = cleanedPhone.length >= 7 && /\d/.test(cleanedPhone);
  
  console.log("Phone validation result:", isValid);
  return isValid;
};

// Send SMS notification for rental confirmation
export const sendRentalConfirmation = async (phone, bookTitle, dueDate) => {
  try {
    if (!phone) {
      console.warn('No phone number provided for SMS notification');
      return false;
    }
    
    // Format deadline date
    const formattedDeadline = new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create SMS message
    const message = `BookHub Rental Confirmation: You've rented "${bookTitle}". Return deadline: ${formattedDeadline}. Thank you for using BookHub!`;
    
    // Ensure phone number is in E.164 format
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = `+${phone}`;
    }
    
    // Log for debugging
    console.log(`Attempting to send SMS to ${formattedPhone}: ${message}`);
    
    // Check if we have Twilio credentials
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Send SMS via Twilio
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      console.log('SMS sent successfully:', result.sid);
      return true;
    } else {
      // Log but continue if Twilio is not configured
      console.log('Twilio not configured - would have sent SMS to:', formattedPhone);
      return true;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't stop the checkout process if SMS fails
    return false;
  }
};

export default {
  sendRentalConfirmation,
  validatePhoneNumber
};