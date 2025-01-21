document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      browser.runtime.sendMessage({ action: "validateJSON", text: selectedText })
        .then(response => {
          const validationMessage = document.createElement('span');
          validationMessage.textContent = response.message;
          validationMessage.style.backgroundColor = response.isValid ? 'green' : 'red';
          validationMessage.style.color = 'white';
          validationMessage.style.padding = '2px 5px';
          validationMessage.style.borderRadius = '3px';
          validationMessage.style.position = 'absolute';
          validationMessage.style.zIndex = '9999';
  
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
  
          validationMessage.style.left = `${rect.right + window.scrollX}px`;
          validationMessage.style.top = `${rect.top + window.scrollY}px`;
  
          document.body.appendChild(validationMessage);
  
          setTimeout(() => {
            document.body.removeChild(validationMessage);
          }, 3000);
        });
    }
  });
  