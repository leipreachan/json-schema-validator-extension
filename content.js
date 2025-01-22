function addCss() {
  const linkElem = document.createElement('link');
  linkElem.setAttribute('rel', 'stylesheet');
  linkElem.setAttribute('href', browser.runtime.getURL('/styles.css'));
  document.body.append(linkElem);
}

function addValidationButtons() {
  const jsonElements = document.querySelectorAll('.highlight-source-json');
  jsonElements.forEach((element, index) => {
    className = 'json-validate-btn';
    id = `${className}-${index}`;
    if (document.getElementById(id) == null) {
      const button = document.createElement('button');
      button.setAttribute('id', id);
      button.textContent = 'Validate JSON';
      button.className = className;
      button.dataset.index = index;
      element.parentNode.insertBefore(button, element);

      const validationMessage = document.createElement('div');
      validationMessage.className = 'json-validation-message'
      validationMessage.dataset.index = index;
      element.parentNode.insertBefore(validationMessage, element);
    }
  });
}

function validateJSON(text, index) {
  browser.runtime.sendMessage({ action: "validateJSON", text: text, index: index });
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('json-validate-btn')) {
    const index = event.target.dataset.index;
    const jsonElement = document.querySelectorAll('.highlight-source-json')[index];
    const jsonText = jsonElement.textContent;
    validateJSON(jsonText, index);
  }
});

addValidationButtons();
addCss();

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "validationResult") {
    console.log(`validationResult: ${JSON.stringify(message)}`);
    const buttons = document.querySelectorAll('.json-validation-message');
    const button = buttons[message.index];
    const cd = new Date()
    const cds = `${(""+cd.getHours()).padStart(2, "0")}:${(""+cd.getMinutes()).padStart(2, "0")}:${(""+cd.getSeconds()).padStart(2, "0")}: ` ;
    button.textContent = cds + (message.isValid ? "Valid JSON" : `Invalid JSON: ${message.message}`);
    button.style.backgroundColor = message.isValid ? "#41ce3d" : "#ee3e3e";
    button.style.color = "white";
  }
});
