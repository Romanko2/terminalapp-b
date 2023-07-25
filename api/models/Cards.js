/**
 * Cards.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

 module.exports = {

  attributes: {

    userId:{
      model:"users",
    },

    card_id:{
      type:"string",
    },

    last4:{
      type:"string",
    },

    brand:{
      type:"string",
    },

    exp_month:{
      type:"string",
    },

    exp_year:{
      type:"string",
    },

    firstName:{
      type:"string",
    },
    lastName:{
      type:"string",
    },
    
    zipCode:{
      type:"number"
    },

    isDefault:{
      type: 'Boolean',
    },
    isDeleted: {
      type: "Boolean",
      defaultsTo: false,
    },
    
    createdAt: {
      type: 'ref',
      autoCreatedAt: true,  
    },
    
    updatedAt: {
      type: 'ref',
      autoCreatedAt: true,
    },

  },

};

