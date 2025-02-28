const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');

class WebServer {
  constructor(options = {}, executeCallback = null) {
    // Standard-Konfigurationsoptionen
    this.config = {
      httpPort: options.httpPort || 3000,
      logRequests: options.logRequests !== undefined ? options.logRequests : true
    };
    
    // Callback-Funktion für Execute-Endpoint
    this.executeCallback = executeCallback;
    
    // Express-App initialisieren
    this.app = express();
    this.httpServer = null;
    
    // Middleware einrichten
    this.setupMiddleware();
    
    // Routes definieren
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // JSON-Parser für Request-Body
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Request-Logging
    if (this.config.logRequests) {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
      });
    }
  }
  
  setupRoutes() {
    // Execute-Endpoint als GET-Route
    this.app.get('/execute', async (req, res) => {
      try {
        // Parameter aus Query-String auslesen
        const command = req.query.command;
        
        if (!command) {
          return res.status(400).json({ 
            success: false, 
            error: 'Command parameter is required' 
          });
        }
        
        // Alle anderen Parameter, außer 'command', in ein params-Objekt sammeln
        const params = {};
        for (const key in req.query) {
          if (key !== 'command') {
            params[key] = req.query[key];
          }
        }
        
        let result;
        
        result = await this.executeCallback(command, params, req, res);
        
        // Wenn die Antwort noch nicht gesendet wurde (z.B. durch den Callback)
        if (!res.headersSent) {
          res.json({ 
            success: true, 
            result 
          });
        }
      } catch (error) {
        console.error('Error in /execute endpoint:', error);
        
        // Nur antworten, wenn die Antwort noch nicht gesendet wurde
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
          });
        }
      }
    });    
  }
    
  start() {
    return new Promise((resolve, reject) => {
      try {
        // HTTP-Server starten
        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(this.config.httpPort, () => {
          console.log(`HTTP server running on port ${this.config.httpPort}`);
          resolve(this);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  stop() {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('HTTP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = WebServer;