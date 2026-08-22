const mongoose = require('mongoose');

const farmTransactionSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
    description: { type: String, default: '', trim: true },
    date: { type: Date, required: true, default: Date.now },
    relatedCrop: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FarmTransaction', farmTransactionSchema);
