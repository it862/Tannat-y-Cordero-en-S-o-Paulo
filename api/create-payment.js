import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    first_name, last_name, email, phone,
    country, quantity, amount, currency,
    order_id, success_url, back_url, notification_url,
  } = req.body;

  const API_KEY    = process.env.DLOCALGO_API_KEY;
  const API_SECRET = process.env.DLOCALGO_SECRET_KEY;
  const BASE_URL   = process.env.NODE_ENV === 'production'
    ? 'https://api.dlocalgo.com'
    : 'https://api-sbx.dlocalgo.com';

  if (!API_KEY || !API_SECRET) {
    console.error("Missing DLOCALGO API credentials");
    return res.status(500).json({ message: 'Server configuration error. Contact support.' });
  }

  const payload = {
    amount,
    currency,
    country,
    order_id,
    description: `Entrada Tannat y Cordero en São Paulo x${quantity}`,
    success_url,
    back_url,
    notification_url,
    payer: {
      name:  `${first_name} ${last_name}`,
      email: email,
      phone: phone,
    },
  };

  try {
    const date = new Date().toISOString();
    const bodyStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(API_KEY + date + bodyStr)
      .digest('hex');
    
    // dLocal Go HMAC signature header format
    const authHeader = `V2-HMAC-SHA256, Signature: ${signature}`;

    const response = await fetch(`${BASE_URL}/v1/payments`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
        'X-Date': date,
        'X-Login': API_KEY
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('dLocal Go error:', data);
      return res.status(400).json({ message: data.message || 'Error processing payment with provider.' });
    }

    // Return the redirect URL that the user should be sent to
    res.status(200).json({ redirect_url: data.redirect_url });
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ message: 'Internal server error while creating payment' });
  }
}
