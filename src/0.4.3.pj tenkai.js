(function (global) {

  var TenkaiHandler = (function () {

    function TenkaiHandler(pj_config, pj_taskSheet, cw_rooms, cw_members) {
      const tenkai = this
      const config = pj_config
      const taskSheet = pj_taskSheet
      const rooms = cw_rooms
      const members = cw_members


      let formatDate = (date) => {
        let date_str = `${(date.getMonth() + 1)}/${date.getDate()}`
        date_str += `(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}) `
        let hours = date.getHours().toString()
        let minutes = date.getMinutes().toString()
        date_str += hours.length == 1 ? "0" + hours : hours
        date_str += ':'
        date_str += minutes.length == 1 ? "0" + minutes : minutes
        return date_str
      }

      this.makeTenkaiParams = function (getNLatestTasks = 1) {
        let tasks = taskSheet.getOngoingTasks(getNLatestTasks)
        for (const task of tasks) {
          task.message = tenkai.makeTenkaiMessage(task)

          console.log(task.tanto);
          task.tanto = members.get(task.tanto)
        }
        console.log("Passed C");

        return {
          room: config.data.room,
          tasks: tasks
        }

      }


      this.makeTenkaiMessage = function (task) {

        let message = JSON.parse(JSON.stringify(config.data.tenkaiText))

        let concernedTeams = Object.entries(task.teams)
          .filter(([team, status]) => status === '')
          .map(([team, status]) => team)

        let value
        for (const headerName of (config.data.variablesToSearch || [])) {
          if (headerName.includes('対象チーム')) {
            value = `【${concernedTeams.join('】【')}】`
          }
          else if (headerName.includes('PJコード')) {
            value = config.data.pjCodes[config.data.categories.indexOf(
              task.rawArray[config.data.currentHeaders.indexOf(config.data.extractHeaders.taskType)]
            )]
          }
          else {
            value = config.data.currentHeaders.indexOf(headerName) > -1
              ? task.rawArray[config.data.currentHeaders.indexOf(headerName)] || '⚠️未記入⚠️'
              : `⚠️不正常な列名 : 「${headerName}」⚠️`
          }

          value = value instanceof Date ? formatDate(value) : value

          message = message.replaceAll(`{${headerName}}`, value)
        }

        return config.data.tenkaiAutomaticTo
          ? rooms.getTeamsTos(config.data.room.id, concernedTeams) + message
          : message
      }

    };

    return TenkaiHandler;
  })();

  global.TenkaiHandler = TenkaiHandler;

})(this);


function loadTenkaiHandler_(pj_config, pj_taskSheet, cw_rooms, cw_members) {
  return new TenkaiHandler(pj_config, pj_taskSheet, cw_rooms, cw_members)
};


