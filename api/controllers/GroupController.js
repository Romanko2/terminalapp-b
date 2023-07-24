/**
 * GroupController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
module.exports = {

    /*For Add Group*/

    addGroup: async (req, res) => {

        try {
            const data = req.body
            const invite = req.body.invite;

            if (!data.name || typeof data.name === undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.Group.NAME_REQUIRED }
                })
            }

            let existed = await Group.findOne({ name: data.name, isDeleted: false });
            if (existed) {
                return res.status(400).json({
                    "success": false,
                    error: { "code": 400, "message": constantObj.group.NAME_EXIST },
                });
            } else {
                data.addedBy = req.identity.id;
                let groupData = await Group.create(data).fetch();
                let create_invite

                if (groupData) {
                    if (invite && invite.length > 0) {
                        let alreadyInviteUsers = []
                        for await (let item of invite) {
                            if (item.email) {
                                item.email = (item.email).toLowerCase();
                                var user = await Inviteusers.findOne({ email: item.email, isDeleted: false, status: { in: ["pending"] } });
                            }
                            if (user) {
                                alreadyInviteUsers.push(user);
                            } else {
                                item["fullName"] = item.fullName
                                item.groupId = groupData.id
                                item.addedBy = req.identity.id;
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
                        return res.status(200).json({
                            "success": true,
                            "code": 200,
                            "alreadyInviteUsers": alreadyInviteUsers
                        });
                    }
                }
            }
        }
        catch (err) {
            return res.status(400).json({ success: false, error: { "code": 400, "message": "" + err } });
        }

    },
    /*For list Group*/

    listGroup: async (req, res) => {
        try {

            var search = req.param('search');
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var type = req.param('type');
            var sortBy = req.param('sortBy');
            let status = req.param('status');
            let id = req.param('group');

            if (!page) {
                page = 1
            }
            var count = parseInt(req.param('count'));
            if (!count) {
                count = 10000
            }
            var skipNo = (page - 1) * count;
            var query = {};

            if (type) {
                query.type = type
            }
            if (id) {
                query.id = ObjectId(id)

            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, '$options': 'i' } }
                ]
            }

            query.isDeleted = false
            sortquery = {};
            if (sortBy) {
                var order = sortBy.split(" ");
                var field = order[0];
                var sortType = order[1];
            }

            sortquery[field ? field : 'updatedAt'] = sortType ? (sortType == 'descending' ? -1 : 1) : -1;
            if (status) {
                query.status = status
            }
            db.collection('group').aggregate([


                {
                    $project: {
                        id: "$_id",
                        isDeleted: "$isDeleted",
                        name: "$name",
                        description: "$description",
                        type: "$type",
                        image: "$image",
                        status: "$status",
                        createdAt: "$createdAt",
                        deletedBy: "$deletedBy.fullName",
                        deletedAt: '$deletedAt',
                        addedBy: "$addedBy",
                        updatedBy: "$updatedBy",
                        updatedAt: "$updatedAt",

                    }
                },
                {
                    $match: query
                },
            ]).toArray((err, totalResult) => {

                db.collection('group').aggregate([

                    {
                        $project: {
                            id: "$_id",
                            isDeleted: "$isDeleted",
                            name: "$name",
                            description: "$description",
                            type: "$type",
                            image: "$image",
                            status: "$status",
                            createdAt: "$createdAt",
                            deletedBy: "$deletedBy.fullName",
                            deletedAt: '$deletedAt',
                            addedBy: "$addedBy",
                            updatedBy: "$updatedBy",
                            updatedAt: "$updatedAt",
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
                ]).toArray(async (err, result) => {

                    let resData = {
                        "success": true,
                        "data": result,
                        "total": totalResult.length,
                    }
                    if (!req.param('count') && !req.param('page')) {
                        resData.data = result ? result : []
                    }
                    return res.status(200).json(resData);
                })

            })
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })

        }
    },

    /*For edit Group*/

    editGroup: async (req, res) => {
        try {
            // const id = req.param("id");
            const id = req.body.id;
            const data = req.body

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.group.ID_REQUIRED }
                })
            }

            if (!data.name || typeof data.name === undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.group.NAME_REQUIRED }
                })
            }
            const query = {};
            query.isDeleted = false
            query.name = data.name;
            query.id = { "!=": id };

            var existed = await Group.findOne(query);
            if (existed) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constantObj.group.NAME_EXIST }
                })
            }

            data.updatedBy = req.identity.id;
            let updatedGroup = await Group.updateOne({ id: id }, req.body);
            return res.status(200).json({
                success: true,
                code: 200,
                message: constantObj.group.UPDATED
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /*For delete Group*/

    deleteGroup: async (req, res) => {
        try {
            const id = req.param("id");

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.group.ID_REQUIRED }
                })
            } else {
                let find_group = await Group.findOne({ id: id });
                if (!find_group) {
                    return res.status(400).json({
                        success: false,
                        error: { code: 400, message: constantObj.group.INVALID_ID }
                    })
                } else {
                    let removeGroup = await Group.updateOne({ id: id }, { isDeleted: true });
                    return res.status(200).json({
                        success: true,
                        message: constantObj.group.DELETED
                    })
                }
            }
        } catch (err) {
            //(err);
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /*For Group Detail*/

    groupDetail: async (req, res,) => {

        try {
            const id = req.param("id");

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.user.PAYLOAD_MISSING }
                })
            } else {
                const groupDetail = await Group.findOne({ id: id }).populate('campaign').populate('category')
                return res.status(200).json({
                    success: true,
                    data: groupDetail,

                })
            }
        } catch (err) {
            //(err);
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },


};

