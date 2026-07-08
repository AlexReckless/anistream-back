const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedCard: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  offeredCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

tradeSchema.index({ recipient: 1, status: 1 });
tradeSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
