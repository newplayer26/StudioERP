
const userService = require('../../services/userService');
const JWTAction = require('../../middleware/JWTAction');
let allUserData = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(500).json({
            errCode: 1,
            message: 'Not found token',
        });
    }
    let userId = JWTAction.verifyToken(token).id;
    if (!userId) {
        return res.status(500).json({
            errCode: 2,
            message: 'Token is invalid',
        });
    }
    let usersData = await userService.handleAllUserData();

    let jwt = null;
    if (usersData.errCode == 0) {
        jwt = JWTAction.createToken({ id: userId });
    }
    res.setHeader('Authorization', `Bearer ${jwt}`);
    return res.status(200).json({
        errCode: usersData.errCode,
        message: usersData.message,
        usersData,
        jwt: jwt,
    });

}




module.exports = {
    allUserData: allUserData,
}