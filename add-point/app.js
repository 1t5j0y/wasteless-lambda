const AWS = require('aws-sdk')
const s3 = new AWS.S3()
let response;

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
      'contentType': 'application/json',
      'body': JSON.stringify({
        message: 'hello world',
      })
    }
    var newPoint = JSON.parse(event.body);
    console.log(JSON.stringify(newPoint));

    s3.getObject({ Bucket: 'goa-waste-eco-map', Key: 'test.json' }, function (err, data) {
      var goa_waste_data = JSON.parse(data.Body);
      goa_waste_data.features.push(newPoint);
      s3.putObject({ Bucket: 'goa-waste-eco-map', Key: 'test.json', Body: JSON.stringify(goa_waste_data) }, function (err) {
        if (err) {
          console.log('error while writing file to s3 ' + e.errorMessage);
          reject(err);

        } else {
          console.log('wrote file to s3');
          resolve(response);
        }
      })
    })
      .on('error', (e) => {
        console.log(e.errorMessage)
        reject(Error(e))
      })
  })
};
