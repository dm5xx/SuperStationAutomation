// Benötigte Implementierungen für Kommander-Klassen
/*
                "Cmd": "set0/0/1",
                "delayNext": 100,
                "dip": "192.168.97.181",
                "mode": "http"
            },
            {
                "Cmd": "s/0/8/1",
                "delayNext": 100,
                "dip": "192.168.97.181",
                "mode": "ws"
*/

const CORSUrlCommander = require('./CORSUrlCommander'); // Importiere die Implementierung
const WebSocketCommander = require('./WebSocketCommander'); // Importiere die Implementierung

class DeviceHandler {
    constructor(controllers = null) {
        this.Devices = [];
        this.Controllers = controllers;

        if(controllers != null)
            this.initControllers();
    }

    initControllers() {
        this.Controllers.forEach(element => {
            let aDevice = null;

            if(element.Protocol == "http") {
                aDevice = new CORSUrlCommander(element.ContollerIp);
            }
            else if(element.Protocol == "ws") {
                aDevice = new WebSocketCommander(element.ContollerIp);
            }

            this.AddDevice(aDevice);
        });
    }
    
    AddDevice(commander) {    
        let dev = this.Devices.findIndex(x => {x.ip == commander.ip && x.mode == commander.mode});

        if(dev == -1)         
            this.Devices.push(commander);
        else
            console.log("Device to add exists");
    }

    RemoveDevice(ip) {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX == -1) {
            console.log("Cannot remove device of " + ip + " - not existing");
            return;
        }

        this.Devices[devX].close();        
        this.Devices = this.Devices.filter(x => x.ip != ip);
    }

    RemoveAllDevices() {
        for(let a = 0; a < this.Devices.length; a++) {
            this.Devices[a].close();                    
        }

        this.Devices = [];
    }

    GetIndexOfDevice(ip) {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX == -1) {
            console.log("Cannot remove device of " + ip + " - not existing");
            return -1; // Return -1 explicitly for better consistency
        }

        return devX;
    }

    async GetAllStateAsArray(forceCollect = true) {
        let re = [];
        let counter = 0;

        for(let a = 0; a < this.Devices.length; a++) {
            if(forceCollect) {
                let result = await this.GetState(this.Devices[a].ip, forceCollect);
                re.push(result);
                counter++;
            }
            else {
                re.push(this.Devices[a].State);
                counter++;
            }

            if(counter == this.Devices.length)
                return re;
        }
        
        return re; // Added explicit return in case the loop finishes
    }

    async GetState(ip, forceCollect = true) {
        let devX = this.Devices.findIndex(x => x.ip == ip);

        if(devX == -1) {
            console.log(ip + " is no part of the devices ");
            return null; // Return null explicitly for better consistency
        }

        if(!forceCollect)
            return this.Devices[devX].State;

        let ares = await this.Devices[devX].executeGetStatus(this.Devices[devX].GetStatusCmd);
        this.Devices[devX].State = ares;

        console.log("State of " + ip + " updated");

        return this.Devices[devX].State;
    }

    ClearState(ip) {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX > -1)
            this.Devices[devX].State = null;
    }

    ClearAllState() {
        for(let a = 0; a < this.Devices.length; a++) {
            this.Devices[a].State = null;
        }
    }
}

module.exports = DeviceHandler; // Exportiere die Klasse für die Verwendung in anderen Modulen