const mongoose = require('mongoose');

const soilReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['pdf', 'manual'],
      required: true,
    },
    originalFileName: {
      type: String,
      default: '',
    },
    parameters: {
      pH: { type: Number, default: null },
      nitrogen: { type: Number, default: null },
      phosphorus: { type: Number, default: null },
      potassium: { type: Number, default: null },
      organicCarbon: { type: Number, default: null },
      ec: { type: Number, default: null },
      sulphur: { type: Number, default: null },
      zinc: { type: Number, default: null },
      iron: { type: Number, default: null },
      manganese: { type: Number, default: null },
      copper: { type: Number, default: null },
      boron: { type: Number, default: null },
    },
    analysis: [
      {
        parameter: String,
        value: Number,
        rating: String,
        recommendation: String,
      },
    ],
    farmerSummary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SoilReport', soilReportSchema);
