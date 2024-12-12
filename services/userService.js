const { User } = require("../models");
const crypto = require("crypto");
const JWTAction = require('../middleware/JWTAction');

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            console.log('email : ', email);
            const user = await User.findOne({
                where: { email: email },
                raw: true,
            });
            if (!user) {
                userData.errCode = 1;
                userData.message = 'Wrong email';
            } else {
                const hash = crypto
                    .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
                    .toString("hex");
                if (hash !== user.password) {
                    userData.errCode = 2;
                    userData.message = 'Wrong pw';
                } else {
                    userData.errCode = 0;
                    userData.user = user;
                    userData.message = 'Login complete';

                }
            }
            resolve(userData);
        } catch (e) {
            reject(e);
        }
    });
}

let handleAutoLogin = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            const user = await User.findOne({
                where: { id: id },
                raw: true,
            });
            if (!user) {
                userData.errCode = 3;
                userData.message = 'Not found user';
            } else {
                userData.errCode = 0;
                userData.user = user;
            }
            resolve(userData);
        } catch (e) {
            reject(e);
        }
    });
}

let handleAllUserData = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let usersData = {};
            const users = await User.findAll({
                attributes: ['email', 'name', 'id'],
                raw: true,
            });
            if (!users) {
                usersData.errCode = 3;
                usersData.message = 'Not found user';
            } else {
                usersData.errCode = 0;
                usersData.user = users;
            }
            resolve(usersData);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    handleUserLogin: handleUserLogin,
    handleAutoLogin: handleAutoLogin,
    handleAllUserData: handleAllUserData,
}