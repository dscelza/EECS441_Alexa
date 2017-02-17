var https = require('https');
var oauth = require('oauth');

//General stock response helper function
function stockExchange(data){
    // Exchange Name
    var name = data['name'];
    // Percent change from previous close
    var percentChange = data['pchg'];
    // Change type (even, up, down)
    var changeType = '';
    console.log(data['pchg_sign']);
    if (data['pchg_sign'] == 'u')
        changeType = 'up';
    if (data['pchg_sign'] == 'd')
        changeType = 'down';
    if (data['pchg_sign'] == 'e')
        changeType = 'unchanged';
    // Trading price
    var price = data['last'];

    // Alexa speech response
    return (name + ' is ' +  changeType + ' by ' + percentChange + ' at ' + price);
}

//Detailed stock response helper function
function stockDetailsHelper(data){
    // Exchange Name
    var name = data['name'];
    // 52 Week high
    var hi52 = data['wk52hi'];
    // 52 Week low
    var low52 = data['wk52lo'];
    //P/E Ratio
    var peRatio = data['pe'];

}

// Setup key/secret for authentication and API endpoint URL
var configuration = {
  api_url: "https://api.tradeking.com/v1",
  consumer_key: "tuBpknysruKHIOGtFS0eOykYqZkLi3P2qBi61WjuA0A7",
  consumer_secret: "rknerQ5ki8yzKxvigA5d99vsxHiahcy58lGCaEhGwKQ4",
  access_token: "7LXGWjbYl8LgJuVJalQZPm8pPYiTq5WZFHTUypDZ7v42",
  access_secret: "KcCZCbBr4ztfmtEpJRS5ZzVf1H5lnl0cBobvFIu8TEs8"
}

// Setup the OAuth Consumer
var tradeking_consumer = new oauth.OAuth(
  "https://developers.tradeking.com/oauth/request_token",
  "https://developers.tradeking.com/oauth/access_token",
  configuration.consumer_key,
  configuration.consumer_secret,
  "1.0",
  null,
  "HMAC-SHA1");

var stockExchangeTicker = {
    NASDAQ: "IXIC",
    DOW: "DJI",
    SP500: "GSPC"
}

var symbol = "";

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
                symbol = event.request.intent.slots.StockSymbol.value;
                symbol = symbol.replace(/[^a-zA-Z ]+/g, '');

                tradeking_consumer.get(configuration.api_url+'/market/ext/quotes.json?symbols=' + symbol, configuration.access_token, configuration.access_secret,
                    function(error, data, response) {
                        if (error){
                            console.log(error);
                            context.succeed(
                            generateResponse(
                                buildSpeechletResponse("My Market was unable to process your request with TradeKing.", true),
                                    {}
                            )
                        );
                        }
                        // Parse the JSON data
                        dataResponse = JSON.parse(data);
                        dataResponse = dataResponse.response['quotes']['quote'];
                        console.log(dataResponse);
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse(stockExchange(dataResponse), true),
                                    {}
                            )
                        );
                    })

            break;

            case "GetNewsAbout":

            keyword = event.request.intent.slots.NewsWord.value;
            keyword = keyword.replace(/[^a-zA-Z ]+/g, '');
            console.log("get update function");
            console.log(keyword);

            tradeking_consumer.get(configuration.api_url+'/market/news/search.json?symbols=' + keyword, configuration.access_token, configuration.access_secret,
                    function(error, data, response) {
                        if (error){
                            console.log(error);
                            context.succeed(
                            generateResponse(
                                buildSpeechletResponse("My Market was unable to process your request with TradeKing.", true),
                                    {}
                            )
                        );
                        }
                        // Parse the JSON data
                        dataResponse = JSON.parse(data);
                        dataResponse = dataResponse.response['articles']['article'];
                        console.log(dataResponse);
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse(stockExchange(dataResponse), true),
                                    {}
                            )
                        );
                    })

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
