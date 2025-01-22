// https://cdnjs.com/libraries/ajv
// https://unpkg.com/@exodus/schemasafe@1.3.0/src/index.js
const preferenceName = "schemaValue";

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "validateJSON") {
    browser.storage.local.get(preferenceName).then((res) => {
      const schemaContent = res[preferenceName];
      
      if (!schemaContent) {
        browser.tabs.sendMessage(sender.tab.id, {
          action: "validationResult",
          isValid: false,
          message: "Schema path not set",
          index: message.index
        });
        return;
      }

      try {
        const schema = JSON.parse(schemaContent)
        const jsonData = JSON.parse(message.text);
        if (!schemaSafe) {
          throw new Error("'schemaSafe' is not loaded yet");
        }
        const validate = schemaSafe.validator(schema, { includeErrors: true });
        const valid = validate(jsonData);

        browser.tabs.sendMessage(sender.tab.id, {
          action: "validationResult",
          isValid: valid,
          message: valid ? "Valid JSON" : ajv.errorsText(validate.errors),
          index: message.index
        });
      } catch (error) {
        browser.tabs.sendMessage(sender.tab.id, {
          action: "validationResult",
          isValid: false,
          message: error.message,
          index: message.index
        });
      }
        
    });
    return true;
  }
});
