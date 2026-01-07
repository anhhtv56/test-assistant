import mongoose from "mongoose";

// markdown schema
const mardownSchema = new mongoose.Schema({
  content: { type: String },
  filename: { type: String }
}, { _id: false });

const jiraTicketSchema = new mongoose.Schema({
  issueUrl: { type: String },
  issueType: { type: String },
  createdAt: { type: Date },
}, { _id: false });

const pdfAttachmentSchema = new mongoose.Schema({
  attachmentId: { type: String },
  filename: { type: String },
  attachedAt: { type: Date },
  commendId: { type: String }
}, { _id: false });

const versionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, required: true },
  notes: { type: String }
}, { _id: false });

/**
 * Main schema for Generation
 */
const generationSchema = new mongoose.Schema({
  issueKey: { type: String, index: true },
  email: { type: String, index: true },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  mode: { type: String, enum: ['manual', 'auto'] },
  status: { type: String, enum: ['completed', 'failed'] },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  generationTimeSeconds: { type: Number },
  cost: { type: Number },
  tokenUsage: {
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },
  },
  result: {
    markdown: { type: mardownSchema }
  },
  jiraTickets: [jiraTicketSchema],
  pdfAttachments: [pdfAttachmentSchema],
  error: { type: String },
  published: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date },
  publishedBy: { type: String },
  versions: [versionSchema],
  currentVersion: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Generation', generationSchema);