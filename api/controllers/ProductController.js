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
const credentials = require('../../config/local');
var constant = require('../../config/local.js');


module.exports = {


    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to register User  
     */

    addproduct: async (req, res) => {
        try {

            if ((!req.body.name) || typeof req.body.name == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.PRODUCT.NAME_REQUIRED } });
            }
            if ((!req.body.price) || typeof req.body.price == undefined) {
                return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.PRODUCT.PRICE_REQUIRED } });
            }
            let createProduct = await Product.create(req.body).fetch()
            // console.log(createProduct, "---------------------newUser");

            if (createProduct) {
                return res.status(200).json({
                    "success": true,
                    "code": 200,
                    "message": constantObj.PRODUCT.ADDED,
                });
            }
        }
        catch (err) {
            console.error(err);
            return res.status(400).json({ success: false, error: { "code": 400, "message": "" + err } });
        }
    },

    getAllProduct: async (req, res) => {
        try {
            var search = req.param('search');
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var count = parseInt(req.param('count'));
            let sortBy = req.param("sortBy");
            let addedBy = req.param('addedBy');

            var query = {};
            if (search) {
                query.$or = [
                    { fullName: { $regex: search, '$options': 'i' } },
                    { email: { $regex: search, '$options': 'i' } },
                    { name: { $regex: search, '$options': 'i' } },
                ]
            }
            let sortquery = {};
            if (sortBy) {
                let typeArr = [];
                typeArr = sortBy.split(" ");
                let sortType = typeArr[1];
                let field = typeArr[0];
                sortquery[field ? field : 'updatedAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;
            } else {
                sortquery = { updatedAt: -1 }
            }

            if (isDeleted) {
                if (isDeleted === 'true') {
                    isDeleted = true;
                } else {
                    isDeleted = false;
                }
                query.isDeleted = isDeleted;
            }
            if (addedBy) {
                query.addedBy_id = ObjectId(addedBy);
            }

            const pipeline = [
                {
                    $project: {
                        name: "$name",
                        price: "$price",
                        image: "$image",
                        isDeleted: "$isDeleted",
                        addedBy: "$addedBy",
                        updatedBy: "$updatedBy",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                    }
                },
                {
                    $match: query
                },
                {
                    $sort: sortquery
                },
            ]

            db.collection('product').aggregate([...pipeline]).toArray((err, totalResult) => {
                //(err, totalResult);

                if (page && count) {
                    var skipNo = (page - 1) * count;
                    pipeline.push(
                        {
                            $skip: Number(skipNo)
                        },
                        {
                            $limit: Number(count)
                        })
                }
                db.collection('product').aggregate([...pipeline]).toArray((err, result) => {
                    //(result)
                    //(err, "------------------------------err")
                    return res.status(200).json({
                        "success": true,
                        "data": result,
                        "total": totalResult.length,
                    });
                })

            })
        } catch (err) {
            //(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })

        }
    },
    deleteproduct: async (req, res) => {
        try {
            const id = req.param('id')
            if (!id || id == undefined) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constantObj.user.PAYLOAD_MISSING }
                })
            }

            let delete_product = await Product.updateOne({ id: id }, { isDeleted: true });
            return res.status(200).json({
                success: true,
                data: delete_product,
                message: constantObj.PRODUCT.DELETED
            })
        }
        catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    productDetails: async function (req, res) {
        var id = req.param('id');
        if ((!id) || typeof id == undefined) {
            return res.status(400).json({ "success": false, "error": { "code": 400, "message": "Id is required" } });
        }
        var userDetails = await Product.find({ where: { id: id } })
        return res.status(200).json(
            {
                "success": true,
                "code": 200,
                "data": userDetails
            });
    },
    editProduct: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body;
            if (!id || typeof id == undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.ID_REQUIRED, },
                });
            }
            let update = await Product.updateOne({ id: id },data )
                return res.status(200).json({
                    success: true,
                    data: update,
                    message: constantObj.user.UPDATED_USER,
                });
        } catch (err) {
            //.log(err);
            return res
                .status(400)
                .json({ success: false, error: { code: 400, message: '' + err } });
        }
    },


}

