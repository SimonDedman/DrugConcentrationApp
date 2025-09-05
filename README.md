# Blood Drug Concentration Tracker

A web-based application for tracking and visualizing blood drug concentrations over time using scientifically-backed pharmacokinetic models.

**🌐 Live App: [https://simondedman.github.io/DrugConcentrationApp/](https://simondedman.github.io/DrugConcentrationApp/)**

## ⚠️ Important Disclaimer

**This tool is for educational purposes only.** The calculations provided are approximations based on population averages and should **never** be used for:
- Medical decision making
- Legal purposes
- Determining fitness to drive or operate machinery
- Any safety-critical decisions

Always consult healthcare professionals for medical advice and follow local laws regarding substance use.

## Features

- **Research-Based Models**: Uses peer-reviewed pharmacokinetic parameters
- **Multiple Substances**: Supports alcohol, THC, MDMA, and psilocybin
- **Multiple Routes**: Oral, inhaled, and other administration routes
- **Real-Time Visualization**: Interactive plots showing concentration curves
- **Cross-Drug Comparison**: Normalized impairment levels
- **Historical & Future Tracking**: Add doses from past or future times

## Supported Substances

### Alcohol
- **Half-life**: Zero-order elimination (~15 mg%/hr)
- **Bioavailability**: 85% (oral)
- **Peak**: 30-90 minutes
- **Units**: Standard drinks, mL, mg, g

### THC (Marijuana)
- **Half-life**: 1.3 days (occasional), 5-13 days (chronic users)
- **Bioavailability**: 25% (inhaled), 8% (oral)
- **Peak**: 10 minutes (inhaled), 1-2 hours (oral)
- **Routes**: Smoking/vaping, edibles

### MDMA (Ecstasy)
- **Half-life**: ~8 hours (non-linear kinetics)
- **Peak**: ~2 hours (oral)
- **Non-linear**: Exhibits dose-dependent kinetics
- **Route**: Oral administration

### Psilocybin
- **Half-life**: 3 hours (as psilocin)
- **Bioavailability**: ~53% (oral)
- **Peak**: 2 hours
- **Route**: Oral (mushrooms, tea)

## How It Works

The application uses established pharmacokinetic models:

1. **One-Compartment Model**: For most substances
   ```
   C(t) = (F×D×ka)/(Vd×(ka-ke)) × (e^(-ke×t) - e^(-ka×t))
   ```

2. **Zero-Order Model**: For alcohol elimination
   ```
   BAC(t) = Peak_BAC - (Elimination_Rate × time)
   ```

### Key Parameters
- **F**: Bioavailability (fraction absorbed)
- **ka**: Absorption rate constant
- **ke**: Elimination rate constant  
- **Vd**: Volume of distribution
- **t**: Time since administration

## Usage

1. **Set User Parameters**: Enter body weight and age
2. **Add Doses**: Select drug, dose, route, and time
3. **View Concentrations**: Click "Update Plot" to see curves
4. **Current Status**: View active concentrations and impairment level

## Files Structure

- `index.html` - Main web interface
- `pharmacokinetics.js` - Core calculation engine
- `app.js` - User interface and visualization logic
- `README.md` - Documentation

## Deployment on GitHub Pages

1. Fork/upload this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Select source branch (usually `main` or `gh-pages`)
4. Access your app at `https://username.github.io/repository-name`

## Scientific Basis

The pharmacokinetic parameters are derived from peer-reviewed research:

- **Alcohol**: Clinical Pharmacokinetics of Ethanol (multiple studies)
- **THC**: Human Cannabinoid Pharmacokinetics, British Journal of Clinical Pharmacology
- **MDMA**: Non-linear pharmacokinetics studies, PMC articles
- **Psilocybin**: Pharmacokinetics and Pharmacodynamics studies (2023-2024)

## Limitations

- Population-average parameters (individual variation exists)
- Simplified models (actual physiology is more complex)
- No consideration of tolerance, drug interactions, or medical conditions
- Concentration ≠ impairment (subjective effects vary)
- Food, hydration, and other factors not fully modeled

## Future Enhancements

- Individual parameter customization
- More substances (LSD, cocaine, opioids)
- Tolerance modeling
- Drug interaction effects
- Mobile app version
- Data export/import

## License

This project is provided for educational purposes. Users assume all responsibility for any use of this software.

## Contributing

Contributions welcome! Please:
1. Ensure scientific accuracy
2. Cite sources for any parameter changes  
3. Include appropriate disclaimers
4. Test thoroughly

## References

Key pharmacokinetic references used in this application are available upon request. All parameters are derived from peer-reviewed scientific literature in clinical pharmacology journals.
