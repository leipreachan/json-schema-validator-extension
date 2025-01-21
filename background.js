browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "validateJSON") {
      browser.storage.sync.get('schemaPath').then((res) => {
        const schemaPath = res.schemaPath;
        
        if (!schemaPath) {
          sendResponse({ isValid: false, message: "Schema path not set. Please set it in the extension options." });
          return;
        }
  
        fetch(schemaPath)
          .then(response => response.json())
          .then(schema => {
            try {
              const jsonData = JSON.parse(message.text);
              const Ajv = require("ajv");
              const ajv = new Ajv();
              const validate = ajv.compile(schema);
              const valid = validate(jsonData);
  
              if (valid) {
                sendResponse({ isValid: true, message: "Valid JSON" });
              } else {
                sendResponse({ isValid: false, message: "Invalid JSON: " + ajv.errorsText(validate.errors) });
              }
            } catch (error) {
              sendResponse({ isValid: false, message: "Invalid JSON: " + error.message });
            }
          })
          .catch(error => {
            sendResponse({ isValid: false, message: "Error loading schema: " + error.message });
          });
      });
      return true; // Indicates that the response is sent asynchronously
    }
  });
  