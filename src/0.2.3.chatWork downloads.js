(function(global){

  var ChatWorkDwndls = (function() {

    function ChatWorkDwndls (cw_request, cw_rooms)
    {
      const dwnld = this,
            requests = cw_request,
            rooms = cw_rooms

      dwnld.csv = function (room, dwnldId) {
        
      }

      
    };

    return ChatWorkDwndls;
  })();

  global.ChatWorkDwndls = ChatWorkDwndls;

})(this);


function loadChatWorkDwndls_ (cw_request, cw_members) {
  return new ChatWorkDwndls (cw_request, cw_members)
};


