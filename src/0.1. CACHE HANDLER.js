(function(global){

  var CacheHandler = (function() {

    function CacheHandler (params_cache)
    {
      const cacheHandler = this

      cacheHandler.cache = params_cache.cache;
      cacheHandler.timeout =
        params_cache.defaultTimeout ??
        params_cache.timeout ??
        3600;
      cacheHandler.chunkSize = 100000;  //5月24日　オ：根本的な解決ではないけど、もう少し容量はあるはず
      // cacheHandler.chunkSize = 1024*90;

      cacheHandler.put = function(key, value, timeOut = cacheHandler.timeout) {
        let json = JSON.stringify(value);
        let cSize = Math.floor(cacheHandler.chunkSize / 2);
        let chunks = [];
        let index = 0;
        while (index < json.length){
          cKey = key + "_" + index;
          chunks.push(cKey);
          cacheHandler.cache.put(cKey,json.substring(index, index + cSize),timeOut + 5);
          index += cSize;
        }
        let superBlk = {
          chunkSize: cacheHandler.chunkSize,
          chunks: chunks,
          length: json.length
        };
        cacheHandler.cache.put(key, JSON.stringify(superBlk), timeOut);
      };

      cacheHandler.get = function (key) {
        // get cache
        let superBlkCache = cacheHandler.cache.get(key);
        // return null if null
        if (superBlkCache === null) return null;
        let superBlk = JSON.parse(superBlkCache);
        let cache = cacheHandler.cache;
        let chunks = superBlk.chunks.map(function (cKey){
          return cache.get(cKey);
        });
        if (!(chunks.every(function (c) { return c != null; }))) return null;

        // console.log(chunks.length)
        // for (const object in chunks) {
        //   try {
        //     JSON.parse(object);
        //   }
        //   catch (err) {
        //     console.log('This object failed to parse: \n\n' + object);
        //   }
        // }
        // try {
        //   let testSheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?gid=0#gid=0').getSheetByName('TestData')
        //   testSheet.getRange(2, 1, 1, 1).setValue(chunks);
        // }
        // catch(err) {
        //   console.log('Not this one: \n\n' + err);
        // }

        return JSON.parse(chunks.join(''));
      }

      cacheHandler.optimize = function (key, callbackFunc, functionParams = null, forceLoad = false){
        console.time('Loading "'+key+'"')
        
        // 26日5月2025年　オ：getが失敗すると全部壊しちゃうので、forceLoadがtrueの際だけにします
        // 強制ロードしない場合はキーで探す
        if (!forceLoad) {
          let cacheVal = null;

          // 失敗すると、forceLoadのコードに続きたいのでエラーをcatchする
          try { cacheVal = cacheHandler.get(key) }
          catch (error) { console.error(error); }


          // 成功した場合（null等じゃない場合）returnします
          if(cacheVal) {
            console.log('BotKunが"'+key+'"を見つけました！')
            console.timeEnd('Loading "'+key+'"')
            return cacheVal
          }
        }

        // 強制ロードの場合またはgetが失敗した場合、ファンクションを使って作り直します
        let infoToUser = forceLoad ? 'Reloading "'+key+'"!' : '"'+key+'" not found by BotKun!'
        console.log(infoToUser+'\nRetrieving values...')
        let returnValue = functionParams ? callbackFunc(functionParams) : callbackFunc()
        cacheHandler.put(key, returnValue)
        console.log('"'+key+'" stored by BotKun!\nNext time will be faster.')
        console.timeEnd('Loading "'+key+'"')
        return returnValue;
      }

      // store a value 10 secs if a function using it is to call it multiple times
      // very useful to make a function targetting a single element iterable without running unnecessary calculations
      cacheHandler.storeTempValue = function (key, callbackFunc, functionParams = null){
        
        // test cache option
        let cacheVal = cacheHandler.get(key)
        if (cacheVal) return cacheVal

        // load data using original function
        let returnValue = functionParams ? callbackFunc(functionParams) : callbackFunc()
        cacheHandler.put(key, returnValue, 10)
        return returnValue
      }

    };

    return CacheHandler;
  })();

  global.CacheHandler = CacheHandler;

})(this);


function loadCacheHandler_ (params_cache) {
  return new CacheHandler (params_cache)
};


