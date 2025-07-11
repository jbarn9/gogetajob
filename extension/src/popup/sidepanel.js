const GOOGLE_ORIGIN = "https://www.google.com";
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on google.com
  if (url.origin === GOOGLE_ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel.html",
      enabled: true,
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");

  function updateUI(user) {
    if (user) {
      userInfo.textContent = `Connecté : ${user.email}`;
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
    } else {
      userInfo.textContent = "Déconnecté";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
    }
  }

  chrome.storage.local.get(["user"], function (result) {
    updateUI(result.user);
  });

  signInButton.addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      if (response.user) {
        updateUI(response.user);
      }
    });
  });

  signOutButton.addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "signOut" }, function () {
      updateUI(null);
    });
  });
});
