 class DeviceHandler {
    constructor(controllers = null) {
        this.Devices = [];
        this.Controllers = controllers;

        if(controllers != null)
            this.initControllers();
    }

    initControllers()
    {
        this.Controllers.forEach(element => {

            let aDevice = null;

            if(element.Protocol == "http")
            {
                aDevice = new CORSUrlCommander(element.ContollerIp);
            }
            else if(element.Protocol == "ws")
            {
                aDevice = new WebSocketCommander(element.ContollerIp);
            }

            this.AddDevice(aDevice);
        });
    }
    
    AddDevice(commander) {    
        let dev = this.Devices.findIndex(x => x.ip == commander.ip && x.mode == commander.mode);

        if(dev==-1)         
            this.Devices.push(commander);
        else
         console.log("Device to add exists");
    }

    RemoveDevice(ip)
    {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX == -1)
        {
            console.log("Cannot remove device of "+ip+" - not existing");
            return 
        }

        this.Devices[devX].close();        
        this.Devices = this.Devices.filter(x => x.ip != ip);
    }

    RemoveAllDevices()
    {
        for(let a=0; a < this.Devices.length; a++)
        {
            this.Devices[a].close();                    
        }

        this.Devices = [];
    }

    GetIndexOfDevice(ip)
    {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX == -1)
        {
            console.log("Cannot remove device of "+ip+" - not existing");
            return 
        }

        return devX;
    }

    async GetAllStateAsArray(forceCollect = true)
    {
        let re = [];
        let counter = 0;

        for(let a=0; a<this.Devices.length; a++)
        {
            let r = null;
            
            if(forceCollect)
            {
                let result = await this.GetState(this.Devices[a].ip, forceCollect);
                re.push(result);
                counter++;
            }
            else
            {
                re.push(this.Devices[a].State);
                counter++;
            }

            if(counter==this.Devices.length)
                return re;
        }
    }

    async GetState(ip, forceCollect = true)
    {
        let devX = this.Devices.findIndex(x => x.ip == ip);

        if(devX == -1)
        {
            console.log(ip+ " is no part of the devices ");
            return;
        }

        if(!forceCollect)
            return this.Devices[devX].State;

        let ares = await this.Devices[devX].executeGetStatus(this.Devices[devX].GetStatusCmd);
        this.Devices[devX].State = ares;

        console.log("State of "+ip+" updated");

        return this.Devices[devX].State;
    }

    ClearState(ip)
    {
        let devX = this.Devices.findIndex(x => x.ip == ip);
        
        if(devX > -1)
            this.Devices[devX].State = null;
    }

    ClearAllState()
    {
        for(const elm in this.Devices)
            elm.State = null;
    }
}

