# Quick Reference - Key Code Snippets

## Common Patterns Used

### Model Pattern
```javascript
const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

schema.index({ projectId: 1, createdAt: -1 })
module.exports = mongoose.model("ModelName", schema)
```

### Service Pattern
```javascript
class ServiceName {
  async createItem(projectId, data) {
    const item = new Model({ projectId, ...data })
    await item.save()
    return item
  }

  async getItems(projectId) {
    return await Model.find({ projectId, isActive: true })
  }

  async updateItem(itemId, updates) {
    return await Model.findByIdAndUpdate(itemId, updates, { new: true })
  }

  async deleteItem(itemId) {
    return await Model.findByIdAndUpdate(itemId, { isActive: false }, { new: true })
  }
}

module.exports = new ServiceName()
```

### Controller Pattern
```javascript
const service = require("../services/serviceName")

exports.create = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const data = await service.createItem(projectId, req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

exports.list = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const data = await service.getItems(projectId)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { itemId } = req.params
    const data = await service.updateItem(itemId, req.body)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const { itemId } = req.params
    await service.deleteItem(itemId)
    res.json({ success: true, message: "Deleted" })
  } catch (error) {
    next(error)
  }
}
```

### Route Pattern
```javascript
const express = require("express")
const router = express.Router()
const controller = require("../controllers/controllerName")
const auth = require("../middleware/auth")

router.post("/project/:projectId", auth, controller.create)
router.get("/project/:projectId", auth, controller.list)
router.get("/:itemId", auth, controller.get)
router.patch("/:itemId", auth, controller.update)
router.delete("/:itemId", auth, controller.delete)

module.exports = router
```

---

## Frontend Component Patterns

### Dialog Pattern
```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function Component() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        {/* Content here */}
      </DialogContent>
    </Dialog>
  )
}
```

### Table Pattern
```jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Component() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Tabs Pattern
```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Component() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  )
}
```

### Chart Pattern
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function Component() {
  const data = [
    { name: "Jan", value: 100 },
    { name: "Feb", value: 120 },
  ]

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

## Database Query Patterns

### Find with Filter
```javascript
const items = await Model.find({ projectId, status: "active" })
  .sort({ createdAt: -1 })
  .limit(50)
```

### Aggregate with Group
```javascript
const results = await Model.aggregate([
  { $match: { projectId } },
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Find and Update
```javascript
const updated = await Model.findByIdAndUpdate(
  id,
  { $set: { status: "active" } },
  { new: true }
)
```

### Find and Delete (Soft)
```javascript
const deleted = await Model.findByIdAndUpdate(
  id,
  { isActive: false },
  { new: true }
)
```

---

## Error Handling Patterns

### Try-Catch in Controller
```javascript
exports.handler = async (req, res, next) => {
  try {
    // Logic here
    res.json({ success: true, data })
  } catch (error) {
    next(error) // Pass to error middleware
  }
}
```

### Error Middleware
```javascript
app.use((error, req, res, next) => {
  console.error(error)
  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error"
  })
})
```

### Custom Error Class
```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

// Usage
throw new ValidationError("Invalid input")
```

---

## Authentication Patterns

### JWT Token Validation
```javascript
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "No token" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
}
```

### Check Permission
```javascript
const checkPermission = async (req, res, next) => {
  const hasPermission = await rbacService.checkPermission(
    req.user.id,
    req.params.projectId,
    "resource",
    "action"
  )
  if (!hasPermission) return res.status(403).json({ error: "Access denied" })
  next()
}
```

---

## Response Formatting

### Success Response
```javascript
res.json({
  success: true,
  data: item,
  message: "Operation successful"
})
```

### Error Response
```javascript
res.status(400).json({
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
})
```

### Paginated Response
```javascript
res.json({
  success: true,
  data: items,
  pagination: {
    total: 100,
    limit: 50,
    offset: 0,
    pages: 2
  }
})
```

---

## Common Utility Functions

### Hash Password
```javascript
const crypto = require("crypto")

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
```

### Generate Token
```javascript
function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}
```

### Format Date
```javascript
function formatDate(date) {
  return new Date(date).toISOString()
}
```

### Build Connection String
```javascript
function buildConnectionString(type, config) {
  const mapping = {
    postgres: `postgresql://${config.user}:${config.password}@${config.host}/${config.db}`,
    mysql: `mysql://${config.user}:${config.password}@${config.host}/${config.db}`,
    mongodb: `mongodb://${config.user}:${config.password}@${config.host}/${config.db}`
  }
  return mapping[type]
}
```

---

## Testing Patterns

### Unit Test Pattern
```javascript
describe("Service", () => {
  it("should create item", async () => {
    const result = await service.createItem("projectId", data)
    expect(result).toBeDefined()
    expect(result.projectId).toBe("projectId")
  })
})
```

### Integration Test Pattern
```javascript
describe("API", () => {
  it("POST /api/items should create item", async () => {
    const res = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${token}`)
      .send(data)
    expect(res.status).toBe(201)
    expect(res.body.data).toBeDefined()
  })
})
```

---

## Important Constants

### HTTP Status Codes
```javascript
const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
}
```

### Role Types
```javascript
const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  DEVELOPER: "developer",
  VIEWER: "viewer"
}
```

### Resource Actions
```javascript
const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXECUTE: "execute",
  DEPLOY: "deploy"
}
```

---

## Environment Variables Template

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Auth
JWT_SECRET=your-very-long-secret-key-here
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# External Services (Optional)
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-key
SENTRY_DSN=your-sentry-dsn
```

---

## File Structure Template

```
project/
├── server/
│   ├── models/          # Mongoose schemas
│   ├── services/        # Business logic
│   ├── controllers/     # Request handlers
│   ├── routes/          # API endpoints
│   ├── middleware/      # Express middleware
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration
│   └── index.js         # Server entry point
├── app/                 # Next.js app
│   └── (app)/          # App routes
│       ├── builds/
│       ├── functions/
│       ├── settings/
│       ├── team/
│       ├── databases/
│       └── developer/
├── components/          # React components
├── lib/                 # Client utilities
├── public/             # Static files
├── .env.local          # Local environment
├── package.json
└── README.md
```

---

This quick reference provides all the common patterns used throughout the implementation. Copy and modify as needed for new features.
