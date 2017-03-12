var https = require('https');
var oauth = require('oauth');

// 4de8fd1a6b2c47ce8d98fce1185a556e newsapi key

//General stock response helper function
function stockExchange(data){
    // Change type (even, up, down)
    var changeType = '';
    if (parseFloat(data.last) > parseFloat(data.pcls))
        changeType = 'up';
    else if (parseFloat(data.last) < parseFloat(data.pcls))
        changeType = 'down';
    else
        changeType = 'unchanged';
    // Alexa speech response
    // [Stock Name] is [up/down/unchanged] by [percentange] percent and trading at [float] dollars;
    return (data.name + ' is ' +  changeType + ' by ' + data.pchg + ' percent and trading at ' + parseFloat(data.last).toFixed(2) + ' dollars.');
}

// Portfolio specific data
function portfolioReview(data){
    // Account market value
    var marketvalue = data.marketvalue;
    // Daily change from previous day
    var dailychange = data.change;
    // Total change for account
    var totalchange = data.gainloss;
    // Alexa speech response
    return ('Your account balance of ' + marketvalue + ' dollars has changed by ' + dailychange + ' percent today and overall has changed by ' + totalchange + ' percent to date.');
}

//Detailed stock response helper function
function stockDetailsHelper(data){
    // Exchange Name
    var name = data.name;
    // 52 Week high
    var hi52 = data.wk52hi;
    // 52 Week low
    var low52 = data.wk52lo;
    //P/E Ratio
    var peRatio = data.pe;
}

// Endpoints for Tradier
var tradier = {
    endpoint: "sandbox.tradier.com",
    symbolSearch: "/v1/markets/search?q=",
    access_token: "qzMwTpKzmDeFez8dn4u2Lr2PM6GC"
}

// Tradier GET options
var tradier_get = {
    method: 'GET',
    hostname: tradier.endpoint,
    path: tradier.symbolSearch,
    headers: {
        'Authorization': 'Bearer ' + tradier.access_token,
        'Accept' : 'application/json',
        'Content-Type' : 'application/json'
    }
}

// Setup key/secret for authentication and API endpoint URL
var configuration = {
  api_url: "https://api.tradeking.com/v1",
  consumer_key: "tuBpknysruKHIOGtFS0eOykYqZkLi3P2qBi61WjuA0A7",
  consumer_secret: "rknerQ5ki8yzKxvigA5d99vsxHiahcy58lGCaEhGwKQ4",
  access_token: "7LXGWjbYl8LgJuVJalQZPm8pPYiTq5WZFHTUypDZ7v42",
  access_secret: "KcCZCbBr4ztfmtEpJRS5ZzVf1H5lnl0cBobvFIu8TEs8"
};

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
};

var symbol = "";

// General error message for TradeKing requests
function getRequestError(error, intent, context){
    console.log(error);
    context.succeed(
    generateResponse(buildSpeechletResponse("My Market was unable to process your request with TradeKing for " + intent + ".", true),{})
    );
}

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

                // Removes excess characters
                var spaceIndex = symbol.lastIndexOf(' ');
                if (spaceIndex != -1)
                    symbol = symbol.substring(spaceIndex + 1, symbol.length);
                
                tradeking_consumer.get(configuration.api_url+'/market/ext/quotes.json?symbols=' + symbol,
                configuration.access_token, configuration.access_secret,
                    function(error, data, response) {
                        if (error)
                            getRequestError(error, " retrieving information about " + symbol, context);
                        else{
                            // If symbol not recognized then convert from Company Name to Ticker Symbol and try again.
                            var definedTest = parseFloat(JSON.parse(data).response.quotes.quote.last);
                            if (!definedTest){
                                console.log("NAME TO SYMBOL")
                                tradier_get.path = tradier.symbolSearch + symbol;
                                var body = "";
                                https.get(tradier_get, (response) => {
                                response.on('data', (chunk) => { body += chunk });
                                response.on('end', () => {
                                    console.log("SYMBOL TRY2");
                                    // Set body as first suggested ticker symbol
                                    
                                    // TODO Fix bug where Tradier doesn't find any matches. 'disney'
                                    // TODO Adjust excess character removal to allow full names. 'constellation brands'
                                    body = JSON.parse(body).securities.security;
                                    if (body instanceof Array)
                                        body = body[0].symbol;
                                    else
                                        body = body.symbol;
                                    
                                    // Send GET to TradeKing with new symbol
                                    tradeking_consumer.get(configuration.api_url+'/market/ext/quotes.json?symbols=' + body,
                                    configuration.access_token, configuration.access_secret,
                                    function(error, data, response) {
                                    if (error)
                                        getRequestError(error, " retrieving information about " + body );
                                        // Parse the JSON data
                                        dataResponse = JSON.parse(data).response.quotes.quote;
                                        context.succeed(
                                            generateResponse(buildSpeechletResponse(stockExchange(dataResponse), true),{})
                                        );
                                    }
                                    );
                                });
                                });
                            }
                            else{
                            // Received a TICKER SYMBOL from the user
                            dataResponse = JSON.parse(data).response.quotes.quote;
                            context.succeed(
                                generateResponse(buildSpeechletResponse(stockExchange(dataResponse), true),{})
                            );
                            }
                        }
                    }
                );
            break;

            case "GetNewsAbout":
                keyword = event.request.intent.slots.NewsWord.value;
                keyword = keyword.replace(/[^a-zA-Z ]+/g, '');
                console.log("get update function");
                console.log(keyword);

                tradeking_consumer.get(configuration.api_url+'/market/news/search.json?symbols=' + keyword + '&maxhits=3',
                configuration.access_token, configuration.access_secret,
                        function(error, data, response) {
                            if (error)
                                getRequestError(error, " retrieving news about " + keyword, context);
                            else{
                                dataResponse = JSON.parse(data);
                                var resp = '';
                                for (var i = 0 ; i < 3; i++)
                                    resp = resp + dataResponse.response.articles.article[i].headline + '. ';
                                console.log(resp);
                                context.succeed(
                                    generateResponse(buildSpeechletResponse(resp, true),{})
                                );
                            }
                    }
                );
            break;

            case "GetNews":
                console.log("get news function");
                var endpoint = "https://newsapi.org/v1/articles?source=" + 
                "bloomberg&apiKey=4de8fd1a6b2c47ce8d98fce1185a556e";
                var body = "";
                https.get(endpoint, (response) => {
                response.on('data', (chunk) => { body += chunk });
                response.on('end', () => {
                    var dataResponse = JSON.parse(body);
                    //console.log(dataResponse)
                    var resp = '';
                    for (var i = 0 ; i < 3; i++){
                        resp = resp + dataResponse.articles[i].title + '. ';
                        resp = resp + dataResponse.articles[i].description + '<break time="2s"/> ';
                        resp = resp + " Next Article. ";
                    }
                    console.log("resp: ");
                    console.log(resp);
                    context.succeed(
                        generateResponse(buildSpeechletResponse(resp, true),{})
                    );
                });
                });
            break;

            case "GetPortfolio":
                var demoAccount = '38937548';
                tradeking_consumer.get(configuration.api_url+'/accounts/' + demoAccount + '/holdings.json',
                configuration.access_token, configuration.access_secret,
                    function(error, data, response) {
                        if (error)
                            getRequestError(error, " retrieving news about your portfolio", context);
                        else{
                            // Parse the JSON data
                            dataResponse = JSON.parse(data).response.accountholdings;
                            console.log(dataResponse);
                            // TODO: CHANGE SPEECHLET FUNCTION TO 'portfolioReview(data)'
                            context.succeed(
                                generateResponse(
                                    buildSpeechletResponse('stockExchange(dataResponse)', true),{}
                                )
                            );
                        }
                    }
                );
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
  };
};