/* app imports */
const __base = global.approot;
const consoleLogger = require(__base + "/utils/logger.js");
const HandlerTemplate = require(__base + "/utils/handler-template.js");

const fileImports = {
  service: {
    AppService: require("../service/app.service.js")
  },
  models: {
    ErrorResponse: require(__base + "/models/error-response.models.js"),
    SuccessResponse: require(__base + "/models/success-response.models.js")
  },
  api: {
    ApiHandler: require("../api/index.api.js")
  },
  data: {
    responseConstants: require("../data/response-constants.js")
  }
};

class Handler extends HandlerTemplate {
  constructor(req, res) {
    super(req, res);
  }

  /* entry */
  static main(req, res) {
    let handler = new Handler(req, res);
    handler.initialize();
  };

  /* start */
  initialize() {
    let $this = this;

    let {AppService} = fileImports.service;
    $this.service = new AppService();

    let {ApiHandler} = fileImports.api;
    $this.apiHandler = new ApiHandler();

    /* next */
    $this.perform();
  };

  perform() {
    let $this = this;
    let {ErrorResponse, SuccessResponse} = fileImports.models;

    let {body: payload} = $this.req;
    const isValidPayload = $this.service.validateShrinkRequest(payload);

    /* here, its not good, so dont proceed */
    if (!isValidPayload) {
      let error = new ErrorResponse();
      error.code = "api-invalid";
      error.message = "Sorry. Invalid post request payload. Please check API Key and Request Url.";
      $this.res.json(error);
    }
    /* ok so now what? */
    else {
      const requestUrl = $this.service.buildRequestToShrink(payload);

      /* make the request to the end point */
      $this.apiHandler.makeGetRequestAndReturnJson(requestUrl, (apiResponse) => {
        if (apiResponse.code !== "api-ok") {
          $this.res.send(apiResponse);
        }
        else {
          $this.formatResponseAndSendToClient(apiResponse);
        }
      });
    }
  };

  formatResponseAndSendToClient(apiResponse) {
    let $this = this;
    let {errorResponse, successResponse} = fileImports.models;
    let {responseConstants} = fileImports.data;
    
    /* get the message from responseConstants and set the message */
    let message = responseConstants[apiResponse.payload.url.status.toString()];
    apiResponse.message = message;

    /* set the code based on the url status value */
    apiResponse.code = (apiResponse.payload.url.status === 7) ? "api-ok" : "api-fail";

    /* send response to the client side */
    $this.res.json(apiResponse);
  };
};
module.exports = Handler.main;
