# BotKun

RPA Library for App Script

## Contents

- [Description](#description)
- [Initialisation](#initialisation)
- [What a botKun contains](#what-a-botkun-contains)
- [Methods](#methods)
  * [cache](#cache)
  * [businessDays](#businessdays)
  * [cw](#cw)
    + [cw.members](#cwmembers)
    + [cw.rooms](#cwrooms)
    + [cw.send](#cwsend)
    + [cw.request](#cwrequest)
  * [Projects](#projects)
- [Repository layout](#repository-layout)

# Description

BotKun Library was made to provide high level functions in App Script to beginners. <br>It is centered around chatWork API, but basically allows to use API calls and fetches in general while optimizing runtime and performance by chunk-caching process heavy get functions under the hood.

It contains :

- A cache that accepts values bigger than the 100KB limit of App Script
- Japanese business day helpers (weekends and public holidays)
- Chatwork features : members, rooms, automatic To lists, messages
- Project sheet helpers : settings check, task lists, task announcement messages

# Initialisation

### 1 Add the library using the following script ID

`144w2zZ83W6qQnpaRwZAPthzaekJfHF5Cy9gfgdgN8cIcJgwCau7ZBjSa`

### 2 Create an instance of botKun using the script below

```js
let magicIncantation = {
    cache : {
      cache : CacheService.getScriptCache(),  //the type of cache you would like to use
      defaultTimeout : 3600                   //the number of seconds the cache should be kept (max 6h = 21600)
    },
    cw : {
      token : INSERT_YOUR_CW_TOKEN_HERE,      //insert your cw token here (mock example : 'uhua2k98y3yv2192gs')
      devRoom : INSERT_ROOM_ID_HERE           //the room that receives the error reports of the library
    },
    members : {
      dataSsUrl : INSERT_SPREADSHEET_URL_HERE //the spreadsheet containing member data
    },
    pjHandler : {                             //only needed if you use botKun.loadProject()
      cache : CacheService.getDocumentCache(),
      defaultTimeout : 3600
    }
  }

let botKun = BotKun.summon(magicIncantation)
```

`BotKun.help()` prints a starting template on the console.

`summon` loads the members, the rooms and the Japanese holidays right away. They come from the cache when it holds them, so the first call is the slow one.

Avoid writing your token in the code. You can keep it in the script properties and read it with `PropertiesService.getScriptProperties().getProperty('CW_TOKEN')`.

### 3 Keep a tab open with this documentation

At the time of publication, ***Google App Script only supports autocompletion on methods directly called on the library***.<br>
However, creating an instance of botKun is necessary to avoid the library storing your API token/ cache in its own script scope.
This was the best trade-off I could find.

# What a botKun contains

| Property | What it is |
| --- | --- |
| `botKun.cache` | The cache. See [cache](#cache) |
| `botKun.businessDays` | Business day helpers. See [businessDays](#businessdays) |
| `botKun.cw` | Everything Chatwork : `members`, `rooms`, `send`, `request`. See [cw](#cw) |
| `botKun.loadProject(spreadsheet)` | Loads a project spreadsheet into `botKun.pj`. See [Projects](#projects) |
| `botKun.reloadAll()` | Reloads the members, the rooms and the project settings without using the cache |

# Methods

<br>

## cache

> Stores and reads values of any size in the cache you gave to `summon`. App Script limits a cached value to 100KB : these methods cut bigger values into chunks behind the scenes.

Values are stored as JSON, so a `Date` comes back as a string.

| Method | What it does |
| --- | --- |
| `cache.put(key, value, timeOut)` | Stores `value` under `key`. `timeOut` is optional (seconds), the default timeout is used without it |
| `cache.get(key)` | Returns the stored value, or `null` when nothing is stored or it has expired |
| `cache.optimize(key, callbackFunc, functionParams, forceLoad)` | Returns the cached value when there is one. If not, runs `callbackFunc(functionParams)`, stores the result and returns it. `forceLoad = true` ignores the cache and reloads |
| `cache.storeTempValue(key, callbackFunc, functionParams)` | Same as `optimize`, but the value is only kept 10 seconds. Useful when a function is called many times in the same run |

A cached value that is falsy (`0`, `''`, `false`, `null`) counts as not found : the function runs again.

```js
function loadRows (sheetName) {
  return SpreadsheetApp.getActive().getSheetByName(sheetName).getDataRange().getValues()
}

// the first call runs loadRows('Orders') and stores the result, the next ones read the cache
let rows = botKun.cache.optimize('orders', loadRows, 'Orders')

// ignore the cache and reload
let freshRows = botKun.cache.optimize('orders', loadRows, 'Orders', true)
```

[Back to Table of Content](#contents)

<br>

## businessDays

> Tells if a date is a day off in Japan (Saturday, Sunday or public holiday) and finds the closest business day. All methods use today when no date is given.

| Method | What it does |
| --- | --- |
| `businessDays.isDayOff(date)` | `true` on a Saturday, a Sunday or a Japanese public holiday |
| `businessDays.getNext(date)` | The closest business day on or after `date` |
| `businessDays.getPrevious(date)` | The closest business day on or before `date` |
| `businessDays.reload(forceReload)` | Fetches the list of public holidays again |

```js
// is today a day off ?
botKun.businessDays.isDayOff()

// closest business day on or after May 3rd 2026
botKun.businessDays.getNext(new Date(2026, 4, 3))
```

[Back to Table of Content](#contents)

<br>

## cw

> Chatwork features. `cw.reportToDevs(body, throwError)` posts `body` to the dev room, then throws it as an error unless `throwError` is `false`.

<br>

### cw.members

> The members listed in the sheet `メンバーデータ` of the member spreadsheet. Each member is an object with one property per column of the sheet, plus `cw_name` and `direct_room` taken from the Chatwork contacts.

The sheet needs the columns `呼び方`, `CW_ID`, `グループ`, `チーム`, `サブチーム`, `ポジション` and `出勤中`.

| Method | What it does |
| --- | --- |
| `members.get(nameOrId)` | The member whose `呼び方` or `CW_ID` matches, or `null` |
| `members.safeGet(nameOrId)` | Same, but reloads the members once before giving up. Use it for members added recently |
| `members.printListOfNames(membersArray)` | The names (`呼び方`) of the given members, or of all members |
| `members.byTeams(teamNames, membersArray)` | The members of the given teams, or `null` if there are none |
| `members.byGroups(groupNames, membersArray)` | The members of the given groups, or `null` if there are none |
| `members.byPositions(positionNames, membersArray)` | The members with the given positions, or `null` if there are none |
| `members.isPresent(member)` | The value of the `出勤中` column for this member |
| `members.filterPresentOnly(membersArray)` | Only the members who are present today |
| `members.getFromArrayOfIds(arrayOfIds)` | The members whose `CW_ID` is in the array |
| `members.getRegisteredTeamsList(...groupNames)` | The names of all teams and sub teams, limited to the given groups if any |
| `members.reload(forceReload)` | Reads the members again |

```js
let taro = botKun.cw.members.get('Taro')
let presentTranslators = botKun.cw.members.filterPresentOnly(botKun.cw.members.byGroups('翻訳'))
```

[Back to Table of Content](#contents)

<br>

### cw.rooms

> The Chatwork rooms registered in the master data spreadsheet. A room has a `name`, an `id` and, when the description of the room holds a `チームズ` block, the `teams` in charge.

| Method | What it does |
| --- | --- |
| `rooms.get(nameOrId)` | The room with this name or id, or `null` |
| `rooms.safeGet(nameOrId, mustIncludeTeams)` | Same, but reloads the rooms once before giving up |
| `rooms.printListOfNames()` | The names of all rooms |
| `rooms.getAllMembers(nameOrId, safeGet)` | Everyone in the room, as returned by Chatwork |
| `rooms.getRegisteredMembers(nameOrId, safeGet)` | The people in the room who are also in `cw.members` |
| `rooms.getPresentMembers(nameOrId, safeGet)` | The registered members of the room who are present today |
| `rooms.getTeamsTos(nameOrId, targetTeams)` | The `[To:...]` lines for the people in charge who are present today. All the teams of the room by default, or an array of team names |
| `rooms.createTeamsFromRoomMembers(room, groupFilter)` | The registered members of the room, sorted by team and sub team |
| `rooms.createTeamsDescription(room, groupFilter)` | The `チームズ` text to paste in the description of the room |
| `rooms.create(roomName, adminsIdsArr, description)` | Creates a room. The bot is added to the admins |
| `rooms.refreshRoomTeams(room)` | Reads the team settings of the room again and updates the master data when they changed |
| `rooms.reload(forceReload)` | Reads the rooms again |

[Back to Table of Content](#contents)

<br>

### cw.send

| Method | What it does |
| --- | --- |
| `send.message(room, body, targetTeams)` | Posts `body` in a room (name or id). With `targetTeams = true`, or an array of team names, the automatic To list is added before the message |
| `send.privateMessage(memberName, body, toUser)` | Posts `body` in the direct room of a member. `toUser = true` adds a To at the top |
| `send.basic(roomId, payload, customHeaders)` | Posts a raw payload in a room and returns the response code |

```js
// message with an automatic To for every team in charge of the room
botKun.cw.send.message('Room name', 'Hello !', true)

// direct message
botKun.cw.send.privateMessage('Taro', 'Hello !')
```

[Back to Table of Content](#contents)

<br>

### cw.request

> Direct calls to the Chatwork API v2, with your token already in the headers. `endOfUrl` is what comes after `https://api.chatwork.com/v2/`.

| Method | What it does |
| --- | --- |
| `request.getFetch(endOfUrl, customHeaders)` | GET request |
| `request.getFetchAll(arrayOfUrls, customHeaders)` | Several GET requests at once |
| `request.postFetch(endOfUrl, payload_data, customHeaders)` | POST request |

```js
let me = JSON.parse(botKun.cw.request.getFetch('me').getContentText())
```

[Back to Table of Content](#contents)

<br>

## Projects

> Helpers for a project spreadsheet : a `設定` sheet for the settings, a `テンプレート` sheet, and one task sheet per month named `YYYYMM` (created from the template when it is missing).

```js
botKun.loadProject(SpreadsheetApp.getActiveSpreadsheet())
let ongoingTasks = botKun.pj.taskSheet.getOngoingTasks(5)
```

| Method | What it does |
| --- | --- |
| `pj.config.data` | The settings read from the `設定` sheet : project name, people in charge, room, categories, project codes, teams... |
| `pj.config.reload(forceLoad)` | Reads the settings again |
| `pj.config.check()` | Checks the settings, colors the faulty lines of the `設定` sheet and returns the list of errors |
| `pj.config.loadSpreadSheet()` | Opens the project spreadsheet |
| `pj.taskSheet.getAllTasks()` | All the tasks of the current sheet |
| `pj.taskSheet.getOngoingTasks(n)` | The tasks that are not finished. Only the `n` latest ones if there are more |
| `pj.taskSheet.getOngoingTasksCreatedToday(n)` | Same, limited to the tasks created today |
| `pj.taskSheet.actualizeNewSheet()` | Hides the sheet of last month and copies its unfinished tasks to the current sheet |
| `pj.taskSheet.getCol(headerName)` | The column number of a header (starts at 1) |
| `pj.taskSheet.makeNextTaskRef(previousTaskRef)` | The next task reference (`project name_date_number`) |
| `pj.tenkai.makeTenkaiParams(n)` | The room and the `n` latest ongoing tasks, each with its announcement message |
| `pj.tenkai.makeTenkaiMessage(task)` | The announcement message of a task, made from the template text of the `設定` sheet |

[Back to Table of Content](#contents)

# Repository layout

`src/` is a copy of the App Script project (last synced on 2026-11-26). File names are the ones of the project, with a `.js` extension.

App Script loads the files in the order of the project, and a file loaded later replaces what an earlier one defined under the same name :

1. `..console.time`
2. `.README`
3. `0.1. CACHE HANDLER`
4. `0.1. BUSINESS DAYS HANDLER`
5. `0.2. CHATWORK HANDLER`
6. `0.2.0.chatWork requests`
7. `0.2.1.chatWork members`
8. `0.2.2.chatWork rooms`
9. `0.2.3.chatWork downloads`
10. `0.2.4.chatWork sends`
11. `0.4. PJ HANDLER`
12. `0.4.0.pj doc Cache handler`
13. `0.4.1.pj Config`
14. `0.4.2.pj task sheet`
15. `0.4.3.pj tenkai`
16. `ROOT CONSTRUCTOR`
17. `zzzzz_console.timeEnd`
18. `zzzzzzzzzzzzBotKun main Constructor Old`
19. `0.1. CACHE HANDLER のコピー`
20. `0.1. CACHE HANDLER の 2 つ目のコピー`

Two things differ from the project :

- The test file of the project is not published.
- Values that belong to our environment are replaced by placeholders. `BOT_MASTER_DATA_SPREADSHEET_ID` in `0.2.2.chatWork rooms` has to be replaced by the id of the master data spreadsheet for the rooms to load. The other placeholders are inside comments.
