const express = require("express")
const cors = require("cors")
const passport = require("passport")
const session = require("express-session")
require("dotenv").config()
const connectDB = require("./config/database")
const errorHandler = require("./middleware/errorHandler")
const config = require("./config/env")
require("./config/passport")

// Routes
const authRoutes = require("./routes/auth")
const deploymentRoutes = require("./routes/deployments")
const projectRoutes = require("./routes/projects")
const databaseRoutes = require("./routes/databases")
const functionRoutes = require("./routes/functions")
const cronJobRoutes = require("./routes/cronjobs")
const domainRoutes = require("./routes/domains")
const environmentRoutes = require("./routes/environment")
const teamRoutes = require("./routes/team")
const logRoutes = require("./routes/logs")
const buildRoutes = require("./routes/builds")
const monitoringRoutes = require("./routes/monitoring")
const securityRoutes = require("./routes/security")
const analyticsRoutes = require("./routes/analytics")
const apiTokenRoutes = require("./routes/api-tokens")
const webhookRoutes = require("./routes/webhooks")
const settingsRoutes = require("./routes/settings")
const providersRoutes = require("./routes/providers")

const app = express()

// Middleware
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session middleware for OAuth
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
  })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Authentication Routes
app.use("/auth", authRoutes)

// API Routes
app.use("/api/deployments", deploymentRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/databases", databaseRoutes)
app.use("/api/functions", functionRoutes)
app.use("/api/cronjobs", cronJobRoutes)
app.use("/api/domains", domainRoutes)
app.use("/api/environment", environmentRoutes)
app.use("/api/team", teamRoutes)
app.use("/api/logs", logRoutes)
app.use("/api/builds", buildRoutes)
app.use("/api/monitoring", monitoringRoutes)
app.use("/api/security", securityRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/api-tokens", apiTokenRoutes)
app.use("/api/webhooks", webhookRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/providers", providersRoutes)

// Error handling
app.use(errorHandler)

// Prometheus metrics endpoint (with basic auth)
const monitoringService = require('./services/monitoringService')
app.get('/metrics', (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic')
    return res.status(401).send('Authentication required')
  }

  const [username, password] = Buffer.from(auth.split(' ')[1], 'base64')
    .toString()
    .split(':')

  if (
    username === process.env.METRICS_USERNAME &&
    password === process.env.METRICS_PASSWORD
  ) {
    return monitoringService.getMetricsHandler(req, res)
  }

  res.set('WWW-Authenticate', 'Basic')
  res.status(401).send('Invalid credentials')
})

// Connect to database and start server
connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`)
      console.log(`Prometheus metrics available at http://localhost:${config.port}/metrics`)
    })
  })
  .catch((error) => {
    console.error("Database connection failed:", error)
    process.exit(1)
  })

module.exports = app
