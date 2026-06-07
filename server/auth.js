const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const users = require("./users");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  try {
    const user = users.findOrCreate({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || "",
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value || "",
    });
    done(null, user);
  } catch (e) {
    done(e, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.googleId));
passport.deserializeUser((googleId, done) => {
  const user = users.getUser(googleId);
  done(null, user);
});

function issueJWT(user) {
  return jwt.sign(
    { googleId: user.googleId, email: user.email, name: user.name, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware: attach user to req if valid JWT present
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = users.getUser(decoded.googleId) || decoded;
    }
  }
  next();
}

// Middleware: require auth
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

module.exports = { passport, issueJWT, verifyJWT, authMiddleware, requireAuth };
