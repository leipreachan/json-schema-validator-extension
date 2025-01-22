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
        console.log(schema);
        // const jsonData = JSON.parse(message.text);
        const jsonData = message.text;
        console.log(jsonData);
        if (!parser) {
          throw new Error("'schemaSafe' is not loaded yet");
        }
        // https://github.com/ExodusMovement/schemasafe
        const parse = parser(schema, {
          mode: 'spec',
          includeErrors: true,
          allErrors: true
        });
        const valid = parse(jsonData);

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
