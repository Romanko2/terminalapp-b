/**
 * Inviteusers.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    groupId: {
      model: "group"
    },
    email: {
      type: 'string',
      isEmail: true,
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false
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
    status: {
      type: 'string',
      isIn: ['accepted', 'pending'],
      defaultsTo: 'pending'
    },

    role: { type: 'string' },
    firstName: { type: 'string', },
    lastName: { type: 'string', },
    fullName: { type: 'string', },

  },

};


