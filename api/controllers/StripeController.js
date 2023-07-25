/**
 * StripeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
var payment_const = require('../../config/local.js');
const stripe = require('stripe')(payment_const.PAYMENT_INFO.SECREATKEY);
//  const html_to_pdf = require('html-pdf-node');
const SmtpController = require('./SmtpController.js');
generateNumber = function () {
    // action are perform to generate VeificationCode for user
    var length = 9,
        charset = '0123456789',
        retVal = '';

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
generateNumberTime = function () {
    var length = 9,
        charset = '0123456789',
        retVal = '';
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
module.exports = {

    /**Add Card */

    addCard: async (req, res) => {
        stripe.tokens.create(
            {
                card: {
                    number: req.body.card_number,
                    exp_month: req.body.exp_month,
                    exp_year: req.body.exp_year,
                    cvc: req.body.cvc,
                    name: req.identity.fullName,
                },
            },
            // console.log(card);
            async (err, token) => {
                if (err) {
                    console.log(err)
                    return res.status(404).json({
                        success: false,
                        error: { code: 404, message: err.raw.message },
                        // error: { code: 404, message: constantObj.card.WRONG_DETAIL },
                    });
                } else {
                    /**If user is alreadyregistered on stripe  */
                    // console.log(token, "----------------------token")
                    if (
                        req.identity.customer_id != undefined &&
                        req.identity.customer_id != ''
                    ) {
                        // console.log("adding new card")

                        var cardNumber = String(req.body.card_number);
                        last4 = cardNumber.slice(cardNumber.length - 4);

                        const cards = await Cards.find({ userId: req.identity.id, last4: last4 })
                        // console.log(cards, "-------------------cardexist");
                        /**User can't add same card multiple time */
                        if (cards && cards.length > 0) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 400,
                                    message: constantObj.CARD.CARD_EXIST,
                                },
                            });
                        }

                        stripe.customers.createSource(
                            req.identity.customer_id,
                            {
                                source: token.id,
                            },
                            async (err, customer) => {
                                if (err) {
                                    return res.status(404).json({
                                        success: false,
                                        error: { code: 404, message: err.raw.message },
                                    });
                                }
                                try {
                                    /**Making last added card default on stripe */
                                    // const updatedcustomer = await stripe.customers.update(
                                    //   req.identity.customer_id,
                                    //   {
                                    //     default_source: customer.id,
                                    //   }
                                    // );
                                } catch (err) {
                                    return res.status(400).json({
                                        success: false,
                                        error: { code: 404, message: '' + err },
                                    });
                                }

                                addedCard = {
                                    userId: req.identity.id,
                                    card_id: customer.id,
                                    last4: customer.last4,
                                    exp_month: customer.exp_month,
                                    exp_year: customer.exp_year,
                                    brand: customer.brand,
                                    firstName: req.body.firstName,
                                    lastName: req.body.lastName,
                                    zipCode: req.body.zipCode,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    // isDefault: true,
                                };
                                // console.log(req.identity.customer_id, "-----------------------addedCard")
                                const existedUserCards = await Cards.find({ userId: req.identity.id })
                                if (existedUserCards && existedUserCards.length == 0) {
                                    addedCard.isDefault = true
                                }
                                /**adding added card into user and making it default */

                                var createdCard = await Cards.create(addedCard)
                                var updated = Users.updateOne({ id: req.identity.id }, {
                                    customer_id: customer.id,
                                })
                                console.log(updated, "updated")

                                return res.status(200).json({
                                    success: true,
                                    data: customer,
                                    message: constantObj.CARD.CARD_ADDED,
                                });
                            }
                        );

                    } else {
                        /**If user is not registered on stripe */
                        // console.log("------else")
                        stripe.customers.create(
                            {
                                description: req.identity.email,
                                email: req.identity.email,
                                name: req.identity.fullName,
                                source: token.id, // obtained with Stripe.js
                            },
                            (err, customer) => {
                                if (err) {
                                    return res.status(404).json({
                                        success: false,
                                        error: { code: 404, message: err.raw.message },
                                    });
                                }

                                var query =
                                {
                                    userId: req.identity.id,
                                    card_id: customer.default_source,
                                    last4: token.card.last4,
                                    exp_month: token.card.exp_month,
                                    exp_year: token.card.exp_year,
                                    brand: token.card.brand,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    isDefault: true,
                                }

                                Users.update(
                                    { id: req.identity.id },
                                    {
                                        stripe_customer_id: customer.id,
                                    }
                                ).then(async (data) => {
                                    // updateExistingCards = await Cards.update({userId:req.identity.id},{isDefault:false})
                                    var createdCard = await Cards.create(query)
                                    return res.status(200).json({
                                        success: true,
                                        data: customer,
                                        message: constantObj.CARD.CARD_ADDED,
                                    });
                                });
                                // console.log(users, "--------------users");
                            }
                        );
                    }
                }
            }
        )
    },

    /** Cards Listing */

    getCards: async (req, res) => {
        
        try {
            const userId = req.identity.id
            const cards = await Cards.find({ userId: userId })
            if (cards && cards.length > 0) {
                for await (const data of cards) {
                    var date = new Date()
                    var currentMonth = date.getUTCMonth() + 1
                    var currentYear = date.getUTCFullYear()
                    if (Number(data.exp_year) < Number(currentYear)) {
                        data.isExpired = true
                    } else if (Number(data.exp_month) < Number(currentMonth) && Number(data.exp_year) <= Number(currentYear)) {
                        data.isExpired = true
                    } else {
                        data.isExpired = false
                    }
                }
            }

            return res.status(200).json({
                success: true,
                data: cards
            })
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /** Delete Card */

    deleteCard: async (req, res) => {
        var customer_id = req.identity.stripe_customer_id;
        const card_id = req.param('card_id');
console.log(customer_id,"===============customer_id")
console.log(card_id,"===============card_id")

        if (!card_id || card_id == undefined) {
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constantObj.card.PAYLOAD_MISSING }
            })
        }
        const id = req.identity.id;
        console.log(id,"=======================id")
        try {
            stripe.customers.deleteSource(
                customer_id,
                card_id,
                async (err, confirmation) => {
                    console.log(err,"==========================err")
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            code: 400,
                            message: '' + err,
                        });
                    } else {
                        var card = await Cards.findOne({ userId: id, card_id: card_id })
                        console.log(card,"=============================================card");
                        if(card){
                            if (card.isDefault == true) {
                                const cards = await Cards.find({ userId: id, isDefault: false })
                                console.log(cards.length)
                                if (cards && cards.length > 0) {
                                    updatedCard = await Cards.update({ id: cards[0].id }, { isDefault: true })
                                }
                            }
                            const removedCard = await Cards.destroy({ userId: id, card_id: card_id })
    
                            return res.status(200).json({
                                success: true,
                                message: constantObj.CARD.CARD_DELETED
                            })
                        }
                       
                    }
                }
            );

        } catch (err) {
            console.log(err,"======================err")
            return res.status(400).json({
                success: false,
                error: {
                    code: 400,
                    message: '' + err,
                },
            });
        }
    },

    // chargePayment: async (req, res) => {

    //     console.log("in charge payment")
    //     try {

    //         var data = {};
    //         var d = new Date();
    //         var payPrice = req.body.payPrice
    //         var billingDetail = req.body.billingDetail
    //         var gst = req.body.gst
    //         var userEmail = req.body.userEmail
    //         var orderNumber = generateNumber();

    //         var userDetail = await Users.findOne({ id: req.identity.id })

    //         email = userDetail.email
    //         userName = userDetail.fullName

    //         stripe.charges.create({
    //             amount: Math.round(payPrice * 100),
    //             currency: "USD",
    //             customer: req.body.customer_id,
    //             source: req.body.card_id,
    //             description: 'Purchase Product'
    //         }, (err, charge) => {

    //             if (err) {
    //                 return res.status(400).json({
    //                     success: false,
    //                     code: 400,
    //                     message: err.message,
    //                 });
    //             } else {
    //                 var data1 = {};

    //                 data1.transaction_id = charge.balance_transaction;

    //                 // data1.planDetail = cartDetail
    //                 data1.addedBy = req.identity.id;
    //                 data1.payment_status = charge.status;
    //                 data1.price = parseFloat(payPrice);
    //                 data1.detail = charge;
    //                 data1.billingDetail = billingDetail
    //                 data1.order_number = randomString(6, '#aA');

    //                 Transaction.create(data1).then(async (txnInfo) => {

    //                     return res.status(200).json({
    //                         success: true,
    //                         code: 200,
    //                         data: data1,
    //                         message: "Payment done successfully."
    //                     })




    //                 });

    //             }

    //         })

    //     } catch (err) {
    //         console.log(err)
    //         return res.status(400).json({
    //             success: false,
    //             error: { code: 400, message: "" + err }
    //         })
    //     }



    // },
    // TransactionListing: async (req, res) => {
    //     try {

    //         var search = req.param('search');
    //         var page = req.param('page');
    //         var sortBy = req.param('sortBy');
    //         var count = parseInt(req.param('count'));

    //         if (!page) {
    //             page = 1
    //         }
    //         if (!count) {
    //             count = 100000000
    //         }
    //         var skipNo = (page - 1) * count;
    //         var query = {};
    //         if (search) {
    //             query.$or = [
    //                 { name: { $regex: search, '$options': 'i' } }
    //             ]
    //         }
    //         sortquery = {};
    //         if (sortBy) {
    //             var order = sortBy.split(" ");

    //             var field = order[0];
    //             var sortType = order[1];
    //         }
    //         sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'descending' ? -1 : 1) : -1;

    //         // query.isDeleted = false
    //         console.log(query);
    //         db.collection('transaction').aggregate([

    //             {
    //                 $project: {
    //                     // role: "$role",
    //                     addedBy: "$addedBy",
    //                     planDetail: "$planDetail",
    //                     address: "$address",
    //                     price: "$price",
    //                     payment_status: "$payment_status",
    //                     // category: "$category",
    //                     createdAt: "$createdAt",
    //                     deletedAt: '$deletedAt',

    //                 }
    //             },
    //             {
    //                 $match: query
    //             },
    //         ]).toArray((err, totalResult) => {

    //             db.collection('transaction').aggregate([
    //                 {
    //                     $project: {
    //                         // role: "$role",
    //                         addedBy: "$addedBy",
    //                         planDetail: "$planDetail",
    //                         address: "$address",
    //                         price: "$price",
    //                         payment_status: "$payment_status",
    //                         // category: "$category",
    //                         createdAt: "$createdAt",
    //                         deletedAt: '$deletedAt',

    //                     }
    //                 },
    //                 {
    //                     $match: query
    //                 },
    //                 {
    //                     $sort: sortquery
    //                 },

    //                 {
    //                     $skip: Number(skipNo)
    //                 },
    //                 {
    //                     $limit: Number(count)
    //                 }
    //             ]).toArray(async (err, result) => {
    //                 console.log(err, result)
    //                 if (result && result.length > 0) {
    //                     for await (const itm of result) {
    //                         transactionQuery = {}
    //                         transactionQuery.isDeleted = false
    //                         // transactionQuery.store = String(itm._id)
    //                         const totalTransaction = await Transaction.count(transactionQuery)
    //                         itm.totalTransaction = totalTransaction
    //                     }
    //                 }
    //                 return res.status(200).json({
    //                     "success": true,
    //                     "data": result,
    //                     "total": totalResult.length,
    //                 });
    //             })

    //         })
    //     } catch (err) {
    //         return res.status(400).json({
    //             success: false,
    //             error: { code: 400, message: "" + err }
    //         })


    //     }
    // },


    // editPercentageFee:async(req,res)=>{
    //     let fee= req.body.fee
    //     if(!fee&& typeof fee ==undefined){
    //         return res.status(400).json({
    //             success:false,
    //             code:400,
    //             error:{message:constantObj.users.PAYLOAD_MISSING}
    //         });
    //     }
    //     let 



    // }



};
function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
