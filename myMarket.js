var https = require('https')

exports.handler = (event, context) => {

  try {

    if (event.session.new){
      // New session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log('LAUNCH REQUEST')
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to My Market! The premiere source of personalized market data.", true)
            {}
          )
        )
        break;

      case "IntentRequest":
      // Intent Request
      console.log('INTENT REQUEST')

      switch(event.request.intent.name) {
        case "GetStockPrice":
          console.log(event.request.intent.slots.StockSymbol)
          var endpoint = "" //ENDPOINT GOES HERE
          var body = ""
          https.get(endpoint, (response) => {
            response.on('data', (chunk) => { body += chunk })
            response.on('end', () => {
              var data = JSON.parse(body)
              var stockPrice = data.items[0].statistics.stockPrice
              var percentChange = data.items[0].statistics.percentChange
              context.succeed(
                generateResponse(
                  buildSpeechletResponse('${StockSymbol} is currently trading at ${stockPrice} and changed by ${percentChange} percent. ', true),
                  {}
                )
              )
            })
          })
          break;

          case "GetStockNews":
            console.log(event.request.intent.slots.StockSymbol)
            var endpoint = "" //ENDPOINT GOES HERE
            var body = ""
            https.get(endpoint, (response) => {
              response.on('data', (chunk) => { body += chunk })
              response.on('end', () => {
                var data = JSON.parse(body)
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse('Recent news for ${StockSymbol}. ', true),
                    {}
                  )
                )
              })
            })
            break;

            //Buy Trade
            //Would you like to buy or sell?
            //What stock you would like to ${buysell_Decision}
            //Stock ${stockSymbol} is trading at ${stockPrice}.
            //What price would you like to ${buysell_Decision}?
            //Would you like to place a market order or a limit order?
            //Okay, you are going to ${buysell_Decision} ${stockSymbol} at
            //${stockPrice} using a ${orderType}. Say PIN to confirm trade else cancel."


          default:
            throw "Invalid intent"
      }

      break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log('SESSION ENDED REQUEST')
        break;

      default:
        context.fail('INVALID REQUEST TYPE: ${event.request.type}')
    }
  } catch(error) { context.fail('Exception: ${error}') }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

    return {
      version: "1.0",
      sessionAttributes: sessionAttributes,
      response: speechletResponse
    }

}
