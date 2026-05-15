const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

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
    const payload = {
      body: formattedBody,
      to,
    };

    // Prefer Messaging Service SID so a dedicated "from" number is not needed in code.
    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (fromPhoneNumber) {
      payload.from = fromPhoneNumber;
    } else {
      console.error('Twilio: Configure TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER');
      return;
    }

    const message = await client.messages.create(payload);

    console.log(`Twilio message sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Twilio send error:', error.message);
  }
}

module.exports = {
  sendSms,
};

// Extended exports: WhatsApp support
async function sendWhatsApp(to, body, mediaUrls) {
  try {
    if (!to || !body) {
      console.error('Twilio WhatsApp: Missing recipient or message body');
      return;
    }

    const fromWhats = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!fromWhats) {
      console.error('Twilio WhatsApp: Missing TWILIO_WHATSAPP_NUMBER (e.g. sandbox number)');
      return;
    }

    const from = `whatsapp:${fromWhats}`;
    const toWhats = `whatsapp:${to}`;

    const msg = {
      from,
      to: toWhats,
      body: `KhatKhat: ${body}`,
    };

    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      msg.mediaUrl = mediaUrls;
    }

    const message = await client.messages.create(msg);
    console.log(`Twilio WhatsApp message sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Twilio WhatsApp send error:', error.message);
  }
}

module.exports = {
  sendSms,
  sendWhatsApp,
};
