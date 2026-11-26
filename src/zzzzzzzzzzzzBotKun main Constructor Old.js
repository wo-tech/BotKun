// (function(global){

//   var BotKun = (function() {

//     /** INSERT INIT VALUES HERE (Variables given by the user)**/
//     function BotKun (params)
//     {
//       this.cache = params.cache.cache;
//       this.timeout = params.cache.defaultTimeout;
//       this.chunkSize = 1024*90;
//       this.cwBaseUrl = 'https://api.chatwork.com/v2/';
//       this.cwToken = params.cw.token;

//       this.today = new Date();

//       this.cw_rooms;
//       this.members;
//       this.shiftReaderParams;
//       this.members_dataSsUrl = params.members.dataSsUrl;
//       this.members_shiftSsUrl = params.members.shiftSsUrl;
//     };


//     BotKun.prototype.help = function () {
//       let fullArrayOfFunctions = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

//       // sort functions by type ('type_function')
//       let sortedObject = {}
//       let splitArray = [];
      
//       for (let funcName of fullArrayOfFunctions) {
//         splitArray = funcName.split('_')
        
//         // avoid false positive
//         if (splitArray.length !== 2) {continue}
        
//         // if a new key, add it
//         if (!sortedObject[splitArray[0]]) {sortedObject[splitArray[0]] = ''}
        
//         sortedObject[splitArray[0]] += '・'+splitArray[1].toUpperCase()+' : botKun.'+funcName+'()\n'
//       }

//       // construct result Log
//       let resultLog = '|\n|  See documentation : https://github.com/wo-tech/BotKun/blob/main/README.md\n|\n\n'
      
//       for (let key in sortedObject) {
//         resultLog += '**\n*'+key.toUpperCase()+'\n**\n'+sortedObject[key]
//       }
//       console.warn('HELP : List of all available functions')
//       console.log(resultLog)
//     } 



//     // CW




//     // MEMBERS
//     BotKun.prototype._members_construct = function (){
//       // load member data
//       let memberData = SpreadsheetApp.openByUrl(this.members_dataSsUrl).getSheetByName('メンバーデータ').getDataRange().getValues()

//       // make easy to use headers
//       let headers = memberData.shift();
//       let headersInd = {};
//       for (header of headers){
//         headersInd[header] = headers.indexOf(header)
//       }

//       // declare today to avoid issues with 'this'
//       let today = this.today;

//       function Member(memberRow) {
//         // names
//         this.shift_name = memberRow[headersInd['シフト名']] || null;
//         this.teamSpirit_name = memberRow[headersInd['TS名']] || null;
//         // cw id
//         this.cw_id = memberRow[headersInd['CW_ID']] || null;
//         // status
//         this.group = memberRow[headersInd['グループ']] || null;
//         this.team = memberRow[headersInd['チーム']] || null;
//         this.position = memberRow[headersInd['ポジション']] || null;
//         // current status in company
//         this.active = memberRow[headersInd['入社日']] instanceof Date && memberRow[headersInd['入社日']] < today 
//         && ((memberRow[headersInd['退社日']] === '') || (memberRow[headersInd['退社日']] instanceof Date && memberRow[headersInd['退社日']] > today))
//         // will be populated by ._members_assignShiftData
//         this.shift = [];
//       }

//       function Members (memberData) {
//         for (memberRow of memberData) {
//           this[memberRow[headersInd['呼び方']]] = new Member (memberRow);
//         }
//       }

//       return new Members (memberData)
//     }
    

//     // load shift
//     BotKun.prototype._members_assignShiftData = function (membersObject){

//       // declare today to avoid issues with 'this'
//       let today = this.today;
      
//       // load shiftSheets and their names
//       let shiftSheets = SpreadsheetApp.openByUrl(this.members_shiftSsUrl).getSheets()
//       let sheetNames = shiftSheets.map(sheet => sheet.getName())

//       // declare target sheet names
//       let shiftReadingSettingsSheetName = 'シフト設定'
//       let currentMonthSheetName = `${today.getFullYear()}年${today.getMonth()+1}月`

//       // get Data (including next month sheet only if it exists)
//       let shiftReadingSettingsSheet = shiftSheets[sheetNames.indexOf(shiftReadingSettingsSheetName)].getDataRange().getValues();
//       let currentMonthData = shiftSheets[sheetNames.indexOf(currentMonthSheetName)].getDataRange().getValues();
      

//       // declare extraction variables 
//       let shiftStartRowInd = 25
//       let memberNameColInd = 3
//       let shiftStartColInd = 9
//       let thisMonthDays = new Date (today.getFullYear(), today.getMonth() + 1, 0).getDate()


//       function assignShifts (shiftData, numOfDays){
//         // get rid of useless data to accelerate process
//         shiftData.splice(0,shiftStartRowInd)

//         // create blank arrays for members that weren't found in current shift
//         // not performance heavy, so favor readability to nested if statements inside the loop
//         let blankArray = []
//         for (let i=0; i<numOfDays; i++) { blankArray.push('') }

//         // init member found
//         let memberFound = false

//         // run through all members
//         for (let memberKey in membersObject){

//           memberFound = false

//           findMemberShift:
//           for (let memberRow of shiftData){
//             if(memberRow[memberNameColInd] === membersObject[memberKey].shift_name){

//               // push the appropriate slice
//               membersObject[memberKey].shift.push(memberRow.slice(shiftStartColInd, numOfDays+shiftStartColInd))
//               // flatten to allow for multiple pushes
//               membersObject[memberKey].shift = membersObject[memberKey].shift.flat()

//               memberFound = true;
//               break findMemberShift;
//             }
//           }

//           if(memberFound) continue
//           // add blank array if wasn't found
//           membersObject[memberKey].shift.push(blankArray)
//           membersObject[memberKey].shift = membersObject[memberKey].shift.flat()
//         }

//       }

//       assignShifts (currentMonthData, thisMonthDays);
      
//       // check if next month sheet is available
//       let nextMonth = new Date (today.getFullYear(), today.getMonth() + 1, 1)
//       let nextMonthSheetName = `${nextMonth.getFullYear()}年${nextMonth.getMonth()+1}月`
//       if (sheetNames.indexOf(nextMonthSheetName) === -1) return

//       // do the same with next month
//       let nextMonthData = shiftSheets[sheetNames.indexOf(nextMonthSheetName)].getDataRange().getValues();
//       let nextMonthDays = new Date (nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
//       assignShifts (nextMonthData, nextMonthDays);

//     }

//     BotKun.prototype.members_reload = function (forceReload = true) {
//       let key = 'members'
//       console.time('Loading "'+key+'"')
      
//       // get cache
//       let cacheVal = this.cache_get(key)
//       // return cache if found and don't force load
//       if (cacheVal && !forceReload) {
//         console.log('"'+key+'" found by BotKun!')
//         console.timeEnd('Loading "'+key+'"')
//         this.members = cacheVal
//         return
//       }

//       // load data using original function if not
//       let infoToUser = forceReload ? 'Reloading "'+key+'"!' : '"'+key+'" not found by BotKun!'
//       console.log(infoToUser+'\nRetrieving values...')
//       let returnValue = this._members_construct()
//       this._members_assignShiftData(returnValue)
//       this.cache_put(key, returnValue)
//       console.log('"'+key+'" stored by BotKun!\nNext time will be faster.')
//       console.timeEnd('Loading "'+key+'"')
//       this.members = returnValue;
//     }


//     // presence Reader
//     // Loads the array for presence marks
//     BotKun.prototype.shiftReaderParams_reload = function (forceReload = true) {
//       let key = 'shiftReadingParams'
//       console.time('Loading "'+key+'"')
      
//       // get cache
//       let cacheVal = this.cache_get(key)
//       // return cache if found and don't force load
//       if (cacheVal && !forceReload) {
//         console.log('"'+key+'" found by BotKun!')
//         console.timeEnd('Loading "'+key+'"')
//         this.shiftReaderParams = cacheVal
//         return
//       }

//       // load data using original function if not
//       let infoToUser = forceReload ? 'Reloading "'+key+'"!' : '"'+key+'" not found by BotKun!'
//       console.log(infoToUser+'\nRetrieving values...')

//       let rawArr = SpreadsheetApp
//                         .openByUrl(this.members_shiftSsUrl)
//                         .getSheetByName('シフト設定')
//                         .getDataRange()
//                         .getValues()

//       // get rid of headers
//       rawArr.shift()
      
//       // get all user input corresponding to their presence
//       let presenceMarks = rawArr.filter(row => row[2]).map(row => row[0]).flat();
//       let correspondingStatus = []
//       correspondingStatus.push(
//         rawArr.map(row => row[0]).flat(),
//         rawArr.map(row => row[1]).flat())

//       let returnValue = {
//         presenceMarks,
//         correspondingStatus
//       }
      
//       this.cache_put(key, returnValue)
//       console.log('"'+key+'" stored by BotKun!\nNext time will be faster.')
//       console.timeEnd('Loading "'+key+'"')
//       this.shiftReaderParams = returnValue;
//     }

//     BotKun.prototype.member_getById = function (memberId) {
//       let members = this.members
//       for (memberName in members) {
//         if (members[memberName].cw_id == memberId) {
//           members[memberName].name = memberName
//           return members[memberName]
//         }
//       }
//     }

//     BotKun.prototype.member_checkPresence = function (memberName, targetDate = this.today){
//       let shiftStartDay = new Date (this.today.getFullYear(), this.today.getMonth(), 1)
//       let searchShiftIndex = Math.floor((targetDate - shiftStartDay) / (1000*60*60*24))
//       // return null for : dates before today, non existing members, and search index going above shift length
//       if (searchShiftIndex < 0 || !this.members[memberName] || !this.members[memberName].shift[searchShiftIndex]) return null
//       // check if the corresponding entry inside the shift is included inside presenceMarks
//       return this.shiftReaderParams.presenceMarks.indexOf(this.members[memberName].shift[searchShiftIndex]) > -1
//     }

//     // Gets the shift's index corresponding to the target date
//     BotKun.prototype.member_getShiftIndex = function (targetDate = this.today) {
//       // make sure it is a valid date in the first place
//       if (!(targetDate instanceof Date)) throw 'Invalid date for presence check : not a javascript date'

//       // actual calculation of the index
//       let shiftStartDay = new Date (this.today.getFullYear(), this.today.getMonth(), 1)
//       let searchShiftIndex = Math.floor((targetDate - shiftStartDay) / (1000*60*60*24))

//       // get rid of negative indexes
//       if (searchShiftIndex < 0) throw 'Invalid date for presence check : preceding current month'

//       // get rid of indexes exceeding shift length
//       // print the first entry of this.members to get their shift length (all shift lengths are equal across the object)
//       let memberKeys = Object.keys(this.members)
//       let testShiftLength = this.members[memberKeys[0]].shift.length
//       if (searchShiftIndex > testShiftLength) throw 'Invalid date for presence check : exceeding available shift data'

//       return searchShiftIndex
//     }

//     // Check one member presence using their name
//     BotKun.prototype.member_checkMemberPresence = function (memberName, targetDate, byPassDateError = false){

//       // allows date error to be non blocking
//       let shiftIndex = 0
//       try {
//         shiftIndex = this.member_getShiftIndex(targetDate) // will handle undefined as today
//       } catch(err){
//         if(!byPassDateError) throw err
//         return null
//       }
      
//       // return null for non existing members
//       if (!this.members[memberName]) return null

//       // check if the corresponding entry inside the shift is included inside presenceMarks
//       return this.shiftReaderParams.presenceMarks.indexOf(this.members[memberName].shift[shiftIndex]) > -1
//     }



//     // get all present members from a team
//     BotKun.prototype.member_getPresentTeamMembers = function (teamName, targetDateOrShiftIndex){
//       // allow for both to avoid unnecessary calculation if it was already done
//       let shiftIndex = targetDateOrShiftIndex instanceof Date ?  this.member_getShiftIndex(targetDate) :  targetDateOrShiftIndex

//       let resultArray = []

//       for (let member in this.members) {
//         if(member.team === teamName && this.shiftReaderParams.presenceMarks.indexOf(member.shift[shiftIndex]) > -1){}
//       }

      
//       // run through members
//         // if team && shiftarray = present
//         // push in result


//     }



//     BotKun.prototype.room_getToList = function (roomName, targetTeams = null) {

//       let self = this

//       // find room, exit if unfound
//       let targetRoom = this.cw_rooms[roomName]
//       if (!targetRoom) throw 'room_getToList failed : invalid room name "'+ roomName +'"'
//       // if there is simply no team in the room, exit without making a scene 
//       if (!targetRoom.teams) return ''

//       // target all teams of the room if no argument was provided
//       if(!targetTeams) targetTeams = Object.keys(targetRoom.teams)

//       // tells the function where to search inside shift array
//       // by definition, to lists are used the same day, therefore no need to use targetDate
//       let shiftIndex = this.member_getShiftIndex()

//       // function to iterate over
//       function getTeamToList (roomTeam2dArray, shiftIndex) {

//         // evolving variables
//         let targetMember, resultArray

//         // the loop iterates through priority arrays of members
//         // the first array that held present members will be returned, until exhaustion of the arrays
//         for (let priorityArray of roomTeam2dArray){
//           targetMember = undefined
//           resultArray = []

//           tantoLoop:
//           for (let memberId of priorityArray) {
//             targetMember = self.member_getById(memberId)
//             // test name: continue if fail
//             if(!targetMember //avoid ids of members that are not registered yet/anymore
//             || !targetMember.shift[shiftIndex] //avoid undefined return
//             || !(self.shiftReaderParams.presenceMarks.indexOf(targetMember.shift[shiftIndex]) > -1)) // check for actual presence
//             {continue tantoLoop}
//             // push if passed
//             resultArray.push(`[To:${memberId}]${targetMember.name}さん`)
//           }
//           // return if found in loop, or just continue
//           if (resultArray.length > 0) return `${resultArray.join('\n')}\n`
//         }

//         // if the loop did not find anything 
//         return null
//       }

//       let currentToList = ''
//       let errorList = ''
//       let finalToList = ''
//       for (let teamName of targetTeams) {
//         if (!targetRoom.teams[teamName]) {
//           errorList += `⚠️「${teamName}」はルーム概要のチームズ設定に記録されていないようです。ご確認をお願い致します。(please)\n`
//           continue;
//         }

//         currentToList = getTeamToList (targetRoom.teams[teamName], shiftIndex)

//         if(!currentToList) {
//           errorList += `⚠️「${teamName}」チームに出勤の担当者が見つかりませんでした(^^;)。\n１．チームのTLさんとご調整お願い致します。\n２．ルーム概要にて${teamName}チーム設定のご編集をお願い致します。(please)\n`
//         }
        
//         finalToList += currentToList
//       }
      
//       return finalToList+errorList;
//     }





//     BotKun.prototype.cw_sendMessage = function (arrayOfSendParams){

//     }

//     BotKun.prototype.cw_sendMultipleMessages = function (arrayOfSendParams){

//     }

//     // BotKun.prototype._cw_sendAPIRequest = function (getPostOrPut, endOfUrl, payload = null, customHeaders = null) {
//     //   // url
//     //   let url = this.cwBaseUrl+endOfUrl
//     //   // make headers and add token
//     //   let headers = customHeaders ? customHeaders : {'Accept': 'application/json'};
//     //   headers['X-ChatWorkToken'] = this.cwToken;
//     //   let options = {
//     //     'method': getPostOrPut,
//     //     'payload': payload || {},
//     //     'headers': headers
//     //   }
//     //   return UrlFetchApp.fetch(url, options);
//     // }

//     BotKun.prototype.cw_rooms_getIdFlexibly = function (roomNameOrId, funcNameIfError) {

//       // check for number first, return truthy result
//       let roomId = typeof roomNameOrId === "number" ? roomNameOrId
//         : this.cw_rooms[roomNameOrId]?.id  //control the error triggering if room name is unvalid (see ? shorthand)
//       if (roomId) return roomId

//       // process errors
//       let roomList = '\n"'+ Object.keys(this.cw_rooms).sort().join('"\n"')+'"'
//       throw `"${funcNameIfError}" failure\n => Invalid Room Name : "${roomNameOrId}"\nAvailable room names below :\n${roomList}`
//     }

//     BotKun.prototype.cw_rooms_getById = function (roomId) {
//       for (let roomName in this.cw_rooms) {
//         if (this.cw_rooms[roomName].id == roomId) return this.cw_rooms[roomName]
//       }
//     }

//     BotKun.prototype.cw_rooms_getMembers = function (roomId) {
//       let params = this._cw_makeGetParams('rooms/'+roomId+'/members')
//       return JSON.parse(UrlFetchApp.fetch(params.url, params.options))
//     }

//     BotKun.prototype._cw_getDownloadUrl = function (roomId, dwnldId) {
//       let params = this._cw_makeGetParams('rooms/'+roomId+'/files/'+dwnldId+'?create_download_url=1')
//       try {
//         let resp = UrlFetchApp.fetch(params.url, params.options)
//         return JSON.parse(resp).download_url
//       } catch (err) {
//         console.log(err)
//       }
//     }

//     BotKun.prototype._cw_downloadFile = function (roomId, dwnldId) {
//       let dwnldUrl = this._cw_getDownloadUrl(roomId, dwnldId)
//       // return UrlFetchApp.fetch(dwnldUrl)
//     }

//     BotKun.prototype.cw_file_downloadArrayFromCsv = function (roomIdOrRoomName, dwnldId, characterEncoding = "shift-jis") {
//       let roomId = this.cw_rooms_getIdFlexibly (roomIdOrRoomName, "cw_file_downloadArrayFromCsv")
//       return Utilities.parseCsv(this._cw_downloadFile(roomId, dwnldId).getContentText(characterEncoding))
//     }

//     // Task Handler

//     BotKun.prototype.taskHandler_isTranslationTeam = function (teamName) {
//       for (member in this.members) {
//         if (this.members[member].group == '翻訳' && this.members[member].team == teamName){
//           return true
//         }
//       }
//       return false
//     }


//     return BotKun;
//   })();

//   global.BotKun = BotKun;

// })(this);


// /**
// * Creates a new botKun for the script
// * @param {object} api key, cache set up
// * @return {object} botKun object on which to call methods
// */
// function summon (params) {
//   console.warn('Summoning botKun')
//   console.time('botKun load')
//   let newBotKun = new BotKun (params)
//   newBotKun.cw_rooms_reload(false)
//   newBotKun.members_reload(false)
//   newBotKun.shiftReaderParams_reload(false)
//   console.warn('BotKun Summoned')
//   console.timeEnd('botKun load')
//   return newBotKun
// };

// /**
// * Logs basic help to use this library
// */
// function help () {
//   console.warn(`HELP: Initialisation
// Use code below to create a new instance of botKun.
// Copy-paste your Chatwork token to replace INSERT_YOUR_CW_TOKEN_HERE`)

//   console.log(` let magicIncantation = {
//     cache : {
//       cache : CacheService.getScriptCache(),  //the type of cache you would like to use
//       timeout : 3600                          //the number of seconds the cache should be kept (max 6h = 21600)
//     },
//     cw : {
//       token : INSERT_YOUR_CW_TOKEN_HERE       //insert your cw token here (mock example : 'uhua2k98y3yv2192gs')
//     }
//   }

//   let botKun = BotKun.summon(magicIncantation)
//   botKun.help()`)

//   console.warn('Detailed documentation : https://github.com/wo-tech/BotKun/blob/main/README.md')
// };

// /**
// * @private
// * Devs only. Automatically prints the template for markdown documentation based on prototypes of the object.
// * Copy paste to readme markdown file.
// * If to update current readme.md, just copy paste the generated table of content and target method section.
// */

// // function printDocumentationTemplate (){

// //   let dummyParams = {
// //     cache : {
// //       cache : null,  
// //       timeout : null                          
// //     },
// //     cw : {
// //       token : null       
// //     }
// //   }

// //   let instance = new BotKun(dummyParams)

// //   function createSectionTableOfContentLine (sectionName){
// //     return `  * [${sectionName.toUpperCase()}](#${sectionName})\n`
// //   }
// //   function createMethodTableOfContentLine (methodName){
// //     return `    + [.${methodName}](#${methodName})\n`
// //   }

// //   function createSectionContent (sectionName) {
// //     return `\n\n\n<br>\n\n## ${sectionName.toUpperCase()}\n\n> write section explanation here\n\n<br><br>\n\n`
// //   }
// //   function createMethodContent (methodName) {
// //     return `### .${methodName}\n\n> write explanation for ${methodName}\n\`\`\`js\n//comment\nbotkun.${methodName}()\n\`\`\`\n\n[Back to Table of Content](#BotKun-Library)\n\n<br><br>\n\n`
// //   }

// //   let fullArrayOfFunctions = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
// //   // gets rid of the 'constructor' prototype
// //   fullArrayOfFunctions.shift()

// //   let section = '';
// //   let docContent = '';
// //   let tableOfContent = '- [Methods](#methods)\n';

  
// //   for (let funcName of fullArrayOfFunctions) {

// //     // if it's a new section
// //     if (section !== funcName.split('_')[0]){
// //       section = funcName.split('_')[0];
// //       tableOfContent += createSectionTableOfContentLine(section);
// //       docContent += createSectionContent(section)
// //     }
    
// //     tableOfContent += createMethodTableOfContentLine(funcName);
// //     docContent += createMethodContent(funcName);
// //   }

// //   console.warn('Table of Content')
// //   console.log(tableOfContent)
// //   console.warn('Documentation Content')
// //   console.log(docContent)
// // }


