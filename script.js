const API = {
  signup: "/api/signup",
  login: "/api/login",
  dashboard: "/api/dashboard",
  tournaments: "/api/tournaments",
  register: "/api/register",
  deposit: "/api/deposit",
  adminLogin: "/api/admin/login",
  adminData: "/api/admin/data",
  adminTournaments: "/api/admin/tournaments"
};

let currentUser = null;
let adminToken = "";
let deferredInstallPrompt = null;
let authRequired = true;

const registerModal = document.getElementById("registerModal");
const authModal = document.getElementById("authModal");
const adminModal = document.getElementById("adminModal");
const openRegisterButton = document.getElementById("openModal");
const extraRegisterButtons = document.querySelectorAll("[data-open-register]");
const heroRegisterButton = document.getElementById("heroRegister");
const openAuthButton = document.getElementById("openAuth");
const heroAuthButton = document.getElementById("heroAuth");
const openAdminAccessButton = document.getElementById("openAdminAccess");
const openAdminNavButton = document.getElementById("openAdminNav");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const depositForm = document.getElementById("depositForm");
const adminForm = document.getElementById("adminForm");
const tournamentForm = document.getElementById("tournamentForm");
const installAppButton = document.getElementById("installAppButton");
const downloadApkButton = document.getElementById("downloadApkButton");
const heroDownloadApkButton = document.getElementById("heroDownloadApk");
const apkDownloadLink = document.getElementById("apkDownloadLink");
const apkHelpButton = document.getElementById("apkHelpButton");
const formMessage = document.getElementById("formMessage");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const depositMessage = document.getElementById("depositMessage");
const adminMessage = document.getElementById("adminMessage");
const tournamentMessage = document.getElementById("tournamentMessage");
const installMessage = document.getElementById("installMessage");
const apkMessage = document.getElementById("apkMessage");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const authTabs = document.querySelectorAll(".auth-tab");
const authPanels = document.querySelectorAll(".auth-panel");
const authModeButtons = document.querySelectorAll("[data-auth-mode]");
const demoAuthSwitch = document.getElementById("demoAuthSwitch");
const dashboardSection = document.getElementById("dashboardSection");
const adminSection = document.getElementById("adminSection");
const logoutButton = document.getElementById("logoutButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const dashboardDepositButton = document.getElementById("dashboardDepositButton");
const tournamentGrid = document.getElementById("tournamentGrid");
const screenButtons = document.querySelectorAll("[data-tab-target]");
const screens = document.querySelectorAll("[data-screen]");

const dashboardName = document.getElementById("dashboardName");
const dashboardEmail = document.getElementById("dashboardEmail");
const dashboardUid = document.getElementById("dashboardUid");
const dashboardRole = document.getElementById("dashboardRole");
const dashboardDepositCount = document.getElementById("dashboardDepositCount");
const dashboardPendingCount = document.getElementById("dashboardPendingCount");
const dashboardBonusBalance = document.getElementById("dashboardBonusBalance");
const dashboardReferralCode = document.getElementById("dashboardReferralCode");
const dashboardReferralCount = document.getElementById("dashboardReferralCount");
const dashboardRewardCount = document.getElementById("dashboardRewardCount");
const adminUserCount = document.getElementById("adminUserCount");
const adminDepositCount = document.getElementById("adminDepositCount");
const adminRegistrationCount = document.getElementById("adminRegistrationCount");
const adminBonusCount = document.getElementById("adminBonusCount");
const adminTournamentCount = document.getElementById("adminTournamentCount");
const depositList = document.getElementById("depositList");
const registrationList = document.getElementById("registrationList");
const tournamentList = document.getElementById("tournamentList");
const authModalCard = authModal ? authModal.querySelector(".modal-card") : null;

function bindClick(element, handler) {
  if (element) {
    element.addEventListener("click", handler);
  }
}

function syncAuthUi() {
  if (authModalCard) {
    authModalCard.classList.toggle("auth-locked", authRequired && !currentUser);
  }

  if (openAuthButton) {
    openAuthButton.textContent = currentUser ? "My Account" : "Login";
  }

  if (heroAuthButton) {
    heroAuthButton.textContent = currentUser ? "My Account" : "Player Login";
  }
}

function openModal(modal) {
  syncAuthUi();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (modal === authModal && authRequired && !currentUser) {
    return;
  }
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function activateTab(tabName) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  authPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tabName}Panel`);
  });
}

function formatMessage(element, text, success = false) {
  element.textContent = text;
  element.className = success ? "form-message success" : "form-message";
}

function switchScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.toggle("screen-active", screen.dataset.screen === screenName);
  });

  screenButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tabTarget === screenName);
  });
}

function getInstallHelpText() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid && isChrome) {
    return "Chrome menu (3 dots) kholo, phir 'Add to Home screen' ya 'Install app' dabao.";
  }

  if (isIOS) {
    return "Safari me Share button dabao, phir 'Add to Home Screen' select karo.";
  }

  return "Browser menu me jaake 'Install app' ya 'Add to Home screen' option use karo.";
}

function getApkInstallText() {
  return "APK button tab kaam karega jab real .apk file upload ho jayegi. Abhi build karke us file ko server ya GitHub release par rakhna hoga.";
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function renderTournaments(tournaments) {
  tournamentGrid.innerHTML = tournaments.length
    ? tournaments
        .map((item, index) => `
          <article class="tournament-card ${index === 0 ? "spotlight-card" : ""}">
            <div class="card-tag">${item.mode}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <ul>
              <li>Starts: ${item.startDate}</li>
              <li>Entry: ${item.entryFee}</li>
              <li>Prize: ${item.prizePool}</li>
            </ul>
          </article>
        `)
        .join("")
    : `
      <article class="tournament-card">
        <div class="card-tag">Upcoming</div>
        <h3>No public tournaments yet</h3>
        <p>Admin can create and publish tournaments from the private host panel.</p>
      </article>
    `;
}

function renderDashboard(dashboard) {
  if (!dashboard) {
    if (dashboardSection) {
      dashboardSection.classList.add("hidden");
    }
    return;
  }

  currentUser = dashboard.user;
  dashboardName.textContent = dashboard.user.fullName;
  dashboardEmail.textContent = dashboard.user.email;
  dashboardUid.textContent = `UID: ${dashboard.user.uid}`;
  dashboardRole.textContent = `Role: ${dashboard.user.role}`;
  dashboardDepositCount.textContent = `${dashboard.stats.totalDeposits}`;
  dashboardPendingCount.textContent = `${dashboard.stats.pendingDeposits}`;
  dashboardBonusBalance.textContent = `Rs ${dashboard.stats.bonusBalance}`;
  dashboardReferralCode.textContent = `Code: ${dashboard.user.referralCode}`;
  dashboardReferralCount.textContent = `Referrals: ${dashboard.stats.referralCount}`;
  dashboardRewardCount.textContent = `${dashboard.stats.rewardedReferralCount}`;
  if (dashboardSection) {
    dashboardSection.classList.remove("hidden");
  }
}

function renderAdmin(adminData) {
  if (!adminData) {
    adminSection.classList.add("hidden");
    return;
  }

  adminUserCount.textContent = `${adminData.summary.totalUsers}`;
  adminDepositCount.textContent = `${adminData.summary.totalDeposits}`;
  adminRegistrationCount.textContent = `${adminData.summary.totalRegistrations}`;
  adminBonusCount.textContent = `${adminData.summary.totalReferralBonuses}`;
  adminTournamentCount.textContent = `${adminData.summary.totalTournaments}`;

  depositList.innerHTML = adminData.deposits.length
    ? adminData.deposits
        .map((item) => `
          <div class="admin-item">
            <strong>${item.email}</strong>
            <span>Amount: ${item.amount}</span>
            <span>Reference: ${item.reference}</span>
            <span>Status: ${item.status}</span>
          </div>
        `)
        .join("")
    : '<div class="admin-item"><strong>No deposits yet</strong><span>New payment requests will appear here.</span></div>';

  registrationList.innerHTML = adminData.registrations.length
    ? adminData.registrations
        .map((item) => `
          <div class="admin-item">
            <strong>${item.teamName}</strong>
            <span>Captain: ${item.email}</span>
            <span>UID: ${item.uid}</span>
            <span>Tournament: ${item.game}</span>
          </div>
        `)
        .join("")
    : '<div class="admin-item"><strong>No registrations yet</strong><span>Squad entries will appear here.</span></div>';

  tournamentList.innerHTML = adminData.tournaments.length
    ? adminData.tournaments
        .map((item) => `
          <div class="admin-item">
            <strong>${item.title}</strong>
            <span>Mode: ${item.mode}</span>
            <span>Starts: ${item.startDate}</span>
            <span>Status: ${item.status}</span>
          </div>
        `)
        .join("")
    : '<div class="admin-item"><strong>No tournaments yet</strong><span>Create one from the host form.</span></div>';

  adminSection.classList.remove("hidden");
}

async function loadPublicTournaments() {
  try {
    const payload = await apiRequest(API.tournaments);
    renderTournaments(payload.tournaments);
  } catch (error) {
    renderTournaments([]);
  }
}

async function refreshDashboard() {
  if (!currentUser) {
    renderDashboard(null);
    return;
  }

  try {
    const dashboard = await apiRequest(`${API.dashboard}?email=${encodeURIComponent(currentUser.email)}`);
    renderDashboard(dashboard);
  } catch (error) {
    renderDashboard(null);
  }
}

async function refreshAdminData() {
  if (!adminToken) {
    renderAdmin(null);
    return;
  }

  try {
    const adminData = await apiRequest(API.adminData, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    renderAdmin(adminData);
  } catch (error) {
    renderAdmin(null);
  }
}

function initializeApp() {
  loadPublicTournaments();
  activateTab("login");
  switchScreen("home");
  syncAuthUi();
  openModal(authModal);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    formatMessage(installMessage, "App install is ready. Tap the button to install.", true);
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    formatMessage(installMessage, "RiftRush app installed successfully.", true);
  });

  formatMessage(installMessage, "Agar button se prompt na aaye, browser menu se manual install use karo.");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        // Keep app usable even if offline setup fails.
      });
    });
  }
}

screenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchScreen(button.dataset.tabTarget);
  });
});

bindClick(openRegisterButton, () => openModal(registerModal));
extraRegisterButtons.forEach((button) => {
  button.addEventListener("click", () => openModal(registerModal));
});
bindClick(heroRegisterButton, () => openModal(registerModal));
bindClick(openAuthButton, () => {
  if (currentUser) {
    switchScreen("account");
    return;
  }
  activateTab("login");
  openModal(authModal);
});
bindClick(heroAuthButton, () => {
  if (currentUser) {
    switchScreen("account");
    return;
  }
  activateTab("login");
  openModal(authModal);
});
bindClick(openAdminAccessButton, () => openModal(adminModal));
bindClick(openAdminNavButton, () => openModal(adminModal));
bindClick(demoAuthSwitch, () => {
  activateTab("login");
  openModal(authModal);
});
bindClick(dashboardDepositButton, () => {
  switchScreen("wallet");
  document.getElementById("wallet").scrollIntoView({ behavior: "smooth" });
});

bindClick(installAppButton, async () => {
  if (!deferredInstallPrompt) {
    formatMessage(installMessage, getInstallHelpText());
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;

  if (choice.outcome === "accepted") {
    formatMessage(installMessage, "Install accepted. RiftRush will appear like an app.", true);
  } else {
    formatMessage(installMessage, "Install cancelled. You can try again later.");
  }

  deferredInstallPrompt = null;
});

bindClick(downloadApkButton, () => {
  document.getElementById("download").scrollIntoView({ behavior: "smooth" });
  formatMessage(apkMessage, getApkInstallText());
});

bindClick(heroDownloadApkButton, () => {
  document.getElementById("download").scrollIntoView({ behavior: "smooth" });
  formatMessage(apkMessage, getApkInstallText());
});

bindClick(apkHelpButton, () => {
  formatMessage(apkMessage, "Phone me APK install karne ke liye: file download karo, open karo, 'Install unknown apps' allow karo, phir Install dabao.");
});

bindClick(apkDownloadLink, (event) => {
  if (apkDownloadLink.getAttribute("href") === "#") {
    event.preventDefault();
    formatMessage(apkMessage, getApkInstallText());
  }
});

authModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.authMode);
    openModal(authModal);
  });
});

document.querySelectorAll("[data-close-button='register']").forEach((button) => {
  button.addEventListener("click", () => closeModal(registerModal));
});

document.querySelectorAll("[data-close-button='auth']").forEach((button) => {
  button.addEventListener("click", () => closeModal(authModal));
});

document.querySelectorAll("[data-close-button='admin']").forEach((button) => {
  button.addEventListener("click", () => closeModal(adminModal));
});

document.querySelectorAll("[data-close-modal='register']").forEach((button) => {
  button.addEventListener("click", () => closeModal(registerModal));
});

document.querySelectorAll("[data-close-modal='auth']").forEach((button) => {
  button.addEventListener("click", () => closeModal(authModal));
});

document.querySelectorAll("[data-close-modal='admin']").forEach((button) => {
  button.addEventListener("click", () => closeModal(adminModal));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    [registerModal, authModal, adminModal].forEach((modal) => {
      if (!modal.classList.contains("hidden")) {
        closeModal(modal);
      }
    });
  }
});

bindClick(menuToggle, () => {
  if (navLinks) {
    navLinks.classList.toggle("open");
  }
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiRequest(API.signup, {
      method: "POST",
      body: JSON.stringify({
        fullName: signupForm.fullName.value.trim(),
        email: signupForm.signupEmail.value.trim(),
        uid: signupForm.playerUid.value.trim(),
        password: signupForm.signupPassword.value.trim(),
        referredBy: signupForm.referredBy.value.trim(),
        role: signupForm.role.value
      })
    });

    currentUser = payload.user;
    formatMessage(signupMessage, `Account created. Your referral code is ${payload.user.referralCode}.`, true);
    signupForm.reset();
    await refreshDashboard();
    await refreshAdminData();

    setTimeout(() => {
      activateTab("login");
      formatMessage(signupMessage, "");
      formatMessage(loginMessage, "Account created. Ab login karo aur home screen kholo.", true);
    }, 1700);
  } catch (error) {
    formatMessage(signupMessage, error.message);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiRequest(API.login, {
      method: "POST",
      body: JSON.stringify({
        email: loginForm.loginEmail.value.trim(),
        password: loginForm.loginPassword.value.trim()
      })
    });

    currentUser = payload.dashboard.user;
    renderDashboard(payload.dashboard);
    formatMessage(loginMessage, `Login successful for ${payload.dashboard.user.fullName}.`, true);
    loginForm.reset();

    setTimeout(() => {
      authRequired = false;
      syncAuthUi();
      closeModal(authModal);
      formatMessage(loginMessage, "");
      switchScreen("home");
    }, 1400);
  } catch (error) {
    formatMessage(loginMessage, error.message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    formatMessage(formMessage, "Please login before joining a game.");
    return;
  }

  try {
    const payload = await apiRequest(API.register, {
      method: "POST",
      body: JSON.stringify({
        teamName: registerForm.teamName.value.trim(),
        email: currentUser.email,
        uid: currentUser.uid,
        game: registerForm.game.value
      })
    });

    formatMessage(formMessage, payload.message, true);
    registerForm.reset();
    await refreshDashboard();
    await refreshAdminData();

    setTimeout(() => {
      closeModal(registerModal);
      formatMessage(formMessage, "");
    }, 1800);
  } catch (error) {
    formatMessage(formMessage, error.message);
  }
});

depositForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    formatMessage(depositMessage, "Please login before submitting a deposit.");
    return;
  }

  try {
    const payload = await apiRequest(API.deposit, {
      method: "POST",
      body: JSON.stringify({
        email: currentUser.email,
        amount: Number(depositForm.amount.value),
        reference: depositForm.reference.value.trim()
      })
    });

    formatMessage(depositMessage, payload.message, true);
    depositForm.reset();
    await refreshDashboard();
    await refreshAdminData();
  } catch (error) {
    formatMessage(depositMessage, error.message);
  }
});

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiRequest(API.adminLogin, {
      method: "POST",
      body: JSON.stringify({
        email: adminForm.adminEmail.value.trim(),
        key: adminForm.adminKey.value.trim()
      })
    });

    adminToken = payload.token;
    formatMessage(adminMessage, payload.message, true);
    await refreshAdminData();

    setTimeout(() => {
      closeModal(adminModal);
      formatMessage(adminMessage, "");
      document.getElementById("adminSection").scrollIntoView({ behavior: "smooth" });
    }, 1200);
  } catch (error) {
    formatMessage(adminMessage, error.message);
  }
});

tournamentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!adminToken) {
    formatMessage(tournamentMessage, "Please login as admin first.");
    return;
  }

  try {
    const payload = await apiRequest(API.adminTournaments, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: tournamentForm.title.value.trim(),
        mode: tournamentForm.mode.value.trim(),
        description: tournamentForm.description.value.trim(),
        startDate: tournamentForm.startDate.value.trim(),
        entryFee: tournamentForm.entryFee.value.trim(),
        prizePool: tournamentForm.prizePool.value.trim(),
        status: tournamentForm.status.value
      })
    });

    formatMessage(tournamentMessage, payload.message, true);
    tournamentForm.reset();
    await refreshAdminData();
    await loadPublicTournaments();
  } catch (error) {
    formatMessage(tournamentMessage, error.message);
  }
});

bindClick(logoutButton, () => {
  currentUser = null;
  authRequired = true;
  syncAuthUi();
  renderDashboard(null);
  activateTab("login");
  openModal(authModal);
});

bindClick(adminLogoutButton, () => {
  adminToken = "";
  renderAdmin(null);
});

initializeApp();
