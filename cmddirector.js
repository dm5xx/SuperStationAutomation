 class CmdDirector {
    constructor(devHandler) {
        this.deviceHandler = devHandler;
    }

    // {"Status":{"B0":7,"B1":0,"B2":0,"B3":0,"B4":1,"LockStatus":false,"Interlock":false},"Mode":"ws","ip":"192.168.0.104"}
    convertCompleteBankResultToCmdSet(StatusJsonForController, delay, isSetPins = false)
    {
        let resulsetarray = [];

        Object.entries(StatusJsonForController.Status).forEach(entry => {
                const [key, value] = entry;

                if(key.startsWith("B"))
                {

                    let bank = key.replace("B","");
                    let val = value; 
                    let newcmd = {};
                    
                    if(StatusJsonForController.Mode == "ws")
                    {
                        let pfx = "S";

                        if(isSetPins)
                            pfx = "s";

                        newcmd.Cmd = pfx+"/"+bank+"/"+val;
                    }
                    else if(StatusJsonForController.Mode == "http")
                    {
                        let pfx = "Set";

                        if(isSetPins)
                            pfx = "set";
                        newcmd.Cmd = pfx+bank+"/"+val;
                    }

                    newcmd.delayNext = delay;

                    resulsetarray.push(newcmd);
                }
        });

        return resulsetarray;
    }

    updateDeviceWithCmdSet(ip, sets)
    {
        let devX = this.deviceHandler.Devices.findIndex(x => x.ip == ip);

        if(devX!=-1)
        {
            this.deviceHandler.Devices[devX].executeSetCommands(sets);
            console.log("Controller with ip "+ip+" updated to new set of cmds");
        }
    }    
}
