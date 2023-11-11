const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'b2000534',
  password: 'admin',
  database: 'nodejs-login',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ');
    return;
  }
  console.log('Connected to MySQL');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true,
}));

app.set('view engine', 'ejs');
// Home Page
app.get('/', (req, res) => {
  res.render("index.ejs")
})
// Register Page
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
    if (err) throw err;
    res.redirect('/login');
  });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const isPasswordMatch = await bcrypt.compare(password, results[0].password);

      if (isPasswordMatch) {
        req.session.userId = results[0].id;
        res.redirect('/profile');
      } else {
        res.send('Incorrect email or password');
      }
    } else {
      res.send('Incorrect email or password');
    }
  });
});

// Profile Page
app.get('/profile', (req, res) => {
  if (req.session.userId) {
    db.query('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, results) => {
      if (err) throw err;

      const user = results[0];
      res.render('profile', { user });
    });
  } else {
    res.redirect('/login');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/login');
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
