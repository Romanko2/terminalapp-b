const fs = require('fs');
const QRCode = require('qrcode');
const credentials = require('../../config/local');
exports.generatePassword = async () => {
    let length = 4,
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        retVal = '';

    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }

    lowercase = 'abcdefghijklmnopqrstuvwxyz';
    lowercaseCharacterLength = 2;
    for (let i = 0, n = lowercase.length; i < lowercaseCharacterLength; ++i) {
        retVal += lowercase.charAt(Math.floor(Math.random() * n));
    }

    specialCharacter = '@%$#&-!';
    specialCharacterLength = 1;

    for (
        let i = 0, n = specialCharacter.length;
        i < specialCharacterLength;
        ++i
    ) {
        retVal += specialCharacter.charAt(Math.floor(Math.random() * n));
    }
    numeric = '0123456789';
    numericLength = 2;
    for (let i = 0, n = numeric.length; i < numericLength; ++i) {
        retVal += numeric.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

exports.generateOTP = async () => {
    let length = 6,
        charset = '1234567890',
        retVal = '';

    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

exports.generateVeificationCode = async () => {
    let length = 9,
        charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        retVal = '';

    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

exports.generateName = function () {
    // action are perform to generate random name for every file
    var uuid = require('uuid');
    var randomStr = uuid.v4();
    var date = new Date();
    var currentDate = date.valueOf();

    retVal = randomStr + currentDate;
    return retVal;
};

exports.decodeBase64Image = async (dataString) => {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches) {

        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
    } else {
        response.error = constantObj.messages.INVALID_IMAGE;
    }

    return response;
};

exports.upload_buffer_to_image = async (data) => {
    let modelName = data.modelName;
    let name = await this.generateName();
    let imagedata = data.data;
    imageBuffer = await this.decodeBase64Image(imagedata);
    let imageType = imageBuffer.type;
    let typeArr = new Array();
    typeArr = imageType.split("/");
    let fileExt = typeArr[1];
    let size = Buffer.byteLength(imagedata, "base64");
    let i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
    let test = Math.round(size / Math.pow(1024, i), 2);
    if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png')) {
        if (imageBuffer.error) return imageBuffer.error;

        let fullPath = name + '.' + fileExt;
        let imagePath = '/images/' + modelName + '/' + name + '.' + fileExt;
        let uploadLocation = 'assets/images/' + modelName + '/' + name + '.' + fileExt;

        let thumbnails = [];
        let file_add = fs.writeFileSync('assets/images/' + modelName + '/' + name + '.' + fileExt, imageBuffer.data);
        let data = {
            imagePath: fullPath,
            fullPath: imagePath,
        }
        return data
    }
};
exports.generate_qr_code = async (options) => {
    // Converting the data into String format
    // let qrData = `${credentials.FRONT_WEB_URL}/view?id=${options.id}`;
    let qrData = "https://play.google.com"
    const generateQR = await QRCode.toDataURL(qrData);
    // let stringdata = typeof (options) != "string" ? JSON.stringify(options) : options;
    // const generateQR = await QRCode.toDataURL(stringdata);
    let image_paylaod = {
        modelName: "users",
        data: generateQR
    }

    let image_data = await this.upload_buffer_to_image(image_paylaod);
    return image_data;
};
// exports.End_of_Day  = async (options) => {
//     let url = "http://api.marketstack.com/v1/eod"
//         ? access_key = "14d6eb83f58a038c77ec12b38c5be776"
//         & symbols = "TATASTEEL"

// }