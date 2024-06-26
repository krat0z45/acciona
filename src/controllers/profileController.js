const db = require('../models/userModel');

exports.getProfile = (req, res) => {
    const userId = req.user.id;

    db.query('SELECT username, email, status FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) throw err;
        const updateEmail = req.query.updateEmail === 'true'; // Obtener el valor de updateEmail de la consulta
        res.render('profile', { user: result[0], updateEmail }); // Pasar updateEmail a la vista
    });
};

exports.updateProfile = (req, res) => {
    const { email, status } = req.body;
    const userId = req.user.id;

    db.query(
        'UPDATE users SET email = ?, status = ? WHERE id = ?',
        [email, status, userId],
        (err, result) => {
            if (err) throw err;
            res.redirect('/profile');
        }
    );
};
