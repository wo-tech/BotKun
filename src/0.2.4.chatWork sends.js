(function(global){

  var ChatWorkSends = (function() {

    function ChatWorkSends (cw_request, cw_members, cw_rooms, reportToDevs)
    {
      const send = this,
            request = cw_request,
            members = cw_members,
            rooms = cw_rooms,
            report = reportToDevs
      
      send.basic = function (roomId, payload_data, customHeaders = null) {
        let targetUrl = `rooms/${roomId}/messages`
        return request.postFetch(targetUrl, payload_data, customHeaders).getResponseCode()
      }
      

      send.message = function (room, body, targetTeamsForAutomaticTo = false) {

        let targetRoom = rooms.safeGet(room)
        if(!targetRoom) report (`send.message failed : "${room}" is an invalid room reference`)
        
        body = targetTeamsForAutomaticTo ? 
          rooms.getTeamsTos(targetRoom.id, targetTeamsForAutomaticTo)  + body
          : body

        try {
          return send.basic (targetRoom.id, { 'body': body })
        } catch (err) {
          report (err)
        }
      }

      send.privateMessage = function (memberName, body, toUser = false) {

        let targetMember = members.safeGet(memberName)
        if(!targetMember || !targetMember.direct_room) report (`send.privateMessage failed : "${memberName}" is an invalid name, or this user does not have a private room`)
        let targetRoom = targetMember.direct_room
        
        body = toUser ? 
          `[To:${targetMember['CW_ID']}]${targetMember.cw_name}\n`  + body
          : body

        try {
          return send.basic (targetRoom, { 'body': body })
        } catch (err) {
          report (err)
        }
      }

      // ADAPT SEND PDF

  //     let sendPdfToCW = function (spreadSheetUrl,targetSheetsNames, room_id) { 

  //     let targetSheetsNamesArray = targetSheetsNames.split('+');

  //     // use the function declared below to get an array of pdf blobs
  //     let blobs = getArrayOfPdfBlobs(spreadSheetUrl, targetSheetsNamesArray);
      
  //     // declare the constant variables for the loop
  //     let headers = {
  //       'X-ChatWorkToken': 'INSERT_YOUR_CW_TOKEN_HERE',
  //     };
  //     let url = "https://api.chatwork.com/v2/rooms/" + room_id + "/files";

  //     // declare the variables for the loop
  //     let postBlobOptions;
  //     let cwAPICall;
  //     let pdfNamingInstructions;

  //     // launch a send for each blob (and post their actual name inside the message)
  //     for (blob = 0; blob<blobs.length; blob++){
  //       pdfNamingInstructions = blobs[blob].getName();
  //       blobs[blob].setName('pdf_'+(blob+1)+'.pdf');

  //       postBlobOptions = {
  //         "headers": headers,
  //         "payload": {
  //           "file": blobs[blob],
  //           "message" : "[To:CW_ACCOUNT_ID]Here's the usage summary for choyokei na otonari san\nThis week's average usage is "+usageAverage+" per day."
  //           },
  //         "muteHttpExceptions": true
  //       };

  //       console.log(postBlobOptions)

  //       cwAPICall = UrlFetchApp.fetch(url,postBlobOptions);
  //       console.log (cwAPICall.getContentText("UTF-8"));
  //       // incrementOneDocumentSentTothisMonthTracking();
  //     }


  //     function getArrayOfPdfBlobs(ssUrl,sheetNamesArray){

  //       // load spreadsheet
  //       let targetSpreadsheet = SpreadsheetApp.openByUrl(ssUrl);

  //       // constant variables through the loop
  //       let url_base = targetSpreadsheet.getUrl().replace(/edit$/,'');
  //       let options = {
  //         headers: {
  //           'Authorization': 'Bearer ' +  ScriptApp.getOAuthToken(),
  //         }
  //       }
        
  //       // variables to modify through the loop
  //       let sheetName;
  //       let sheetId;
  //       let pdfName;
  //       let url_ext;
  //       let response;

  //       // variable to return
  //       let arrayOfPdfBlobs = [];

  //       for (sheet = 0; sheet<sheetNamesArray.length; sheet++){
  //         sheetName = sheetNamesArray[sheet];

  //         // make the ULR FetchCall
  //         sheetId = targetSpreadsheet.getSheetByName(sheetName).getSheetId();
  //         url_ext = 'export?exportFormat=pdf&format=pdf'   //export as pdf
  //                   + ('&gid=' + sheetId) 
  //                   // following parameters are optional...
  //                   + '&size=A4'      // paper size
  //                   + '&portrait=true'    // orientation, false for landscape
  //                   + '&fitw=true'        // fit to width, false for actual size
  //                   + '&sheetnames=true&printtitle=false&pagenumbers=true'  //hide optional headers and footers
  //                   + '&gridlines=false'  // hide gridlines
  //                   + '&fzr=false';       // do not repeat row headers (frozen rows) on each page;
  //         response = UrlFetchApp.fetch(url_base + url_ext, options);

  //         // Convert it into a Blob and push it inside the result array
  //         pdfName = sheetName;
  //         arrayOfPdfBlobs.push(response.getBlob().setName(pdfName + '.pdf'));
  //       }

  //       return arrayOfPdfBlobs;
  //     }
  // }

    };

    return ChatWorkSends;
  })();

  global.ChatWorkSends = ChatWorkSends;

})(this);


function loadChatWorkSends_ (cw_request, cw_members, cw_rooms, reportToDevs) {
  return new ChatWorkSends (cw_request, cw_members, cw_rooms, reportToDevs)
};


