/**
 * gMatch – Shared type definitions (JSDoc-annotated)
 * These typedefs provide IDE autocompletion across both apps.
 * They mirror the Mongoose schemas defined in apps/server.
 */

// ─────────────────────────── User ───────────────────────────

/**
 * @typedef {Object} User
 * @property {string}  _id            - MongoDB ObjectId
 * @property {string}  name           - Display name
 * @property {string}  email          - Email address (unique)
 * @property {string}  [avatar]       - Avatar URL
 * @property {"organizer"|"participant"} role - User role
 * @property {string[]} portfolioUrls - Linked portfolio URLs (GitHub, LinkedIn, Behance, personal)
 * @property {string}  [oauthProvider] - OAuth provider used (google | github)
 * @property {string}  [oauthId]      - Provider-specific user ID
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

// ─────────────────────────── Workspace ───────────────────────────

/**
 * @typedef {Object} Workspace
 * @property {string}  _id           - MongoDB ObjectId
 * @property {string}  organizerId   - Ref → User._id
 * @property {string}  name          - Workspace display name
 * @property {string}  [template]    - Template slug (software-engineering | business-case-study | study-group | hackathon | blank)
 * @property {number}  teamSize      - Target number of members per team
 * @property {string[]} requiredTags - Tags the algorithm must distribute across teams
 * @property {string}  inviteCode    - 6-character alphanumeric join code
 * @property {"open"|"matching"|"published"} status - Current workspace lifecycle stage
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

// ─────────────────────────── Form ───────────────────────────

/**
 * @typedef {Object} FormQuestion
 * @property {string}  id       - Unique question identifier
 * @property {"multiple-choice"|"availability-grid"|"skill-tag"} type - Question type
 * @property {string}  label    - Display label / prompt
 * @property {string}  [tag]    - Algorithm tag assigned to this question
 * @property {string[]} [options] - Options for multiple-choice questions
 */

/**
 * @typedef {Object} Form
 * @property {string}  _id         - MongoDB ObjectId
 * @property {string}  workspaceId - Ref → Workspace._id
 * @property {FormQuestion[]} questions - Ordered list of questions
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

// ─────────────────────────── Response ───────────────────────────

/**
 * @typedef {Object} Answer
 * @property {string}  questionId - Ref → FormQuestion.id
 * @property {*}       value      - Answer value (string, string[], or grid object)
 */

/**
 * @typedef {Object} Response
 * @property {string}   _id              - MongoDB ObjectId
 * @property {string}   workspaceId      - Ref → Workspace._id
 * @property {string}   participantId    - Ref → User._id
 * @property {Answer[]} answers          - Submitted answers
 * @property {Object}   availabilityGrid - Day/hour availability matrix
 * @property {string[]} whitelistEmails  - Peers the participant wants to be grouped with
 * @property {string[]} blacklistEmails  - Peers the participant wants to avoid
 * @property {Date}     createdAt
 * @property {Date}     updatedAt
 */

// ─────────────────────────── Team ───────────────────────────

/**
 * @typedef {Object} ChatMessage
 * @property {string}  senderId  - Ref → User._id
 * @property {string}  message   - Message text
 * @property {Date}    timestamp - When the message was sent
 */

/**
 * @typedef {Object} Team
 * @property {string}        _id          - MongoDB ObjectId
 * @property {string}        workspaceId  - Ref → Workspace._id
 * @property {string[]}      memberIds    - Array of User._id refs
 * @property {ChatMessage[]} chatHistory  - In-document chat log
 * @property {Date}          createdAt
 * @property {Date}          updatedAt
 */

// ─────────────────────────── Notification ───────────────────────────

/**
 * @typedef {Object} Notification
 * @property {string}  _id       - MongoDB ObjectId
 * @property {string}  userId    - Ref → User._id
 * @property {string}  message   - Notification text
 * @property {boolean} read      - Has the user seen it?
 * @property {Date}    createdAt
 */

// ─────────────────────────── Exports ───────────────────────────

// No runtime values to export — this file exists purely for JSDoc
// type annotations. Import it like:
//   const Types = require("@gmatch/types");
// Then reference types with:  /** @type {Types.User} */

module.exports = {};
