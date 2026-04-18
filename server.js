const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@riftrushplay.com";
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || "RiftRushHost@2026";
const REFERRAL_BONUS = 5;
const adminTokens = new Set();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const DEFAULT_DATA = {
  "users.json": [],
  "deposits.json": [],
  "registrations.json": [],
  "tournaments.json": [
    {
      "id": "ff-pro-squad-clash",
      "title": "RiftRush Prime Clash",
      "mode": "Free Fire Max",
      "description": "4-player squad knockouts with custom room codes, observer panel, and booyah bonus points.",
      "startDate": "18 April 2026",
      "entryFee": "Rs 199 per squad",
      "prizePool": "Rs 50,000",
      "status": "published"
    },
    {
      "id": "rush-arena-night-cup",
      "title": "Neon Knockout Cup",
      "mode": "Clash Squad",
      "description": "Fast-paced 4v4 rounds for mobile teams who want shorter and high-energy matches.",
      "startDate": "21 April 2026",
      "entryFee": "Free",
      "prizePool": "Rs 12,500",
      "status": "published"
    },
    {
      "id": "lone-wolf-master-series",
      "title": "Last Drop Solo Series",
      "mode": "Solo Survival",
      "description": "Solo eliminations with performance ladders, weekly qualifiers, and final redemption rooms.",
      "startDate": "26 April 2026",
      "entryFee": "Rs 49 per player",
      "prizePool": "Rs 8,000",
      "status": "published"
    }
  ]
};

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  Object.entries(DEFAULT_DATA).forEach(([file, value]) => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    }
  });
}

function readJson(file) {
  const filePath = path.join(DATA_DIR, file);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "File not found" });
      return;
    }

    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function generateReferralCode(users) {
  let code = "";
  do {
    code = `AX${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (users.some((user) => user.referralCode === code));
  return code;
}

function sanitizeUser(user) {
  return {
    fullName: user.fullName,
    email: user.email,
    uid: user.uid,
    role: user.role,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    bonusBalance: user.bonusBalance,
    referralBonusAwarded: user.referralBonusAwarded
  };
}

function awardReferralBonusIfEligible(email) {
  const users = readJson("users.json");
  const deposits = readJson("deposits.json");
  const registrations = readJson("registrations.json");
  const player = users.find((item) => item.email === email);

  if (!player || !player.referredBy || player.referralBonusAwarded) {
    return false;
  }

  const hasDeposit = deposits.some((item) => item.email === email);
  const hasRegistration = registrations.some((item) => item.email === email);

  if (!hasDeposit || !hasRegistration) {
    return false;
  }

  const referrer = users.find((item) => item.referralCode === player.referredBy);

  if (!referrer) {
    return false;
  }

  player.bonusBalance += REFERRAL_BONUS;
  player.referralBonusAwarded = true;
  referrer.bonusBalance += REFERRAL_BONUS;
  writeJson("users.json", users);
  return true;
}

function buildDashboard(email) {
  const users = readJson("users.json");
  const deposits = readJson("deposits.json");
  const registrations = readJson("registrations.json");
  const user = users.find((item) => item.email === email);

  if (!user) {
    return null;
  }

  const userDeposits = deposits.filter((item) => item.email === email);
  const pendingDeposits = userDeposits.filter((item) => item.status === "Pending");
  const referrals = users.filter((item) => item.referredBy === user.referralCode);
  const rewardedReferrals = referrals.filter((item) => item.referralBonusAwarded);

  return {
    user: sanitizeUser(user),
    stats: {
      totalDeposits: userDeposits.length,
      pendingDeposits: pendingDeposits.length,
      bonusBalance: user.bonusBalance,
      referralCount: referrals.length,
      rewardedReferralCount: rewardedReferrals.length
    }
  };
}

function buildAdminData() {
  const users = readJson("users.json");
  const deposits = readJson("deposits.json");
  const registrations = readJson("registrations.json");
  const tournaments = readJson("tournaments.json");
  const rewardedReferrals = users.filter((item) => item.referralBonusAwarded).length * 2;

  return {
    summary: {
      totalUsers: users.length,
      totalDeposits: deposits.length,
      totalRegistrations: registrations.length,
      totalReferralBonuses: rewardedReferrals,
      totalTournaments: tournaments.length
    },
    deposits: deposits.slice().reverse(),
    registrations: registrations.slice().reverse(),
    users: users.map(sanitizeUser),
    tournaments: tournaments.slice().reverse()
  };
}

async function handleApi(req, res, pathname, searchParams) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/signup" && req.method === "POST") {
    const body = await parseBody(req);
    const users = readJson("users.json");
    const email = String(body.email || "").trim().toLowerCase();
    const referredBy = String(body.referredBy || "").trim().toUpperCase();

    if (!body.fullName || !email || !body.uid || !body.password || !body.role) {
      sendJson(res, 400, { error: "Please complete all signup fields." });
      return;
    }

    if (users.some((item) => item.email === email)) {
      sendJson(res, 409, { error: "Account already exists." });
      return;
    }

    if (referredBy && !users.some((item) => item.referralCode === referredBy)) {
      sendJson(res, 400, { error: "Referral code is invalid." });
      return;
    }

    const user = {
      fullName: body.fullName.trim(),
      email,
      uid: String(body.uid).trim(),
      password: String(body.password),
      role: String(body.role),
      referralCode: generateReferralCode(users),
      referredBy: referredBy || null,
      bonusBalance: 0,
      referralBonusAwarded: false
    };

    users.push(user);
    writeJson("users.json", users);
    sendJson(res, 201, { message: "Account created.", user: sanitizeUser(user) });
    return;
  }

  if (pathname === "/api/login" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const users = readJson("users.json");
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      sendJson(res, 401, { error: "Invalid email or password." });
      return;
    }

    sendJson(res, 200, {
      message: "Login successful.",
      dashboard: buildDashboard(user.email)
    });
    return;
  }

  if (pathname === "/api/dashboard" && req.method === "GET") {
    const email = String(searchParams.get("email") || "").trim().toLowerCase();
    const dashboard = buildDashboard(email);

    if (!dashboard) {
      sendJson(res, 404, { error: "User not found." });
      return;
    }

    sendJson(res, 200, dashboard);
    return;
  }

  if (pathname === "/api/tournaments" && req.method === "GET") {
    const tournaments = readJson("tournaments.json");
    const publishedOnly = searchParams.get("scope") !== "all";
    const items = publishedOnly
      ? tournaments.filter((item) => item.status === "published")
      : tournaments;
    sendJson(res, 200, { tournaments: items });
    return;
  }

  if (pathname === "/api/register" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();

    if (!body.teamName || !email || !body.uid || !body.game) {
      sendJson(res, 400, { error: "Please fill in all registration details." });
      return;
    }

    const registrations = readJson("registrations.json");
    registrations.push({
      teamName: String(body.teamName).trim(),
      email,
      uid: String(body.uid).trim(),
      game: String(body.game),
      createdAt: new Date().toISOString()
    });
    writeJson("registrations.json", registrations);
    const rewarded = awardReferralBonusIfEligible(email);

    sendJson(res, 201, {
      message: `Squad registered successfully.${rewarded ? " Referral bonus unlocked for both accounts." : ""}`
    });
    return;
  }

  if (pathname === "/api/deposit" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const amount = Number(body.amount);
    const reference = String(body.reference || "").trim();

    if (!email) {
      sendJson(res, 401, { error: "Please login before submitting a deposit." });
      return;
    }

    if (!amount || amount < 10 || amount > 1000) {
      sendJson(res, 400, { error: "Deposit amount must be between Rs 10 and Rs 1000." });
      return;
    }

    if (!reference) {
      sendJson(res, 400, { error: "Please enter a payment reference." });
      return;
    }

    const deposits = readJson("deposits.json");
    deposits.push({
      email,
      amount,
      reference,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
    writeJson("deposits.json", deposits);
    const rewarded = awardReferralBonusIfEligible(email);

    sendJson(res, 201, {
      message: `Deposit request submitted.${rewarded ? " Referral bonus unlocked for both accounts." : ""}`
    });
    return;
  }

  if (pathname === "/api/admin/login" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const key = String(body.key || "").trim();

    if (email !== ADMIN_EMAIL || key !== ADMIN_ACCESS_KEY) {
      sendJson(res, 401, { error: "Invalid admin credentials." });
      return;
    }

    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
    adminTokens.add(token);
    sendJson(res, 200, { message: "Admin panel unlocked.", token });
    return;
  }

  if (pathname === "/api/admin/data" && req.method === "GET") {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    if (!adminTokens.has(token)) {
      sendJson(res, 401, { error: "Unauthorized admin access." });
      return;
    }

    sendJson(res, 200, buildAdminData());
    return;
  }

  if (pathname === "/api/admin/tournaments" && req.method === "POST") {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    if (!adminTokens.has(token)) {
      sendJson(res, 401, { error: "Unauthorized admin access." });
      return;
    }

    const body = await parseBody(req);
    const title = String(body.title || "").trim();
    const mode = String(body.mode || "").trim();
    const description = String(body.description || "").trim();
    const startDate = String(body.startDate || "").trim();
    const entryFee = String(body.entryFee || "").trim();
    const prizePool = String(body.prizePool || "").trim();
    const status = String(body.status || "draft").trim().toLowerCase();

    if (!title || !mode || !description || !startDate || !entryFee || !prizePool) {
      sendJson(res, 400, { error: "Please fill all tournament fields." });
      return;
    }

    const tournaments = readJson("tournaments.json");
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    tournaments.push({
      id: `${id}-${Date.now().toString().slice(-4)}`,
      title,
      mode,
      description,
      startDate,
      entryFee,
      prizePool,
      status: status === "published" ? "published" : "draft"
    });
    writeJson("tournaments.json", tournaments);
    sendJson(res, 201, { message: "Tournament created successfully." });
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolvedPath = path.normalize(path.join(ROOT, safePath));

  if (!resolvedPath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  sendFile(res, resolvedPath);
}

ensureDataFiles();

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  try {
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname, requestUrl.searchParams);
      return;
    }

    serveStatic(pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: "Server error", details: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`RiftRush server running on http://localhost:${PORT}`);
});
