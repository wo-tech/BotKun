(function(global){

  var BotKun = (function() {

    function BotKun (params)
    {
      const self = this
      this.cache = loadCacheHandler_(params.cache); // see 0.1.cache handler
      this.businessDays = loadBusinessDaysHandler_ (this.cache)
      this.cw = loadChatWorkHandler_(params, this.cache)

      this.pj
      this.loadProject = function (pjSpreadSheet) {
        console.log('Loading new project...')
        console.time('project loaded in ')
        this.pj = loadtaskEnvironmentHandler_ (params.pjHandler, pjSpreadSheet, this.cw)
        console.timeEnd('project loaded in ')
      }

      this.reloadAll = function () {
        self.cw.members.reload();
        self.cw.rooms.reload();
        if(self.pj){
          console.log('configを更新してみます...');
          self.pj.config.reload();
        }
      }
    };

    return BotKun;
  })();

  global.BotKun = BotKun;

})(this);


/**
* Creates a new botKun for the script
* @param {object} api key, cache set up
* @return {object} botKun object on which to call methods
*/
// スクリプト用に新しいbotKunを作成します。
//  @param {object} APIキー、キャッシュ設定
//  @return {object} メソッドを呼び出すbotKunオブジェクト
function summon (params) {
  console.warn('Summoning botKun')
  console.time('botKun load')
  let newBotKun = new BotKun (params)
  console.warn('BotKun Summoned')
  console.timeEnd('botKun load')
  return newBotKun
};




/**
* Logs basic help to use this library
* このライブラリを使用するための基本的なヘルプをログに記録します
*/
function help () {
  console.warn(`HELP: Initialisation
Use code below to create a new instance of botKun.
Copy-paste your Chatwork token to replace INSERT_YOUR_CW_TOKEN_HERE`)

  console.log(` let magicIncantation = {
    cache : {
      cache : CacheService.getScriptCache(),  //the type of cache you would like to use
      timeout : 3600                          //the number of seconds the cache should be kept (max 6h = 21600)
    },
    cw : {
      token : INSERT_YOUR_CW_TOKEN_HERE       //insert your cw token here (mock example : 'uhua2k98y3yv2192gs')
    }
  }

  let botKun = BotKun.summon(magicIncantation)
  botKun.help()`)

  console.warn('Detailed documentation : https://github.com/wo-tech/BotKun/blob/main/README.md')
};

/**
* @private
* Devs only. Automatically prints the template for markdown documentation based on prototypes of the object.
* Copy paste to readme markdown file.
* If to update current readme.md, just copy paste the generated table of content and target method section.
*/

// function printDocumentationTemplate (){

//   let dummyParams = {
//     cache : {
//       cache : null,  
//       timeout : null                          
//     },
//     cw : {
//       token : null       
//     }
//   }

//   let instance = new BotKun(dummyParams)

//   function createSectionTableOfContentLine (sectionName){
//     return `  * [${sectionName.toUpperCase()}](#${sectionName})\n`
//   }
//   function createMethodTableOfContentLine (methodName){
//     return `    + [.${methodName}](#${methodName})\n`
//   }

//   function createSectionContent (sectionName) {
//     return `\n\n\n<br>\n\n## ${sectionName.toUpperCase()}\n\n> write section explanation here\n\n<br><br>\n\n`
//   }
//   function createMethodContent (methodName) {
//     return `### .${methodName}\n\n> write explanation for ${methodName}\n\`\`\`js\n//comment\nbotkun.${methodName}()\n\`\`\`\n\n[Back to Table of Content](#BotKun-Library)\n\n<br><br>\n\n`
//   }

//   let fullArrayOfFunctions = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
//   // gets rid of the 'constructor' prototype
//   fullArrayOfFunctions.shift()

//   let section = '';
//   let docContent = '';
//   let tableOfContent = '- [Methods](#methods)\n';

  
//   for (let funcName of fullArrayOfFunctions) {

//     // if it's a new section
//     if (section !== funcName.split('_')[0]){
//       section = funcName.split('_')[0];
//       tableOfContent += createSectionTableOfContentLine(section);
//       docContent += createSectionContent(section)
//     }
    
//     tableOfContent += createMethodTableOfContentLine(funcName);
//     docContent += createMethodContent(funcName);
//   }

//   console.warn('Table of Content')
//   console.log(tableOfContent)
//   console.warn('Documentation Content')
//   console.log(docContent)
// }


