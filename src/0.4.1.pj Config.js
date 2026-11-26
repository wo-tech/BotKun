(function (global) {

  var PjConfig = (function () {

    function PjConfig(pjSpreadSheet, inheritedDocCache, cw_object) {
      const config = this
      const docCache = inheritedDocCache
      const cw = cw_object
      const ss = pjSpreadSheet

      const pjSettingsSheetName = '設定'
      const settingStartIndex = 3
      const templateSheetName = 'テンプレート'

      this.data

      // provide a force load if no cache was provided (project is loaded from a script unbound to a sheet)
      this.reload = function (forceLoad = true) {
        this.data = docCache ?
          docCache.optimize('pj_config', buildPjConfig, ss, forceLoad)
          : buildPjConfig(ss)
        console.warn(this.data.pjName + ' loaded!')
      }

      this.reload(false)

      this.loadSpreadSheet = function () {
        return SpreadsheetApp.openByUrl(config.data.url)
      }


      function buildPjConfig(ss) {
        console.log("【BotKun：buildPjConfig】PJのconfigを作成してみます");
        try {
          // return new PjConfigParams (pjConfigSheetData, templateHeaders, ssUrl)
          return new PjConfigParams(pjSpreadSheet)
        } catch (err) {
          // throw 'Error loading project : spreadsheet not valid, while cache is unaccessible'
          throw err
        }


        // config params constructor
        function PjConfigParams(pjSpreadSheet) {

          const config = this

          // store url to reload ss from cache
          this.url = pjSpreadSheet.getUrl()

          // TASKSHEET SETTINGS AND headers

          // get current sheet name and date for irai bango based on date
          let today = new Date()
          let year = today.getFullYear()
          let iraiYear = year.toString().slice(2, 4)
          let month = today.getMonth() + 1
          let monthWithZero = month < 10 ? "0" + month : month.toString()
          let day = today.getDate()
          let dayWithZero = day < 10 ? "0" + day : day.toString()

          this.currentSheetName = `${year}${monthWithZero}`
          this.iraiBangoDate = `${iraiYear}${monthWithZero}${dayWithZero}`

          // init ongoing sheet and create it if necessary
          // this.newSheetWasCreated will be used by the pj task sheet to use last month sheet for its data
          this.newSheetWasCreated = false
          let ongoingSheet = pjSpreadSheet.getSheetByName(this.currentSheetName)

          if (ongoingSheet === null) {
            let templateSheet = pjSpreadSheet.getSheetByName('テンプレート');
            pjSpreadSheet.insertSheet(this.currentSheetName, 1, { template: templateSheet });
            ongoingSheet = pjSpreadSheet.getSheetByName(this.currentSheetName);
            ongoingSheet.showSheet()
            this.newSheetWasCreated = true
          }

          // get headers
          this.currentHeaders = ongoingSheet.getRange(1, 1, 1, ongoingSheet.getLastColumn()).getValues().flat()

          let currentHeaders = this.currentHeaders
          function returnNullIfNotInHeaders(headerName) {
            return currentHeaders.includes(headerName) ? headerName : null
          }


          // PJ SETTINGS

          // load config sheet 
          let pjConfigSheet = pjSpreadSheet.getSheetByName(pjSettingsSheetName)
          // load config data
          let pjConfigSheetData = pjConfigSheet.getDataRange().getValues()
          // get rid of headers
          pjConfigSheetData.shift()

          // get pj name for on edit
          this.pjName = pjConfigSheetData[0][settingStartIndex] || null

          // get pj tanto
          this.pjTantos = pjConfigSheetData[1]
            .slice(settingStartIndex) // start from line 4
            .filter(member => member !== '') // get rid of empty entries

          // get roomname and teams array
          this.room = cw.rooms.safeGet(pjConfigSheetData[2][settingStartIndex])

          // categories and pjCode
          this.categories = pjConfigSheetData[4]
            .slice(settingStartIndex)
            .filter(categ => categ !== '')
          this.pjCodes = pjConfigSheetData[5]
            .slice(settingStartIndex)
            .filter(pjCode => pjCode !== '')


          // teams
          // extract both teams and headers
          this.roomTeams = pjConfigSheetData[7]
            .slice(settingStartIndex)
            .filter(roomTeam => roomTeam !== '')

          this.teamHeaders = pjConfigSheetData[8]
            .slice(settingStartIndex)
            .filter(teamHeaders => teamHeaders !== '')

          // construct file path if it was activated
          this.filePath = pjConfigSheetData[10][settingStartIndex] ?
            {
              colName: pjConfigSheetData[11][settingStartIndex],
              basePath: pjConfigSheetData[12][settingStartIndex]
            }
            : null

          // extract choyokei na otonarisan variables
          let extractHeaders = pjConfigSheetData[15]
            .slice(settingStartIndex, settingStartIndex + 5)

          this.extractHeaders = {
            status: returnNullIfNotInHeaders(extractHeaders[0]),
            taskNum: returnNullIfNotInHeaders(extractHeaders[1]),
            deadline: returnNullIfNotInHeaders(extractHeaders[2]),
            taskType: returnNullIfNotInHeaders(extractHeaders[3]),
            messUrl: returnNullIfNotInHeaders(extractHeaders[4])
          }

          //【26年6月30日その２】オ：もとはなんだったかよく覚えていないけど、とりあえずtenkaiTextとtenkaiTextSnsをpjConfigSheetから取得するでいいかな？
          //（他は一旦コメント化します！）

          // //【26年6月30日】オ：「依頼展開定型文」がないシートはエラーがすぐ出るので、緊急でこちらの追加させていただきました
          // if (!tenkaiTemplateSheet) {
          //   this.tenkaiText = pjConfigSheet.getRange('A2').getValue() || null
          //   this.tenkaiTextSns = pjConfigSheet.getRange('B2').getValue() || null
          // }
          // else {
          //   this.tenkaiText = tenkaiTemplateSheet.getRange('A2').getValue() || null
          //   this.tenkaiTextSns = tenkaiTemplateSheet.getRange('B2').getValue() || null
          //   if (!this.tenkaiText) return
          // }
          // TENKAI SETTINGS OPTIONS
          this.tenkaiText = pjConfigSheetData[0][0] !== '' ? pjConfigSheetData[0][0] : null
          if (!this.tenkaiText) return

          // get the automatic to
          this.tenkaiAutomaticTo = pjConfigSheetData[2][1]

          // get the variable to search
          // set the regex and array to process each variable
          let regVariableExtractor = /(?<={)([^{}]+)(?=})/g;
          this.variablesToSearch = this.tenkaiText.match(regVariableExtractor) || [];
        }
      }


      // checks all the values inside the config data, and returns an array of faulty keys
      this.check = async function () {

        console.log('updating values')

        this.reload()
        let data = this.data

        // load config sheet 
        let pjConfigSheet = ss.getSheetByName(pjSettingsSheetName)

        let response = {
          errors: [],
          newSheetCreated: data.newSheetWasCreated
        }

        function storeInErrors(problem, fixing) {
          response.errors.push(`⚠️${problem}\n⭕修正方法：\n${fixing}`)
        }

        function formatTitle(lineNumber, normalOrError = true) {
          let cellRef = 'C' + lineNumber
          let color = normalOrError ? '#073763' : 'red'
          pjConfigSheet.getRange(cellRef).setBackground(color)
        }

        // confront current headers and template headers
        let templateSheet = ss.getSheetByName(templateSheetName)
        let templateHeaders = templateSheet.getRange(1, 1, 1, templateSheet.getLastColumn()).getValues().flat()
        let mismatchHeaders = data.currentHeaders.filter(header => !templateHeaders.includes(header))
        if (mismatchHeaders.length > 1) {
          storeInErrors(
            `「${data.currentSheetName}」シートの次の列名が「テンプレート」シートにないようです：「${mismatchHeaders.join('」「')}」。`,
            `来月に不一致が起こらないように、「${data.currentSheetName}」の列名が「テンプレート」シートにも反映されているようにご修正ください。`
          )
        }

        // if project name is inexistent
        if (!data.pjName) {
          storeInErrors(
            'pj名が設定されていないようです。',
            'セル「D2」にてpj名をご記入ください。'
          )
          formatTitle(2, false)
        }
        else { formatTitle(2) }


        // update the member list rule
        //【2026年6月】更新しない問題を解決するため、ifの外に移動
        var memberListRule = SpreadsheetApp.newDataValidation()
          .requireValueInList(cw.members.printListOfNames())
          .build();
        pjConfigSheet.getRange('D3:O3').setDataValidation(memberListRule);

        // are all tantos registered in members ?
        let unfoundMembers = data.pjTantos.filter(memberName => !cw.members.safeGet(memberName))
        if (unfoundMembers.length > 0) {

          // push in error
          storeInErrors(
            `次のメンバーの名前が登録されていないようです：「${unfoundMembers.join('」「')}」。`,
            'セル「D3:O3」にて選択可能なメンバーのリストを更新しましたので、ご編集をお願いいたします。'
          )

          // erase invalid pjTantos from the data
          data.pjTantos = data.pjTantos.filter(tanto => !unfoundMembers.includes(tanto))

          formatTitle(3, false)
        }
        else { formatTitle(3) }


        // update the member list rule
        //【2026年6月】更新しない問題を解決するため、ifの外に移動
        var roomListRule = SpreadsheetApp.newDataValidation()
          .requireValueInList(cw.rooms.printListOfNames())
          .build();
        pjConfigSheet.getRange('D4').setDataValidation(roomListRule);

        // test room (null was returned if didn't exist during intialization)
        if (!data.room) {
          // push in error
          storeInErrors(
            `ルームの名前が正しくないため、チーム設定を最後まで確認・更新できませんし、自動展開もできません。`,
            'セル「D4」にて選択可能なルームのリストを更新しましたので、ご編集をお願いいたします。'
          )

          formatTitle(4, false)
        }
        // notify if no team was 
        else if (!data.room.teams) {
          // push in error
          storeInErrors(
            `ルームのチーム設定が登録されていないため、チーム設定を最後まで確認・更新できませんし、自動展開もできません。`,
            'セル「D4」にて正常なルーム名がセレクトされていることをご確認の上、ルーム概要にチームズの設定がされていることをお確かめください。'
          )
          formatTitle(4, false)
        }

        // if there was no problem with the room
        else {
          // validate it
          formatTitle(4)

          // and run teams checks based on it
          let registeredTeams = cw.members.getRegisteredTeamsList()
          // let notAddedTeams = Object.keys(data.room.teams)
          //   .filter(teamName => registeredTeams.includes(teamName)) // filter out teams not registered
          //   .filter(teamName => !data.roomTeams.includes(teamName)) //filter out teams that are present in the array

          // [9/1/25] 最近の調整による、このステップでチームとメンバーのデータが影響しあってバグを起すと思います
          let teamsInRoom = Object.keys(data.room.teams)
            .filter(teamName => registeredTeams.includes(teamName)) // filter out teams not registered

          console.log(teamsInRoom)

          let sameNumberOfTeams = teamsInRoom.length === data.roomTeams.length
          let sameTeams = !sameNumberOfTeams ?
            false
            : teamsInRoom
              .filter(teamName => !data.roomTeams.includes(teamName)).length === 0

          // if some teams registered in the room were not added, add them on the list and notify the user
          if (!sameTeams) {

            storeInErrors(
              `ルーム概要に登録されているチームの編集によって、「D９:O9」のリストに不一致があるかもしれません。`,
              '「D９:O9」のリストを更新いたしましたので、セル「D10:O10」にて「D９:O9」のリストの各チームに相当する列名をご記入ください'
            )

            pjConfigSheet.getRange('D9:O9').clearContent()
            pjConfigSheet.getRange(9, 4, 1, teamsInRoom.length).setValues([teamsInRoom])

            formatTitle(9, false)
          }
          else { formatTitle(9) }
        }


        // check for inconsitencies between categories and pjCodes
        if (data.categories.length === 0) {
          storeInErrors(
            `カテゴリーとPJコードが未記入のままになっています。`,
            'セル「D6:07」にて各カテゴリーの下にPJコードが記入されているようにご修正ください。\n（＊）同じPJコードを使用してもいいです。'
          )
          formatTitle(6, false)
          formatTitle(7, false)
        }
        else if (data.categories.length !== data.pjCodes.length) {
          storeInErrors(
            `カテゴリーとPJコードの数に不一致があります`,
            'セル「D6:07」にて各カテゴリーの下にPJコードが記入されているようにご修正ください。\n（＊）同じPJコードを使用してもいいです。'
          )
          let lineToFormat = data.categories.length > data.pjCodes.length ? 6 : 7
          formatTitle(lineToFormat, false)
        }
        else {
          formatTitle(6)
          formatTitle(7)
        }


        // teams
        // teamHeaders are actually present inside the current sheet
        let unfoundTeamHeaders = data.teamHeaders
          .filter(teamName => !data.currentHeaders.includes(teamName))
        if (unfoundTeamHeaders.length > 0) {

          storeInErrors(
            `セル「D10:O10」に記入されている列名の中で、「${unfoundTeamHeaders.join('」「')}」が「${data.currentSheetName}」シートの列にありませんでした。`,
            `セル「D10:O10」のご記入が「${data.currentSheetName}」シートの列名と不一致がないようご修正をお願いします。`
          )

          formatTitle(10, false)
        }
        else { formatTitle(10) }


        // check lenght of roomTeams vs TeamHeaders
        // if there are some non designated room teams
        if (data.roomTeams.length > data.teamHeaders.length) {

          let undesignatedRoomTeams = data.roomTeams
            .filter((roomTeam, index) => data.teamHeaders[index] === '')

          storeInErrors(
            `「${undesignatedRoomTeams.join('」「')}」は「D９:O9」のリストにあるのに、「D10:O10」に相当する列名が書いていないです。`,
            'セル「D10:O10」にて「D９:O9」のリストの各チームに相当する列名をご記入ください。'
          )

          formatTitle(10, false)
        }

        // if some headers were declared without corresponding room team
        else if (data.roomTeams.length < data.teamHeaders.length) {

          let undesignatedTeamHeaders = data.teamHeaders
            .filter((roomTeam, index) => data.roomTeams[index] === '')

          storeInErrors(
            `「${undesignatedTeamHeaders.join('」「')}」の列名は「D10:O10」に記入されていますが、「D９:O9」のリストに相当するチームがないです。`,
            'セル「D10:O10」にて「D９:O9」のリストの各チームに相当する列名をご記入ください。'
          )

          formatTitle(9, false)
        }

        else {
          formatTitle(9)
          formatTitle(10)
        }


        // check : filepath col name is in headers
        if (data.filePath && !data.currentHeaders.includes(data.filePath.colName)) {

          storeInErrors(
            `「${data.filePath.colName}」のファイルパスの列名は「${data.currentSheetName}」シートにありません。`,
            `セル「D13」のご記入が「${data.currentSheetName}」シートの列名と不一致がないようご修正をお願いします。`
          )

          formatTitle(13, false)
        }
        else { formatTitle(13) }


        // check otonari san headers (were returned null if unfound in headers)
        let unfoundExtractHeaders = Object.entries(data.extractHeaders)
          .filter(entry => entry[1] === null)
          .map(entry => entry[0])

        if (unfoundExtractHeaders.length > 0) {

          storeInErrors(
            `「${unfoundExtractHeaders.join('」「')}」に相当する列名は「${data.currentSheetName}」シートにありません。`,
            `セル「D17:H17」のご記入が「${data.currentSheetName}」シートの列名と不一致がないようご修正をお願いします。`
          )

          formatTitle(16, false)
        }
        else { formatTitle(16) }



        // continue if there's a tenkai bun
        console.log('standard update over')
        if (!data.tenkaiText) return response


        console.log('update tenkai bun')


        // update selectable headers

        // get current Headers, erase teams headers and 2dfy array
        let headers = data.currentHeaders
          .filter(el => !data.teamHeaders.includes(el))
          .map(filtered => ['{' + filtered + '}'])

        // add the pjCode option at the begginning of the array
        headers.unshift(['{PJコード}'])

        // add the team list at the begginning of the array
        headers.unshift(['{対象チームのリスト：【' + data.roomTeams.join('】【') + '】}'])

        // delete content
        pjConfigSheet.getRange('B7:B42').clearContent()

        // paste new content
        pjConfigSheet.getRange(7, 2, headers.length, 1).setValues(headers)


        // check if variablesToSearch match with headers
        let incorrectVariablesToSearch = data.variablesToSearch
          .filter(el => !data.currentHeaders.includes(el) && el !== 'PJコード' && el.slice(0, 2) !== '対象')

        if (incorrectVariablesToSearch.length > 0) {
          storeInErrors(
            `自動展開文：「{${incorrectVariablesToSearch.join('}」「{')}}」に相当する列名は「${data.currentSheetName}」シートにありません。`,
            `更新されたセル「B7:B42」のリストからコピペをください。`
          )
        }

        return response

      }


    };

    return PjConfig;
  })();

  global.PjConfig = PjConfig;

})(this);


function loadPjConfig_(pjSpreadSheet, inheritedDocCache, cw_object) {
  return new PjConfig(pjSpreadSheet, inheritedDocCache, cw_object)
};


