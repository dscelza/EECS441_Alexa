var https = require('https')

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to an Alexa Skill, this is running on a deployed lambda function", true),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request
        console.log(`INTENT REQUEST`)

        switch(event.request.intent.name) {
          case "GetStockPrice":
            console.log(event.request.intent.slots.StockSymbol.value)
            var sym = event.request.intent.slots.StockSymbol.value
            // does not work with voice.. still need to remove spaces and '.'
            // voice returns a. a. p. l need aapl
            // does work when configuring your own test cases on Lambda
            var endpoint = "https://download.finance.yahoo.com/d/quotes.csv?s=" + 
                event.request.intent.slots.StockSymbol.value +"&f=nabo"
            console.log(endpoint)
            var body = ""
            https.get(endpoint, (response) => {
              response.on('data', (chunk) => { body += chunk })
              response.on('end', () => {
                var resp = body.split(',')
                var StockName = resp[0]
                StockName.replace('"',' ')
                var StockPrice = resp[1]
                var x =  StockName + ' is currently trading at ' + StockPrice + '.'
                console.log(x)
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse(x, true),
                    {}
                  )
                )
              })
            })
            break;

          

          default:
            throw "Invalid intent"
        }

        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

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