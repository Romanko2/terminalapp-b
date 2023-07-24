/**
 * CategoryController
 *
 * @description :: Server-side logic for managing categories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;

module.exports = {

    /*For Add category*/

    addCategory: async (req, res) => {

        try {
            const data = req.body

            if (!data.name || typeof data.name === undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.CATEGORY.NAME_REQUIRED }
                })
            }

            let existed = await Category.findOne({ name: data.name, isDeleted: false });
            if (existed) {
                return res.status(400).json({
                    "success": false,
                    error: { "code": 400, "message": constantObj.CATEGORY.NAME_EXIST },
                });
            } else {
                data.addedBy = req.identity.id;


                let items = await Category.create(data).fetch();
                if (items) {
                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "data": items,
                        "message": constantObj.CATEGORY.ADDED,
                    });
                };
            }
        } catch (err) {
            console.log(err);
            return res.status(400).json({ success: false, code: 400, error: err });
        }
    },

    /*For list category*/

    listCategory: async (req, res) => {
        try {

            var search = req.param('search');
            var page = req.param('page');
            var type = req.param('type');
            var cat_type = req.param('cat_type');
            var sortBy = req.param('sortBy');
            let status = req.param('status')
            let Parent_category_id = req.param("Parent_category_id")

            if (!page) {
                page = 1
            }
            var count = parseInt(req.param('count'));
            if (!count) {
                count = 10000
            }
            var skipNo = (page - 1) * count;
            var query = {};


            if (Parent_category_id) {
                query.Parent_category_id = ObjectId(Parent_category_id);
            }
            if (type) {
                query.Parent_category_id = null
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, '$options': 'i' } }
                ]
            }

            query.isDeleted = false

            if (cat_type) {
                query.cat_type_id = ObjectId(cat_type);
            }

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
            db.collection('category').aggregate([
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
                        id: "$_id",
                        isDeleted: "$isDeleted",
                        name: "$name",
                        description: "$description",
                        cat_type: "$cat_type",
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

                db.collection('category').aggregate([
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
                            id: "$_id",
                            isDeleted: "$isDeleted",
                            name: "$name",
                            description: "$description",
                            cat_type: "$cat_type",
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
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })

        }
    },

    /*For edit category*/

    editCategory: async (req, res) => {
        try {
            // const id = req.param("id");
            const id = req.body.id;
            const data = req.body

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.CATEGORY.ID_REQUIRED }
                })
            }

            if (!data.name || typeof data.name === undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.CATEGORY.NAME_REQUIRED }
                })
            }
            const query = {};
            query.isDeleted = false
            query.name = data.name;
            query.id = { "!=": id };

            var existed = await Category.findOne(query);
            if (existed) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constantObj.CATEGORY.NAME_EXIST }
                })
            }

            data.updatedBy = req.identity.id;
            let updatedCategory = await Category.updateOne({ id: id }, req.body);
            return res.status(200).json({
                success: true,
                code: 200,
                message: constantObj.CATEGORY.UPDATED
            });
        } catch (err) {
            // console.log(err, '==========err');
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /*For delete category*/

    deleteCategory: async (req, res) => {
        try {
            const id = req.param("id");

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.CATEGORY.ID_REQUIRED }
                })
            } else {
                let category = await Category.findOne({ id: id });
                if (!category) {
                    return res.status(400).json({
                        success: false,
                        error: { code: 400, message: constantObj.CATEGORY.INVALID_ID }
                    })
                } else {
                    let removeCategory = await Category.updateOne({ id: id }, { isDeleted: true });
                    return res.status(200).json({
                        success: true,
                        message: constantObj.CATEGORY.DELETED
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

    /*For category Detail*/

    categoryDetail: async (req, res,) => {

        try {
            const id = req.param("id");

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.user.PAYLOAD_MISSING }
                })
            } else {
                const categoryDetail = await Category.findOne({ id: id }).populate('addedBy').populate('updatedBy')
                // console.log(categoryDetail)
                return res.status(200).json({
                    success: true,
                    data: categoryDetail,

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


}
