
const userService = require('../../services/userService');
const JWTAction = require('../../middleware/JWTAction');
let sysLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.status(500).json({
            errCode: 1,
            message: 'Missing input parameters',
        });
    }
    let userData = await userService.handleUserLogin(email, password);
    let jwt = null;
    if (userData.errCode == 0) {
        jwt = JWTAction.createToken({ id: userData.user.id, email: userData.user.email });
    }
    res.setHeader('Authorization', `Bearer ${jwt}`);
    console.log('syslogin deteact : ', JSON.stringify(userData));
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.message,
        userData,
        jwt: jwt,
    });
}


let autoLogin = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('check token input : ', token);
    if (!token) {
        return res.status(500).json({
            errCode: 1,
            message: 'Not found token',
        });
    }
    let tokenVerify = JWTAction.verifyToken(token);
    if (!tokenVerify) {
        return res.status(500).json({
            errCode: 1,
            message: 'Token lỗi ',
        });
    }

    let userId = tokenVerify.id;
    if (!userId) {
        return res.status(500).json({
            errCode: 2,
            message: 'Token is invalid',
        });
    }
    let userData = await userService.handleAutoLogin(userId);

    let jwt = null;
    if (userData.errCode == 0) {
        jwt = JWTAction.createToken({ id: userData.user.id, email: userData.user.email });
    }
    res.setHeader('Authorization', `Bearer ${jwt}`);
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.message,
        userData,
        jwt: jwt,
    });
}

module.exports = {
    sysLogin: sysLogin,
    autoLogin: autoLogin,
}