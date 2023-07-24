/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
    },
    price: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    addedBy: {
      model: 'users'
    },
    updatedBy: {
      model: 'users'
    },
    createdAt: {
      type: "ref",
      autoCreatedAt: true,
    },
    updatedAt: {
      type: "ref",
      autoUpdatedAt: true,
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

  },

};

