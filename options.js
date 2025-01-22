const preferenceName = "schemaValue";

function saveOptions(e) {
  e.preventDefault();
  const val = document.getElementById(preferenceName).value
  browser.storage.local.set({
    [preferenceName]: val
  });
  document.getElementById("action").innerText = `Value saved - ${val.length} characters`
}

function restoreOptions() {
  browser.storage.local.get(preferenceName).then((res) => {
    const val = res[preferenceName] || ''
    document.getElementById(preferenceName).value = val;
    document.getElementById("action").innerText = `Loaded ${val.length} characters`;
  });
}

document.getElementById("action").innerText = `Loading settings ... `;
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
