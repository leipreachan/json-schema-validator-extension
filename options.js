function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
      schemaPath: document.getElementById('schemaPath').value
    });
  }
  
  function restoreOptions() {
    browser.storage.sync.get('schemaPath').then((res) => {
      document.getElementById('schemaPath').value = res.schemaPath || '';
    });
  }
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);
  