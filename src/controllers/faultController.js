const db = require('../../app');
const path = require('path');
const fs = require('fs');
const notificationController = require('./notificationController'); // Importar el controlador de notificaciones

exports.reportFault = (req, res) => {
    res.render('faultReport',{user: req.user});
};

exports.submitFault = (req, res) => {
    const { reporter, reportDate, priority, description, lugar } = req.body;
    const photo = req.file;

    console.log('Datos recibidos:', { reporter, reportDate, priority, description, lugar });

    let photoPath = null;
    if (photo) {
        photoPath = path.join('/uploads/', photo.filename);
    }

    db.query(
        'INSERT INTO faults (reporter, reportDate, priority, photo, description, lugar) VALUES (?, ?, ?, ?, ?, ?)', 
        [reporter, reportDate, priority, photoPath, description, lugar],
        (err, result) => {
            if (err) throw err;

            const faultId = result.insertId;
            const message = `Nuevo reporte enviado por cliente ${reporter}.\nDescripción: ${description}\nLugar: ${lugar}\nPrioridad: ${priority}`;

            notificationController.storeNotification(faultId, message, (err) => {
                if (err) throw err;

                const adminEmail = req.user.email;
                const subject = 'Nuevo reporte enviado';
                const message = `Nuevo reporte enviado por cliente ${reporter}.\nDescripción: ${description}\nLugar: ${lugar}\nPrioridad: ${priority}`;
                notificationController.sendNotification(adminEmail, subject, message);

                res.redirect(`/diagnosis/${faultId}`);
            });
        }
    );
};


exports.diagnosis = (req, res) => {
    const faultId = req.params.id;

    db.query('SELECT * FROM faults WHERE id = ?', [faultId], (err, result) => {
        if (err) throw err;
        const fault = result[0];
        res.render('diagnosis', { faultId, fault });
    });
};



exports.submitDiagnosis = (req, res) => {
    const { faultId, electricity, requiresReplacement, x, y, lampType, additionalQuestion1, additionalQuestion2 } = req.body;
    db.query(
        'UPDATE faults SET electricity = ?, requiresReplacement = ?, x = ?, y = ?, lampType = ?, additionalQuestion1 = ?, additionalQuestion2 = ? WHERE id = ?', 
        [electricity, requiresReplacement, x, y, lampType, additionalQuestion1, additionalQuestion2, faultId], 
        (err) => {
            if (err) throw err;
            
            res.redirect(`/success?faultId=${faultId}`);
        }
    );
};


exports.summary = (req, res) => {
    db.query('SELECT * FROM faults WHERE id = ?', [req.params.id], (err, result) => {
        if (err) throw err;
        const fault = result[0];
        res.render('summary', { fault });
    });
};

exports.listReports = (req, res) => {
    db.query('SELECT id, reporter, reportDate, description FROM faults', (err, results) => {
        if (err) throw err;
        res.render('reportList', { reports: results, user: req.user });
    });
};

exports.listFaults = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    db.query('SELECT COUNT(*) AS count FROM faults', (err, countResult) => {
        if (err) throw err;

        const totalCount = countResult[0].count;
        const totalPages = Math.ceil(totalCount / limit);

        db.query('SELECT id, reporter, reportDate, description, status FROM faults ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset], (err, faults) => {
            if (err) throw err;

            res.render('reportList', {
                reports: faults,
                currentPage: page,
                totalPages: totalPages,
                user: req.user // Pasar la variable user
            });
        });
    });
};

exports.markAsCompleted = (req, res) => {
    const reportId = req.params.id;
    db.query('UPDATE faults SET status = ? WHERE id = ?', ['completado', reportId], (err) => {
        if (err) throw err;
        res.redirect('/list'); // Redirigir de vuelta a la lista después de actualizar el estado
    });
};
