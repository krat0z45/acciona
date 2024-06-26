const bcrypt = require('bcryptjs');
const db = require('../models/userModel');

exports.registerUser = (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;

        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(query, [username, hash], (err, result) => {
            if (err) throw err;
            res.redirect('/login');
        });
    });
};
