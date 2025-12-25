const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require("path");
const cors = require("cors");

class WebServer {
  constructor(options = {}, executeCallback = null, renewDeviceHandler = null, forceWebsocketReconnect = null) {
    // Standard-Konfigurationsoptionen
    this.config = {
      httpPort: options.httpPort || 3000,
      logRequests: options.logRequests !== undefined ? options.logRequests : true,
      password: options.password || "magicmike"
    };
    
    // Callback-Funktion für Execute-Endpoint
    this.executeCallback = executeCallback;
    this.renewDeviceHandler = renewDeviceHandler;
    this.forceWebsocketReconnect = forceWebsocketReconnect;


    // Express-App initialisieren
    this.app = express();
    this.httpServer = null;
    
    // Middleware einrichten
    this.setupMiddleware();
    
    // Routes definieren
    this.setupRoutes();
  }
  
  setupMiddleware() {

    this.app.use(
      cors({ origin: "*" })
    );
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

    this.app.use(express.static('./'))

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
    
    this.app.get("/creator", (req, res) => {
      const filename = req.query.fn ? `${req.query.fn}.html` : null;
      const myjson = req.query.jn ? `${req.query.jn}.json` : null;

      if (!filename) {
          return res.send("No filename provided. Use ?fn=yourfile");
      }

      // Only allow HTML files
      if (path.extname(filename) !== ".html") {
          return res.status(400).send("Error: Invalid file type. Only HTML files are allowed.");
      }

      try {
          const processedContent = this.processHTMLFile(filename, myjson, req);
          res.send(processedContent);
      } catch (err) {
          res.status(500).send(`An error occurred: ${err.message}`);
      }
    });

    this.app.get("/jsonhandlerread", (req, res) => {
      const filename = req.query.fn;

      if (!filename) {
          return res
              .status(400)
              .json({ State: "FileNotFound" });
      }

      const safeFilename = path.basename(filename);
      const filepath = path.join(__dirname, "JSON", safeFilename);

      if (!fs.existsSync(filepath)) {
          return res
              .status(404)
              .json({ State: "FileNotFound" });
      }

      try {
          const data = fs.readFileSync(filepath, "utf8");
          res.setHeader("Content-Type", "application/json");
          res.send(data);
      } catch (err) {
          res.status(500).json({ State: "ReadError" });
      }
    });

    this.app.post("/jsonhandlerwrite", (req, res) => {
      const filename = req.query.fn;

      if (!filename) {
          return res.status(400).json({ State: "MissingFilename" });
      }

      const safeFilename = path.basename(filename);
      const filepath = path.join(__dirname, "JSON", safeFilename);

      // if (!req.body || typeof req.body.json === "undefined") {
      //     return res.status(400).json({ State: "InvalidJSON" });
      // }

      try {
          const cleanedJson = JSON.stringify(req.body).replace(/\\/g, "");
          fs.writeFileSync(filepath, cleanedJson, "utf8");

          res.json({ State: "Save" });
      } catch (err) {
          res.status(500).json({ State: "WriteError" });
      }
    });

    this.app.get("/newbuttonfile", (req, res) => {
      res.setHeader("Content-Type", "application/json");

      // Get filename from query
      let filename = req.query.fn || "";

      // Validate filename
      if (!filename) {
          return res.json({ success: false, message: "Filename is required" });
      }

      // Sanitize filename
      filename = path.basename(filename); // remove path components
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, "");

      // Ensure .json extension
      if (!filename.endsWith(".json")) {
          filename += ".json";
      }

      const directory = path.join(__dirname, "JSON");
      const filepath = path.join(directory, filename);

      try {
          // Read template
          const templatePath = path.join(directory, "btnTemplate.json");
          const templateData = fs.readFileSync(templatePath, "utf8");

          // Create/write file
          fs.writeFileSync(filepath, templateData, "utf8");

          res.json({ success: 1 });
      } catch (err) {
          console.error(err);
          res.status(500).json({ success: false, message: "Server error" });
      }
    });

    this.app.get('/writeappconfig', (req, res) => {
      const { content } = req.query;

      if (!content) {
          return res.status(400).json({ error: 'Parameter "content" fehlt' });
      }

      let jsonData;
      try {
          jsonData = JSON.parse(content);
      } catch (err) {
          return res.status(400).json({ error: 'content ist kein gültiger JSON-String' });
      }

      const filePath = path.join(__dirname, './JSON/appconfig.json');

      fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), 'utf8', (err) => {
          if (err) {
              return res.status(500).json({ error: 'Datei konnte nicht geschrieben werden' });
          }

          res.json({
              State: '200',
              path: filePath
          });
      });
    });

    this.app.post("/filedominator", (req, res) => {
      const { filename, content, p} = req.body;

      if (p !== this.config.password || !filename || content === undefined) {
          return res.status(400).json({ message: "filename und content erforderlich" });
      }

      const safeFilename = path.basename(filename);
      const filePath = path.join(__dirname, './JSON/'+safeFilename);

      fs.writeFile(filePath, content, "utf8", err => {
          if (err) {
              return res.status(500).json({ message: "Fehler beim Speichern" });
          }
          res.json({ message: `Datei '${safeFilename}' gespeichert` });
      });
    });

    this.app.get("/listjson", (req, res) => {
    fs.readdir(__dirname+'/JSON', { withFileTypes: true }, (err, entries) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Verzeichnis konnte nicht gelesen werden"
            });
        }

        const files = entries
            .filter(entry => entry.isFile())
            .map(entry => entry.name);

        res.json({
            success: true,
            directory: __dirname + '/JSON',
            count: files.length,
            files: files
        });
    });
    });

    this.app.get("/deletefile", (req, res) => {
        const { p, filename } = req.query;

        if (p !== this.config.password || !filename) {
            return res.status(404).json({
                success: false,
                message: "Datei nicht gefunden oder Zugriff verweigert"
            });
        }

        const safeFilename = path.basename(filename);
        const filePath = path.join(__dirname+'/JSON', safeFilename);

        fs.unlink(filePath, err => {
            if (err) {
                return res.status(404).json({
                    success: false,
                    message: "Datei nicht gefunden oder konnte nicht gelöscht werden"
                });
            }

            res.status(200).json({
                success: true,
                message: `Datei '${safeFilename}' gelöscht`
            });
        });
    });

    this.app.get("/shutdown", (req, res) => {
      const { p } = req.query;
      if (p !== this.config.password) {
        return res.status(404).json({
              success: false,
              message: "Zugriff verweigert"
          });
        }
        res.status(200).json({
            success: true,
            message: "Node.js Prozess wird beendet"
        });

        // kurze Verzögerung, damit die Antwort noch gesendet wird
        setTimeout(() => {
            console.log("Shutdown über /shutdown ausgelöst");
            process.exit(0);
        }, 100);
    });

    this.app.get("/renewdevices", (req, res) => {
      const { p } = req.query;
      if (p !== this.config.password) {
        return res.status(404).json({
              success: false,
              message: "Zugriff verweigert"
          });
        }
        res.status(200).json({
            success: true,
            message: "Geräte neu initialisiert"
        });

        // kurze Verzögerung, damit die Antwort noch gesendet wird
        setTimeout(() => {
          this.renewDeviceHandler();
        }, 100);
    });

    this.app.get("/forcewebsocketreconnect", (req, res) => {
      const { p } = req.query;
      if (p !== this.config.password) {
        return res.status(404).json({
              success: false,
              message: "Zugriff verweigert"
          });
        }
        res.status(200).json({
            success: true,
            message: "Websocket-Verbindungen erneut herstellen"
        });

        // kurze Verzögerung, damit die Antwort noch gesendet wird
        setTimeout(() => {
          this.forceWebsocketReconnect();
        }, 100);
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

  processHTMLFile(filename, myjson, req) {
    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filepath = path.join(__dirname, safeFilename);

    const safeJsonName = myjson ? path.basename(myjson) : null;
    const jsonFilePath = safeJsonName
        ? path.join(__dirname, "JSON", safeJsonName)
        : null;

    console.log(filepath);

    // Check file existence & readability
    if (!fs.existsSync(filepath)) {
        throw new Error("Error: File not found or not readable.");
    }

    let content = fs.readFileSync(filepath, "utf8");

    // let controllers file be local! 
    if (filename === "buttons.html" && myjson) {
        const jsonContent = fs.readFileSync(jsonFilePath, "utf8");

        const protocol = req.secure ? "https" : "http";
        let baseUrl = `${protocol}://${req.get("host")}${path.dirname(req.originalUrl)}`.replace();

        
        if (baseUrl.substring(baseUrl.length-1) == "/")
        {
            baseUrl = baseUrl.substring(0, baseUrl.length-1);
        }
        
        const actualLink = `${baseUrl}/jsonhandlerwrite`;
        const actualLinkNewButtonFile = `${baseUrl}/newbuttonfile`;

        const replacements = {
            "let buttonJson = null;": `let buttonJson = ${jsonContent};`,
            "readConfigFile()": "readConfigServer()",
            "./jsonhandlerread.php?fn=": `./jsonhandlerread?fn=${myjson}`,
            "saveFile(": "saveToServer(",
            "%URLPLACEHOLDER%": `${actualLink}?fn=${myjson}`,
            "//NEWFILEATSERVERJS": fs
                .readFileSync("./newfileplaceholderjs.txt", "utf8")
                .replace("%pathnewbuttonfile%", actualLinkNewButtonFile),
            "<!--NEWFILEATSERVERHTML-->": fs.readFileSync(
                "./newfileplaceholderhtml.txt",
                "utf8"
            ),
            "onclick=\"fopenOverlay()\" style=\"visibility: hidden;\"":
                "onclick=\"fopenOverlay()\" style=\"visibility: show;\""
        };

        for (const [search, replace] of Object.entries(replacements)) {
            content = content.split(search).join(replace);
        }
    }

    return content;
  }

}

module.exports = WebServer;