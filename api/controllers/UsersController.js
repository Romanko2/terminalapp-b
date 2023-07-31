/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const credentials = require('../../config/local');
const bcrypt = require('bcrypt-nodejs');
var constantObj = sails.config.constants;
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
const db = sails.getDatastore().manager;
const reader = require("xlsx");
var fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const { sendEmail } = require('../controllers/SmtpController');
const { waitForDebugger } = require('inspector');
var ObjectId = require('mongodb').ObjectID;

generateVeificationCode = function () {
    // action are perform to generate VeificationCode for user
    var length = 9,
        charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        retVal = '';

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

generatePassword = function () {
    // action are perform to generate VeificationCode for user
    var length = 4,
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        retVal = '';

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }

    lowercase = 'abcdefghijklmnopqrstuvwxyz'
    lowercaseCharacterLength = 2
    for (var i = 0, n = lowercase.length; i < lowercaseCharacterLength; ++i) {
        retVal += lowercase.charAt(Math.floor(Math.random() * n));
    }

    specialCharacter = '@%$#&-!'
    specialCharacterLength = 1

    for (var i = 0, n = specialCharacter.length; i < specialCharacterLength; ++i) {
        retVal += specialCharacter.charAt(Math.floor(Math.random() * n));
    }
    numeric = '0123456789'
    numericLength = 2
    for (var i = 0, n = numeric.length; i < numericLength; ++i) {
        retVal += numeric.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

generateOTP = function () {
    // action are perform to generate VeificationCode for user
    var length = 6,
        charset = '1234567890',
        retVal = '';

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

module.exports = {


    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to register User  
     */
    register: async (req, res) => {

        if ((!req.body.email) || typeof req.body.email == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.EMAIL_REQUIRED } });
        }

        if ((!req.body.password) || typeof req.body.password == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.PASSWORD_REQUIRED } });
        }
        var date = new Date();
        try {
            var user = await Users.findOne({ email: req.body.email.toLowerCase(), isDeleted: false });
            if (user) {
                return res.status(400).json({ "success": false, "error": { "code": 400, "message": constantObj.user.EMAIL_EXIST } });
            } else {
                req.body['date_registered'] = date;
                req.body['date_verified'] = date;
                req.body["status"] = "active";
                req.body["role"] = req.body.role ? req.body.role : "user"

                // if (req.body.firstName && req.body.lastName) {
                //     req.body["fullName"] = req.body.firstName + ' ' + req.body.lastName
                // }


                var newUser = await Users.create(req.body).fetch()
                if (newUser) {
                    userVerifyLink({
                        email: newUser.email,
                        fullName: newUser.fullName,
                        id: newUser.id,
                    })

                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "data": newUser,
                        "message": constantObj.user.SUCCESSFULLYREGISTERED,
                    });
                }
            }
        } catch (err) {
            return res.status(400).json({ "success": true, "code": 400, "error": err, });
        }
    },

    /**
     * 
     * @reqBody  : {email,password}
     * @param {*} res 
     * @returns 
     */
    adminSignin: async (req, res) => {

        if ((!req.body.email) || typeof req.body.email == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.EMAIL_REQUIRED } });
        }

        if ((!req.body.password) || typeof req.body.password == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.PASSWORD_REQUIRED } });
        }

        var user = await Users.findOne({ email: req.body.email.toLowerCase(), isDeleted: false });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 404,
                    message: constantObj.user.INVALID_USER,
                },
            });
        }

        if (user && user.status == 'deactive') {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_INACTIVE } });
        }

        if (user && user.status != "active" && user.isVerified != "Y") {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_INACTIVE } });
        }

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.WRONG_PASSWORD } });
        } else {

            var token = jwt.sign({ user_id: user.id, fullName: user.fullName },
                { issuer: 'Amit Kumar', subject: user.email, audience: "public" })

            user.access_token = token;

            return res.status(200).json(
                {
                    "success": true,
                    "code": 200,
                    "message": constantObj.user.SUCCESSFULLY_LOGGEDIN,
                    "data": user
                });
        }
    },

    /*
    *changePassword
    */
    changePassword: async function (req, res) {
        //("in change password")

        if ((!req.body.newPassword) || typeof req.body.newPassword == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.PASSWORD_REQUIRED } });
        }
        if ((!req.body.confirmPassword) || typeof req.body.confirmPassword == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.CONPASSWORD_REQUIRED } });
        }

        if ((!req.body.currentPassword) || typeof req.body.currentPassword == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.CURRENTPASSWORD_REQUIRED } });
        }

        let data = req.body;
        let newPassword = data.newPassword;
        let currentPassword = data.currentPassword;

        let query = {};
        query.id = req.identity.id;

        Users.findOne(query).then((user) => {
            if (!bcrypt.compareSync(currentPassword, user.password)) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.CURRENT_PASSWORD },
                });
            } else {
                var encryptedPassword = bcrypt.hashSync(
                    newPassword,
                    bcrypt.genSaltSync(10)
                );
                Users.update(
                    { id: req.identity.id },
                    { password: encryptedPassword }
                ).then(function (user) {
                    return res.status(200).json({
                        success: true,
                        message: constantObj.user.PASSWORD_CHANGED,
                    });
                });
            }
        });

    },


    /**
     * 
     * @param {*} req.body {email:"",password:""}
     * @param {*} res 
     * @returns detail of the user
     * @description: Used to signup for company, manager , employee
     */
    userSignin: async (req, res) => {
        try {

            if ((!req.body.email) || typeof req.body.email == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.EMAIL_REQUIRED } });
            }

            if ((!req.body.password) || typeof req.body.password == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.PASSWORD_REQUIRED } });
            }

            // if ((!req.body.role) || typeof req.body.role == undefined) {
            //     return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.ROLE_REQUIRED } });

            // }


            // , select: ['email', 'role', 'status', 'isVerified', 'password', 'firstName', 'lastName', 'fullName', 'image'] 
            var userDetails = await Users.find({ where: { email: req.body.email.toLowerCase(), isDeleted: false } });
            var user = userDetails[0];

            if (!user) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.INVALID_CRED } });
            }

            if (user && user.status != "active") {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_INACTIVE } });

            }
            if (user.isVerified == "N") {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_VERIFIED } });

            }

            if (!bcrypt.compareSync(req.body.password, user.password)) {

                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.INVALID_CRED } });

            } else {
                /**Genreating access token for the company and company_admin */

                var token = jwt.sign({ user_id: user.id, fullName: user.fullName },
                    { issuer: 'Jcsoftware', subject: user.email, audience: "L3Time" })
                const refreshToken = jwt.sign({ user_id: user.id }, { issuer: 'refresh', subject: "user", audience: "L3Time" })
                user.access_token = token;
                user.refresh_token = refreshToken;

                return res.status(200).json({
                    "success": true,
                    "code": 200,
                    "message": constantObj.user.SUCCESSFULLY_LOGGEDIN,
                    "data": user
                });
            }
        }
        catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /**
        * 
        * @param {*} req.body {email:"",password:""}
        * @param {*} res 
        * @returns detail of the user
        * @description: Used to signup for group and participants
        */




    verifiyOtp: (req, res) => {
        try {
            var otp = req.param("otp");
            var email = req.param("email");

            if (!otp || typeof otp == undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.OTP_REQUIRED },
                });
            }
            if (!email || typeof email == undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
                });
            }
            var query = {};
            query.otp = otp;
            query.email = email;
            Users.findOne(query).then((user) => {
                if (user) {
                    var token = jwt.sign(
                        { user_id: user.id, firstName: user.firstName },
                        { issuer: "Jcsoftware", subject: user.email, audience: "L3Time" }
                    );

                    user.access_token = token;

                    return res.status(200).json({
                        success: true,
                        data: user,
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: { message: constantObj.user.INVALID_OTP },
                    });
                }
            });
        } catch (err) {
            return res
                .status(400)
                .json({ success: false, error: { code: 400, message: "" + err } });
        }
    },


    /*For Get User Details
    * Get Record from Login User Id
    */
    userDetails: async function (req, res) {
        var id = req.param('id');
        if ((!id) || typeof id == undefined) {
            return res.status(400).json({ "success": false, "error": { "code": 400, "message": "Id is required" } });
        }

        var userDetails = await Users.findOne({ id: id } )

        let get_subscription = await Subscription.findOne({ user_id: id, status: "active" })
        // console.log(userDetails, "===============userDetails")

    //    let userDetails2 = Object.assign({}, userDetails)       
        userDetails.subscribe_status = get_subscription ? get_subscription.status : "cancelled";
        if (get_subscription) {
            userDetails.subscription_plan_id = get_subscription.subscription_plan_id;

        }
        // console.log(userDetails, "===============userDetails")


        return res.status(200).json(
            {
                "success": true,
                "code": 200,
                "data": userDetails
            });
    },


    /*For Get all Users
    * Param Role
    */


    getAllUsers: async (req, res) => {
        //.log("In Get all user");
        try {
            var search = req.param('search');
            var role = req.param('role');
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var recordType = req.param('recordType');
            var type = req.param('type');
            var faculty = req.param('faculty');
            var sortBy = req.param("sortBy");


            if (!page) {
                page = 1
            }
            var count = parseInt(req.param('count'));
            if (!count) {
                count = 10
            }
            var skipNo = (page - 1) * count;
            var query = {};
            if (search) {
                query.$or = [
                    { fullName: { $regex: search, '$options': 'i' } },
                    { email: { $regex: search, '$options': 'i' } },
                    { name: { $regex: search, '$options': 'i' } }
                ]
            }
            query.role = { $ne: 'admin' };
            if (role) {
                query.role = role;
            }

            query.isDeleted = false;
            if (recordType) {
                query.recordType = recordType;
            }
            if (type) {
                query.type = type
            }
            sortquery = {};
            if (sortBy) {
                var order = sortBy.split(" ");

                var field = order[0];
                var sortType = order[1];
            }
            sortquery[field ? field : "createdAt"] = sortType
                ? sortType == "desc"
                    ? -1
                    : 1
                : -1;
            db.collection('users').aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'addedBy',
                        foreignField: '_id',
                        as: "addedBy"
                    }
                },
                {
                    $unwind: {
                        path: '$addedBy',
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $project: {
                        role: "$role",
                        isDeleted: "$isDeleted",
                        firstName: "$firstName",
                        lastName: "$lastName",
                        fullName: "$fullName",
                        groupName: "$groupName",
                        mobileNo: "$mobileNo",
                        name: "$name",
                        email: "$email",
                        type: "$type",
                        role: "$role",
                        address: "$address",
                        addedBy: "$addedBy",
                        status: "$status",
                        createdAt: "$createdAt",
                        deletedBy: "$deletedBy.fullName",
                        deletedAt: '$deletedAt',
                    }
                },
                {
                    $match: query
                },
            ]).toArray((err, totalResult) => {

                db.collection('users').aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'addedBy',
                            foreignField: '_id',
                            as: "addedBy"
                        }
                    },
                    {
                        $unwind: {
                            path: '$addedBy',
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            role: "$role",
                            isDeleted: "$isDeleted",
                            firstName: "$firstName",
                            lastName: "$lastName",
                            fullName: "$fullName",
                            groupName: "$groupName",
                            mobileNo: "$mobileNo",
                            name: "$name",
                            email: "$email",
                            type: "$type",
                            role: "$role",
                            address: "$address",
                            addedBy: "$addedBy",
                            status: "$status",
                            createdAt: "$createdAt",
                            deletedBy: "$deletedBy.fullName",
                            deletedAt: '$deletedAt',
                        }
                    },
                    {
                        $match: query
                    },
                    {
                        $sort: sortquery
                    },

                    {
                        $skip: Number(skipNo)
                    },
                    {
                        $limit: Number(count)
                    }
                ]).toArray((err, result) => {
                    // //.log(err)
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            code: { code: 400, error: err }
                        })
                    }
                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "data": result,
                        "total": totalResult.length,
                    });
                })

                if (err) {
                    return res.status(400).json({
                        success: false,
                        code: { code: 400, error: err }
                    })
                }
            })
        } catch (error) {
            //.log(error)
            return res.status(400).json({
                "success": false,
                "code": 400,
                "error": error,
            });
        }
    },

    /*
    *For Check Email Address Exit or not
    */
    checkEmail: async function (req, res) {
        var email = req.param('email');
        if ((!email) || typeof email == undefined) {
            return res.status(400).json({ "success": false, "error": { "code": 400, "message": "Email is required" } });
        }
        Users.findOne({ email: email }).then(user => {
            if (user) {
                return res.status(200).json({ "success": false, "error": { "code": 400, "message": "Email already taken" } });
            } else {
                return res.status(200).json({ "success": true, "code": 200, "message": "you can use this email" });
            }
        });
    },

    userProfileData: async (req, res) => {
        let id = req.identity.id

        var userDetail = await Users.findOne({ id: id });

        if (!userDetail) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            });
        } else {
            return res.status(200).json({
                "success": true,
                "code": 200,
                "data": userDetail
            });
        }
    },

    userDetail: async (req, res) => {

        let query = {};
        query.id = req.param('id')

        let userDetail = await Users.findOne(query)
        //.log(userDetail);
        if (!userDetail) {
            return res.status(400).json({
                "success": false,
                "code": 400,
                "message": "User not exist."
            });
        } else {
            return res.status(200).json({
                "success": true,
                "code": 200,
                "data": userDetail
            });
        }

    },

    forgotPassword: async (req, res) => {
        let data = req.body;
        if (!data.email || data.email == undefined) {
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constantObj.user.USERNAME_REQUIRED },
            });
        }
        Users.findOne({ email: data.email.toLowerCase(), isDeleted: false, role: { in: ["admin"] } }).then(
            (data) => {
                if (data === undefined) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 404,
                            message: constantObj.user.INVALID_USER,
                        },
                    });
                } else {
                    var verificationCode = generateVeificationCode();

                    Users.update(
                        { email: data.email, isDeleted: false },
                        {
                            verificationCode: verificationCode,
                        }
                    ).then(async (result) => {
                        currentTime = new Date();
                        await forgotPasswordEmail({
                            email: data.email,
                            verificationCode: verificationCode,
                            fullName: data.fullName,
                            id: data.id,
                            time: currentTime.toISOString(),
                        });
                        return res.status(200).json({
                            success: true,
                            id: data.id,
                            message: constantObj.user.VERIFICATION_SENT,
                        });
                    });
                }
            }
        );
    },

    forgotPasswordFrontend: async (req, res) => {
        let data = req.body;
        if (!data.email || data.email == undefined) {
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constantObj.user.USERNAME_REQUIRED },
            });
        }
        let find = await Users.findOne({ email: data.email.toLowerCase(), isDeleted: false, role: { in: ["user"] } })

        if (!find) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 404,
                    message: constantObj.user.INVALID_USER,
                },
            });
        } else {
            var verificationCode = generateVeificationCode();
            let user = await Users.updateOne(
                { email: req.body.email, isDeleted: false },
                {
                    verificationCode: verificationCode,
                })
            // console.log(user, "==================user")
            currentTime = new Date();
            await forgotPasswordEmail({
                email: find.email,
                fullName: find.fullName,
                id: find.id,
                verificationCode: verificationCode,
                time: currentTime.toISOString(),
            });
            return res.status(200).json({
                success: true,
                id: find.id,
                message: constantObj.user.VERIFICATION_SENT,
            });

        }
    },

    resetPassword: async (req, res) => {
        let data = req.body;
        try {
            var code = data.verificationCode;
            var newPassword = data.newPassword;

            let user = await Users.findOne({ id: data.id, isDeleted: false });

            console.log(data.verificationCode)
            console.log(code)

            if (!user || user.verificationCode !== code) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 404,
                        message: 'Verification code wrong.',
                    },
                });
            } else {
                const encryptedPassword = bcrypt.hashSync(
                    newPassword,
                    bcrypt.genSaltSync(10)
                );
                Users.updateOne({ id: user.id }, { password: encryptedPassword }).then(
                    (updatedUser) => {
                        return res.status(200).json({
                            success: true,
                            message: 'Password reset successfully.',
                        });
                    }
                );
            }
        } catch (err) {
            return res
                .status(400)
                .json({ success: true, error: { code: 400, message: '' + err } });
        }
    },

    verifyUser: (req, res) => {
        var id = req.param('id')
        Users.findOne({ id: id }).then(user => {

            if (user) {
                Users.update({ id: id }, { isVerified: 'Y', }).then(verified => {
                    return res.redirect(`${credentials.FRONT_WEB_URL}/auth/login?id=${id}`)
                })
            } else {
                return res.redirect(`${credentials.FRONT_WEB_URL}/auth/login?id=${id}`)
            }
        })
    },

    verifyEmail: (req, res) => {
        var id = req.param('id')
        //(id);
        Users.findOne({ id: id }).then(user => {
            if (user) {
                //(user)
                Users.update({ id: id }, { contact_information: 'Yes' }).then(verified => {
                    return res.redirect(constant.FRONT_WEB_URL)
                })
            } else {
                return res.redirect(constant.FRONT_WEB_URL)
            }
        })
    },

    editProfile: async (req, res) => {
        let data = req.body;
        try {
            var id = req.body.id;
            if (!id || id == undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.ID_REQUIRED, },
                });
            }
            /**Creating fullName of User using firstName and lastName */
            if (data.firstName && data.lastName) {
                data.fullName = data.firstName + ' ' + data.lastName;
            }
            else if (data.firstName && !data.lastName) {
                data.fullName = data.firstName
            }
            Users.updateOne({ id: id }, data).then(async (user) => {


                return res.status(200).json({
                    success: true,
                    data: user,
                    message: constantObj.user.UPDATED_USER,
                });
            });
        } catch (err) {
            //.log(err);
            return res
                .status(400)
                .json({ success: false, error: { code: 400, message: '' + err } });
        }
    },

    /**
 *
 * @param {*} req
 * @param {*} res
 * @returns
 * @description Used to register User
 */
    addUser: async (req, res) => {
        if (!req.body.email || typeof req.body.email == undefined) {
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
            });
        }

        var date = new Date();
        try {
            var user = await Users.findOne({ email: req.body.email.toLowerCase(), isDeleted: false });
            if (user) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constantObj.user.EMAIL_EXIST },
                });
            } else {
                req.body['date_registered'] = date;
                req.body['status'] = 'active';
                req.body['role'] = req.body.role ? req.body.role : 'user';
                req.body['addedBy'] = req.identity.id;
                const password = generatePassword();
                req.body.password = password;
                req.body.isVerified = 'Y';

                if (req.body.recordType != "") {
                    req.body['fullName'] = req.body.fullName;
                }
                else {
                    req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
                }

                //  if (req.body.firstName && req.body.lastName) {        


                var newUser = await Users.create(req.body).fetch();
                if (newUser) {
                    //.log(newUser, "-------------------->newUser")
                    addUserEmail({
                        email: newUser.email,
                        fullName: newUser.fullName,
                        password: password,
                        role: newUser.role
                    });

                    return res.status(200).json({
                        success: true,
                        code: 200,
                        data: newUser,
                        message: constantObj.user.SUCCESSFULLY_REGISTERED,
                    });
                }
            }
        } catch (err) {
            return res.status(400).json({ success: true, code: 400, error: err });
        }
    },
};

welcomeEmail = function (options) {

    console.log("we are here")
    var email = options.email;
    var password = options.password;
    message = '';
    style = {
        header: `
       padding:30px 15px;
       text-align:center;
       background-color:#f2f2f2;
       `,
        body: `
       padding:15px;
       height: 230px;
       `,
        hTitle: `font-family: 'Raleway', sans-serif;
       font-size: 37px;
       height:auto;
       line-height: normal;
       font-weight: bold;
       background:none;
       padding:0;
       color:#333;
       `,
        maindiv: `
       width:600px;
       margin:auto;
       font-family: Lato, sans-serif;
       font-size: 14px;
       color: #333;
       line-height: 24px;
       font-weight: 300;
       border: 1px solid #eaeaea;
       `,
        textPrimary: `color:#3e3a6e;
       `,
        h5: `font-family: Raleway, sans-serif;
       font-size: 22px;
       background:none;
       padding:0;
       color:#333;
       height:auto;
       font-weight: bold;
       line-height:normal;
       `,
        m0: `margin:0;`,
        mb3: 'margin-bottom:15px;',
        textCenter: `text-align:center;`,
        btn: `padding:10px 30px;
       font-weight:500;
       font-size:14px;
       line-height:normal;
       border:0;
       display:inline-block;
       text-decoration:none;
       `,
        btnPrimary: `
       background-color:#3e3a6e;
       color:#fff;
       `,
        footer: `
       padding:10px 15px;
       font-weight:500;
       color:#fff;
       text-align:center;
       background-color:#000;
       `
    }

    // src="` +
    // constant.FRONT_WEB_URL +
    // `/assets/img/logo.jpeg"

    message += `<div class="container" style="` + style.maindiv + `">
   <div class="header" style="`+ style.header + `text-align:center">
       <img style="margin-bottom:20px; height: 67%; width: 66%;"  src="` +
        constant.FRONT_WEB_URL +
        `/assets/img/logo.jpeg"  />
      
   </div>
   <div class="body" style="`+ style.body + `">
       <h5 style="`+ style.h5 + style.m0 + style.mb3 + `">Hello ` + options.fullName + `</h5>
       <p style="`+ style.m0 + style.mb3 + `margin-bottom:20px;font-weight: 600">Your Goodclean account has been created! <br>
       Your login credentials are:</p>
       <div style="">
       <strong>Email : </strong>`+ email + `<br>
       <strong>Password : </strong>`+ password + `<br>
        </div>
   </div>
   <div class="footer" style="`+ style.footer + `">
   2023 All Rights Reserved.
   </div>
 </div>`



    SmtpController.sendEmail(email, 'Email Verification', message)
};


userVerifyLink = async (options) => {
    let email = options.email;
    console.log(options, "==================options")
    message = ''
    message += `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    
    <body style="font-family: sans-serif;">
    
        <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
            <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
                <img src="${credentials.BACK_WEB_URL}img/check_mark2.png" style="width: 80px; height: 80px;">
                <h1 style="    margin-top: 10px; font-size: 26px;color: #23a2d4;">You’Re In!</h1>
                <p>Thank you for joining Globovue, You are Going to love it here. </p>
    
                <img src="${credentials.BACK_WEB_URL}img/logo_img.png" style="width:170px; height: 85px;margin-top: 20px; object-fit: contain;">
    
                <p style="width: 134px; height: 1px;background: #164E63;margin: 22px auto;    margin-top: 14px;"></p>
    
                    <a href="${credentials.BACK_WEB_URL}/verifyUser?id=${options.id}"  style="padding: 8px 25px; font-size: 12px;cursor: pointer; color: #fff; background: #2fc0f9; border-radius: 50px; border: 1px solid #2fc0f9;"
                    type="text">Verify Email</a>
                <p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our support team!</p>
    
            </div>
            <p style="width: 20px; height: 185px; background: #164E63; position: absolute;bottom: 0px;left: 0px;margin:0px;">
            </p>
            <!-- <p
                style="width: 50px; height: 18px; background: #164E63; position: absolute;bottom: 0px; right: 0px;margin:0px;">
            </p> -->
            <p style="width: 20px; height: 185px; background: #164E63; position: absolute;top: 0px;right: 0px;margin:0px;">
            </p>
            <!-- <p style="width: 50px; height: 18px; background: #164E63; position: absolute;top: 0px;left: 0px;margin:0px;">
            </p> -->
        </div>
    
    </body>
    
    </html>
  `;
    SmtpController.sendEmail(email, 'Email Verification', message);
};

forgotPasswordEmail = function (options) {

    var email = options.email;
    var fullName = options.fullName;

    if (!fullName) {
        fullName = email;
    }
    message = '';

    message +=
        ` 
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        
        <body style="font-family: sans-serif;">
        
            <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
                <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
                    <img src=""${credentials.BACK_WEB_URL}/logo_img.png" style="width:170px; height: 85px; object-fit: contain;">
                    <!-- <img src="img/check_mark2.png" style="width: 80px; height: 80px;"> -->
                    <h1 style="    margin-top: 10px; font-size: 26px;color: #23a2d4;">Forgot password</h1>
                    <p> To reset your password, click the
                    following link and follow the instructions.</p>
                    <p style="width: 134px; height: 1px;background: #164E63;margin: 22px auto;margin-top: 14px;"></p>
        <a href="${credentials.FRONT_WEB_URL}/auth/reset?id=${options.id}&verificationCode=${options.verificationCode}"
                    style="background:#2fc0f9;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                    Password </a>
                      
                    <p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our support team!</p>
        
                </div>
                <p style="width: 20px; height: 185px; background: #164E63; position: absolute;bottom: 0px;left: 0px;margin:0px;">
                </p>
            
                <p style="width: 20px; height: 185px; background: #164E63; position: absolute;top: 0px;right: 0px;margin:0px;">
                </p>
          
            </div>
        
        </body>
        
        </html>
      `;

    SmtpController.sendEmail(email, 'Reset Password', message);
};

addUserEmail = async (options) => {
    let email = options.email;

    let firstName = options.firstName;
    let password = options.password;

    if (!firstName) {
        firstName = email;
    }
    message = '';
    message += `
    <body>
    <div>
        <div style="width: 600px; margin: auto; 
        border: 1px solid #eaeaea;">
    <img src="${credentials.BACK_WEB_URL}/images/shape.png" alt="" style="width: 100%; 
    ">
    <div style="text-align: center;">
    <img src="${credentials.BACK_WEB_URL}/images/Check-mark.png" alt="" style="width: 80px;
    height: 80px;
    margin-top: 18px;">
    <h2 style="
    color: #97D5EC;
    font-family: sans-serif;
    font-size: 27px;
    font-weight: 600;
    margin-top: 6px;
    margin-bottom: 0px;">You’Re In!</h2>
    <p style="color: #626262;
    text-align: center;
    font-family: sans-serif;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;">Thank you for joining Good Clean Fund Raising, You are Going<br>
        to love it here. </p>
    </div>
    <div style="text-align:center ;">
    <img src="${credentials.BACK_WEB_URL}/images/Asset.png" alt="" style="
    width: 250px;">
    </div>
    <div style="text-align: center;">
        <button type="submit" style="border-radius: 26.5px;
        background: #A3D282;
        color: white;
        height: 30px;
        width: 115px;
        border: none;
        font-size: 10px;
        font-weight: 600;
        margin-top: 27px;">Verify Email</button>
        <p style="
        color: #626262;
        font-family: sans-serif;
        font-size: 12px;
        margin-top: 14px;">Got Questions? Contact our support team!</p>
    </div>  </div>
    </div>
    </body>
      `;

    SmtpController.sendEmail(email, 'Registration', message);
};

contactUsEmail = function (options) {
    console.log(options, '----------------options')
    var email = options.email;
    var fullName = options.fullName
    //   var Admin_Email=options.Admin_Email
    var mobileNo = options.mobileNo
    var message = options.message
    if (!fullName) {
        fullName = email;
    }
    message = '';
    message += ` 

  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
      <title>Contact us email template</title>
  </head>
  <body style="margin: 0px; padding:0; background-color: #f2f3f8;">
      <table width="100%" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans',sans-serif; font-family: 'Open Sans', sans-serif;">
          <tr>
              <td>
                  <table style="max-width:670px; margin:0 auto;" width="100%">
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                              <a href="#" title="logo" target="_blank">
                              <img style="margin-bottom:20px; height: 67%; width: 66%;"  src="` +
        constant.FRONT_WEB_URL +
        `/assets/img/logo.jpeg" title="logo" alt="logo">
                            </a>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:10px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>
                              <table width="100%"
                              style="max-width:670px; background:#fff; border-radius:3px; -webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);    border: 1px solid #e1e1e1;">
                              <tr>
                                  <td style="height:40px;">&nbsp;</td>
                              </tr>
                              <tr>
                                  <td style="padding:0 35px;">
                                   
                                      <span
                                      style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                      <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                          Hi admin ${fullName} wants to contact with you. </p>
                                    
                                                 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  Email: ${email} </p> 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  FullName: ${fullName} </p> 

                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  MobileNo: ${mobileNo} </p> 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  Message: ${options.message} </p> 
                                                      <span
                                                      style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                      <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                       <strong>Regards</strong><br> The Goodclean Support Team</p> 

                                  </td>
                              </tr>
                              <tr>
                                  <td style="height:40px;">&nbsp;</td>
                              </tr>
                          
                          </table>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>                             
                             <span
                             style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
  
                             <h3 style="margin-bottom: 10px;">Need Support?</h3>
                             <p style="font-size:15px; color:#455056; margin:8px 0 0; line-height:24px;">Feel free to email us if you have any questions, comments or suggestions. we'll be happy to resolve your issues.</p>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `
    SmtpController.sendEmail(constant.Admin_Email, "Contact Us", message);


};

userSendOtp = function (options) {
    var email = options.email
    message = '';
    style = {
        header: `
       padding:30px 15px;
       text-align:center;
       background-color:#f2f2f2;
       `,
        body: `
       padding:15px;
       height: 230px;
       `,
        hTitle: `font-family: 'Raleway', sans-serif;
       font-size: 37px;
       height:auto;
       line-height: normal;
       font-weight: bold;
       background:none;
       padding:0;
       color:#333;
       `,
        maindiv: `
       width:600px;
       margin:auto;
       font-family: Lato, sans-serif;
       font-size: 14px;
       color: #333;
       line-height: 24px;
       font-weight: 300;
       border: 1px solid #eaeaea;
       `,
        textPrimary: `color:#3e3a6e;
       `,
        h5: `font-family: Raleway, sans-serif;
       font-size: 22px;
       background:none;
       padding:0;
       color:#333;
       height:auto;
       font-weight: bold;
       line-height:normal;
       `,
        m0: `margin:0;`,
        mb3: 'margin-bottom:15px;',
        textCenter: `text-align:center;`,
        btn: `padding:10px 30px;
       font-weight:500;
       font-size:14px;
       line-height:normal;
       border:0;
       display:inline-block;
       text-decoration:none;
       `,
        btnPrimary: `
       background-color:#3e3a6e;
       color:#fff;
       `,
        footer: `
       padding:10px 15px;
       font-weight:500;
       color:#fff;
       text-align:center;
       background-color:#000;
       `
    }

    message += `<div class="container" style="` + style.maindiv + `">
   <div class="header" style="`+ style.header + `text-align:center">
       <img style="margin-bottom:20px; height: 67%; width: 66%;" src="` +
        constant.FRONT_WEB_URL +
        `/assets/img/logo.jpeg" />
       <h2 style="`+ style.hTitle + style.m0 + `">Welcome to Application </h2>
   </div>
   <div class="body" style="`+ style.body + `">
       <h5 style="`+ style.h5 + style.m0 + style.mb3 + style.textCenter + `">Hello ` + options.fullName + `</h5>
       <p style="`+ style.m0 + style.mb3 + style.textCenter + `margin-bottom:20px;font-weight: 600">Your otp for login is :   </p>` + options.otp + `
   </div>
   <div class="footer" style="`+ style.footer + `">
   2023 All Rights Reserved.
   </div>
 </div>`



    SmtpController.sendEmail(email, 'Otp Verification', message)
};





