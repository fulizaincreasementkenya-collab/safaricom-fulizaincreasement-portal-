require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// PAYHERO AUTH TOKEN YAKO
const BASIC_AUTH = process.env.BASIC_AUTH_TOKEN;

// ROUTE 1: TOA PAGE 1
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROUTE 2: STK PUSH - HII NDIO INATUMA M-PESA PROMPT
app.post('/pay', async (req, res) => {
  try {
    let { phone, amount } = req.body;

    // Badilisha 0712345678 > 254712345678
    phone = phone.toString().trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }

    const payload = {
      "amount": parseInt(amount),
      "phone_number": phone,
      "channel_id": process.env.CHANNEL_ID,
      "provider": "mpesa",
      "external_reference": `FULIZA-${Date.now()}`,
      "callback_url": process.env.CALLBACK_URL
    };

    console.log("Sending STK to:", phone, "Amount: KES", amount);

    const response = await axios.post(
      'https://api.payhero.co.ke/api/v2/payments', 
      payload, 
      { 
        headers: { 
          'Authorization': BASIC_AUTH,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    
    console.log("STK Success:", response.data);
    res.json({status: "success", data: response.data});

  } catch (error) {
    console.log("PAYHERO ERROR:", error.response?.data || error.message);
    res.status(400).json({
      status: "error",
      message: error.response?.data?.message || "STK Failed. Check wallet balance."
    });
  }
});

// ROUTE 3: CALLBACK - PayHero atarudi hapa akilipa
app.post('/payhero-callback', (req, res) => {
  console.log("PAYMENT RECEIVED:", req.body);
  res.status(200).json({status: "OK"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
