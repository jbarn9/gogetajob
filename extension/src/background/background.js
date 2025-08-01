//oauth2 auth
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "signIn") {
    console.log("action");
    getAuthToken()
      .then((user) => {
        chrome.storage.local.set({ user: user }, () => {
          sendResponse({ user: user });
        });
      })
      .catch((error) => {
        console.error("Erreur d'authentification:", error.message);
        sendResponse({ error: error.message });
      });
    // Indicates we will send a response asynchronously
    return true;
  } else if (message.action === "signOut") {
    chrome.storage.local.remove("user", () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (message.action === "getGmailLabels") {
    getGmailLabels()
      .then((labels) => {
        sendResponse({ success: true, labels: labels });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (message.action === "getGmailEmails") {
    getGmailEmails()
      .then((emails) => {
        sendResponse({ success: true, emails: emails });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Fonction corrigée pour obtenir le token d'authentification
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      {
        interactive: true,
        scopes: [
          "https://www.googleapis.com/auth/gmail.metadata",
          "https://www.googleapis.com/auth/gmail.labels",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
      },
      async (token) => {
        if (chrome.runtime.lastError) {
          console.error("Erreur OAuth:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        }
        try {
          // Appel à l'API Google UserInfo pour récupérer email, nom, photo
          const res = await fetch(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error("Échec de récupération des infos utilisateur");
          }

          const data = await res.json();
          console.log("data", data);

          resolve({
            email: data.email,
            displayName: data.name || "Utilisateur",
            accessToken: token,
            uid: data.sub,
            profileImage: data.picture || null,
          });
        } catch (error) {
          console.error("Erreur lors de l'appel à l'API UserInfo :", error);
          reject(error);
        }
      }
    );
  });
}

// Récupérer les libellés Gmail
async function getGmailLabels() {
  try {
    const user = await getAuthToken();
    const accessToken = user.accessToken;

    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erreur Gmail API: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des libellés:", error);
    throw error;
  }
}

// get gmail emails
async function getGmailEmails() {
  try {
    const user = await getAuthToken();
    const accessToken = user.accessToken;

    // D'abord, récupérer la liste des messages
    const messagesResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(
        `Erreur Gmail API: ${messagesResponse.status} - ${messagesResponse.statusText}`
      );
    }

    // messages list with json format
    const messagesData = await messagesResponse.json();
    console.log("messagesData", messagesData);

    // Array of emails
    const detailedEmails = [];

    for (const message of messagesData.messages) {
      console.log(message);

      const detailsResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!detailsResponse.ok) {
        throw new Error(
          `Erreur Gmail API: ${detailsResponse.status} - ${detailsResponse.statusText}`
        );
      }
      const emailData = await detailsResponse.json();

      // Extract header informations
      const header = emailData.payload.headers;
      const from = header.find((h) => h.name === "From")?.value || "Inconnu";
      const subject =
        header.find((h) => h.name === "Subject")?.value || "Sans objet";

      detailedEmails.push({
        id: emailData.id,
        threadId: emailData.threadId,
        from: from,
        subject: subject,
      });
    }

    return detailedEmails;
  } catch (error) {
    console.error("Erreur lors de la récupération des emails:", error);
    throw error;
  }
}

async function loadScript(url) {
  var request = new XMLHttpRequest();
  console.log("loadScript");

  request.onreadystatechange = function () {
    if (request.readyState !== 4) {
      return;
    }

    if (request.status !== 200) {
      return;
    }

    eval(request.responseText);
  };

  request.open("GET", url);
  request.send();

  return request;
}

async function authorize() {
  gapi.auth.authorize(
    {
      client_id:
        "924497334126-0t8sieknf09agrrqkd4e3frg23g1dvaa.apps.googleusercontent.com",
      immediate: true,
      scope: "https://www.googleapis.com/auth/gmail.labels",
    },
    function () {
      gapi.client.load("gmail", "v1", gmailAPILoaded);
    }
  );
}

function gmailAPILoaded() {
  //do stuff here
}

/* here are some utility functions for making common gmail requests */
function getThreads(query, labels) {
  return gapi.client.gmail.users.threads.list({
    userId: "me",
    q: query, //optional query
    labelIds: labels, //optional labels
  }); //returns a promise
}

//takes in an array of threads from the getThreads response
function getThreadDetails(threads) {
  var batch = new gapi.client.newBatch();

  for (var ii = 0; ii < threads.length; ii++) {
    batch.add(
      gapi.client.gmail.users.threads.get({
        userId: "me",
        id: threads[ii].id,
      })
    );
  }

  return batch;
}

function getThreadHTML(threadDetails) {
  var body = threadDetails.result.messages[0].payload.parts[1].body.data;
  return B64.decode(body);
}

function archiveThread(id) {
  var request = gapi.client.request({
    path: "/gmail/v1/users/me/threads/" + id + "/modify",
    method: "POST",
    body: {
      removeLabelIds: ["INBOX"],
    },
  });

  request.execute();
}
