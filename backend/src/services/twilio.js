const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Send an SMS message using Twilio
 * @param {string} to - The recipient's phone number
 * @param {string} body - The message content
 */
async function sendSms(to, body) {
  try {
    if (!to || !body) {
      console.error('Twilio: Missing recipient or message body');
      return;
    }

    // Ensure the body starts with KhatKhat as requested
    const formattedBody = `KhatKhat: ${body}`;

    const message = await client.messages.create({
      body: formattedBody,
      from: fromPhoneNumber,
      to: to,
    });

    console.log(`Twilio message sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Twilio send error:', error.message);
  }
}

module.exports = {
  sendSms,
};
