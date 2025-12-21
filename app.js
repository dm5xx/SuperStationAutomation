const WebServer = require('./webexpress');
const DeviceHandler = require('./njsdevicehandler');
const CORSUrlCommander = require('./CORSUrlCommander'); // Importiere die Implementierung
const WebSocketCommander = require('./WebSocketCommander'); // Importiere die Implementierung


const appconfig = require('./JSON/appconfig.json');
const buttons = require('./JSON/'+appconfig.buttonJsonName+'.json');
const controllers = require('./JSON/'+appconfig.controllersJsonName+'.json');

let aDeviceHandler = new DeviceHandler(controllers);

function findElementByTitle(titleToFind) {    
    if (typeof titleToFind !== 'string') {
      throw new Error('Second parameter must be a string');
    }
    
    // Find the element with matching title
    const foundElement = buttons.find(element => element.title === titleToFind);
    
    // Return the found element or null if not found
    return foundElement || null;
}

function fire(ttt) {
    let devX = aDeviceHandler.Devices.findIndex(x => x.ip == ttt.ip);

    let differentIps = [];
    let noDifIp = [];

    for(let a=0; a < ttt.cmdSet.length; a++)
    {
        if(ttt.cmdSet[a].dip != undefined)
        {
            let newentry = {};
            newentry.ip = ttt.cmdSet[a].dip;
            newentry.cmd = ttt.cmdSet[a].Cmd;
            newentry.mode = ttt.cmdSet[a].mode;
            newentry.delayNext = ttt.cmdSet[a].delayNext;
            differentIps.push(newentry);
        }
        else
        {
            noDifIp.push(ttt.cmdSet[a]);
        }
    }

    if(devX > -1)
        aDeviceHandler.Devices[devX].executeSetCommands(noDifIp);

    let uniqueiparr = [];

    // get unique ip adresses as lost of element to fill
    for (index = 0; index < differentIps.length; index++) {
        let elm = {};
        elm.cmdSet = [];

        if(uniqueiparr.length == 0)
        {
            elm.ip = differentIps[index].ip;
            elm.mode = differentIps[index].mode;
            uniqueiparr.push(elm);
            continue;
        }

        let sidx = uniqueiparr.findIndex(x => x.ip == differentIps[index].ip);

        if(sidx== -1 || uniqueiparr[sidx].mode != differentIps[index].mode)
        {
            elm.ip = differentIps[index].ip;
            elm.mode = differentIps[index].mode;
            elm.cmdSet.push
            uniqueiparr.push(elm);                
        }
    }

    // fill the elements correct
    for(let d=0; d < differentIps.length; d++)
    {
        let idx = uniqueiparr.findIndex(x => x.ip == differentIps[d].ip && x.mode == differentIps[d].mode);

        uniqueiparr[idx].cmdSet.push(
            {
                "Cmd" : differentIps[d].cmd,
                "delayNext" : differentIps[d].delayNext
            }
        )
    }

    for(let c=0; c < uniqueiparr.length; c++)
    {
        // check if the device is already added
        let dX = aDeviceHandler.Devices.findIndex(x => x.ip == uniqueiparr[c].ip && x.mode == uniqueiparr[c].mode);

        if(dX == -1)
        {
            if(uniqueiparr[c].mode == "http")
            {
                aDeviceHandler.AddDevice(new CORSUrlCommander(uniqueiparr[c].ip));                    
            }
            else if(uniqueiparr[c].mode == "ws")
            {
                aDeviceHandler.AddDevice(new WebSocketCommander(uniqueiparr[c].ip));
            }

            let nn = new Number(aDeviceHandler.Devices.length-1);
            setTimeout(() => { aDeviceHandler.Devices[nn].executeSetCommands(uniqueiparr[c].cmdSet)},500);
        }
        else
        {
            aDeviceHandler.Devices[dX].executeSetCommands(uniqueiparr[c].cmdSet);
        }
    }
}

// Eine Callback-Funktion für die Befehlsausführung definieren
const customExecuteHandler = async (command, params, req, res) => {

    console.log(`Custom handler processing command: ${command}`);
    elementFnd = findElementByTitle(command);

    if(elementFnd != undefined)
    {
        fire(elementFnd);
    }
};

// Server mit benutzerdefinierten Optionen und einem Callback erstellen
const server = new WebServer({
  httpPort: appconfig.httpPort,
  logRequests: false
}, customExecuteHandler);

// Server starten
server.start()
  .then(() => {
    console.log('Server erfolgreich gestartet');
  })
  .catch(error => {
    console.error('Fehler beim Starten des Servers:', error);
  });

