(function(global){

  var ChatWorkMembers = (function() {

    function ChatWorkMembers (params_members, cw_request, cacheHandler)
    {
      const members = this

      // ⚠️possible points of failure if header change⚠️
      const nameHeader = '呼び方',
            // shiftNameHeader = 'シフト名',
            cwIdHeader = 'CW_ID',
            groupHeader = 'グループ', 
            teamHeader = 'チーム',
            subTeamHeader = 'サブチーム',
            positionHeader = 'ポジション',
            workStatus = '出勤設定', //【2025/10/10】オ：出勤チェックでは必要なので、また追加しました
            isWorking = '出勤中'
            //sectionHeader = '所属部署'【2026/10/2】追加予定

      // store spreadsheets urls for reloads 
      members.params = params_members

      // loads stored members (or store them)
      members.stored = []
      // members.shiftParams = {}

      members.reload = function (forceReload = true) {

        // load members
        let memberKey = 'cw_members'
        members.stored = cacheHandler.optimize (memberKey, buildMembers, members.params, forceReload) // see below for buildMembers

        // [10/3/2025] 出勤情報はシフト表で管理しているし、既にTRUE・FALSEで確認できる
        // load shift parameters used for checking presence
        // let shiftParamsKey = 'shift_parameters'
        // members.shiftParams = cacheHandler.optimize (shiftParamsKey, buildShiftReader, members.params, forceReload) // see below for buildShiftReader

      }
      // load without forcing a reload
      members.reload(false)

      members.printListOfNames = function (membersArray = members.stored) {
        return membersArray.map(member => member[nameHeader])
      }

      members.get = function (memberNameOrId) {
        for (let member of members.stored) {
          // console.log(`Searching for "${memberNameOrId}", current ID: ${member[cwIdHeader/**⚠️**/]}`)
          if (memberNameOrId == member[nameHeader/**⚠️**/] || memberNameOrId == member[cwIdHeader/**⚠️**/]) return member
        }
        console.log(`member with ref "${memberNameOrId}" not found : returned null`)
        return null
      }

      // a member added recently might not be in cache
      members.safeGet = function (memberNameOrId) {
        let newMember = members.get(memberNameOrId)
        if (newMember) return newMember
        console.log(`Member with ref "${memberNameOrId}" unfound : reseting cache and searching again`)
        members.reload()
        return members.get(memberNameOrId)
      }

      // is used to define the get functions below
      // prefer using the functions below rather than this
      // to control the possible points of failures inside this file only
      members.filter = function (headerName, headerValues, membersArrayToFilter = members.stored) {
        let result = JSON.parse(JSON.stringify(membersArrayToFilter)) // create a deep copy of the stored array to avoid unwanted changes
            .filter(member => headerValues.includes(member[headerName]))
        if (result.length > 0) return result
        console.warn(`Searches for "${typeof headerValues === "string" ? headerValues : headerValues.join(' / ')}" inside header "${headerName}" did not return any result\nReturning null`)
        return null
      }

      // also accepts single values
      members.byTeams = function (teamNames, membersArrayToFilter) {
        return members.filter(teamHeader/**⚠️**/, teamNames, membersArrayToFilter)
      }

      // also accepts single values
      members.byGroups = function (groupNames, membersArrayToFilter) {
        return members.filter(groupHeader/**⚠️**/, groupNames, membersArrayToFilter)
      }

      // also accepts single values
      members.byPositions = function (positionNames, membersArrayToFilter) {
        return members.filter(positionHeader/**⚠️**/, positionNames, membersArrayToFilter)
      }

      members.getShiftIndex = function (targetDate = new Date()){
        // make sure it is a valid date in the first place
        if (!(targetDate instanceof Date)) throw 'Invalid date for presence check : not a javascript date'

        let today = new Date()

        // actual calculation of the index
        let shiftStartDay = new Date (today.getFullYear(), today.getMonth(), 1)
        let searchShiftIndex = Math.floor((targetDate - shiftStartDay) / (1000*60*60*24))

        // get rid of negative indexes
        if (searchShiftIndex < 0) throw 'Invalid date for presence check : preceding current month'

        // get rid of indexes exceeding shift length
        // search for the first member to have a valid shift, check the condition and leave
        for (let member of members.stored) {
          if (member.shift.length === 0) continue
          if (searchShiftIndex > member.shift.length) throw 'Invalid date for presence check : exceeding available shift data'
          break
        }

        return searchShiftIndex
      }


      members.isPresent = function (member) {
        // return members.shiftParams.presenceInputs.includes(member[workStatus])
        //【注意】現在は「TRUE」か空の文字列かになる（空の文字列はFALSEとして扱われるので問題ないはず）
        return member[isWorking];
      }

      members.filterPresentOnly = function (arrayOfMembers) {
        if (!Array.isArray(arrayOfMembers)) return null

        return JSON.parse(JSON.stringify(arrayOfMembers)) // create a deep copy
            .filter(member => {
              return members.isPresent(member);
            })
      }


      // function specifically used for jido To
      members.getFromArrayOfIds = function (arrayOfIds) {
        arrayOfIds = arrayOfIds.map(id => parseInt(id,10))
        return JSON.parse(JSON.stringify(members.stored)) // create a deep copy of the stored array to avoid unwanted changes
            .filter(member => arrayOfIds.includes(member[cwIdHeader]))
      }
      

      members.getRegisteredTeamsList = function (...groupNamesIfAny) {

        // needs to take all groups if no arg was provided
        let checkFunction
        if (groupNamesIfAny?.length>0) {
          checkFunction = groupHeaderValue => groupNamesIfAny.includes(groupHeaderValue)
        }
        else { checkFunction = groupHeaderValue => true }

        let teamsList = []

        for (let member of members.stored) {
          
          if (checkFunction(member[groupHeader/**⚠️**/])){

           if(member[teamHeader/**⚠️**/] && !teamsList.includes(member[teamHeader/**⚠️**/])){
            teamsList.push(member[teamHeader/**⚠️**/])
           }

           if(member[subTeamHeader/**⚠️**/] &&!teamsList.includes(member[subTeamHeader/**⚠️**/])){
            teamsList.push(member[subTeamHeader/**⚠️**/])
           }

          }
        }

        return teamsList
      }


      // ***
      // Build functions
      // ***

      function buildMembers(params_members) {

        let today = new Date()

        // PHASE 1 : CONSTRUCT THE MEMBERS OBJECT USING DATA SHEET
        // データシートを使用してメンバーオブジェクトを構築する

        // load member data
        let memberDataSheet = SpreadsheetApp.openByUrl(params_members.dataSsUrl).getSheetByName('メンバーデータ')
        // SpreadsheetApp.flush(); //[10/6/25] 時々前の日のデータが読み取られるので、これで解決かな？
        // [3/3/26] オ：スクリプトの実行者は編集許可がないとエラーがでるので削除します。そもそも更新方法は変わったのでこちらは不要になったかと
        let memberData = memberDataSheet.getDataRange().getValues()

        // get headers
        let headers = memberData.shift()

        // member builder
        function Member(memberRow) {
          // loops over every header and assigns it as a property
          // allows to adapt rather swiftly to a change of header names, or addition of new headers
          for (let header of headers) {
            this[header] = memberRow[headers.indexOf(header)] || null
          }
          // will be populated by assignShiftData
          // this.shift = []
        }

        // first build of the array of members
        let builtMembers = memberData.map(memberRow => new Member(memberRow))

        // PHASE 2 : get all contacts and assign privateRoom and cw_name to members
        // すべての連絡先を取得し、メンバーに privateRoom と cw_name を割り当てます

        let cwContactsFetch = JSON.parse(cw_request.getFetch('contacts').getContentText())
        function getCorrespondingContact(id) {
          for (let el of cwContactsFetch) {
            if (el.account_id === id) return el
          }
          return null
        }

        console.log('entering loop')
        for (let [line, member] of builtMembers.entries()) {
          tempMember = getCorrespondingContact(member[cwIdHeader])
          if (!tempMember) {
            console.warn(`${member[nameHeader]}'s id not found in cw contact fetch`)
            memberDataSheet.getRange(line + 2, headers.indexOf(cwIdHeader) + 1).setBackground('red')
            continue
          }
          member.cw_name = tempMember.name
          member.direct_room = tempMember.room_id
        }

        //     { account_id: 1234567,
        // room_id: 123456789,
        // name: 'DISPLAY NAME',
        // chatwork_id: 'chatwork_id',
        // organization_id: 1234567,
        // organization_name: 'ORGANIZATION NAME',
        // department: '',
        // avatar_image_url: 'https://appdata.chatwork.com/avatar/XXXXXXXXXX.rsz.jpg' }

        // [7/7/25] オ：シフトは「今日の分」に制限しましたので、こういう読みとりは不要になりました
        //＊＊＊削除待ち＊＊＊
        // PHASE 3 : USE THE SHIFT SPREADSHEET TO ASSIGN SHIFTS TO MEMBERS
        // シフトスプレッドシートを使用してメンバーにシフトを割り当てます

        // // // load all sheets from shift ss and their names
        // let shiftSheets = SpreadsheetApp.openByUrl(params_members.shiftSsUrl).getSheets()
        // let sheetNames = shiftSheets.map(sheet => sheet.getName())

        // // get current month data 
        // let currentMonthSheetName = `${today.getFullYear()}年${today.getMonth() + 1}月`
        // let currentMonthData = shiftSheets[sheetNames.indexOf(currentMonthSheetName)].getDataRange().getValues()
        // let thisMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

        // // assign current month to builtMembers (assignShifts() defined below)
        // assignShifts(builtMembers, currentMonthData, thisMonthDays, currentMonthSheetName)

        // // // is next month sheet unavailable ? return
        // let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        // let nextMonthSheetName = `${nextMonth.getFullYear()}年${nextMonth.getMonth() + 1}月`
        // if (sheetNames.indexOf(nextMonthSheetName) === -1) return builtMembers

        // // or do the same with next month data, and return
        // let nextMonthData = shiftSheets[sheetNames.indexOf(nextMonthSheetName)].getDataRange().getValues()
        // let nextMonthDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
        // assignShifts(builtMembers, nextMonthData, nextMonthDays, nextMonthSheetName)
        return builtMembers

        // // ...
        // // UTILITY
        // // ...

        //＊＊＊削除待ち＊＊＊
        // assign shifts from each member array to corresponding member
        // function assignShifts(membersArray, shiftData, numOfDays, shiftName) {

        //   // declare general extraction variables for the shifts
        //   let shiftStartRowInd = 25 // オ：合っていないのかな？今は28?
        //   let memberNameColInd = 3
        //   let shiftStartColInd = 9


        //   // get rid of useless data to accelerate process
        //   shiftData.splice(0, shiftStartRowInd)

        //   // create blank arrays for members that weren't found in current shift
        //   // not performance heavy, so favor readability to nested if statements inside the loop
        //   // メンバーが見つからない場合は空のシフトを入れるので、空のシフトを作る
        //   // let blankArray = Array(numOfDays);
        //   let blankArray = Array(1);
        //   blankArray.fill('');
        //   // let blankArray = [];
        //   // for (let i = 0; i < numOfDays; i++) { blankArray.push('') }

        //   // init member found : useful to run assignShift over multiple shift sheets
        //   let memberFound = false

        //   // オ：今日だけのデータで十分かどうか試してみたい
        //   let todayIndex = today.getDay() + 1; 

        //   // run through all members
        //   for (let member of membersArray) {

        //     memberFound = false

        //     findMemberShift:
        //     for (let memberRow of shiftData) {
        //       if (memberRow[memberNameColInd] === member[shiftNameHeader]) {

        //         // push the appropriate slice
        //         member.shift.push(memberRow.slice(shiftStartColInd, numOfDays + shiftStartColInd))
        //         // オ：今日の情報だけでいいかな？
        //         // member.shift.push(memberRow.slice(shiftStartColInd, todayIndex + shiftStartColInd))
        //         // flatten to allow for multiple use of assign shift (current month + next month)
        //         member.shift = member.shift.flat()

        //         memberFound = true;
        //         break findMemberShift;
        //       }
        //     }

        //     if (memberFound) continue
        //     // add blank array if wasn't found
        //     console.warn(`"${member[shiftNameHeader]}" was not found in the shift ${shiftName}`)
        //     member.shift.push(blankArray)
        //     member.shift = member.shift.flat()
        //   }

        //   // run a counter check :
        //   // are all members seen in the shift actually registered in the members data ?
        //   runThroughShift:
        //   for (let memberRow of shiftData) {
        //     for (member of membersArray) {
        //       if (memberRow[memberNameColInd] === '' || memberRow[memberNameColInd] === member[shiftNameHeader]) continue runThroughShift
        //     }
        //     console.warn(`"${memberRow[memberNameColInd]}" in shift ${shiftName} was not found in member data\nFix it here: ${params_members.dataSsUrl}`)
        //   }
        // }
      }

      // presence Reader
      // Loads the array for presence marks
      // [10/3/2025] シフト表で処理するので、こちらは必要ない
      // function buildShiftReader (params_members) {

      //   let rawArr = SpreadsheetApp
      //                     .openByUrl(params_members.shiftSsUrl)
      //                     .getSheetByName('シフト設定')
      //                     .getDataRange()
      //                     .getValues()

      //   // get rid of headers
      //   rawArr.shift()
        
      //   // get user input that will be considered as presence
      //   let presenceInputs = rawArr.filter(row => row[2]).map(row => row[0]).flat();
      //   // get the status that can be checked when 
      //   let correspondingStatus = []
      //   correspondingStatus.push(
      //     rawArr.map(row => row[0]).flat(),
      //     rawArr.map(row => row[1]).flat())

      //   return {
      //     presenceInputs,
      //     correspondingStatus
      //   }

      // }

    };

    return ChatWorkMembers;
  })();

  global.ChatWorkMembers = ChatWorkMembers;

})(this);


function loadChatWorkMembers_ (params_members, cw_request, cacheHandler) {
  return new ChatWorkMembers (params_members, cw_request, cacheHandler)
};


