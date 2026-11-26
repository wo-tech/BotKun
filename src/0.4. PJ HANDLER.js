// task environment handler can be initiated with two ways
  // providing the spreadsheet data
  // providing an existing cache data

(function(global){

  var TaskEnvironmentHandler = (function() {

    function TaskEnvironmentHandler (params_pjHandler, pjSpreadSheet, cw_object)
    {
      let pjSpreadSheetIsAccessible = pjSpreadSheet!== undefined
      let cacheIsAcessible = params_pjHandler?.cache !== undefined
      if (!cacheIsAcessible && !pjSpreadSheetIsAccessible) throw 'loadtaskEnvironmentHandler_ failed : No cache nor Spreadsheet'

      this.cache = cacheIsAcessible ? 
        loadLocalCache_ (params_pjHandler.cache, params_pjHandler.defaultTimeout)
        : null

      this.config = loadPjConfig_(pjSpreadSheet, this.cache, cw_object)

      this.taskSheet = loadTaskSheet_ (this.config)
      this.tenkai = loadTenkaiHandler_ (this.config, this.taskSheet, cw_object.rooms, cw_object.members)
    }

    return TaskEnvironmentHandler;
  })();

  global.TaskEnvironmentHandler = TaskEnvironmentHandler;

})(this);


function loadtaskEnvironmentHandler_ (params_pjHandler, pjSpreadSheet, cw_object) {
  return new TaskEnvironmentHandler (params_pjHandler, pjSpreadSheet, cw_object)
};


