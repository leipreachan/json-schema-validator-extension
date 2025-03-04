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
        // console.log("schema", schema);
        const jsonData = message.text;
        // console.log("data", jsonData);
        if (!parser) {
          throw new Error("'schemaSafe' is not loaded yet");
        }
        if (jsonData.length == 0 || Object.keys(JSON.parse(jsonData)).length == 0) {
          throw new Error("Empty JSON");
        }
        // https://github.com/ExodusMovement/schemasafe
        const parse = parser(schema, {
          mode: 'spec',
          includeErrors: true,
          allErrors: true
        });
        const validationResult = parse(jsonData);
        console.log(validationResult);

        browser.tabs.sendMessage(sender.tab.id, {
          action: "validationResult",
          isValid: validationResult.valid,
          message: validationResult.error || "Valid JSON",
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
