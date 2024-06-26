const nodemailer = require('nodemailer');
const db = require('../../app'); // Asegúrate de tener la configuración correcta de tu base de datos

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


exports.sendNotification = (to, subject, message) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

exports.storeNotification = (faultId, message, callback) => {
    db.query('INSERT INTO notifications (faultId, message) VALUES (?, ?)', [faultId, message], callback);
};

exports.showNotifications = (req, res) => {
    db.query('SELECT * FROM notifications ORDER BY createdAt DESC', (err, results) => {
        if (err) throw err;
        res.render('notifications', { notifications: results });
    });
};

exports.getNotificationCount = (req, res) => {
    db.query('SELECT COUNT(*) AS count FROM notifications', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error retrieving notification count' });
        }
        res.json({ count: result[0].count });
    });
};
