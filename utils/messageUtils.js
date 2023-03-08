function isAlreadyConfirmed(name){
    return name.includes("*");
  }
  
  function isAlreadyCancelled(name){
    return name.includes("@");
  }
  
  function isValidPhoneNumber(number){
    return isNumeric(number) && number.length === 9;
  }
  
  function isNumeric(str) {
    if (typeof str != "string") return false 
    return !isNaN(str) && !isNaN(parseFloat(str)) 
  }

  function translateDay(day){
    var translatedDay = "";
  
    switch (day){
      case 1:
        translatedDay = "lunes";
      break;
      case 2:
        translatedDay = "martes";
      break;
      case 3:
        translatedDay = "miércoles";
      break;
      case 4:
        translatedDay = "jueves";
      break;    
      case 5:
        translatedDay = "viernes";
      break;
      case 6:
        translatedDay = "sábado";
      break;
      case 7:
        translatedDay = "domingo"
      break;
    }
  
    return translatedDay;
  }

  module.exports = {
    isAlreadyConfirmed,
    isAlreadyCancelled,
    isValidPhoneNumber,
    isNumeric,
    translateDay
  }