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

  console.log("Popup chargé");

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

  // Button to get emails from gmail API
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
    if (!resultsDiv) return;

    if (!labels.labels || labels.labels.length === 0) {
      resultsDiv.innerHTML = "<p>Aucun libellé trouvé</p>";
      return;
    }

    // filter labels to get "applications" labels only
    const candidaturesLabels = labels.labels.filter(
      (label) =>
        label.name && label.name.toLowerCase().includes("candidatures/")
    );

    if (candidaturesLabels.length === 0) {
      resultsDiv.innerHTML = "<p>Aucun libellé 'Candidatures' trouvé</p>";
      return;
    }
    // HTML labels displayer
    const labelsHTML = candidaturesLabels
      .map(
        (label) => `
        <div class="label-item">
        <h4>${label.name}</h4>
        <p><strong>Messages:</strong> ${label.messagesTotal || 0}</p>
        
        </div>
        `
      )
      .join("");

    // Save labels in Firebase storage
    const emailCandidate = user.email;
    candidaturesLabels.map((label) =>
      saveLabels(label.id, label.name, label.messagesTotal, emailCandidate)
    );
    // Display HTML in resultDiv
    resultsDiv.innerHTML = `
      <h3>Entreprises ciblées (${candidaturesLabels.length})</h3>
      <div class="labels-list">
        ${labelsHTML}
      </div>
    `;
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
