(function(global){

  var BusinessDaysHandler = (function() {

    function BusinessDaysHandler (cacheHandler)
    {
      const businessDays = this

      businessDays.jpHolidays = []

      businessDays.reload = function (forceReload = true) {

        // load jpHolidays
        let jpHolidaysKey = 'jpHolidays'
        // see fetchJpHolidays below
        // JSON files cannot store javascript dates properly
        // so we cache dates in miliseconds
        businessDays.jpHolidays = cacheHandler.optimize (jpHolidaysKey, fetchJpHolidays, null, forceReload)


        // businessDays.jpHolidays = businessDays.jpHolidays.map(dateInMilisec => new Date(dateInMilisec))

      }
      // load without forcing a reload
      businessDays.reload(false)

      businessDays.today = new Date ()

      // will consider the current date if no args were provided
      // creates a copy of today to avoid modifying the original object
      businessDays.isDayOff = (targetDate = new Date (businessDays.today.getTime())) => {
        return targetDate.getDay() === 6 || targetDate.getDay() === 0 || businessDays.jpHolidays.includes(targetDate.setHours(0,0,0,0))
      }

      // output the date which is the closest FORWARD business day (same day included)
      // based on isDayOff, so will consider the current date if no args were provided
      businessDays.getNext = (targetDate = new Date (businessDays.today.getTime())) => {

        // creates a copy to avoid modifying the original date
        let resultDate = new Date (targetDate.getTime())

        while (businessDays.isDayOff(resultDate)){
          resultDate.setDate(resultDate.getDate()+1)
        }

        return resultDate
      }

      // output the date which is the closest PREVIOUS business day (same day included)
      // based on isDayOff, so will consider the current date if no args were provided
      businessDays.getPrevious = (targetDate = new Date (businessDays.today.getTime())) => {
        
        // creates a copy to avoid modifying the original date
        let resultDate = new Date (targetDate.getTime())

        while (businessDays.isDayOff(resultDate)){
          resultDate.setDate(resultDate.getDate() - 1)
        }

        return resultDate
      }



      // EXAMPLE OF PREVIOUS CODE FOR THE ASSISTANT CONSTRUCTOR
      // SEE 自動リマインダー2.0 code base for concrete usage example

      //   this.getDaysDiff = function (targetDateWithAnyTimeSetting){
      //   let dateInMiliSec_atMidnight = targetDateWithAnyTimeSetting.setHours(0,0,0,0);
      //   return (dateInMiliSec_atMidnight-this.inMilSec_atMidnight)/this.milSec_day;
      // }

      // // ouput boolean if target date is either on weekend or inside jpDaysOff
      // this.isDayOff = function (targetDate = this.full) {
      //   if (targetDate.getDay() === 6 || targetDate.getDay() === 0 || this.jpDaysOff.includes(targetDate.setHours(0,0,0,0)))
      //     {return true;}
      //   return false;
      // }

      // // output the date which is the closest forward business day (same day included)
      // this.getNextBusinessDay = function (targetDate = this.full){
      //       let addingDays = 0;
      //       let datetoCheckConverted = targetDate.setHours(0,0,0,0);
      //       while (this.isDayOff(new Date (datetoCheckConverted+addingDays))){
      //         addingDays += this.milSec_day;
      //       }
      //       return new Date (datetoCheckConverted+addingDays);
      // }

      // // output the date which is the closest backward business day (same day included)
      // this.getPreviousBusinessDay = function (targetDate = this.full){
      //       let substractingDays = 0;
      //       let datetoCheckConverted = targetDate.setHours(0,0,0,0);
      //       while (this.isDayOff(new Date (datetoCheckConverted-substractingDays))){
      //         substractingDays += this.milSec_day;
      //       }
      //       return new Date (datetoCheckConverted-substractingDays);
      // }

      // // hour scale
      // this.isBetweenHours = function (startHour, endHour){
      //   if(this.hour>startHour && this.hour<endHour){
      //     return true;
      //   }
      //   return false;
      // }

      // // minute scale
      // this.getMinDiff_withDate = function (targetDate){
      //   let targetDateInMiliSec_setToMinutes = targetDate.setHours(targetDate.getHours(),targetDate.getMinutes(),0,0);
      //   let refDateInMiliSec_setToMinutes = this.full.setHours(this.hour,this.min,0,0);
      //   return (targetDateInMiliSec_setToMinutes - refDateInMiliSec_setToMinutes)/this.milSec_min;
      // }

      // this.getMinDiff_withTimeInt = function (hourInt, minInt){
      //   let rawMinTarget = hourInt*60+minInt;
      //   let rawMinRef = this.hour*60+this.min;
      //   return rawMinTarget-rawMinRef;
      // }


      function fetchJpHolidays () {
        // the target URL was hard copied here, to avoid having to change the magic incantations in all the codes
        let targetUrl = 'https://holidays-jp.github.io/api/v1/datetime.json'
        // the fetch returns an object where key = name of the holiday and property = dates expressed in seconds
        let holidayDatesFetch = JSON.parse(UrlFetchApp.fetch(targetUrl).getContentText());
        // we transform this in a array of dates expressed in miliseconds
        // to facilitate the creation of dates
        let holidayArr = [];
        for (dateKey in holidayDatesFetch){
          holidayArr.push(parseInt(dateKey, 10)*1000)
        }
        return holidayArr;
      }

    };

    return BusinessDaysHandler;
  })();

  global.BusinessDaysHandler = BusinessDaysHandler;

})(this);


function loadBusinessDaysHandler_ (cacheHandler) {
  return new BusinessDaysHandler (cacheHandler)
};
