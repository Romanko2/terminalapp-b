
var constant = require("../../config/local.js");
var constantObj = sails.config.constants;

module.exports = {
 
  /**
   *
   * @param {*} data consist frontend payload
   * @param {*} context
   * @param {*} req
   * @param {*} res
   * @description: autoLogin the user using uers's id and detail of user with token in response
   * @createdAt: 03/08/2023
   */
  autoLogin: (data, context, req, res) => {
    var id = req.param("id");
    if (!id || typeof id == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: "Id is required" },
      });
    }

    Users.findOne({ id: id }).then(async (user) => {
      if (user) {
        if (user.status != "active") {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: "Account Deactivated. Please Contact To Admin",
            },
          });
        } else {
       
          var token = jwt.sign({ user_id: user.id, fullName: user.fullName },
            { issuer: 'Amit Kumar', subject: user.email, audience: "public" })
          user.access_token = token;
      
          return res.status(200).json({
            success: true,
            code: 200,
            message: "Login successfully",
            data: user,
          });
        }
      }
    });
  },
  
};
