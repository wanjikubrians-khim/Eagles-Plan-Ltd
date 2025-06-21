const express = require('express');
const sqlite3 = require('better-sqlite3');
const sanitizeHtml = require('sanitize-html');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3('reviews.db', { verbose: console.log });
db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        date TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT 0
    )
`);

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
// Submit a review
app.post('/api/reviews', (req, res) => {
    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    const sanitizedName = sanitizeHtml(name, { allowedTags: [] });
    const sanitizedComment = sanitizeHtml(comment, { allowedTags: [] });
    const date = new Date().toISOString();
    try {
        const stmt = db.prepare('INSERT INTO reviews (name, rating, comment, date, approved) VALUES (?, ?, ?, ?, ?)');
        stmt.run(sanitizedName, rating, sanitizedComment, date, 0);
        res.status(201).json({ message: 'Review submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch approved reviews
app.get('/api/reviews', (req, res) => {
    try {
        const reviews = db.prepare('SELECT id, name, rating, comment, date FROM reviews WHERE approved = 1').all();
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch all reviews (admin)
app.get('/api/admin/reviews', (req, res) => {
    try {
        const reviews = db.prepare('SELECT id, name, rating, comment, date, approved FROM reviews').all();
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a review (admin)
app.delete('/api/admin/reviews/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
        const info = stmt.run(id);
        if (info.changes === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

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