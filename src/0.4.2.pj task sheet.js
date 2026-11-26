(function(global){

  var TaskSheet = (function() {

    function TaskSheet (pj_config)
    {
      const taskSheet = this
      const config = pj_config

      // task unit
      const Task = function (taskRow) {

        const task = this

        this.status = taskRow[config.data.currentHeaders.indexOf(config.data.extractHeaders.status)]
        this.taskNum = taskRow[config.data.currentHeaders.indexOf(config.data.extractHeaders.taskNum)]
        this.deadline = taskRow[config.data.currentHeaders.indexOf(config.data.extractHeaders.deadline)]
        this.taskType = taskRow[config.data.currentHeaders.indexOf(config.data.extractHeaders.taskType)]
        this.pjCode = config.data.categories.includes(this.taskType) ? 
          config.data.pjCodes[config.data.categories.indexOf(this.taskType)]
          : null
        this.messUrl = taskRow[config.data.currentHeaders.indexOf(config.data.extractHeaders.messUrl)]
        this.tanto = taskRow[0]

        // get teams
        this.teams = {}
        for (let i = 0; i < config.data.roomTeams.length; i++) {
          this.teams[config.data.roomTeams[i]] = taskRow[config.data.currentHeaders.indexOf(config.data.teamHeaders[i])]
        }
        
        this.rawArray = taskRow

      }

      // get tasks data (with filtering options)
      this.buildTasks = function (arrayOfTasks) {
        return arrayOfTasks.map(taskRow => new Task(taskRow))
      }

      this.loadSheet = function (sheetName = config.data.currentSheetName) {
        // load spreadsheet
        let ss = config.loadSpreadSheet()

        // get out if the sheet did not exist
        return ss.getSheetByName(sheetName)
      }

      this.loadSheetData = function (sheetName = config.data.currentSheetName) {

        // get out if the sheet did not exist
        let sheet = taskSheet.loadSheet(sheetName)
        if(!sheet) return sheet

        // process if it did
        let fullData = sheet.getDataRange().getValues()
        if(!fullData) return fullData
        // get rid of headers
        fullData.shift()
        return fullData
      }

      this.getAllTasks = function () {
        return taskSheet.loadSheetData().map(taskRow => new Task(taskRow))
      }

      this.getOngoingTasks = function (getNLatestTasks) {
        let statusIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.status)
        let taskRefIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.taskNum)

        if (statusIndex === -1) throw 'Impossible to get Ongoing tasks : col name for status in PJ config is invalid'
        let isOngoing = task => task[taskRefIndex] !== '' && !task[statusIndex].includes('完')
        let tasks = taskSheet.loadSheetData()
                .filter(task => isOngoing(task))
                .map(taskRow => new Task(taskRow))
        return getNLatestTasks < tasks.length ? 
          tasks.slice(-getNLatestTasks)
          : tasks
      }

      this.getOngoingTasksCreatedToday = function (getNLatestTasks) {

        let statusIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.status)
        let taskRefIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.taskNum)
        if (taskRefIndex === -1 || statusIndex === -1) throw 'Impossible to get Ongoing tasks : col name for task reference or status in PJ config is invalid'

        // filtering function
        let isOngoing = task => task[taskRefIndex] !== '' && !task[statusIndex].includes('完')
        let wasCreatedToday =  taskRow => taskRow[taskRefIndex].includes(config.data.iraiBangoDate)
        let todayArray = taskSheet.loadSheetData().filter(task => wasCreatedToday(task) && isOngoing(task))
        return getNLatestTasks < todayArray.length ? 
          todayArray.slice(-getNLatestTasks).map(taskRow => new Task(taskRow))
          : todayArray.map(taskRow => new Task(taskRow))
      }


      this.actualizeNewSheet = function () {

        console.warn('Actualizing new sheet data!')
        // create last month sheet name
        let lastMonth = new Date (new Date().getFullYear(), new Date().getMonth(), 0)
        let year = lastMonth.getFullYear()
        let month = lastMonth.getMonth()+1
        let monthWithZero = month < 10 ? "0" + month : month.toString()
        let lastMonthSheetName = `${year}${monthWithZero}`

        // try to load sheet
        let lastMonthSheet = taskSheet.loadSheet(lastMonthSheetName)
        if (!lastMonthSheet) {
          console.warn('Looks like there was not a previous sheet, this means it is a new project.\nUpdate canceled')
          return
        }

        // hide it, you don't want the user to keep on using it
        lastMonthSheet.hideSheet()

        // get data without headers
        let lastMonthSheetData = lastMonthSheet.getDataRange().getValues()
        lastMonthSheetData.shift()

        // load data and getOngoingTasks
        let statusIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.status)
        if (statusIndex === -1) throw 'Impossible to get Ongoing tasks : col name for status in PJ config is invalid'

        let taskRefIndex = config.data.currentHeaders.indexOf(config.data.extractHeaders.taskNum)
        let isOngoing = task => task[taskRefIndex] !== '' && !task[statusIndex].includes('完')
        let lastMonthTasks = lastMonthSheetData
                .filter(task => isOngoing(task))
        
        if (lastMonthTasks.length === 0) {
          console.warn('No previous tasks still ongoing : leaving update.')
          return
        }

        let pasteRow = 2;
        let pasteColumn = 1;

        // let ss = config.loadSpreadSheet(); [12/1/25] オ：案件が終わりましたので、こちらのコードは必要ありません
        // if(ss.getName() == 'PROJECT_SHEET_NAME'){
        //   pasteRow = 3;
        //   pasteColumn = 2;
        //   lastMonthTasks = lastMonthTasks.map((arr) => arr.slice(1))
        // }

        console.log('Copying tasks below')
        console.log(lastMonthTasks)
        // transfer the Ongoing tasks to the new sheet
        let newSheet = taskSheet.loadSheet()
        newSheet.getRange(pasteRow,pasteColumn,lastMonthTasks.length, lastMonthTasks[0].length).setValues(lastMonthTasks)

        // reload config data just to avoid config.newSheetWasCreated triggering multiple times
        config.reload()
      }

      // used for the onEdit functions

      let buildTaskRef = function (taskNumber){
        return `${config.data.pjName}_${config.data.iraiBangoDate}_${taskNumber}`
      }

      this.getCol = function (headerName) {
        let result = config.data.currentHeaders.indexOf(headerName)
        if (result > -1) return result + 1 //columns start with 1
        throw 'Could not get column - Invalid Header Name : '+headerName
      }

      // [2026/1/5] <注意> PJ名に「_」があれば次の依頼番号は正しく作れません
      // オ：先にsplit(config.data.pjName)を使えば解消できるかな
      this.makeNextTaskRef = function (previousTaskRef){
        let raw = previousTaskRef.split('_')
        if (raw.length !== 3) return buildTaskRef(1)

        let [pjName, previousDate, previousNumber] = raw
        if (previousDate !== config.data.iraiBangoDate) return buildTaskRef(1)
        return buildTaskRef(( parseInt(previousNumber, 10) + 1 ))
      }

    };

    return TaskSheet;
  })();

  global.TaskSheet = TaskSheet;

})(this);


function loadTaskSheet_ (pj_config) {
  return new TaskSheet (pj_config)
};


