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
                    volumeOfDistribution: 2, // L/kg (reduced from 10 for realistic concentrations)
                    halfLife: 33, // hours (occasional users)
                    tmax: 1.5 // hours
                },
                inhaled: {
                    bioavailability: 0.25, // 10-35% average 25%
                    absorptionRate: 12, // very fast absorption (5 minutes = 0.083 hr)
                    eliminationRate: 0.021, // same elimination
                    volumeOfDistribution: 2, // L/kg (reduced from 10)
                    halfLife: 33,
                    tmax: 0.17 // ~10 minutes
                },
                liquid: {
                    bioavailability: 0.15, // Between oral and inhaled
                    absorptionRate: 2, // Faster than oral, slower than inhaled
                    eliminationRate: 0.021,
                    volumeOfDistribution: 2,
                    halfLife: 33,
                    tmax: 0.5 // 30 minutes
                }
            },
            cbd: {
                oral: {
                    bioavailability: 0.06, // 6% oral bioavailability
                    absorptionRate: 0.5, // Similar to THC oral
                    eliminationRate: 0.038, // 18-32 hour half-life, average ~18h
                    volumeOfDistribution: 32, // L/kg (highly lipophilic)
                    halfLife: 18, // hours
                    tmax: 2 // hours
                },
                inhaled: {
                    bioavailability: 0.31, // 11-45% average 31%
                    absorptionRate: 12, // Fast like THC
                    eliminationRate: 0.038,
                    volumeOfDistribution: 32,
                    halfLife: 18,
                    tmax: 0.25 // 15 minutes
                },
                liquid: {
                    bioavailability: 0.15, // Between oral and inhaled
                    absorptionRate: 2,
                    eliminationRate: 0.038,
                    volumeOfDistribution: 32,
                    halfLife: 18,
                    tmax: 1 // 60 minutes
                }
            },
            mdma: {
                oral: {
                    bioavailability: 0.75, // Variable due to non-linear kinetics
                    absorptionRate: 0.5, // 1/hr (absorption rate to reach tmax ~2hr)
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
    
    // Improved alcohol model with exponential elimination
    static alcoholModel(dose, params, timeHours, bodyWeight) {
        const { bioavailability, tmax } = params;
        const F = bioavailability;
        const t = timeHours;
        
        if (t <= 0) return 0;
        
        // Use empirical BAC calculation calibrated to Forbes chart
        // Forbes shows 4 drinks consumed quickly = 0.08% BAC for 180lb male
        // But single doses should be higher to account for accumulation when drinking over time
        const doseGrams = dose / 1000; // Convert mg to grams
        const effectiveDose = doseGrams * F; // Apply bioavailability
        const drinksEquivalent = effectiveDose / 14; // Number of standard drinks
        const peakBAC = drinksEquivalent * 30 * (82 / bodyWeight); // mg/dL, increased from 20 to 30
        
        // Absorption phase (exponential approach to peak)
        if (t <= tmax) {
            return peakBAC * (1 - Math.exp(-3 * t / tmax)); // 95% absorbed by tmax
        }
        
        // Elimination phase (zero-order/linear decay)
        // Alcohol elimination: constant rate ~15-20 mg/dL per hour
        const eliminationRate = 15; // mg/dL per hour (constant elimination)
        const eliminationTime = t - tmax;
        const currentBAC = peakBAC - (eliminationRate * eliminationTime);
        
        return Math.max(0, currentBAC);
    }
    
    // Improved MDMA model based on empirical data
    static mdmaModel(dose, params, timeHours, bodyWeight) {
        const { bioavailability, tmax, halfLife } = params;
        const F = bioavailability;
        const t = timeHours;
        
        if (t <= 0) return 0;
        
        // Empirical model: 100mg MDMA ≈ 200 ng/mL peak for 70kg person
        // Scale by dose and body weight
        const peakConcentration = (dose * F / 100) * 200 * (70 / bodyWeight); // ng/mL
        
        // Use proper one-compartment kinetics for smooth curve
        const ke = 0.693 / halfLife; // elimination rate constant
        const ka = 3 / tmax; // absorption rate to reach ~95% of peak at tmax
        
        // One-compartment model: C(t) = (F*D*ka)/(Vd*(ka-ke)) * (e^(-ke*t) - e^(-ka*t))
        // But we want to specify peak concentration directly, so:
        const maxCoeff = ka / (ka - ke); // Maximum value of (e^(-ke*t) - e^(-ka*t))
        const coefficient = peakConcentration / maxCoeff;
        const currentConcentration = coefficient * (Math.exp(-ke * t) - Math.exp(-ka * t));
        
        return Math.max(0, currentConcentration);
    }
    
    // Empirical psilocybin model based on research data
    static psilocybinModel(dose, params, timeHours, bodyWeight) {
        const { bioavailability, tmax, halfLife } = params;
        const F = bioavailability;
        const t = timeHours;
        
        if (t <= 0) return 0;
        
        // Research shows: 30mg psilocybin ≈ 21 ng/mL peak psilocin for 70kg person
        // Scale linearly by dose and body weight
        const peakConcentration = (dose * F / 30) * 21 * (70 / bodyWeight); // ng/mL
        
        // Use one-compartment kinetics for smooth curve
        const ke = 0.693 / halfLife; // elimination rate constant
        const ka = 3 / tmax; // absorption rate to reach ~95% of peak at tmax
        
        // One-compartment model scaled to desired peak
        const maxCoeff = ka / (ka - ke);
        const coefficient = peakConcentration / maxCoeff;
        const currentConcentration = coefficient * (Math.exp(-ke * t) - Math.exp(-ka * t));
        
        return Math.max(0, currentConcentration);
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
        
        // Special handling for MDMA (simplified model due to non-linear kinetics)
        if (drugType === 'mdma') {
            return this.mdmaModel(dose, adjustedParams, timeHours, bodyWeight);
        }
        
        // Special handling for psilocybin (empirical model for better accuracy)
        if (drugType === 'psilocybin') {
            return this.psilocybinModel(dose, adjustedParams, timeHours, bodyWeight);
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
    
    // Research-based subjective effects normalization
    // Based on published studies comparing subjective intoxication levels
    static getSubjectiveEffectsFactor(drugType) {
        const factors = {
            // Reference: Standard drink = ~0.02 BAC increase
            alcohol: 1.0, // BAC mg/dL directly correlates with subjective impairment
            
            // THC: Peak subjective effects at ~10-20 ng/mL (inhaled), ~5-10 ng/mL (oral)
            // 5mg THC should be comparable to 1-2 drinks subjectively
            thc: 8.0, // 10 ng/mL THC ≈ 80 mg/dL BAC subjectively (increased for visibility)
            
            // CBD: Calming effects, should be visible but much lower than THC
            // 25mg CBD should be like mild alcohol effects
            cbd: 2.0, // 50 ng/mL CBD ≈ 100 mg/dL BAC subjectively (increased for visibility)
            
            // MDMA: Peak subjective effects at ~150-250 ng/mL
            // Moderate empathogenic effects ≈ 0.05-0.08 BAC equivalent  
            mdma: 0.4, // 200 ng/mL MDMA ≈ 80 mg/dL BAC subjectively
            
            // Psilocin: Peak effects at ~15-25 ng/mL
            // Strong psychedelic effects ≈ 0.08+ BAC equivalent subjective impairment
            psilocybin: 4.0 // 20 ng/mL psilocin ≈ 80 mg/dL BAC subjectively
        };
        return factors[drugType] || 1.0;
    }
    
    // Convert to subjective effects units (alcohol-equivalent mg/dL)
    static normalizeToSubjectiveEffects(concentration, drugType) {
        const factor = this.getSubjectiveEffectsFactor(drugType);
        return concentration * factor;
    }
    
    // Get impairment level description based on alcohol-equivalent BAC
    static getImpairmentLevel(alcoholEquivalentBAC) {
        if (alcoholEquivalentBAC < 10) return "Minimal";      // < 0.01 BAC
        if (alcoholEquivalentBAC < 30) return "Mild";         // 0.01-0.03 BAC  
        if (alcoholEquivalentBAC < 50) return "Moderate";     // 0.03-0.05 BAC
        if (alcoholEquivalentBAC < 80) return "Significant";  // 0.05-0.08 BAC
        if (alcoholEquivalentBAC < 150) return "Severe";      // 0.08-0.15 BAC
        return "Dangerous";                                    // > 0.15 BAC
    }
}