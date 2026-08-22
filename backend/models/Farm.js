const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Crop name is required'], trim: true },
  variety: { type: String, default: '', trim: true },
  areaAcres: { type: Number, required: [true, 'Crop area is required'] },
  sowingDate: { type: Date, required: [true, 'Sowing date is required'] },
  expectedHarvestDate: { type: Date, default: null },
  status: { type: String, enum: ['active', 'harvested', 'failed'], default: 'active' },
});

const farmSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    farmName: { type: String, default: '', trim: true },
    totalAreaAcres: { type: Number, required: [true, 'Total area is required'] },
    village: { type: String, required: [true, 'Village is required'], trim: true },
    district: { type: String, required: [true, 'District is required'], trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    soilType: {
      type: String,
      enum: ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy', 'Unknown'],
      default: 'Unknown',
    },
    irrigationSource: {
      type: String,
      enum: ['Canal', 'Borewell', 'Rainfed', 'Tank', 'River', 'Other'],
      default: 'Rainfed',
    },
    crops: [cropSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farm', farmSchema);
