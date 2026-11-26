(function(global){

  var ChatWorkRooms = (function() {

    function ChatWorkRooms (cw_request, cw_members, cacheHandler)
    {
      const rooms = this
      const members = cw_members

      // loads stored rooms (or store them)
      // stored rooms are only public rooms
      rooms.stored = []
      rooms.reload = function (forceReload = true) {
        let key = 'cw_rooms'
        // rooms.stored = cacheHandler.optimize (key, buildRooms, null, forceReload) // see below for buildRooms
        rooms.stored = cacheHandler.optimize (key, _readAllRoomsFromSheet, null, forceReload) // see below for _readAllRoomsFromSheet
      }
      // load without forcing a reload
      rooms.reload(false)

      rooms.get = function (roomNameOrId) {
        for (room of rooms.stored) {
          if (roomNameOrId == room.name || roomNameOrId == room.id) return room
        }
        console.log(`【BotKun：rooms.get】"${roomNameOrId}"という部屋が見つかりませんでした：nullを返しました`)
        return null
      }

      // a room created recently might not be in cache
      rooms.safeGet = function (roomNameOrId, mustIncludeTeams = false) {
        let newRoom = rooms.get(roomNameOrId)
        if (newRoom && (mustIncludeTeams ? newRoom.teams : true)) return newRoom
        console.log(`Room with ref "${roomNameOrId}" ${mustIncludeTeams ? "(or its team settings)" : ""} unfound : reseting cache and searching again`)
        rooms.reload()
        let newAttempt = rooms.get(roomNameOrId)
        return mustIncludeTeams ? 
          newAttempt.teams ? newAttempt : null
          : newAttempt
      }

      rooms.printListOfNames = function () {
        return rooms.stored.map(room => room.name)
      }
      
      // fetch members inside room
      rooms.getAllMembers = function (roomNameOrId, safeGet = false) {
        let roomId = safeGet ? rooms.safeGet(roomNameOrId)?.id : rooms.get(roomNameOrId)?.id
        let fetch = cw_request.getFetch('rooms/'+roomId+'/members')
        return JSON.parse(fetch.getContentText())
      }

      rooms.getRegisteredMembers = function (roomNameOrId, safeGet = false) {
        console.log(`filtering only registered members from room ref ${roomNameOrId}`)
        return rooms
          .getAllMembers (roomNameOrId, safeGet)
          .map(cwMember => members.get(cwMember.account_id)) // run get from cw.members object 
          .filter(member => member) //non existing members will return null, and be filtered out
      }

      rooms.getPresentMembers = function (roomNameOrId, safeGet = false) {
        console.log(`filtering only present members from room ref ${roomNameOrId}`)
        return members.filterPresentOnly(rooms.getRegisteredMembers (roomNameOrId, safeGet))
      }

      // creation of teams out of registered members inside target room
      rooms.createTeamsFromRoomMembers = function (room, groupFilter = null) {

        // get members
        let targetMembers = rooms.getRegisteredMembers (room.id)

        // filter them
        targetMembers = groupFilter ? 
          members.byGroups(groupFilter, targetMembers) 
          : targetMembers
        
        // get out if nothing
        if(targetMembers.length === 0) return null

        // store members by teams
        return targetMembers.reduce(
          (teamsObject, member) => {

            // do main teams
            if (!teamsObject[member['チーム']])  teamsObject[member['チーム']] = []
            teamsObject[member['チーム']].push(member)

            // check for sub teams
            if (!member['サブチーム']) return teamsObject

            // deal with sub team if any
            if(!teamsObject[member['サブチーム']])  teamsObject[member['サブチーム']] = []
            teamsObject[member['サブチーム']].push(member)
            return teamsObject

          },{})
      }

      // creation of teams out of registered members inside target room
      rooms.createTeamFromTLs = function (teamNames) {

        let concerned = members.byTeams(teamNames)
        let targetMembers = members.filterPresentOnly(concerned)
        
        // get out if nothing
        if(targetMembers.length === 0) return null


        return targetMembers.reduce(
          (resultObj, currMember) => {
            if (!resultObj[currMember['チーム']]) resultObj[currMember['チーム']] = {tl: false, team: []}

            if (currMember['ポジション'] === 'TL') {
              resultObj[currMember['チーム']].tl = true
              resultObj[currMember['チーム']].team = [currMember]
              return resultObj
            }

            if (resultObj[currMember['チーム']].tl) return resultObj

            resultObj[currMember['チーム']].team.push(currMember)
            return resultObj
          },{}
        )
      }

      rooms.createTeamsDescription = function (room, groupFilter = null) {

        console.warn(`Creating teams description for room "${room.name}"`)
        let projectTeams = rooms.createTeamsFromRoomMembers (room, groupFilter)
        if (!projectTeams) return `⚠️このルームに${groupFilter ? `「${groupFilter}」グループに所属する`: ''}メンバーが見つかりませんでした。\nメンバーをルームに追加してからやり直してください。`

        let teamDescription = '[hr]チームズ[hr]\n\n'
        let mainTanto;

        for (let team in projectTeams) {
          teamDescription += `[info][title]${team}[/title]`
          mainTanto = projectTeams[team].shift()
          teamDescription += `[code]メイン担当[/code][To:${mainTanto['CW_ID']}]${mainTanto.cw_name}\n`
          // put all members left inside the fukutantos
          teamDescription += projectTeams[team].length > 0 ? 
            `[code]副担当[/code]${projectTeams[team].map(member => `[To:${member['CW_ID']}]${member.cw_name}`).join('\n')}[/info]\n\n`
            :'[/info]\n\n'
        }

        return teamDescription
      }

      rooms.createTeamsDescription = function (room, groupFilter = null) {

        console.warn(`Creating teams description for room "${room.name}"`)
        let projectTeams = rooms.createTeamsFromRoomMembers (room, groupFilter)
        if (!projectTeams) return `⚠️このルームに${groupFilter ? `「${groupFilter}」グループに所属する`: ''}メンバーが見つかりませんでした。\nメンバーをルームに追加してからやり直してください。`

        let teamDescription = '[hr]チームズ[hr]\n\n'
        let mainTanto;

        for (let team in projectTeams) {
          teamDescription += `[info][title]${team}[/title]`
          mainTanto = projectTeams[team].shift()
          teamDescription += `[code]メイン担当[/code][To:${mainTanto['CW_ID']}]${mainTanto.cw_name}\n`
          // put all members left inside the fukutantos
          teamDescription += projectTeams[team].length > 0 ? 
            `[code]副担当[/code]${projectTeams[team].map(member => `[To:${member['CW_ID']}]${member.cw_name}`).join('\n')}[/info]\n\n`
            :'[/info]\n\n'
        }

        return teamDescription
      }

      // CREATE NEW ROOM
      rooms.create = async function (roomName, adminsIdsArr, description) { 

        let headers = {
          'Accept': 'application/json',
          'content-type': 'application/x-www-form-urlencoded'
        }

        // add bot id inside the request
        // not doing so will trigger an error
        adminsIdsArr.push(
          JSON.parse(cw_request.getFetch('me').getContentText()).account_id
        )

        let payload = {
          link: '0',
          link_need_acceptance: '0',
          name: roomName,
          members_admin_ids: adminsIdsArr.join(','),
          description: description
        }

        async function returnRoomId () {
          return cw_request.postFetch ('rooms', payload, headers)
        }

        return await returnRoomId()
      }


      rooms.getTeamsTos = function (roomNameOrId, targetTeams = true) {
        // get the teams of the room
        let targetRoom = rooms.safeGet(roomNameOrId, true)
        if (!targetRoom || !targetRoom.teams) return "自動Toリストが作れずに終わりました。\n（原因：１．対象ルームに「システム部」が追加されていない、および２．対象ルームの概要にチームズの設定が不正常である）\n\n"

        // target all teams of the room if no argument was provided
        if(targetTeams === true) targetTeams = Object.keys(targetRoom.teams)

        // calculate now to use during getTeamToListIteration
        // let shiftIndex = members.getShiftIndex()

        // declare evovling variables
        let teamResult, successArray = [], failedTeams = []

        for (let teamName of targetTeams) {
          teamResult = getTeamToList (targetRoom.teams[teamName])
          if (teamResult) {
            successArray.push(teamResult)
          }
          else {
            failedTeams.push(teamName)
          }
        }

        let resultList = successArray.length > 0 ?
          successArray.map(teamArray => {
            return teamArray.map(member => `[To:${member['CW_ID']}]${member.cw_name}`).join('\n')
          }).join('\n') + '\n'
          : '普通の担当のリストの中で出勤のどなたでも見つかりませんでした。\n'
          
        if (failedTeams.length === 0) return resultList + '\n'

        // if some teams did not have any registered member present today
        // get all present members inside the room
        let presentMembersInRoom = rooms.getPresentMembers (roomNameOrId)
        // and try to find some other members of these teams that
        let fallBackMembers
        for (teamName of failedTeams) {
          fallBackMembers = members.byTeams(teamName, presentMembersInRoom)
          resultList += fallBackMembers ?
            `⚠️${teamName}チームの担当の中でどなたも見つかりませんでしたので、今日出勤のメンバー、ご調整お願いいたします(bow)：${fallBackMembers.map(member => `[To:${member['CW_ID']}]`).join('')}\n`
            : `⚠️「${teamName}」チームの中で今日出勤の方どなたも見つかりませんでした(^^;)、お助けをお願いいたします(bow)\n`
        }
        return resultList + '\n'
        

        function getTeamToList (team2dArray) {

          // avoid teams input that are not correct
          if (!team2dArray) return null

          // evolving variables
          let result

          // the loop iterates through priority arrays of members
          // the first array that held present members will be returned, until exhaustion of the arrays
          for (let priorityArray of team2dArray){

            result = members.filterPresentOnly(
              members.getFromArrayOfIds(priorityArray)
            )

            if (result && result.length > 0) return result
          }

          // if the loop did not find anything
          return null
        }

      }

      // ...
      // UTILITY
      // ...
      /**
       * 「ボットマスターデータ」シートにある情報を直接アクセスし読み込む
       */
      function _readAllRoomsFromSheet() {
        let dataSS = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/BOT_MASTER_DATA_SPREADSHEET_ID/");
        let roomStrings = dataSS.getSheetByName("CW部屋データ").getRange("A3:A").getValues();

        roomStrings = roomStrings.filter(row => row[0] != "");  // 空の行を除外する

        //TODO Try/Catchでやってもいいかもしれない
        console.log("【BotKun：_readAllRoomsFromSheet】部屋の読み取り、パースを開始します");
        let parsedRooms = roomStrings.map(roomString => JSON.parse(roomString[0]));

        console.log("【BotKun：_readAllRoomsFromSheet】部屋の読み取り、パースが完了しました");
        // console.log(parsedRooms[1]);
        return parsedRooms;
      }

      /**
       * roomsにあるデータを
       */
      //[3/6/26] オ：ここでマスターデータを触るのはよくないかもしれないので、この辺を削除してもいいかな
      // function _refreshRoomTeams(pjRoom) {
      // Testing in TEST_PROJECT
      rooms.refreshRoomTeams = function (pjRoom) {
        if (pjRoom == false)
          return console.log("【BotKun：rooms.refreshRoomTeams】部屋が存在しないようです。「ボットマスターデータ」を確認・更新してください");

        let roomFetch = cw_request.getFetch('rooms/' + pjRoom.id);
        let roomData = JSON.parse(roomFetch.getContentText("shift-jis"));

        //！！どのボットがアクセスしたかによって「botCanChange」が違うかもしれません
        let newRoomObject = new Room(roomData);


        // テキストの比較は簡単なので、一旦データをstringに変更する
        let newTeamsData = JSON.stringify(newRoomObject.teams);
        let oldTeamsData = JSON.stringify(pjRoom.teams);
        console.log("【BotKun：rooms.refreshRoomTeams】\n"+newTeamsData+"\n"+oldTeamsData);

        if (newTeamsData == false || oldTeamsData == false)
          return console.log("【BotKun：rooms.refreshRoomTeams】不正なデータがあるかご確認をお願いします：\n" + newTeamsData + "\n\n" + oldTeamsData);

        if (newTeamsData != oldTeamsData) {
        // if (true) {  // テスト用
          console.log("【BotKun：rooms.refreshRoomTeams】「" + pjRoom.name + "」の部屋情報を更新します");

          let dataSS = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/BOT_MASTER_DATA_SPREADSHEET_ID/");
          let roomDataRange = dataSS.getSheetByName("CW部屋データ").getRange("A3:A");
          let roomData = roomDataRange.getValues();

          let updatedRoomIndex = -1;

          for (let i = 0; i < roomData.length; i++) {
            // 万が一似ているIDがあれば「"id":＊＊＊,」で探す
            if (roomData[i][0].includes(`"id":`+pjRoom.id+`,`)) {
              console.log("【BotKun：rooms.refreshRoomTeams】古いデータを見つけました：\n" + oldTeamsData + "\n\n最新データで置き換えます：\n" + newTeamsData);
              roomData[i][0] = JSON.stringify(newRoomObject);
              updatedRoomIndex = i;
              break;
            }
          }

          roomDataRange.setValues(roomData);

          let updateTimeStamp = roomDataTab.getRange(3, 15, updatedRoomIndex, 1);
          updateTimeStamp.setValue([new Date()]);

          console.log("【BotKun：rooms.refreshRoomTeams】「" + pjRoom.name + "」の部屋情報を更新しました");
        }
        else {
          return console.log("【BotKun：rooms.refreshRoomTeams】シートにある「" + pjRoom.name + "」の部屋情報は更新する必要がないようです");
        }

        //！！単純にreloadでキャッシュを更新するとSpreadsheetのアクセスが重複する（問題ないと思うけど、ちょっと無駄です）
        rooms.reload();
      }

      //TODO コマンドで部屋のリフレッシュでもいいかもしれません
      //↓ 全部をリフレッシュするより、多くの場合は一つだけで十分なので、特定の部屋をリフレッシュする関数が必要
      //＊＊削除待ち＊＊
      //！！「ボットマスターデータ」に移動：https://script.google.com/u/0/home/projects/SCRIPT_ID/edit（2025年8月）
      // rooms.fetchAllRooms = function () {
      //   let allRoomsFetch = cw_request.getFetch('rooms/')
      //   let allRooms = JSON.parse(allRoomsFetch.getContentText())

      //   let fetchAllPublicRoomsUrls = allRooms
      //     .filter(room => room.type === 'group') // 個人の部屋などを除外する
      //     .map(room => 'rooms/' + room.room_id)  // FetchのURLの後半部分を作成する

      //   let publicRooms = cw_request
      //     .getFetchAll(fetchAllPublicRoomsUrls)
      //     .map(resp => JSON.parse(resp.getContentText("shift-jis"))) // CWから貰った各responseをパースしてみる
      //     //TODO Try/Catchを使ってもいいかもしれない（2025年8月）

      //   return publicRooms.map(room => new Room (room))

      //！！「ボットマスターデータ」と重複している
      function Room (roomObject) {
        this.name = roomObject.name
        this.id = roomObject.room_id
        this.botCanChange = roomObject.role === 'admin'
        let teamsSettings = new TeamsSetting (roomObject.description)
        if (teamsSettings.configNotFound) return
        // console.log("【"+this.name+"】読み込まれたチームのリストは：\n"+Object.keys(teamsSettings));
        this.teams = teamsSettings
      }

      //！！「ボットマスターデータ」と重複している
      // 部屋の概要欄にある「チームズ」のテキストで言語チームの情報をパースする
      function TeamsSetting(roomDescription) {

        // 「チームズ」（[hr]）のヘッダーがなければreturnする
        let teamsDescrStr = roomDescription.match(/(?<=チームズ\[hr\])([\S\s]+)/g);
        if (!teamsDescrStr) {
          this.configNotFound = true;
          return;
        }
        else { teamsDescrStr = teamsDescrStr[0]; }

        // 各言語の枠（[info]）で配列を分割する　＊最初の部分は切れ捨てる
        let teamsArr = teamsDescrStr.split('[info]');
        teamsArr.shift();

        // 枠内の担当情報（[code]）で一つの配列でまとめる
        teamsArr = teamsArr.map(str => str.split('[code]'));

        // arr[n][0]は各チームの名前なので、それを切り取って新しい配列を作る
        let teamNames = teamsArr.map(el => el.shift().replace('[title]', '').replace('[/title]', ''));

        // CWのIDで十分なので、それだけ残す ＊2次元配列なのでMapの中でMapを使う
        teamsArr = teamsArr.map((teamEl) => {
          return teamEl.map((tantoStr) => {
            return tantoStr.match(/(?<=(\[To:))[0-9]+/g);
          });
        })

        // TeamSettingのオブジェクトは「チーム名（キー）：IDの配列（値）」で作成する
        for (let i = 0; i < teamNames.length; i++) {
          this[teamNames[i]] = teamsArr[i];
        }
      }
    };

    return ChatWorkRooms;
  })();

  global.ChatWorkRooms = ChatWorkRooms;

})(this);


function loadChatWorkRooms_ (cw_request, cw_members, cacheHandler) {
  return new ChatWorkRooms (cw_request, cw_members, cacheHandler)
};


