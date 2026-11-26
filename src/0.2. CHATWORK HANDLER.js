(function(global){

  var ChatWorkHandler = (function() {

    function ChatWorkHandler (params, cacheHandler)
    {
      const cw = this
      this.request = loadChatWorkRequests_ (params.cw.token)
      const request = this.request

      this.reportToDevs = function (body, throwError = true) {
        let targetUrl = `rooms/${params.cw.devRoom}/messages`
        console.warn('Report to dev : \n---\n' + body + '\n---\n' + throwError ? 'Throwing error' : 'Skipping the error') 
        request.postFetch(targetUrl, { 'body' : `⚠️Report⚠️\n${body}`})
        if (throwError) throw body
      }

      this.members = loadChatWorkMembers_ (params.members, this.request, cacheHandler)
      // try {
      //   this.members = loadChatWorkMembers_ (params.members, this.request, cacheHandler)
      // } catch (err) {
      //   this.reportToDevs('Error loading members : \n\n' + err)
      // }
      try {
        this.rooms = loadChatWorkRooms_ (this.request, this.members, cacheHandler)
      } catch (err) {
        this.reportToDevs('Error loading rooms : \n\n' + err)
      }
      try {
        this.dwnld = loadChatWorkDwndls_ (this.request, this.members)
      } catch (err) {
        this.reportToDevs('Error loading dwnld : \n\n' + err)
      }
      try {
        this.send = loadChatWorkSends_ (this.request, this.members, this.rooms, this.reportToDevs)
      } catch (err) {
        this.reportToDevs('Error loading sends : \n\n' + err)
      }
    };

    return ChatWorkHandler;
  })();

  global.ChatWorkHandler = ChatWorkHandler;

})(this);


function loadChatWorkHandler_ (params, cacheHandler) {
  return new ChatWorkHandler (params, cacheHandler)
};


