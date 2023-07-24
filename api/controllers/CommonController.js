/**
 * CommonController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;
var fs = require("fs");
// var sharp = require('sharp');
//  const readXlsxFile = require('read-excel-file/node');
//  var distance = require('google-distance-matrix');
const safeCred = require("../../config/local");

generateName = function () {
  // action are perform to generate random name for every file
  var uuid = require("uuid");
  var randomStr = uuid.v4();
  var date = new Date();
  var currentDate = date.valueOf();

  retVal = randomStr + currentDate;
  return retVal;
};
module.exports = {
  uploadImage: async (req, res) => {
    var modelName = req.param("modelName");

    try {
      req
        .file("file")
        .upload(
          { maxBytes: 5242880, dirname: "../../assets/images/" + modelName },
          async (err, file) => {
            ////(file)
            if (err) {
              if (err.code == "E_EXCEEDS_UPLOAD_LIMIT") {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: "Image size must be less than 5 MB",
                  },
                });
              }
            }

            var responseData = {};

            file.forEach(async (element, index) => {
              var name = generateName();
              //(element.fd);
              typeArr = element.type.split("/");
              fileExt = typeArr[1];

              if (
                fileExt === "jpeg" ||
                fileExt === "JPEG" ||
                fileExt === "JPG" ||
                fileExt === "jpg" ||
                fileExt === "PNG" ||
                fileExt === "png"
              ) {
                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: {
                        code: 403,
                        message: err,
                      },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;
                      fs.writeFile(
                        "assets/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt,
                        data,

                        function (err, image) {
                          if (err) {
                            //(err);
                            return res.status(400).json({
                              success: false,
                              error: {
                                code: 400,
                                message: err,
                              },
                            });
                          }
                        }
                      );
                      fs.writeFile(
                        "./.tmp/public/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt,
                        data,

                        async function (err, image) {
                          if (err) {
                            //(err);
                            return res.status(400).json({
                              success: false,
                              error: {
                                code: 400,
                                message: err,
                              },
                            });
                          }
                        }
                      );

                      responseData.fullpath = name + "." + fileExt;
                      responseData.imagePath =
                        "assets/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt;
                      // //(responseData ,"responsedata");

                      if (index == file.length - 1) {
                        fs.unlink(file[index].fd, function (err) {
                          if (err) {
                            //(err, "unlink not done")
                          }
                        });

                        // await new Promise((resolve) =>
                        //   setTimeout(resolve, 6000)
                        // );

                        return res.json({
                          success: true,
                          code: 200,
                          data: responseData,
                        });
                      }
                    }
                  }
                }); //end of loop
              } else {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: constantObj.messages.NOT_VALID_FILE,
                  },
                });
              }
            });
          }
        );
    } catch (err) {
      //(err);
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: "" + err } });
    }
  },

  changeStatus: function (req, res) {
    try {
      var modelName = req.param("model");
      var Model = sails.models[modelName];
      var itemId = req.param("id");
      var updated_status = req.param("status");

      let query = {};
      query.id = itemId;

      Model.findOne(query).exec(function (err, data) {
        if (err) {
          return res.json({
            success: false,
            error: {
              code: 400,
              message: "" + err,
            },
          });
        } else {
          Model.update(
            {
              id: itemId,
            },
            {
              status: updated_status,
            },
            function (err, response) {
              if (err) {
                return res.json({
                  success: false,
                  error: {
                    code: 400,
                    message: "" + err,
                  },
                });
              } else {
                return res.json({
                  success: true,
                  code: 200,
                  message: "Status changed successfully.",
                });
              }
            }
          );
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: err, message: "" + err });
    }
  },

  commonDelete: async function (req, res) {
    try {
      var modelName = req.param("model");
      var Model = sails.models[modelName];
      var itemId = req.param("id");

      let query = {};
      query.id = itemId;
     
      Model.findOne(query).exec(async (err, data) => {
        
        if (err) {
          return res.json({
            success: false,
            error: {
              code: 400,
              message: constantObj.messages.DATABASE_ISSUE,
            },
          });
        } else {
          Model.update(
            {
              id: itemId,
            },
            {

              isDeleted: true,
              // deletedBy: req.identity.id,

              deletedAt: new Date(),
            },

            function (err, response) {
              if (err) {
                return res.json({
                  success: false,
                  error: {
                    code: 400,
                    message: constantObj.messages.DATABASE_ISSUE,
                  },
                });
              } else {
                return res.json({
                  success: true,
                  code: 200,
                  message: "Recode deleted successfully.",
                });
              }
            }
          );
        }
      });
    } catch (err) {
      console.log(err)
      return res
        .status(400)
        .json({ success: false, error: err, message: "Server Error" });
    }
  },

  uploadVideos: async (req, res) => {
    try {
      var modelName = "videos";
      if (!modelName || typeof modelName == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: "Please Add Model Name" },
        });
      }
      req
        .file("file")
        .upload(
          { maxBytes: 10485760000, dirname: "../../assets/images" },
          async (err, file) => {
            if (err) {
              if (err.code == "E_EXCEEDS_UPLOAD_LIMIT") {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: "Please Select video Below 100Mb",
                  },
                });
              }
            }

            if (file.length > 20) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 404,
                  message: "Please upload maximum 20 videos.",
                },
              });
            }

            let fullpath = [];
            let resImagePath = [];
            file.forEach(async (element, index) => {
              var name = generateName();
              typeArr = element.type.split("/");
              fileExt = typeArr[1];

              if (
                fileExt === "mp4" ||
                fileExt === "webm" ||
                fileExt === "mkv" ||
                fileExt === "mov" ||
                fileExt === "wmv" ||
                fileExt === "avi" ||
                fileExt === "flv"
              ) {
                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: { code: 403, message: err },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;
                      fs.writeFile(
                        ".tmp/public/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt,
                        data,
                        function (err, image) {
                          if (err) {
                            console.log(err);
                            return res.status(400).json({
                              success: false,
                              error: { code: 400, message: err },
                            });
                          }
                        }
                      );
                      fs.writeFile(
                        "assets/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt,
                        data,
                        function (err, image) {
                          if (err) {
                            console.log(err);
                            return res.status(400).json({
                              success: false,
                              error: { code: 400, message: err },
                            });
                          }
                        }
                      );

                      fullpath.push(name + "." + fileExt);
                      resImagePath.push(
                        "assets/images/" +
                        modelName +
                        "/" +
                        name +
                        "." +
                        fileExt
                      );

                      await new Promise((resolve) => setTimeout(resolve, 2000));

                      if (index == file.length - 1) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 2000)
                        );
                        return res.json({
                          success: true,
                          code: 200,
                          data: {
                            fullPath: resImagePath,
                            imagePath: fullpath,
                          },
                        });
                      }
                    }
                  }
                }); //end of loop
              } else {
                return res.json({
                  success: false,
                  error: {
                    code: 400,
                    message: constantObj.user.INVALID_IMAGE,
                  },
                });
              }
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: "" + err } });
    }
  },
  removeVideo: async (req, res) => {
    var Imagename = req.param("videoName");
    modelName = "videos";
    if (!Imagename || typeof Imagename == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: "Video Name is required" },
      });
    }
    // console.log('In image remove')
    var fs = require("fs");
    // await fs.unlinkSync(".tmp/public/images/" + modelName + "/" + Imagename);
    fs.unlink(
      ".tmp/public/images/" + modelName + "/" + Imagename,
      function (err) {
        if (err) throw err;
      }
    );
    fs.unlink("assets/images/" + modelName + "/" + Imagename, function (err) {
      if (err) throw err;
    });
    return res.status(200).json({
      code: 200,
      success: true,
      message: "Video Deleted Successfully.",
    });
  },
};

function timeConvert(n) {
  var num = n;
  var hours = num / 60;
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  if (rhours > 0) {
    if (rhours < 24) {
      return rhours + " hours " + rminutes + " mins";
    } else if (rhours > 24 && rhours < 48) {
      var dayHours = Number(rhours) - 24;
      return "1 day " + dayHours + " hours " + rminutes + " mins";
    } else if (rhours > 48 && rhours < 72) {
      var dayHours = Number(rhours) - 48;
      return "2 days " + dayHours + " hours " + rminutes + " mins";
    } else if (rhours > 72 && rhours < 96) {
      var dayHours = Number(rhours) - 72;
      return "3 days " + dayHours + " hours " + rminutes + " mins";
    }
  } else {
    return rminutes + " min";
  }
}

function convertH2M(timeInHour) {
  var timeParts = timeInHour.split(":");
  return Number(timeParts[0]) * 60 + Number(timeParts[1]);
}
