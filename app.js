const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos MySQL.');
});

module.exports = db;

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Configuración de Passport
passport.use(new LocalStrategy(
    function(username, password, done) {
        db.query('SELECT id, username, password, email FROM users WHERE username = ?', [username], (err, results) => {
            if (err) return done(err);
            if (results.length === 0) return done(null, false, { message: 'Usuario no encontrado.' });

            const user = results[0];
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Contraseña incorrecta.' });
                }
            });
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role, email: user.email });
});

passport.deserializeUser((serializedUser, done) => {
    db.query('SELECT id, username, role, email FROM users WHERE id = ?', [serializedUser.id], (err, results) => {
        if (err) return done(err);
        const user = results[0];
        done(null, user);
    });
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Rutas
const indexRouter = require('./src/routes/index');
app.use('/', indexRouter);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
