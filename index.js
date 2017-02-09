var https = require('https');


//TRADEKING SAMPLE GET WITH OUR KEYS. https://developers.tradeking.com/documentation/node
//NEEDS OAUTH package. https://github.com/ciaranj/node-oauth

    // Use the OAuth module
 var oauth = require('oauth');

//             // Setup key/secret for authentication and API endpoint URL
// var configuration = {
//   api_url: "https://api.tradeking.com/v1",
//   consumer_key: "tuBpknysruKHIOGtFS0eOykYqZkLi3P2qBi61WjuA0A7",
//   consumer_secret: "rknerQ5ki8yzKxvigA5d99vsxHiahcy58lGCaEhGwKQ4",
//   access_token: "7LXGWjbYl8LgJuVJalQZPm8pPYiTq5WZFHTUypDZ7v42",
//   access_secret: "KcCZCbBr4ztfmtEpJRS5ZzVf1H5lnl0cBobvFIu8TEs8"
// }

// // Setup the OAuth Consumer
// var tradeking_consumer = new oauth.OAuth(
//   "https://developers.tradeking.com/oauth/request_token",
//   "https://developers.tradeking.com/oauth/access_token",
//   configuration.consumer_key,
//   configuration.consumer_secret,
//   "1.0",
//   null,
//   "HMAC-SHA1");

// tradeking_consumer.get(configuration.api_url+'/accounts.json', configuration.access_token, configuration.access_secret,
//   function(error, data, response) {
//     // Parse the JSON data
//     account_data = JSON.parse(data);
//     // Display the response
//     console.log(account_data.response);
//   }
// );

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION");
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`);
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to an Alexa Skill, this is running on a deployed lambda function", true),
            {}
          )
        );
        break;

      case "IntentRequest":
        // Intent Request
        console.log(`INTENT REQUEST`);

        switch(event.request.intent.name) {
          case "GetStockPrice":
            var sym = event.request.intent.slots.StockSymbol.value;
            sym = sym.replace(/[^a-zA-Z ]+/g, '');
            var endpoint = "https://download.finance.yahoo.com/d/quotes.csv?s=" + 
                sym +"&f=nl1p2";
            var body = "";
            
            https.get(endpoint, (response) => {
              response.on('data', (chunk) => { body += chunk });
              response.on('end', () => {
                  //BUG. doesn't split correctly. test FIT.
                  //http://vikku.info/codetrash/Yahoo_Finance_Stock_Quote_API (API info)
                var resp = body.split(',');
                var StockName = resp[0];
                StockName.replace('.','');
                var StockPrice = resp[1];
                console.log("Stock price is: ");
                console.log(resp);
                var x =  StockName + ' is currently trading at ' + StockPrice + '.';
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse(x, true),
                    {}
                  )
                );
              });
            });
            break;

          

          default:
            throw "Invalid intent";
        }

        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`);
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`);

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

};

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  };

};

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}