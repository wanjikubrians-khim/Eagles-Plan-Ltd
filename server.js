const express = require('express');
const sanitizeHtml = require('sanitize-html');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

// Configure Nodemailer (use your Gmail App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'eaglesplan9@gmail.com', // Your Gmail address
        pass: 'YOUR_APP_PASSWORD'     // Your App Password (not your regular password)
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints
// Send contact message via email
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const mailOptions = {
        from: 'eaglesplan9@gmail.com',
        to: 'eaglesplan9@gmail.com', // Send to yourself for now
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send email' });
        }
        res.status(200).json({ message: 'Email sent successfully' });
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});