const mongoose = require("mongoose")

const formFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "email", "number", "file", "textarea", "select", "checkbox", "radio"],
    default: "text",
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [String], // For select, checkbox, radio
  validation: {
    pattern: String,
    min: Number,
    max: Number,
    maxSize: Number, // For file uploads
    allowedTypes: [String], // For file uploads
  },
})

const formSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fields: [formFieldSchema],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  settings: {
    emailNotification: {
      enabled: Boolean,
      recipients: [String],
      template: String,
    },
    redirectUrl: String,
    allowFileUploads: Boolean,
    maxFileSize: Number,
    reCaptcha: Boolean,
    customDomain: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Virtual for form URL
formSchema.virtual("formUrl").get(function() {
  return `/f/${this._id}`
})

// Generate embed code
formSchema.virtual("embedCode").get(function() {
  return `<iframe src="${this.formUrl}" frameborder="0"></iframe>`
})

module.exports = mongoose.model("Form", formSchema)