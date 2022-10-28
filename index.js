
const wa = require('@open-wa/wa-automate');  
const express = require('express');
const { google } = require('googleapis');
const config = require('./prueba-366211-32bf1c5313d1.json');
const contacts = require('./dictionary.json');
  
const app = express();
  
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_PRIVATE_KEY= config.private_key;
const GOOGLE_CLIENT_EMAIL = config.client_email;
const GOOGLE_PROJECT_NUMBER = config.project_id;
const GOOGLE_CALENDAR_ID = config.calendar_id;

const jwtClient = new google.auth.JWT(
    GOOGLE_CLIENT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY,
    SCOPES
);
  
const calendar = google.calendar({
    version: 'v3',
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient
});

const NOT_EXCLUDED_YET = -1;

var excludeProcessed = [];
var confirmed = [];

app.get('/', (req, res) => {
  // var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
  // if (ip != config.authorized_ip) {
  //   res.send(JSON.stringify({ message: "Not valid!" }));   
  //   return;
  // } else {
  //   res.send(JSON.stringify({ message: "Ole ole" }));   
  // }

  var timeMin = new Date();
  timeMin.setDate(timeMin.getDate() + 1);
  timeMin.setHours(0,0,1);

  var timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 1);
  timeMax.setHours(23,59,59);

  calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 40,
    singleEvents: true,
    orderBy: 'startTime',
  }, (error, result) => {
    if (error) {
      res.send(JSON.stringify({ error: error }));
    } else {

      if (result.data.items.length) {        
        var response = result.data.items;

        response.forEach(current => {
          notify(current);
        });

         res.send(JSON.stringify({ events: result.data.items }));        
      } else {
        res.send(JSON.stringify({ message: 'No upcoming events found.' }));
      }
    }
  });
});

app.get('/confirmados', (req,res) => {
  res.send(JSON.stringify(confirmed));        
});

app.get('/restart', (req, res) => {
  excludeProcessed = [];
  confirmed = [];

  res.send(JSON.stringify({message: 'Memory cleaned!'}));
});
  
app.listen(3000, () => console.log(`App listening on port 3000!`));


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

function notify(currentResponse){  
  var name = currentResponse.summary;  
  var number = contacts[name]?.number;  // var number = currentResponse.description;  
  var startHour = currentResponse.start.dateTime;  
  var endHour = currentResponse.end.dateTime;  
  var appointment = new Date(startHour);
  var appointmentID = currentResponse.id;

  var dayName = translateDay(appointment.getDay());
  var dayNumber = appointment.getDate();
  var appointmentHour = appointment.getHours();
  var appointmentMinutes = (appointment.getMinutes() == 0 ? "00" : appointment.getMinutes());
  var message = `¡Hola! Te recuerdo tu cita para ${name} el ${dayName} ${dayNumber} a las ${appointmentHour}:${appointmentMinutes}. \n\nResponde con *SI* o *NO* para confirmar tu cita (en mayúsculas).`;
  var shouldBeProccesed = number !== undefined && isValidPhoneNumber(number) && !isAlreadyConfirmed(name) && !isAlreadyCancelled(name) && !isNaN(dayNumber) && !isNaN(appointmentHour);
  var chatID = `34${number}@c.us`

  if (shouldBeProccesed) {
    populateToBeConfirmed(name, chatID, startHour, endHour, appointmentID);
    processMessage(name, number, message, appointmentID, startHour, endHour);
  } else {
    console.log(`Won't process ${name}'s appointment.`)
  }
}

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

function processMessage(name, number, message, appointmentID){
  var succeded = false;
    
  if (excludeProcessed.indexOf(appointmentID) === NOT_EXCLUDED_YET){
    excludeProcessed.push(appointmentID);
    
    var chatID = `34${number}@c.us`
    sendMessage(name, chatID, message);
  }else{
    console.log("Ya no se procesa");
  }
  
  succeded = true;
  return succeded;
}

function sendMessage(name, chatID, message){
  console.log("\n----------------------------------");
  console.log("Sending...");
  console.log(`Name: ${name}.`)
  console.log(`ID: ${chatID}`);
  console.log(`Message: ${message}`);
  console.log("----------------------------------");
    
  whatsClient.sendText(chatID, message);  
}

function populateToBeConfirmed(name, chatID, startHour, endHour, appointmentID){
  confirmed.push({name: name, confirmed: "", chatID: chatID, startHour: startHour, endHour: endHour, appointmentID: appointmentID});  
}

function isAppointmentConfirmed(chatID, confirmation){
  var isConfirmed = false;

  confirmed.forEach(appointment => {
    if(appointment.chatID == chatID && appointment.confirmed == ""){
      appointment.confirmed = confirmation
      isConfirmed = true;
    }
  });

  return isConfirmed;
}

function markAsConfirmed(chatID){
  var startHour = "";
  var endHour = "";
  var name = ""
  var appointmentID = "";

  confirmed.forEach(appointment => {
    if(appointment.chatID == chatID){
      startHour = appointment.startHour;
      endHour = appointment.endHour;
      name = appointment.name;
      appointmentID = appointment.appointmentID;
    }
  });

  if (startHour == "" || endHour == "" || name == "" || appointmentID == ""){
    console.log("No se pudo determinar la hora, el nombre o el ID de la cita. No se confirmará.");
    return;
  }

    var object = {
      'summary': "* " + name,
      'end': {
          'dateTime': endHour,
          'timeZone': 'Europe/Madrid'
      },
      'start': {
          'dateTime': startHour,
          'timeZone': 'Europe/Madrid'
      }
    };

    calendar.events.update({      
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: appointmentID, 
      resource: object
    });
}

function markAsCancelled(chatID){
  var startHour = "";
  var endHour = "";
  var name = ""
  var appointmentID = "";

  confirmed.forEach(appointment => {
    if(appointment.chatID == chatID){
      startHour = appointment.endHour;
      endHour = appointment.endHour;
      name = appointment.name;
      appointmentID = appointment.appointmentID;
    }
  });

  if (startHour == "" || endHour == "" || name == "" || appointmentID == ""){
    console.log("No se pudo determinar la hora, el nombre o el ID de la cita. No se cancelará.");
    return;
  }

    var resourceData = {
      'summary': "@ " + name,
      'end': {
          'dateTime': endHour,
          'timeZone': 'Europe/Madrid'
      },
      'start': {
          'dateTime': startHour,
          'timeZone': 'Europe/Madrid'
      }
    };

    calendar.events.update({      
      calendarId: GOOGLE_CALENDAR_ID, 
      eventId: appointmentID, 
      resource: resourceData
    });
}

var whatsClient;

wa.create({
  sessionId: "CAL_TEST",
  multiDevice: false,
  authTimeout: 60, 
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0, 
}).then(client => start(client));

function start(client) {  
  whatsClient = client;  

  client.onMessage(async message => {
    switch (message.body){
      case "SI":
        if (isAppointmentConfirmed(message.chatId, "SI")){
          markAsConfirmed(message.chatId);
          await client.sendText(message.from, '¡Gracias!');        
        }         
      break;
      case "NO":
        if (isAppointmentConfirmed(message.chatId, "NO")){
          markAsCancelled(message.chatId);
          await client.sendText(message.from, '¡Gracias! Puedes reagendar tu cita aquí: www.fisiopeques.com/citas');
        }
      break;
      default:
      break;
    }
  });
}
