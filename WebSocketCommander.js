const WebSocket = require('ws');

class WebSocketCommander {
    constructor(ip) {
        this.GetStatusCmd = "G";
        this.ip = ip;
        this.url = "ws://" + ip + ":59/xxws";
        this.mode = "ws";
        this.socket = null;
        this.State = null;
        this.isConnecting = false;
        this.init();
    }

    async init() {
        await this.connect();
    }

    async connect(overwrite = false) {
        if (overwrite == true || this.isConnecting == true || this.socket != null && (this.socket.readyState == WebSocket.OPEN || this.socket.readyState == WebSocket.CONNECTING)) {
            this.updateStatus('WS existe and WS already open');
            return;
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.url, ['cors']);
                
                this.socket.on('open', () => {
                    this.isConnecting = false;
                    this.updateStatus('Connected');
                    resolve(this.socket);
                });
                
                this.socket.on('error', (error) => {
                    this.isConnecting = false;
                    this.updateStatus('Connection Error');
                    reject(error);
                });
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    async executeSetCommands(t) {
        try {            
            await this.connect();

            if (t == null)
               return;

            for (const command of t) {
                await new Promise(resolve => setTimeout(resolve, command.delayNext));
                    
                this.socket.send(command.Cmd);
                this.updateStatus(`Sent: ${command.Cmd}`);
            }
        } catch (error) {
            this.updateStatus(`Execution Error: ${error.message}`);
        }
    }

    async executeGetStatus(getstatuscmd) {
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
                let response;
                try {
                    response = JSON.parse(event.data);
                } catch (e) {
                    response = event.data; // Fallback wenn kein gültiger JSON
                }

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
                this.socket.removeListener('message', messageHandler);
                this.socket.removeListener('error', errorHandler);
            };
    
            // Add event listeners
            this.socket.on('message', messageHandler);
            this.socket.on('error', errorHandler);
    
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

module.exports = WebSocketCommander;