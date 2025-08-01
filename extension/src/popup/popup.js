// Importer les styles CSS
import "../styles/index.js";

document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");
  const getLabelsBtn = document.getElementById("getLabelsBtn");
  const getEmailsBtn = document.getElementById("getEmailsBtn");
  const resultsDiv = document.getElementById("results");
  const userEmail = document.getElementById("userEmail");
  const API_URL = "https://evening-plateau-32510-8b2c133dbe66.herokuapp.com/";
  var iduser = null;

  console.log("Popup chargé");

  // if user, update profile
  function updateUI(user) {
    console.log(user ? user : "non connecté");

    if (user) {
      userInfo.innerHTML = `Compte connecté : <div id='userEmail'>${user.email}<div>`;
      userEmail.textContent = `${user.email}`;
      userEmail.style.fontWeight = "600";
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
      if (getLabelsBtn) getLabelsBtn.style.display = "block";
      if (getEmailsBtn) getEmailsBtn.style.display = "block";
    } else {
      userInfo.textContent = "Non connecté";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
      if (getLabelsBtn) getLabelsBtn.style.display = "none";
      if (getEmailsBtn) getEmailsBtn.style.display = "none";
    }
  }

  // Check if user is already connected
  chrome.storage.local.get(["user"], function (result) {
    updateUI(result.user);
    iduser = result.user;
  });
  // event onclick sign in btn
  signInButton.addEventListener("click", function () {
    console.log("Clic sur le bouton de connexion dans le popup");
    chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      console.log("Réponse reçue dans le popup:", response);

      if (chrome.runtime.lastError) {
        console.error("Erreur runtime:", chrome.runtime.lastError);
        userInfo.textContent = "Erreur de connexion";
        return;
      }

      if (response && response.user) {
        updateUI(response.user);
        // Fetch all labels from db with heroku
        fetch(API_URL + iduser.uid)
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            const arrayOfItems = data.map((items) => items.item);
            insertHtml(arrayOfItems);
          });
      } else if (response && response.error) {
        console.error("Erreur d'authentification:", response.error);
        userInfo.textContent = `Erreur: ${response.error}`;
      } else {
        console.error("Réponse invalide:", response);
        userInfo.textContent = "Erreur de connexion";
      }
    });
  });
  // on click sign out btn
  signOutButton.addEventListener("click", function () {
    console.log("Clic sur le bouton de déconnexion dans le popup");
    chrome.runtime.sendMessage({ action: "signOut" }, function (response) {
      console.log("Réponse déconnexion dans le popup:", response);
      updateUI(null);
      if (resultsDiv) resultsDiv.innerHTML = "";
    });
  });

  // onclick btn get labels
  if (getLabelsBtn) {
    getLabelsBtn.addEventListener("click", function () {
      console.log("Récupération des libellés Gmail...");
      if (resultsDiv) resultsDiv.innerHTML = "Récupération des libellés...";

      chrome.runtime.sendMessage(
        { action: "getGmailLabels" },
        function (response) {
          console.log("Réponse libellés:", response);

          if (chrome.runtime.lastError) {
            console.error("Erreur runtime:", chrome.runtime.lastError);
            if (resultsDiv)
              resultsDiv.innerHTML = "Erreur de récupération des libellés";
            return;
          }

          if (response && response.success) {
            console.log(response.labels);
            displayLabels(response.labels);
          } else if (response && response.error) {
            console.error("Erreur libellés:", response.error);
            if (resultsDiv) resultsDiv.innerHTML = `Erreur: ${response.error}`;
          }
        }
      );
    });
  }

  // Button to synchronize emails from gmail API
  if (getEmailsBtn) {
    getEmailsBtn.addEventListener("click", function () {
      if (resultsDiv) resultsDiv.innerHTML = "Récupération des emails...";
      // when action message is getGmailEmails
      chrome.runtime.sendMessage(
        { action: "getGmailEmails" },
        function (response) {
          // if error
          if (chrome.runtime.lastError) {
            console.error("Erreur runtime:", chrome.runtime.lastError);
            if (resultsDiv)
              resultsDiv.innerHTML = "Erreur de récupération des emails";
            return;
          }
          // if success
          if (response && response.success) {
            console.log("data", response);
            displayEmails(response.emails);
          } else if (response && response.error) {
            console.error("Erreur emails:", response.error);
            if (resultsDiv) resultsDiv.innerHTML = `Erreur: ${response.error}`;
          }
        }
      );
    });
  }

  // Display labels
  function displayLabels(labels) {
    console.log("userid", iduser.uid);

    if (!resultsDiv) return;

    // there is no labels inside candidatures directory
    if (!labels.labels || labels.labels.length === 0) {
      resultsDiv.innerHTML += "<p>Aucun libellé trouvé</p>";
      return;
    }

    // filter labels to get "applications" labels only
    const allApplications = labels.labels.filter(
      (label) =>
        label.name && label.name.toLowerCase().includes("candidatures/")
    );

    // fetch new labels inside candidatures dir
    fetch(API_URL + iduser.uid)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        // get data id only to compare with allApplications ids
        const idApp = data.map((app) => app.item.id);

        allApplications.map((items, index) => {
          // test if idApp include allapp id
          if (!idApp.includes(items.id)) {
            allApplications[index].iduser = iduser;
            allApplications[index].messagesTotal = items.messagesTotal || 0;
            allApplications[index].new = 1;
            console.log(allApplications[index]);
            setTimeout(() => {
              fetch(API_URL + "add", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(allApplications[index]),
              })
                .then((res) => res.json())
                .then((docRef) => {
                  console.log("Document written with ID: ", docRef.id);
                })
                .catch((error) => {
                  console.error("Error adding document: ", error);
                });
            }, index * 200);
          }
        });

        if (allApplications.length === 0) {
          resultsDiv.innerHTML +=
            "<p>Aucun nouveau libellé 'Candidatures' trouvé</p>";
          return;
        }
        insertHtml(allApplications);
      });
  }
  // create the HTML
  function insertHtml(arrayofapplications) {
    console.log(arrayofapplications);

    // HTML labels displayer
    const labelsHTML = arrayofapplications
      .map(
        (label) => `
              <div class="label-item ">
              ${label.new ? "<div class='new-label'>New!</div>" : ""}
              <h4>${label.name}</h4>
              <p><strong>Messages:</strong> ${label.messagesTotal || 0}</p>

              </div>
              `
      )
      .join("");
    // add labels in HTML
    return (resultsDiv.innerHTML = `
              <h3>Entreprises ciblées (${arrayofapplications.length})</h3>
              <div class="labels-list" >
                ${labelsHTML}
              </div>
              <button id="createLabel" class="btn btn-primary">Créer un dossier</button>
            `);
  }
  // Display Google emails
  function displayEmails(emails) {
    if (!resultsDiv) return;

    if (!emails || emails.length === 0) {
      resultsDiv.innerHTML = "<p>Aucun email trouvé</p>";
      return;
    }

    const emailsHTML = emails
      .map(
        (email) => `
        <div class="email-item">
          <h4>${email.subject}</h4>
          <p><strong>De:</strong> ${email.from}</p>
        </div>
      `
      )
      .join("");

    resultsDiv.innerHTML = `
      <h3>Emails Gmail (${emails.length})</h3>
      <div class="emails-list">
        ${emailsHTML}
      </div>
    `;
  }

  // Écouter les changements de stockage pour synchroniser avec le side panel
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.user) {
      console.log("Changement détecté dans le stockage:", changes.user);
      updateUI(changes.user.newValue);
    }
  });
});
