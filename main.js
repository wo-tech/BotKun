(function(global){

  var BotKun = (function() {

    /** INSERT INIT VALUES HERE (Variables given by the user)**/
    function BotKun (params)
    {
      this.cache = params.cache.cache;
      this.timeout = params.cache.timeout;
      this.chunkSize = 1024*90;
      this.cwToken = params.cw.token;
    };


    BotKun.prototype.help = function () 
    {
      let fullArrayOfFunctions = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

      // sort functions by type ('type_function')
      let sortedObject = {}
      let splitArray = [];
      
      for (let funcName of fullArrayOfFunctions) {
        splitArray = funcName.split('_')
        
        // avoid false positive
        if (splitArray.length !== 2) {continue}
        
        // if a new key, add it
        if (!sortedObject[splitArray[0]]) {sortedObject[splitArray[0]] = ''}
        
        sortedObject[splitArray[0]] += '・'+splitArray[1].toUpperCase()+' : botKun.'+funcName+'()\n'
      }

      // construct result Log
      let resultLog = '|\n|  See documentation : https://github.com/wo-tech/BotKun/blob/main/README.md\n|\n\n'
      
      for (let key in sortedObject) {
        resultLog += '**\n*'+key.toUpperCase()+'\n**\n'+sortedObject[key]
      }
      console.warn('HELP : List of all available functions')
      console.log(resultLog)
    } 


    /**
    * Stores value in cache. Uses cache chunks to overcome the 100KB limit. 
    * @param {String} key to store in cache
    * @param {*} value to store
    * @return {void}
    */
    BotKun.prototype.cache_put = function(key, value) {
      let json = JSON.stringify(value);
      // nothing to store (undefined, function...) : clear the key instead of failing
      if (json === undefined) {
        this.cache.remove(key);
        return;
      }
      let cSize = Math.floor(this.chunkSize / 2);
      let chunks = [];
      let index = 0;
      // chunks must outlive the super block, without exceeding the 6h cache limit
      let chunkTimeout = Math.min(this.timeout + 5, 21600);
      while (index < json.length){
        let cKey = key + "_" + index;
        chunks.push(cKey);
        this.cache.put(cKey, json.substring(index, index + cSize), chunkTimeout);
        index += cSize;
      }
      let superBlk = {
        chunkSize: this.chunkSize,
        chunks: chunks,
        length: json.length
      };
      this.cache.put(key, JSON.stringify(superBlk), this.timeout);
    };

    /**
    * Gets value from cache. Uses cache chunks to overcome the 100KB limit. 
    * @param {String} key to store in cache
    * @return {object} stored value. null if empty.
    */
    BotKun.prototype.cache_get = function (key) {
      // get cache
      let superBlkCache = this.cache.get(key);
      // return null if null
      if (superBlkCache === null) return null;
      let superBlk = JSON.parse(superBlkCache);
      let cache = this.cache;
      let chunks = superBlk.chunks.map(function (cKey){
        return cache.get(cKey);
      });
      if (!(chunks.every(function (c) { return c != null; }))) return null;
      return JSON.parse(chunks.join(''));
    }

    /**
    * Returns the cached value for key if there is one. Otherwise runs callbackFunc, stores its result in cache and returns it.
    * @param {String} key to look up / store in cache
    * @param {Function} callbackFunc function that loads the value when it is not cached
    * @param {*} functionParams (optional) single argument passed to callbackFunc
    * @param {Boolean} forceLoad (optional) true to ignore the cache and reload the value
    * @return {*} cached or freshly loaded value
    */
    BotKun.prototype.cache_optimize = function (key, callbackFunc, functionParams = null, forceLoad = false){
      console.time('Loading "'+key+'"')
      // get cache
      let cacheVal = this.cache_get(key)
      // return cache if found and don't force load
      if (cacheVal !== null && !forceLoad) {
        console.log('"'+key+'" found by BotKun!')
        console.timeEnd('Loading "'+key+'"')
        return cacheVal
      }
      // load data using original function if not
      let infoToUser = forceLoad ? 'Reloading "'+key+'"!' : '"'+key+'" not found by BotKun!'
      console.log(infoToUser+'\nRetrieving values...')
      let returnValue = functionParams !== null ? callbackFunc(functionParams) : callbackFunc()
      this.cache_put(key, returnValue)
      // null / undefined can't be told apart from an empty cache, so they are loaded again next time
      if (returnValue == null) {
        console.log('"'+key+'" has no value, nothing to store.')
      } else {
        console.log('"'+key+'" stored by BotKun!\nNext time will be faster.')
      }
      console.timeEnd('Loading "'+key+'"')
      return returnValue;
    }

    return BotKun;
  })();

  global.BotKun = BotKun;

})(this);


/**
* Creates a new botKun for the script
* @param {object} api key, cache set up
* @return {object} botKun object on which to call methods
*/
function summon (params) {
  return new BotKun(params);
};
