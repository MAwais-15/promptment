const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    // ── Parties ───────────────────────────────────────
    student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    executor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },

    // ── Amounts ───────────────────────────────────────
    amount:         { type: Number, required: true },  // total student pays
    platformFee:    { type: Number, required: true },  // platform cut
    executorPayout: { type: Number, required: true },  // executor receives

    // ── Currency ──────────────────────────────────────
    currency: {
      type:    String,
      enum:    ['PKR', 'BTC', 'ETH', 'USDT'],
      default: 'PKR',
    },
    cryptoAmountUSD: { type: Number, default: null }, // if crypto
    exchangeRate:    { type: Number, default: null },

    // ── Payment Method ────────────────────────────────
    method: {
      type: String,
      enum: [
        'easypaisa', 'jazzcash',        // mobile wallets
        'bank_transfer', 'iban',        // bank
        'btc', 'eth', 'usdt_trc20', 'usdt_erc20', // crypto
        'wallet',                       // platform wallet
      ],
      required: true,
    },

    // ── Status ────────────────────────────────────────
    // pending → deposited → held (escrow) → released | refunded | failed
    status: {
      type:    String,
      enum:    ['pending', 'deposited', 'held', 'released', 'refunded', 'failed', 'disputed'],
      default: 'pending',
    },

    // ── Escrow ────────────────────────────────────────
    escrow: {
      held:       { type: Boolean, default: false },
      heldAt:     { type: Date,    default: null },
      released:   { type: Boolean, default: false },
      releasedAt: { type: Date,    default: null },
      releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },

    // ── Transaction Reference ─────────────────────────
    transactionId:   { type: String, unique: true, sparse: true },
    externalRef:     { type: String, default: null }, // bank/crypto tx id
    receiptUrl:      { type: String, default: null },

    // ── Crypto Details ────────────────────────────────
    cryptoAddress:   { type: String, default: null },
    cryptoTxHash:    { type: String, default: null },
    cryptoNetwork:   { type: String, default: null }, // mainnet, trc20, erc20

    // ── Bank / Mobile Details ─────────────────────────
    senderName:      { type: String, default: null },
    senderAccount:   { type: String, default: null }, // masked
    senderIBAN:      { type: String, default: null },
    receiverAccount: { type: String, default: null },

    // ── Physical Payment (5% commission) ──────────────
    isPhysical:      { type: Boolean, default: false },
    commissionPaid:  { type: Boolean, default: false },

    // ── Dispute ───────────────────────────────────────
    dispute: {
      raised:    { type: Boolean, default: false },
      raisedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reason:    { type: String,  default: null },
      raisedAt:  { type: Date,    default: null },
      resolved:  { type: Boolean, default: false },
      resolvedAt:{ type: Date,    default: null },
      resolution:{ type: String,  default: null },
    },

    // ── Refund ────────────────────────────────────────
    refund: {
      requested:   { type: Boolean, default: false },
      requestedAt: { type: Date,    default: null },
      approved:    { type: Boolean, default: false },
      approvedAt:  { type: Date,    default: null },
      amount:      { type: Number,  default: null },
      reason:      { type: String,  default: null },
    },

    // ── Admin ─────────────────────────────────────────
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminNotes:  { type: String, default: null },

    // ── Expiry (for pending crypto payments) ──────────
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ─── Indexes ─────────────────────────────────────────────
paymentSchema.index({ student:    1, status: 1 })
paymentSchema.index({ executor:   1, status: 1 })
paymentSchema.index({ assignment: 1 })
paymentSchema.index({ transactionId: 1 })
paymentSchema.index({ status: 1, createdAt: -1 })
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL for pending

// ─── Pre-save: generate transactionId ────────────────────
paymentSchema.pre('save', function (next) {
  if (!this.transactionId) {
    const ts  = Date.now().toString(36).toUpperCase()
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
    this.transactionId = `PMT-${ts}-${rnd}`
  }
  next()
})

// ─── Virtuals ────────────────────────────────────────────
paymentSchema.virtual('isExpired').get(function () {
  return this.status === 'pending' && new Date() > new Date(this.expiresAt)
})

module.exports = mongoose.model('Payment', paymentSchema)
