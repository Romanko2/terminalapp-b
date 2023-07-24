/**
 * Category.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,
  attributes: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
    },
    image: {
      type: "string",
      defaultsTo: "",
    },
    status: {
      type: "string",
      isIn: ["active", "deactive"],
      defaultsTo: "active",
    },

    isDeleted: {
      type: "Boolean",
      defaultsTo: false,
    },
    deletedBy: {
      model: "users",
    },
    deletedAt: {
      type: "ref",
      columnType: "datetime",
    },
    updatedBy: {
      model: "users",
    },
    addedBy: {
      model: "users",
    },
    createdAt: {
      type: "ref",
      columnType: "datetime",
      autoCreatedAt: true,
    },
    updatedAt: {
      type: "ref",
      columnType: "datetime",
    }
  },
};

