// middlewares/checkEmail.js

function checkEmail(req, res, next) {
    if (req.user && req.user.email) {
        next();
    } else {
        res.redirect('/profile?updateEmail=true');
    }
}

module.exports = checkEmail;
