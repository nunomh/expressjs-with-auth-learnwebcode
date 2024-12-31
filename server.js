const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // middleware for parsing urlencoded bodies of incoming requests (POST, PUT...)
app.use(express.static('public'));

app.use((req, res, next) => {
    res.locals.errors = [];
    next();
});

app.get('/', (req, res) => {
    res.render('homepage');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', (req, res) => {
    const errors = [];

    if (typeof req.body.username !== 'string') req.body.username = '';
    if (typeof req.body.password !== 'string') req.body.password = '';

    req.body.username = req.body.username.trim();
    req.body.password = req.body.password.trim();

    if (!req.body.username) errors.push('Username is required');
    if (req.body.username && req.body.username.length < 6) errors.push('Username must be at least 6 characters long');
    if (req.body.username && req.body.username.length > 30) errors.push('Username must be at most 30 characters long');
    if (req.body.username && req.body.username.match(/[^a-zA-Z0-9]/))
        errors.push('Username must contain only letters and numbers');

    if (!req.body.password) errors.push('Password is required');
    if (req.body.password && req.body.password.length < 12) errors.push('Password must be at least 12 characters long');
    if (req.body.password && req.body.password.length > 30) errors.push('Password must be at most 30 characters long');

    if (errors.length) {
        return res.render('homepage', { errors });
    }

    // save the user to the database

    // log the user in by setting a cookie

    res.send('Thanks for signing up!');
});

app.listen(3001);
