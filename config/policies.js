/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  '*': 'isAuthorized',

  UsersController: {
    adminSignin: true,
    userSignin: true,
    register: true,
    forgotPassword: true,
    forgotPasswordFrontend: true,
    userDetails: true,
    resetPassword: true,
    verifyUser: true,
    verifyEmail: true,
    checkEmail: true,
    getAllUsers: true,
  },
};
