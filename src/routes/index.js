const express = require('express');
const router = express.Router();
const passport = require('passport');
const faultController = require('../controllers/faultController');
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const notificationController = require('../controllers/notificationController');
const profileController = require('../controllers/profileController');






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

// Middleware de autenticación
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Acceso denegado');
}


router.get('/', ensureAuthenticated, (req, res) => {
    res.render('index', { user: req.user });
});

function ensureEmailDefined(req, res, next) {
    if (!req.user.email) {
        return res.redirect('/profile?updateEmail=true');
    }
    next();
}


router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login',
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: false
    })
);

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', authController.registerUser);

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

router.get('/success', (req, res) => {
    const { faultId } = req.query;
    const user = req.user; // Obtener el usuario desde req.user

    res.render('success', { user, faultId }); // Pasar user como parte de los datos para renderizar
});



// Ruta para ver el perfil
router.get('/profile', ensureAuthenticated, profileController.getProfile);

// Ruta para actualizar el perfil
router.post('/profile', ensureAuthenticated, profileController.updateProfile);

router.get('/notifications', notificationController.showNotifications);
router.get('/api/notifications/count', notificationController.getNotificationCount);

// Nuevas rutas para reporte y diagnóstico de fallas
router.get('/report', ensureAuthenticated,ensureEmailDefined, faultController.reportFault);
router.post('/report', ensureAuthenticated, ensureEmailDefined, upload.single('photo'), faultController.submitFault);

router.get('/diagnosis/:id', ensureAuthenticated, faultController.diagnosis);
router.post('/diagnosis', ensureAuthenticated, faultController.submitDiagnosis);

router.get('/summary/:id', ensureAuthenticated, faultController.summary);
router.get('/summary/:id', faultController.summary);

router.get('/list', ensureAdmin,ensureAuthenticated,faultController.listFaults);
router.post('/complete/:id', faultController.markAsCompleted);

module.exports = router;
