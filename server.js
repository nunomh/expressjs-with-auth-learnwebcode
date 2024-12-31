const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // middleware for parsing urlencoded bodies of incoming requests (POST, PUT...)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('homepage');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', (req, res) => {
    console.log(req.body);
    res.send('Thanks for signing up!');
});

app.listen(3001);
