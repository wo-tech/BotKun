(function(global){

  var LocalCacheHandler = (function() {

    function LocalCacheHandler (inheritedDocCache, defaultTimeout)
    {
      const local_cacheHandler = this

      const docCache = inheritedDocCache
      local_cacheHandler.timeout = defaultTimeout;
      local_cacheHandler.chunkSize = 1024*90;

      local_cacheHandler.put = function(key, value, timeOut = local_cacheHandler.timeout) {
        let json = JSON.stringify(value);
        let cSize = Math.floor(local_cacheHandler.chunkSize / 2);
        let chunks = [];
        let index = 0;
        while (index < json.length){
          cKey = key + "_" + index;
          chunks.push(cKey);
          docCache.put(cKey, json.substring(index, index + cSize), timeOut+5);
          index += cSize;
        }
        let superBlk = {
          chunkSize: local_cacheHandler.chunkSize,
          chunks: chunks,
          length: json.length
        };
        docCache.put(key, JSON.stringify(superBlk), timeOut);
      };

      local_cacheHandler.get = function (key) {
        // get cache
        let superBlkCache = docCache.get(key);
        // return null if null
        if (superBlkCache === null) return null;
        let superBlk = JSON.parse(superBlkCache);
        let cache = docCache;
        let chunks = superBlk.chunks.map(function (cKey){
          return cache.get(cKey);
        });
        if (!(chunks.every(function (c) { return c != null; }))) return null;
        return JSON.parse(chunks.join(''));
      }

      local_cacheHandler.optimize = function (key, callbackFunc, functionParams = null, forceLoad = false, timeOut = local_cacheHandler.timeout){
        console.time('Loading "'+key+'"')
        
        // get cache
        let cacheVal = local_cacheHandler.get(key)
        // return cache if found and don't force load
        if (cacheVal && !forceLoad) {
          console.log('"'+key+'" found by BotKun!')
          console.timeEnd('Loading "'+key+'"')
          return cacheVal
        }

        // load data using original function if not
        let infoToUser = forceLoad ? 'Reloading "'+key+'"!' : '"'+key+'" not found by BotKun!'
        console.log(infoToUser+'\nRetrieving values...')
        let returnValue = functionParams ? callbackFunc(functionParams) : callbackFunc()
        local_cacheHandler.put(key, returnValue, timeOut)
        console.log('"'+key+'" stored by BotKun!\nNext time will be faster.')
        console.timeEnd('Loading "'+key+'"')
        return returnValue;
      }

    };

    return LocalCacheHandler;
  })();

  global.LocalCacheHandler = LocalCacheHandler;

})(this);


function loadLocalCache_ (docCache, defaultTimeout) {
  return new LocalCacheHandler (docCache, defaultTimeout)
};


