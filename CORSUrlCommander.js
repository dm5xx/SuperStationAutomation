//const fetch = require('node-fetch'); // Für Node.js vor Version 18

class CORSUrlCommander {
    constructor(ip) {
        this.ip = ip;
        this.url = "http://"+ip+":59/";
        this.GetStatusCmd = "Get/";
        this.mode = "http";
        this.State = null;
    }

    async executeSetCommands(t) {
        if(t == null)
            return;

        for(const step of t) {
            try {
                await new Promise(resolve => setTimeout(resolve, step.delayNext));

                const response = await fetch(this.url+step.Cmd, {
                    method: 'GET'
                    // mode: 'cors' entfernt, da dies ein Browser-Konzept ist
                });
        
                if (!response.ok) {
                    console.error(`Failed to fetch ${this.url+step.Cmd}: ${response.status}`);
                }
            } catch (error) {
                console.error('Command execution error:', error);
            }
        }
    }

    async executeGetStatus(getstatuscmd) {
        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const response = await fetch(this.url+getstatuscmd, {
                method: 'GET'
                // mode: 'cors' entfernt, da dies ein Browser-Konzept ist
            });
    
            if (!response.ok) {
                console.error(`Failed to fetch ${this.url+getstatuscmd}: ${response.status}`);
            }
            else {
                let res = {};
                res.Status = await response.json(); 
                res.Mode = this.mode;
                res.ip = this.ip;

                return res;
            }
        } catch (error) {
            console.error('Command execution error:', error);
        }
    }

    close() {
        console.log('Http Closed :p');
    }
}

module.exports = CORSUrlCommander; // Export der Klasse für die Verwendung in anderen Dateien