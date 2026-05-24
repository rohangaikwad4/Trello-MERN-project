const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const token = req.headers.token;

    try {
        const decode = jwt.verify(
            token,
            "super123123"
        );

        req.userId = decode.userId;
        next();
    } catch (err) {
        return res.status(403).json({
            msg: "Token was incorrect"
        });
    }
}

module.exports = authMiddleware; // ✅ FIXED