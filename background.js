const ajv = new Ajv();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "validateJSON") {
    browser.storage.sync.get('schemaPath').then((res) => {
      const schemaPath = res.schemaPath;
      console.log(`schemaPath: ${schemaPath}`);
      
      if (!schemaPath) {
        browser.tabs.sendMessage(sender.tab.id, {
          action: "validationResult",
          isValid: false,
          message: "Schema path not set",
          index: message.index
        });
        return;
      }

      fetch(schemaPath)
        .then(response => response.json())
        .then(schema => {
          try {
            console.log(`schema: ${schema}`);
            const jsonData = JSON.parse(message.text);
            if (!Ajv) {
              throw new Error("Ajv is not loaded yet");
            }
            const validate = ajv.compile(schema);
            const valid = validate(jsonData);

            browser.tabs.sendMessage(sender.tab.id, {
              action: "validationResult",
              isValid: valid,
              message: valid ? "Valid JSON" : "Invalid JSON: " + ajv.errorsText(validate.errors),
              index: message.index
            });
          } catch (error) {
            browser.tabs.sendMessage(sender.tab.id, {
              action: "validationResult",
              isValid: false,
              message: "Invalid JSON: " + error.message,
              index: message.index
            });
          }
        })
        .catch(error => {
          browser.tabs.sendMessage(sender.tab.id, {
            action: "validationResult",
            isValid: false,
            message: "Error loading schema: " + error.message,
            index: message.index
          });
        });
    });
    return true;
  }
});
