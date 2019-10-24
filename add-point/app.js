const AWS = require('aws-sdk')
const s3 = new AWS.S3()
let response;
require('dotenv').config()

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {

  return new Promise(function (resolve, reject) {
    response = {
      'statusCode': 200,
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify({
        message: 'Success',
      })
    }
    var newPoint = JSON.parse(event.body);

    console.log('Processing: ' + JSON.stringify(newPoint));

    if (newPoint) {
      var input_errors = [];
      if ((newPoint.name.trim()).length < 3) {
        input_errors.push('New point name should be at least 3 characters long.');
      }
      if (newPoint.categories == null || newPoint.categories.length < 1) {
        input_errors.push('The new point should belong to at least one category.');
      }
      if (newPoint.coordinates == null || newPoint.coordinates.length !== 2) {
        input_errors.push('Coordinates for the new point are mandatory');
      }

      if (input_errors.length > 0) {
        response.statusCode = 400;
        // console.log(JSON.stringify({message: input_errors}));
        response.body = JSON.stringify({ message: input_errors });
        console.log('Errors: ' + JSON.stringify(input_errors));
        resolve(response);
      } else {
        console.log('Fetching ', process.env.S3_BUCKET, process.env.POINTS_DATA_FILE_PATH);
        s3.getObject({ Bucket: process.env.S3_BUCKET, Key: process.env.POINTS_DATA_FILE_PATH }, function (err, data) {
          if (err) {
            console.log('Error while fetching file from s3 ' + err.errorMessage);
            console.error(err);
            response.statusCode = 500;
            response.body = JSON.stringify({ message: 'Error while updating new point.' });
            resolve(response);
          } else {
            console.log('got file');
            var goa_waste_data = JSON.parse(data.Body);
            goa_waste_data.features.push(newPoint);
            s3.putObject({ Bucket: process.env.S3_BUCKET, Key: process.env.POINTS_DATA_FILE_PATH, Body: JSON.stringify(goa_waste_data) }, function (err) {
              if (err) {
                console.log('Error while writing file to s3 ' + e.errorMessage);
                response.statusCode = 500;
                response.body = JSON.stringify({ message: 'Error while updating new point.' });
                resolve(response);
              } else {
                console.log('Succesfully added point and wrote file to S3.');
                resolve(response);
              }
            })
          }
        })
          .on('error', (e) => {
            console.error(e);
            response.statusCode = 500;
            response.body = JSON.stringify({ message: 'Error while updating new point.' });
            resolve(response);
          })
      }
    } else {
      response.statusCode = 400;
      response.body = JSON.stringify({ message: 'Bad Request - New point data is required.' });
      console.log('Bad Request - New point data is required.');
      resolve(response);
    }
  })
};
