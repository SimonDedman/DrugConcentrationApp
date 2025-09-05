// Pharmacokinetic Models for Drug Concentration Tracking
// Based on research-backed parameters for accurate modeling

class DrugParameters {
    static getDrugParams(drugType, route) {
        const params = {
            alcohol: {
                oral: {
                    bioavailability: 0.85, // 85% bioavailability (reduced with food)
                    absorptionRate: 1.0, // hours (ka = 1/hr)
                    eliminationRate: null, // Zero-order kinetics
                    volumeOfDistribution: 0.53, // L/kg (37L/70kg = 0.53 L/kg)
                    halfLife: null, // Zero-order elimination
                    eliminationCapacity: 10, // mg/dL/hr average elimination
                    tmax: 0.75 // hours (30-90 minutes peak)
                }
            },
            thc: {
                oral: {
                    bioavailability: 0.08, // 4-12% average 8%
                    absorptionRate: 0.5, // hours (slower absorption)
                    eliminationRate: 0.021, // 1/hr (33-hour half-life for occasional users)
                    volumeOfDistribution: 10, // L/kg (highly lipophilic)
                    halfLife: 33, // hours (occasional users)
                    tmax: 1.5 // hours
                },
                inhaled: {
                    bioavailability: 0.25, // 10-35% average 25%
                    absorptionRate: 12, // very fast absorption (5 minutes = 0.083 hr)
                    eliminationRate: 0.021, // same elimination
                    volumeOfDistribution: 10,
                    halfLife: 33,
                    tmax: 0.17 // ~10 minutes
                }
            },
            mdma: {
                oral: {
                    bioavailability: 0.75, // Variable due to non-linear kinetics
                    absorptionRate: 0.5, // hours
                    eliminationRate: 0.087, // 1/hr (8-hour half-life)
                    volumeOfDistribution: 4, // L/kg
                    halfLife: 8, // hours
                    tmax: 2, // hours
                    nonLinear: true // Flag for non-linear kinetics
                }
            },
            psilocybin: {
                oral: {
                    bioavailability: 0.53, // 52-55%
                    absorptionRate: 0.5, // hours
                    eliminationRate: 0.231, // 1/hr (3-hour half-life)
                    volumeOfDistribution: 14, // L/kg (277-1016L / 70kg avg = ~14)
                    halfLife: 3, // hours
                    tmax: 2 // hours
                }
            }
        };
        
        return params[drugType]?.[route] || null;
    }
    
    // Convert doses to standard units (mg)
    static convertDose(dose, unit, drugType) {
        switch(unit) {
            case 'g':
                return dose * 1000;
            case 'ml': // for alcohol
                if (drugType === 'alcohol') {
                    return dose * 789 * 0.4; // ml to mg (density 0.789, 40% alcohol)
                }
                return dose;
            case 'drinks': // standard drinks
                if (drugType === 'alcohol') {
                    return dose * 14000; // 14g = 14000mg per standard drink
                }
                return dose;
            default:
                return dose;
        }
    }
}

class PharmacokineticCalculator {
    
    // One-compartment model with first-order absorption and elimination
    static oneCompartmentModel(dose, params, timeHours, bodyWeight) {
        const { bioavailability, absorptionRate, eliminationRate, volumeOfDistribution } = params;
        const F = bioavailability;
        const ka = absorptionRate;
        const ke = eliminationRate;
        const Vd = volumeOfDistribution * bodyWeight;
        const t = timeHours;
        
        if (t <= 0) return 0;
        
        // C(t) = (F*D*ka)/(Vd*(ka-ke)) * (e^(-ke*t) - e^(-ka*t))
        const coefficient = (F * dose * ka) / (Vd * (ka - ke));
        const concentration = coefficient * (Math.exp(-ke * t) - Math.exp(-ka * t));
        
        return Math.max(0, concentration);
    }
    
    // Zero-order elimination model for alcohol
    static alcoholModel(dose, params, timeHours, bodyWeight) {
        const { bioavailability, tmax, eliminationCapacity } = params;
        const F = bioavailability;
        const t = timeHours;
        
        if (t <= 0) return 0;
        
        // Convert dose to blood alcohol concentration
        const Vd = 0.53 * bodyWeight * 1000; // mL
        const peakBAC = (F * dose) / Vd; // mg/dL
        
        // Absorption phase (first-order-like to peak)
        if (t <= tmax) {
            return peakBAC * (t / tmax);
        }
        
        // Elimination phase (zero-order)
        const eliminationTime = t - tmax;
        const eliminatedAmount = eliminationCapacity * eliminationTime;
        const currentBAC = peakBAC - eliminatedAmount;
        
        return Math.max(0, currentBAC);
    }
    
    // Calculate concentration at specific time for any drug
    static calculateConcentration(dose, drugType, route, timeHours, bodyWeight, age = 25) {
        const params = DrugParameters.getDrugParams(drugType, route);
        if (!params) return 0;
        
        // Age adjustment (simplified)
        const ageAdjustment = age > 65 ? 0.8 : 1.0;
        const adjustedParams = { ...params };
        if (adjustedParams.eliminationRate) {
            adjustedParams.eliminationRate *= ageAdjustment;
        }
        
        // Special handling for alcohol (zero-order kinetics)
        if (drugType === 'alcohol') {
            return this.alcoholModel(dose, adjustedParams, timeHours, bodyWeight);
        }
        
        // Standard one-compartment model for other drugs
        return this.oneCompartmentModel(dose, adjustedParams, timeHours, bodyWeight);
    }
    
    // Generate concentration curve over time
    static generateCurve(dose, drugType, route, startTime, bodyWeight, age, duration = 48) {
        const timePoints = [];
        const concentrations = [];
        
        // Generate points every 15 minutes for first 12 hours, then every hour
        for (let t = 0; t <= duration; t += (t <= 12 ? 0.25 : 1)) {
            const concentration = this.calculateConcentration(
                dose, drugType, route, t, bodyWeight, age
            );
            
            timePoints.push(new Date(startTime.getTime() + t * 60 * 60 * 1000));
            concentrations.push(concentration);
        }
        
        return { timePoints, concentrations };
    }
    
    // Calculate current concentration for a dose
    static getCurrentConcentration(doseEntry, currentTime, bodyWeight, age) {
        const timeDiffMs = currentTime - new Date(doseEntry.time);
        const timeHours = timeDiffMs / (1000 * 60 * 60);
        
        if (timeHours < 0) return 0; // Future dose
        
        const dose = DrugParameters.convertDose(doseEntry.dose, doseEntry.unit, doseEntry.drug);
        return this.calculateConcentration(dose, doseEntry.drug, doseEntry.route, timeHours, bodyWeight, age);
    }
}

// Normalization for cross-drug comparison
class DrugNormalization {
    // Approximate relative potency factors for subjective effect comparison
    static getRelativePotency(drugType) {
        const potencies = {
            alcohol: 1.0, // Reference (BAC in mg/dL)
            thc: 500, // THC is much more potent per mg
            mdma: 50, // MDMA moderate potency
            psilocybin: 1000 // Psilocybin very potent per mg
        };
        return potencies[drugType] || 1.0;
    }
    
    // Normalize concentration to "alcohol equivalence" for comparison
    static normalizeToAlcoholEquivalent(concentration, drugType) {
        const potency = this.getRelativePotency(drugType);
        return concentration * potency;
    }
    
    // Get impairment level description
    static getImpairmentLevel(normalizedConcentration) {
        if (normalizedConcentration < 5) return "Minimal";
        if (normalizedConcentration < 20) return "Mild";
        if (normalizedConcentration < 50) return "Moderate";
        if (normalizedConcentration < 100) return "Significant";
        return "Severe";
    }
}