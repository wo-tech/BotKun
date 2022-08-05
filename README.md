# BotKun

RPA Library for App Script

## Contents

- [Description](#description)
- [Initialisation](#initialisation)
<!--  -->
<!-- Copy paste generated table of content below  -->
<!--  -->
- [Methods](#methods)
  * [HELP](#help)
    + [.help](#help)
  * [CACHE](#cache)
    + [.cache_put](#cache_put)
    + [.cache_get](#cache_get)
    + [.cache_optimize](#cache_optimize)
<!--  -->
<!-- Copy paste generated table of content above  -->
<!--  -->

# Description

BotKun Library was made to provide high level functions in App Script to beginners. <br>It is centered around chatWork API, but basically allows to use API calls and fetches in general while optimizing runtime and performance by chunk-caching process heavy get functions under the hood.

It contains :

- Advanced Chatwork features (Api calls, and functions tailored )

# Initialisation

### 1 Add the library using the following script ID

`144w2zZ83W6qQnpaRwZAPthzaekJfHF5Cy9gfgdgN8cIcJgwCau7ZBjSa`

### 2 Create an instance of botKun using the script below

```js
let magicIncantation = {
    cache : {
      cache : CacheService.getScriptCache(),  //the type of cache you would like to use
      timeout : 3600                          //the number of seconds the cache should be kept (max 6h = 21600)
    },
    cw : {
      token : INSERT_YOUR_CW_TOKEN_HERE       //insert your cw token here (mock example : 'uhua2k98y3yv2192gs')
    }
  }

let botKun = BotKun.summon(magicIncantation)
// help() will print all available functions on the console
botKun.help()
```

### 3 Keep a tab open with this documentation

At the time of publication, ***Google App Script only supports autocompletion on methods directly called on the library***.<br>
However, creating an instance of botKun is necessary to avoid the library storing your API token/ cache in its own script scope.
This was the best trade-off I could find.

# Methods

<!--  -->
<!-- Copy paste generated documentation content below -->
<!--  -->
	


<br>

## HELP

> write section explanation here

<br><br>

### .help

> write explanation for help
```js
//comment
botkun.help()
```

[Back to Table of Content](#BotKun-Library)

<br><br>




<br>

## CACHE

> write section explanation here

<br><br>

### .cache_put

> write explanation for cache_put
```js
//comment
botkun.cache_put()
```

[Back to Table of Content](#BotKun-Library)

<br><br>

### .cache_get

> write explanation for cache_get
```js
//comment
botkun.cache_get()
```

[Back to Table of Content](#BotKun-Library)

<br><br>

### .cache_optimize

> write explanation for cache_optimize
```js
//comment
botkun.cache_optimize()
```

[Back to Table of Content](#BotKun-Library)

<br><br>
