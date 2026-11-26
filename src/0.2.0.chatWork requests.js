(function(global){

  var ChatWorkRequests = (function() {

    /** INSERT INIT VALUES HERE (Variables given by the user)**/
    function ChatWorkRequests (cw_token)
    {
      const requestHandler = this
      requestHandler.cwBaseUrl = 'https://api.chatwork.com/v2/';
      requestHandler.cwToken = cw_token;
      

      requestHandler.singleGetParams = function (endOfUrl, customHeaders = null) {
        // make headers and add token
        let headers = customHeaders ? customHeaders : {'Accept': 'application/json'};
        headers['X-ChatWorkToken'] = requestHandler.cwToken;
        let url = requestHandler.cwBaseUrl+endOfUrl
        return {
            url: url,
            options : {
              'method': 'get',
              'headers': headers
            }
        }
      }

      requestHandler.getFetch = function (endOfUrl, customHeaders = null) {
        let params = requestHandler.singleGetParams(endOfUrl, customHeaders)
        try {
          return UrlFetchApp.fetch(params.url, params.options)
        } catch(err){
          throw err
        }
      }

      requestHandler.multiGetParams = function (endOfUrl, customHeaders = null) {
        // make headers and add token
        let headers = customHeaders ? customHeaders : {'Accept': 'application/json'};
        headers['X-ChatWorkToken'] = requestHandler.cwToken;
        let url = requestHandler.cwBaseUrl+endOfUrl
        return {
          'url': url,
          'method': 'get',
          'headers': headers
        }
      }

      requestHandler.getFetchAll = function (arrayOfUrls, customHeaders = null) {
        let paramMaker = requestHandler.multiGetParams
        let fetchAllParams = arrayOfUrls.map(url => paramMaker(url, customHeaders))
        try {
          return UrlFetchApp.fetchAll(fetchAllParams)
        } catch(err){
          throw err
        }
      }

      // flexible : either for simple fetch or fetchAll 
      requestHandler.makePostParams = function (endOfUrl, payload_data, outputForFetchAll = false, customHeaders = null) {
        // make headers and add token
        let headers = customHeaders ? customHeaders : {'Accept': 'application/json'};
        headers['X-ChatWorkToken'] = requestHandler.cwToken;
        let url = requestHandler.cwBaseUrl+endOfUrl
        // return parameters for fetch all
        if (outputForFetchAll) {
          return {
            'url': url,
            'method': 'post',
            'payload': payload_data,
            'headers': headers
          } 
        }
        // or parameters for simple fetch
        return {
            url: url,
            options : {
              'method': 'post',
              'payload': payload_data,
              'headers': headers
            }
        }
      }

      requestHandler.singlePostParams = function (endOfUrl, payload_data, customHeaders = null) {
        // make headers and add token
        let headers = customHeaders ? customHeaders : {'Accept': 'application/json'};
        headers['X-ChatWorkToken'] = requestHandler.cwToken;
        let url = requestHandler.cwBaseUrl+endOfUrl

        return {
            url: url,
            options : {
              'method': 'post',
              'payload': payload_data,
              'headers': headers
            }
        }
      }

      requestHandler.postFetch = function (endOfUrl, payload_data, customHeaders = null) {
        let params = requestHandler.singlePostParams (endOfUrl, payload_data, customHeaders)
        try {
          return UrlFetchApp.fetch(params.url, params.options)
        } catch(err){
          throw err
        }
      }

    };

    return ChatWorkRequests;
  })();

  global.ChatWorkRequests = ChatWorkRequests;

})(this);


function loadChatWorkRequests_ (cw_token) {
  return new ChatWorkRequests (cw_token)
};


