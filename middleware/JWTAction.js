require("dotenv").config();
var jwt = require('jsonwebtoken');

const createToken = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key);
        console.log('token : ', token);

    } catch (err) {
        console.log('error : ', err);
    }

    return token;
}

const verifyToken = (token) => {
    let data = null;
    return jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            console.log('err : ', err);
            return null;
        }
        console.log('decoded : ', decoded);

        return decoded;

    });
}

module.exports = {
    createToken: createToken,
    verifyToken: verifyToken,
}