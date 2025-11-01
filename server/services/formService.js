const Form = require("../models/Form")
const Submission = require("../models/Submission")
const nodemailer = require("nodemailer")
const multer = require("multer")
const { Storage } = require("@google-cloud/storage")

class FormService {
  constructor() {
    this.storage = new Storage()
    this.bucket = this.storage.bucket(process.env.STORAGE_BUCKET)
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async getForms(projectId) {
    return await Form.find({ projectId })
  }

  async createForm(formData) {
    const form = new Form(formData)
    return await form.save()
  }

  async updateForm(id, updates) {
    return await Form.findByIdAndUpdate(id, updates, { new: true })
  }

  async deleteForm(id) {
    return await Form.findByIdAndDelete(id)
  }

  async getSubmissions(formId, query = {}) {
    return await Submission.find({ formId, ...query }).sort({ createdAt: -1 })
  }

  async handleSubmission(formId, data, files, metadata) {
    const form = await Form.findById(formId)
    if (!form) throw new Error("Form not found")

    // Handle file uploads
    const uploadedFiles = []
    if (files && form.settings.allowFileUploads) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`
        const fileUpload = this.bucket.file(fileName)
        
        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        })

        uploadedFiles.push({
          fieldName: file.fieldname,
          fileName: fileName,
          fileType: file.mimetype,
          fileSize: file.size,
          fileUrl: `https://storage.googleapis.com/${process.env.STORAGE_BUCKET}/${fileName}`,
        })
      }
    }

    // Create submission
    const submission = new Submission({
      formId,
      data,
      files: uploadedFiles,
      metadata,
    })
    await submission.save()

    // Send email notification if enabled
    if (form.settings.emailNotification.enabled) {
      await this.sendNotificationEmail(form, submission)
    }

    return submission
  }

  async sendNotificationEmail(form, submission) {
    const { recipients, template } = form.settings.emailNotification
    
    // Basic template if none specified
    const htmlContent = template || `
      <h2>New Form Submission</h2>
      <p>Form: ${form.name}</p>
      <pre>${JSON.stringify(submission.data, null, 2)}</pre>
    `

    await this.mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: recipients.join(","),
      subject: `New submission - ${form.name}`,
      html: htmlContent,
    })
  }

  async exportSubmissions(formId, format = "csv") {
    const submissions = await this.getSubmissions(formId)
    const form = await Form.findById(formId)

    switch (format) {
      case "csv":
        return this.generateCSV(form, submissions)
      case "json":
        return this.generateJSON(form, submissions)
      default:
        throw new Error("Unsupported export format")
    }
  }

  generateCSV(form, submissions) {
    const fields = form.fields.map(f => f.name)
    const rows = submissions.map(s => {
      return fields.map(f => s.data.get(f)).join(",")
    })
    return [fields.join(","), ...rows].join("\n")
  }

  generateJSON(form, submissions) {
    return JSON.stringify(submissions.map(s => ({
      id: s._id,
      data: Object.fromEntries(s.data),
      files: s.files,
      createdAt: s.createdAt,
    })), null, 2)
  }
}

module.exports = new FormService()