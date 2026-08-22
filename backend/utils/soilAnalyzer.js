/**
 * Rule-based soil analysis engine using Indian Soil Health Card reference ranges.
 * Pure function — no external dependencies.
 */

const RULES = {
  pH: {
    name: 'pH',
    analyze(v) {
      if (v < 6.5) return { rating: 'Acidic', recommendation: 'Apply agricultural lime (2-4 tonnes/ha) to raise pH. Use acid-tolerant crop varieties in the meantime.' };
      if (v <= 7.5) return { rating: 'Neutral (Optimal)', recommendation: 'pH is in the ideal range. No corrective action needed. Continue balanced fertilization.' };
      return { rating: 'Alkaline', recommendation: 'Apply gypsum (2-4 tonnes/ha) and incorporate organic matter (FYM/compost) to lower pH. Consider salt-tolerant varieties.' };
    },
  },
  nitrogen: {
    name: 'Nitrogen (kg/ha)',
    analyze(v) {
      if (v < 280) return { rating: 'Low', recommendation: 'Apply urea (40-60 kg/ha) or DAP in split doses. Incorporate green manure crops like dhaincha or sunhemp before sowing.' };
      if (v <= 560) return { rating: 'Medium', recommendation: 'Apply standard nitrogen dosage (20-40 kg/ha urea) as per crop requirement. Maintain organic matter inputs.' };
      return { rating: 'High', recommendation: 'Reduce urea application. Excess nitrogen can cause lodging and pest susceptibility. Focus on P and K balance.' };
    },
  },
  phosphorus: {
    name: 'Phosphorus (kg/ha)',
    analyze(v) {
      if (v < 10) return { rating: 'Low', recommendation: 'Apply DAP (100-150 kg/ha) or SSP (250-300 kg/ha) at sowing time. Add organic manure to improve phosphorus availability.' };
      if (v <= 25) return { rating: 'Medium', recommendation: 'Apply maintenance dose of DAP (50-75 kg/ha) or SSP as per crop needs.' };
      return { rating: 'High', recommendation: 'Reduce phosphorus application. Excess P can lock up zinc and iron. Skip DAP/SSP for one season if very high.' };
    },
  },
  potassium: {
    name: 'Potassium (kg/ha)',
    analyze(v) {
      if (v < 110) return { rating: 'Low', recommendation: 'Apply MOP/Muriate of Potash (60-80 kg/ha). Potassium improves drought tolerance and disease resistance.' };
      if (v <= 280) return { rating: 'Medium', recommendation: 'Apply standard MOP dose (40-60 kg/ha) based on crop requirement.' };
      return { rating: 'High', recommendation: 'Potassium is sufficient. Reduce or skip MOP application this season. Monitor in next soil test.' };
    },
  },
  organicCarbon: {
    name: 'Organic Carbon (%)',
    analyze(v) {
      if (v < 0.5) return { rating: 'Low', recommendation: 'Urgently add farmyard manure (FYM) at 10-15 tonnes/ha, compost, or vermicompost. Practice crop residue retention and green manuring.' };
      if (v <= 0.75) return { rating: 'Medium', recommendation: 'Maintain organic inputs. Apply FYM (5-10 tonnes/ha) or compost regularly. Practice mulching to retain soil organic matter.' };
      return { rating: 'High', recommendation: 'Organic carbon is excellent. Continue current organic matter management practices.' };
    },
  },
  ec: {
    name: 'Electrical Conductivity (dS/m)',
    analyze(v) {
      if (v < 1) return { rating: 'Normal', recommendation: 'Soil salinity is within safe limits. No corrective action needed.' };
      if (v <= 2) return { rating: 'Slightly Saline', recommendation: 'Monitor salinity. Improve drainage, apply gypsum, and use light but frequent irrigation to flush salts.' };
      return { rating: 'Saline', recommendation: 'Apply gypsum (5-10 tonnes/ha), improve field drainage, and switch to salt-tolerant varieties (e.g., CSR rice varieties). Avoid excess chemical fertilizers.' };
    },
  },
  sulphur: {
    name: 'Sulphur (ppm)',
    analyze(v) {
      if (v < 10) return { rating: 'Deficient', recommendation: 'Apply elemental sulphur (20-40 kg/ha) or gypsum. Use sulphur-containing fertilizers like ammonium sulphate or SSP.' };
      return { rating: 'Sufficient', recommendation: 'Sulphur levels are adequate. No additional supplementation needed.' };
    },
  },
  zinc: {
    name: 'Zinc (ppm)',
    analyze(v) {
      if (v < 0.6) return { rating: 'Deficient', recommendation: 'Apply zinc sulphate (ZnSO₄) at 25 kg/ha to soil, or 0.5% foliar spray at tillering stage. Critical for rice and wheat.' };
      return { rating: 'Sufficient', recommendation: 'Zinc levels are adequate. Continue routine monitoring.' };
    },
  },
  iron: {
    name: 'Iron (ppm)',
    analyze(v) {
      if (v < 4.5) return { rating: 'Deficient', recommendation: 'Apply ferrous sulphate (FeSO₄) at 50 kg/ha to soil or 1% foliar spray. More common in alkaline/calcareous soils.' };
      return { rating: 'Sufficient', recommendation: 'Iron levels are adequate. No supplementation needed.' };
    },
  },
  manganese: {
    name: 'Manganese (ppm)',
    analyze(v) {
      if (v < 2) return { rating: 'Deficient', recommendation: 'Apply manganese sulphate (MnSO₄) at 25 kg/ha to soil or 0.5% foliar spray.' };
      return { rating: 'Sufficient', recommendation: 'Manganese levels are adequate. No action required.' };
    },
  },
  copper: {
    name: 'Copper (ppm)',
    analyze(v) {
      if (v < 0.2) return { rating: 'Deficient', recommendation: 'Apply copper sulphate (CuSO₄) at 5-10 kg/ha. Copper deficiency is common in sandy and organic-rich soils.' };
      return { rating: 'Sufficient', recommendation: 'Copper levels are adequate. No supplementation needed.' };
    },
  },
  boron: {
    name: 'Boron (ppm)',
    analyze(v) {
      if (v < 0.5) return { rating: 'Deficient', recommendation: 'Apply borax at 5-10 kg/ha or 0.2% boric acid foliar spray. Important for flowering and fruit setting.' };
      return { rating: 'Sufficient', recommendation: 'Boron levels are adequate. No action required.' };
    },
  },
};

/**
 * Analyze soil parameters against Indian Soil Health Card reference ranges.
 * @param {Object} params - Object with optional numeric soil parameters
 * @returns {Array} Array of { parameter, value, rating, recommendation }
 */
function analyzeSoil(params) {
  if (!params || typeof params !== 'object') return [];

  const results = [];

  for (const [key, rule] of Object.entries(RULES)) {
    const value = params[key];
    if (value === null || value === undefined || isNaN(value)) continue;

    const numValue = parseFloat(value);
    const { rating, recommendation } = rule.analyze(numValue);

    results.push({
      parameter: rule.name,
      value: numValue,
      rating,
      recommendation,
    });
  }

  return results;
}

module.exports = { analyzeSoil };
