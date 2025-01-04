require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const express = require('express');
const db = require('better-sqlite3')('ourApp.db');
db.pragma('journal_mode = WAL');

// database setup here
const createTables = db.transaction(() => {
    db.prepare(
        `
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username STRING NOT NULL UNIQUE,
			password STRING NOT NULL
			)
		`
    ).run();
});

createTables();

// dabatabse setup ends here

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // middleware for parsing urlencoded bodies of incoming requests (POST, PUT...)
app.use(express.static('public'));
app.use(cookieParser());

// middleware for cookie validation
app.use((req, res, next) => {
    res.locals.errors = [];

    try {
        const decoded = jwt.verify(req.cookies.ourSimpleApp, process.env.JWTSECRET);
        req.user = decoded;
    } catch (error) {
        req.user = false;
    }

    res.locals.user = req.user;

    next();
});

app.get('/', (req, res) => {
    if (req.user) {
        return res.render('dashboard');
    }
    res.render('homepage');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    res.clearCookie('ourSimpleApp');
    res.redirect('/');
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
    const salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);

    const ourStatement = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = ourStatement.run(req.body.username, req.body.password);

    const lookupStatement = db.prepare('SELECT * FROM users WHERE ROWID = ?');
    const ourUser = lookupStatement.get(result.lastInsertRowid);

    // log the user in by setting a cookie
    const ourTokenValue = jwt.sign(
        { exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, userid: ourUser.id, username: ourUser.username },
        // 7 days, exp is defined as the number of seconds (not milliseconds)
        process.env.JWTSECRET
    );

    res.cookie('ourSimpleApp', ourTokenValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days, in milliseconds
    });

    res.send('Thanks for signing up!');
});

app.listen(3001);
