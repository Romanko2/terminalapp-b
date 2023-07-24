/**
 * InviteusersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;
const SmtpController = require('./SmtpController');
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
const Services = require('../services/index.js');
const credentials = require('../../config/local');
module.exports = {

    inviteusers: async (req, res) => {
        try {

            if ((!req.body.email) || typeof req.body.email == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_REQUIRED } });
            }

            req.body.email = (req.body.email).toLowerCase();
            var user = await Inviteusers.findOne({ email: req.body.email, isDeleted: false });
            if (user) {
                return res.status(400).json({ "success": false, "error": { "code": 400, "message": constantObj.user.EMAIL_EXIST } });
            }

            // req.body["fullName"] = req.body.firstName + ' ' + req.body.lastName;

            // req.body.user_id = req.body.user_id?req.body.user_id:req.identity.id;
            req.body.addedBy = req.identity.id;
            let create_invite = await Inviteusers.create(req.body).fetch()
            // console.log(create_invite, "---------------------newUser");

            if (create_invite) {
                await invite_userEmail({
                    email: create_invite.email,
                    id: create_invite.id,
                })
                return res.status(200).json({
                    "success": true,
                    "code": 200,
                    "data": create_invite,
                    "message": constantObj.user.SUCCESSFULLY_INVITED,
                });
            }
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ success: false, error: { "code": 400, "message": "" + err } });
        }
    },
    getAllinviteusers: async (req, res) => {
        try {
            var search = req.param('search');
            let status = req.param('status')
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var groupId = req.param('groupId');
            var addedBy = req.param('addedBy');

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
                    { email: { $regex: search, '$options': 'i' } }
                ]
            }
            if (isDeleted) {
                if (isDeleted === 'true') {
                    isDeleted = true;
                } else {
                    isDeleted = false;
                }
                query.isDeleted = isDeleted;
            } else {
                query.isDeleted = false;
            }

            if (groupId) {
                query.groupId = ObjectId(groupId)
            }
            if (addedBy) {
                query.addedBy = ObjectId(addedBy)
            }
            if (status) {
                query.status = status
            }
            db.collection('inviteusers').aggregate([
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
                    $lookup: {
                        from: 'campaign',
                        localField: 'campaignId',
                        foreignField: '_id',
                        as: "campaignId"
                    }
                },
                {
                    $unwind: {
                        path: '$campaignId',
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $project: {
                        groupId: "$groupId",
                        isDeleted: "$isDeleted",
                        status: "$status",
                        email: "$email",
                        addedBy: "$addedBy",
                        updatedBy: "$updatedBy",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                        campaignId: "$campaignId",
                        firstName: "$firstName",
                        lastName: "$lastName",
                        fullName: "$fullName",

                    }
                },
                {
                    $match: query
                },
            ]).toArray((err, totalResult) => {

                db.collection('inviteusers').aggregate([
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
                        $lookup: {
                            from: 'campaign',
                            localField: 'campaignId',
                            foreignField: '_id',
                            as: "campaignId"
                        }
                    },
                    {
                        $unwind: {
                            path: '$campaignId',
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            groupId: "$groupId",
                            isDeleted: "$isDeleted",
                            status: "$status",
                            email: "$email",
                            addedBy: "$addedBy",
                            updatedBy: "$updatedBy",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            campaignId: "$campaignId",
                            firstName: "$firstName",
                            lastName: "$lastName",
                            fullName: "$fullName",

                        }
                    },
                    {
                        $match: query
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },

                    {
                        $skip: Number(skipNo)
                    },
                    {
                        $limit: Number(count)
                    }
                ]).toArray(async (err, result) => {

                    if (err) {
                        return res.status(400).json({
                            success: false,
                            error: { code: 400, message: "" + err }
                        })
                    }
                    return res.status(200).json({
                        "success": true,
                        "data": result,
                        "total": totalResult.length,
                    });
                })

            })
        } catch (error) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, message: "" + error, }
            });
        }
    },
    resentInvite: async (req, res) => {
        try {

            if ((!req.body.email) || typeof req.body.email == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.USERNAME_REQUIRED } });
            }
            req.body.email = (req.body.email).toLowerCase();
            var user = await Inviteusers.findOne({ email: req.body.email, isDeleted: false, status: { in: ["pending"] } });
            if (!user) {
                return res.status(400).json({ "success": false, "error": { "code": 400, "message": constantObj.invitaion.NOT_INVITED } });

            } else {
                await invite_userEmail({
                    email: user.email,
                    id: user.id,
                })
                return res.status(200).json({
                    "success": true,
                    "code": 200,
                    "data": user,
                    "message": constantObj.user.SUCCESSFULLY_INVITED,
                })
            }



        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ success: false, error: { "code": 400, "message": "" + err } });
        }
    },
    invitemultipleusers: async (req, res) => {
        try {

            let invite = req.body.invite
            if (invite && invite.length > 0) {
                let alreadyInviteUsers = []
                let create_invite
                for await (let item of invite) {
                    item.email = (item.email).toLowerCase();
                    var user = await Inviteusers.findOne({ email: item.email, isDeleted: false, });
                    if (user) {
                        alreadyInviteUsers.push(user);
                    }
                    else {
                        item.addedBy = req.identity.id;
                        item.groupId = item.groupId;
                        create_invite = await Inviteusers.create(item).fetch()
                        if (create_invite) {
                            await invite_userEmail({
                                email: create_invite.email,
                                id: create_invite.id,
                            })

                        }
                    }
                }
                if (create_invite) {
                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "message": constantObj.invitaion.Invited,
                    });

                }
                return res.status(400).json({ "success": false, "error": { "code": 400, "message": constantObj.invitaion.ALREDYINVITED } });

            }
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ success: false, error: { "code": 400, "message": "" + err } });
        }
    },
    generate_qrcode: async (req, res) => {
        let qrData ="https://play.google.com"
        let generate_qr = await Services.CommonServices.generate_qr_code(qrData);
        // console.log(generate_qr,"========")
        return res.status(200).json({
            "success": true,
            "code": 200,
            "data":generate_qr,
        });


    }

};

invite_userEmail = async (options) => {
    var email = options.email
    message = '';

    // let invited_by_details;

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
    margin-bottom: 0px;"> You'Re invited</h2>
    <p style="color: #626262;
    text-align: center;
    font-family: sans-serif;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;"> Please accept invitation by clicking the link below  and register yourself with Goodclean fundrising community. </p>
    </div>
    <div style="text-align:center ;">
    <img src="${credentials.BACK_WEB_URL}/images/Asset.png" alt="" style="
    width: 250px;">
    </div>
    <br>
    <div style="text-align: center;">
    <a href="${credentials.BACK_WEB_URL}verifyUser?id=${options.id}" style="padding: 8px 25px; font-size: 12px;background: #A3D282;
    color: white;
    height: 30px;
    width: 115px;
    border: none;
    font-size: 10px;
    margin-top: 27px;
    font-weight: 600;"
    type="text">Accept Invitation</a>
        <p style="
        color: #626262;
        font-family: sans-serif;
        font-size: 12px;
        margin-top: 14px;">Got Questions? Contact our support team!</p>
    </div>  </div>
    </div>
    </body>
`
    SmtpController.sendEmail(email, 'Email Verification', message)
};

