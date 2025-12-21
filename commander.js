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

        for(const step of t)
        {
            try {
                await new Promise(resolve => setTimeout(resolve, step.delayNext));

                const response = await fetch(this.url+step.Cmd, {
                    method: 'GET',
                    mode: 'cors'
                });
        
                if (!response.ok) {
                    console.error(`Failed to fetch ${this.url+step.Cmd}: ${response.status}`);
                }
            } catch (error) {
                console.error('Command execution error:', error);
            }
        }
    }

    async executeGetStatus(getstatuscmd)
    {
        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const response = await fetch(this.url+getstatuscmd, {
                method: 'GET',
                mode: 'cors'
            });
    
            if (!response.ok) {
                console.error(`Failed to fetch ${this.url+getstatuscmd}: ${response.status}`);
            }
            else
            {
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

class WebSocketCommander {

    isConnecting = false;

    constructor(ip) {
        this.GetStatusCmd = "G";
        this.ip = ip;
        this.url = "ws://"+ip+":59/xxws";
        this.mode = "ws";
        this.socket = null;
        this.State = null;
        this.init();
    }

    async init()
    {
        await this.connect();
    }

    async connect(overwrite = false) {
        if(overwrite == true || this.isConnecting == true || this.socket != null && (this.socket.readyState == WebSocket.OPEN || this.socket.readyState == WebSocket.CONNECTING))
        {
            this.updateStatus('WS existe and WS already open');
            return;
        }

        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.url, ['cors']);
            
            this.socket.onopen = () => {
                this.updateStatus('Connected');
                resolve(this.socket);
            };
            
            this.socket.onerror = (error) => {
                this.updateStatus('Connection Error');
                reject(error);
            };
        });
    }

    async executeSetCommands(t) {
        try {            
            await this.connect();

            if(t==null)
               return;

            for(const command of t)
            {
                await new Promise(resolve => setTimeout(resolve, command.delayNext));
                    
                this.socket.send(command.Cmd);
                this.updateStatus(`Sent: ${command.Cmd}`);
            }
        } catch (error) {
            this.updateStatus(`Execution Error: ${error.message}`);
        }
    }

    async executeGetStatus(getstatuscmd)
    {
        try {
            await this.connect();
            const response = await this.#sendWebSocketCommand(getstatuscmd);
            return response;                
        } catch (error) {
            this.updateStatus(`Execution Error: ${error.message}`);
        }
    }

    async #sendWebSocketCommand(command, timeout = 5000) {
        return new Promise((resolve, reject) => {

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('WebSocket response timeout'));
            }, timeout);
    
            // Message handler
            const messageHandler = (event) => {
                const response = JSON.parse(event.data);

                let res = {};
                res.Status = response;
                res.Mode = this.mode;
                res.ip = this.ip;

                cleanup();
                resolve(res);
            };
    
            // Error handler
            const errorHandler = (error) => {
                cleanup();
                reject(error);
            };
    
            // Cleanup function to remove listeners
            const cleanup = () => {
                clearTimeout(timeoutId);
                this.socket.removeEventListener('message', messageHandler);
                this.socket.removeEventListener('error', errorHandler);
            };
    
            // Add event listeners
            this.socket.addEventListener('message', messageHandler);
            this.socket.addEventListener('error', errorHandler);
    
            // Send the command
            try {
                this.socket.send(command);
            } catch (error) {
                cleanup();
                reject(error);
            }
        });
    }

    updateStatus(message) {
        console.log(message);
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.updateStatus('WebSocket Closed');
        }
    }
}

//         s/<banknr>/<pin>/<0/1></pin>"    S/<banknr>/<value>