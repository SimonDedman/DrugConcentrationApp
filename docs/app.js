// Main application logic for Drug Concentration Tracker

class DrugConcentrationApp {
    constructor() {
        this.doses = [];
        this.initializeDateTime();
        this.updateDoseUnits();
        this.bindEvents();
    }
    
    initializeDateTime() {
        // Set default time to current time
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16);
        document.getElementById('timeOfDose').value = localDateTime;
    }
    
    bindEvents() {
        // Update dose units when drug type changes
        document.getElementById('drugType').addEventListener('change', () => {
            this.updateDoseUnits();
            this.updateDosePlaceholder();
        });
        
        // Update route options when drug type changes
        document.getElementById('drugType').addEventListener('change', () => {
            this.updateRouteOptions();
        });
        
        // Initialize route options
        this.updateRouteOptions();
        this.updateDosePlaceholder();
    }
    
    updateDoseUnits() {
        const drugType = document.getElementById('drugType').value;
        const doseUnit = document.getElementById('doseUnit');
        
        // Clear existing options
        doseUnit.innerHTML = '';
        
        if (drugType === 'alcohol') {
            doseUnit.innerHTML = `
                <option value="ml">ml (pure alcohol)</option>
                <option value="drinks" selected>standard drinks</option>
                <option value="mg">mg</option>
                <option value="g">g</option>
            `;
        } else {
            doseUnit.innerHTML = `
                <option value="mg" selected>mg</option>
                <option value="g">g</option>
            `;
        }
    }
    
    updateDosePlaceholder() {
        const drugType = document.getElementById('drugType').value;
        const doseInput = document.getElementById('dose');
        
        const placeholders = {
            alcohol: '1-3',
            thc: '5-25',
            cbd: '10-100',
            mdma: '75-150',
            psilocybin: '15-30'
        };
        
        doseInput.placeholder = placeholders[drugType] || '';
    }
    
    updateRouteOptions() {
        const drugType = document.getElementById('drugType').value;
        const routeSelect = document.getElementById('route');
        
        // Clear existing options
        routeSelect.innerHTML = '';
        
        const routeOptions = {
            alcohol: [
                { value: 'oral', text: 'Oral (drinking)' }
            ],
            thc: [
                { value: 'oral', text: 'Oral (edibles)' },
                { value: 'inhaled', text: 'Inhaled (smoking/vaping)' },
                { value: 'liquid', text: 'Oral (liquid/tincture)' }
            ],
            cbd: [
                { value: 'oral', text: 'Oral (edibles/capsules)' },
                { value: 'inhaled', text: 'Inhaled (smoking/vaping)' },
                { value: 'liquid', text: 'Oral (liquid/tincture)' }
            ],
            mdma: [
                { value: 'oral', text: 'Oral (pills/crystals)' }
            ],
            psilocybin: [
                { value: 'oral', text: 'Oral (mushrooms/tea)' }
            ]
        };
        
        const options = routeOptions[drugType] || [{ value: 'oral', text: 'Oral' }];
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            routeSelect.appendChild(optionElement);
        });
    }
    
    addDose() {
        const drugType = document.getElementById('drugType').value;
        const dose = parseFloat(document.getElementById('dose').value);
        const doseUnit = document.getElementById('doseUnit').value;
        const route = document.getElementById('route').value;
        const timeOfDose = document.getElementById('timeOfDose').value;
        
        if (!dose || !timeOfDose) {
            alert('Please fill in dose and time fields');
            return;
        }
        
        const doseEntry = {
            id: Date.now(),
            drug: drugType,
            dose: dose,
            unit: doseUnit,
            route: route,
            time: timeOfDose
        };
        
        this.doses.push(doseEntry);
        this.updateDoseList();
        
        // Clear dose input but keep other fields
        document.getElementById('dose').value = '';
    }
    
    removeDose(id) {
        this.doses = this.doses.filter(dose => dose.id !== id);
        this.updateDoseList();
    }
    
    clearAllDoses() {
        this.doses = [];
        this.updateDoseList();
    }
    
    updateDoseList() {
        const doseList = document.getElementById('doseList');
        
        if (this.doses.length === 0) {
            doseList.innerHTML = '<p style="color: #666;">No doses added yet.</p>';
            return;
        }
        
        doseList.innerHTML = this.doses.map(dose => {
            const time = new Date(dose.time).toLocaleString();
            const drugName = dose.drug.charAt(0).toUpperCase() + dose.drug.slice(1);
            
            return `
                <div class="drug-entry">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${drugName}</strong> - ${dose.dose} ${dose.unit} (${dose.route})<br>
                            <small style="color: #666;">Time: ${time}</small>
                        </div>
                        <button onclick="app.removeDose(${dose.id})" style="background-color: #dc3545;">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updatePlot() {
        if (this.doses.length === 0) {
            alert('Please add at least one dose to generate a plot');
            return;
        }
        
        const bodyWeight = parseFloat(document.getElementById('bodyWeight').value) || 70;
        const age = parseInt(document.getElementById('age').value) || 25;
        
        this.generateConcentrationPlot(bodyWeight, age);
        this.generateSubjectiveEffectsPlot(bodyWeight, age);
    }
    
    getDrugDuration(drugType) {
        // Get typical duration for drug effects (in hours)
        const durations = {
            alcohol: 16, // Extended to ensure plot continues until BAC hits zero
            thc: 24, 
            mdma: 24,
            psilocybin: 12
        };
        return durations[drugType] || 24;
    }
    
    createDoseHistory(doses) {
        // Create a summary of all doses for tooltip
        return doses.map(dose => {
            const time = new Date(dose.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            return `${dose.dose}${dose.unit} at ${time}`;
        }).join(', ');
    }
    
    createDateAnnotations(startTime, endTime) {
        // Create date annotations for start of each day
        const annotations = [];
        const current = new Date(startTime);
        current.setHours(0, 0, 0, 0); // Start of day
        
        while (current <= endTime) {
            if (current >= startTime) {
                annotations.push({
                    x: current.getTime(),
                    y: 0,
                    xref: 'x',
                    yref: 'paper',
                    text: current.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
                    showarrow: false,
                    font: {size: 10, color: '#666'},
                    yshift: -30,
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: '#ccc',
                    borderwidth: 1
                });
            }
            current.setDate(current.getDate() + 1); // Next day
        }
        
        return annotations;
    }
    
    generateConcentrationPlot(bodyWeight, age) {
        const plotData = [];
        const now = new Date();
        
        // Find earliest and latest times
        const doseTimes = this.doses.map(d => new Date(d.time));
        const earliestTime = new Date(Math.min(...doseTimes));
        const latestTime = new Date(Math.max(...doseTimes));
        
        // Round current time to previous 30-minute mark
        const roundedNow = new Date();
        roundedNow.setMinutes(Math.floor(roundedNow.getMinutes() / 30) * 30, 0, 0);
        
        // Plot from rounded current time 
        const startTime = roundedNow;
        const endTime = new Date(latestTime.getTime() + 24 * 60 * 60 * 1000);
        
        // Drug colors for plotting
        const drugColors = {
            alcohol: '#FF6B6B',
            thc: '#4ECDC4',
            cbd: '#95A5A6',
            mdma: '#45B7D1',
            psilocybin: '#96CEB4'
        };
        
        // Group doses by drug type for additive effects
        const drugGroups = {};
        this.doses.forEach(doseEntry => {
            if (!drugGroups[doseEntry.drug]) {
                drugGroups[doseEntry.drug] = [];
            }
            drugGroups[doseEntry.drug].push(doseEntry);
        });
        
        // Generate combined curves for each drug type
        Object.entries(drugGroups).forEach(([drugType, doses]) => {
            // Create time points for this drug (from earliest dose to +48h after latest)
            const doseTimes = doses.map(d => new Date(d.time));
            const earliestDose = new Date(Math.min(...doseTimes));
            const latestDose = new Date(Math.max(...doseTimes));
            const drugDuration = Math.min(24, this.getDrugDuration(drugType));
            
            const timePoints = [];
            const combinedConcentrations = [];
            const doseHistory = this.createDoseHistory(doses);
            
            // Generate time points from start to end
            const plotStart = new Date(Math.min(startTime.getTime(), earliestDose.getTime()));
            const plotEnd = new Date(latestDose.getTime() + drugDuration * 60 * 60 * 1000);
            
            for (let t = plotStart.getTime(); t <= plotEnd.getTime(); t += 15 * 60 * 1000) { // 15-min intervals
                const currentTime = new Date(t);
                timePoints.push(currentTime);
                
                // Calculate combined concentration from all doses of this drug
                let totalConcentration = 0;
                doses.forEach(doseEntry => {
                    const doseTime = new Date(doseEntry.time);
                    const timeDiffHours = (currentTime - doseTime) / (1000 * 60 * 60);
                    
                    if (timeDiffHours >= 0) {
                        const dose = DrugParameters.convertDose(doseEntry.dose, doseEntry.unit, doseEntry.drug);
                        const concentration = PharmacokineticCalculator.calculateConcentration(
                            dose, doseEntry.drug, doseEntry.route, timeDiffHours, bodyWeight, age
                        );
                        totalConcentration += concentration;
                    }
                });
                
                combinedConcentrations.push(totalConcentration);
            }
            
            // Create plot trace
            const drugName = drugType.charAt(0).toUpperCase() + drugType.slice(1);
            const traceName = `${drugName} (${doses.length} dose${doses.length > 1 ? 's' : ''})`;
            
            plotData.push({
                x: timePoints,
                y: combinedConcentrations,
                mode: 'lines',
                name: traceName,
                line: { 
                    color: drugColors[drugType],
                    width: 3
                },
                hovertemplate: `<b>${drugName}</b><br>` +
                              `Time: %{x}<br>` +
                              `Total Concentration: %{y:.2f} ng/mL<br>` +
                              `Doses: ${doseHistory}<br>` +
                              `<extra></extra>`
            });
        });
        
        // Add current time marker (but don't snap hover to it)
        const currentTimeTrace = {
            x: [now, now],
            y: [0, Math.max(...plotData.flatMap(d => d.y)) * 1.1],
            mode: 'lines',
            name: 'Current Time',
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            },
            hovertemplate: 'Current Time<extra></extra>',
            hoverinfo: 'skip' // Don't include in hover events
        };
        
        plotData.push(currentTimeTrace);
        
        // Create layout
        const layout = {
            title: {
                text: 'Blood Drug Concentration Over Time',
                font: { size: 20, family: 'Arial, sans-serif' }
            },
            xaxis: {
                gridcolor: '#E0E0E0',
                gridwidth: 1,
                tickformat: '%H:%M',
                range: [startTime, endTime],
                dtick: 30 * 60 * 1000 // 30-minute intervals in milliseconds
            },
            yaxis: {
                title: 'Plasma Concentration (ng/mL)',
                gridcolor: '#E0E0E0',
                gridwidth: 1,
                rangemode: 'tozero'
            },
            plot_bgcolor: '#FAFAFA',
            paper_bgcolor: 'white',
            font: { family: 'Arial, sans-serif' },
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#E0E0E0',
                borderwidth: 1
            },
            margin: { l: 80, r: 150, t: 80, b: 80 },
            hovermode: 'x unified',
            annotations: this.createDateAnnotations(startTime, endTime)
        };
        
        // Plot configuration
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToAdd: ['pan2d', 'select2d'],
            displaylogo: false
        };
        
        // Create plot
        Plotly.newPlot('plot', plotData, layout, config);
        
        // Add current concentrations summary
        this.displayCurrentConcentrations(bodyWeight, age);
    }
    
    generateSubjectiveEffectsPlot(bodyWeight, age) {
        const plotData = [];
        const now = new Date();
        
        // Find earliest and latest times
        const doseTimes = this.doses.map(d => new Date(d.time));
        const earliestTime = new Date(Math.min(...doseTimes));
        const latestTime = new Date(Math.max(...doseTimes));
        
        // Round current time to previous 30-minute mark
        const roundedNow = new Date();
        roundedNow.setMinutes(Math.floor(roundedNow.getMinutes() / 30) * 30, 0, 0);
        
        // Plot from rounded current time 
        const startTime = roundedNow;
        const endTime = new Date(latestTime.getTime() + 24 * 60 * 60 * 1000);
        
        // Drug colors for plotting
        const drugColors = {
            alcohol: '#FF6B6B',
            thc: '#4ECDC4',
            cbd: '#95A5A6',
            mdma: '#45B7D1',
            psilocybin: '#96CEB4'
        };
        
        // Group doses by drug type for additive effects
        const drugGroups = {};
        this.doses.forEach(doseEntry => {
            if (!drugGroups[doseEntry.drug]) {
                drugGroups[doseEntry.drug] = [];
            }
            drugGroups[doseEntry.drug].push(doseEntry);
        });
        
        // Generate combined normalized curves for each drug type
        Object.entries(drugGroups).forEach(([drugType, doses]) => {
            // Create time points for this drug
            const doseTimes = doses.map(d => new Date(d.time));
            const earliestDose = new Date(Math.min(...doseTimes));
            const latestDose = new Date(Math.max(...doseTimes));
            const drugDuration = Math.min(24, this.getDrugDuration(drugType));
            
            const timePoints = [];
            const combinedNormalizedConcentrations = [];
            const doseHistory = this.createDoseHistory(doses);
            
            // Generate time points from start to end
            const plotStart = new Date(Math.min(startTime.getTime(), earliestDose.getTime()));
            const plotEnd = new Date(latestDose.getTime() + drugDuration * 60 * 60 * 1000);
            
            for (let t = plotStart.getTime(); t <= plotEnd.getTime(); t += 15 * 60 * 1000) { // 15-min intervals
                const currentTime = new Date(t);
                timePoints.push(currentTime);
                
                // Calculate combined normalized concentration from all doses of this drug
                let totalConcentration = 0;
                doses.forEach(doseEntry => {
                    const doseTime = new Date(doseEntry.time);
                    const timeDiffHours = (currentTime - doseTime) / (1000 * 60 * 60);
                    
                    if (timeDiffHours >= 0) {
                        const dose = DrugParameters.convertDose(doseEntry.dose, doseEntry.unit, doseEntry.drug);
                        const concentration = PharmacokineticCalculator.calculateConcentration(
                            dose, doseEntry.drug, doseEntry.route, timeDiffHours, bodyWeight, age
                        );
                        const normalizedConc = DrugNormalization.normalizeToSubjectiveEffects(concentration, doseEntry.drug);
                        totalConcentration += normalizedConc;
                    }
                });
                
                combinedNormalizedConcentrations.push(totalConcentration);
            }
            
            // Create plot trace
            const drugName = drugType.charAt(0).toUpperCase() + drugType.slice(1);
            const traceName = `${drugName} (${doses.length} dose${doses.length > 1 ? 's' : ''})`;
            
            plotData.push({
                x: timePoints,
                y: combinedNormalizedConcentrations,
                mode: 'lines',
                name: traceName,
                line: { 
                    color: drugColors[drugType],
                    width: 3
                },
                hovertemplate: `<b>${drugName}</b><br>` +
                              `Time: %{x}<br>` +
                              `Total Effect Level: %{y:.1f} mg/dL BAC-equiv<br>` +
                              `Doses: ${doseHistory}<br>` +
                              `<extra></extra>`
            });
        });
        
        // Add current time marker (but don't snap hover to it)
        const currentTimeTrace = {
            x: [now, now],
            y: [0, Math.max(...plotData.flatMap(d => d.y)) * 1.1 || 100],
            mode: 'lines',
            name: 'Current Time',
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            },
            hovertemplate: 'Current Time<extra></extra>',
            hoverinfo: 'skip' // Don't include in hover events
        };
        
        plotData.push(currentTimeTrace);
        
        // Add reference lines for BAC equivalence only if they don't extend Y range
        const maxDataValue = Math.max(...plotData.filter(d => d.name !== 'Current Time').flatMap(d => d.y));
        const referenceLines = [
            { level: 30, label: 'Mild (0.03% BAC equiv)', color: '#FFC107' },
            { level: 50, label: 'Moderate (0.05% BAC equiv)', color: '#FF9800' },
            { level: 80, label: 'Legal Limit (0.08% BAC equiv)', color: '#F44336' }
        ];
        
        referenceLines.forEach(ref => {
            if (ref.level <= maxDataValue * 1.1) { // Only show if within 110% of max data
                plotData.push({
                    x: [startTime, endTime],
                    y: [ref.level, ref.level],
                    mode: 'lines',
                    name: ref.label,
                    line: {
                        color: ref.color,
                        width: 1,
                        dash: 'dot'
                    },
                    hovertemplate: ref.label + '<extra></extra>',
                    showlegend: true,
                    hoverinfo: 'skip'
                });
            }
        });
        
        // Create layout
        const layout = {
            title: {
                text: 'Subjective Effects Over Time (Alcohol-Equivalent)',
                font: { size: 20, family: 'Arial, sans-serif' }
            },
            xaxis: {
                gridcolor: '#E0E0E0',
                gridwidth: 1,
                tickformat: '%H:%M',
                range: [startTime, endTime],
                dtick: 30 * 60 * 1000 // 30-minute intervals in milliseconds
            },
            yaxis: {
                title: 'Subjective Effect Level (mg/dL BAC-equivalent)',
                gridcolor: '#E0E0E0',
                gridwidth: 1,
                rangemode: 'tozero'
            },
            plot_bgcolor: '#FAFAFA',
            paper_bgcolor: 'white',
            font: { family: 'Arial, sans-serif' },
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#E0E0E0',
                borderwidth: 1
            },
            margin: { l: 80, r: 150, t: 80, b: 80 },
            hovermode: 'x unified',
            annotations: this.createDateAnnotations(startTime, endTime)
        };
        
        // Plot configuration
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToAdd: ['pan2d', 'select2d'],
            displaylogo: false
        };
        
        // Create plot
        Plotly.newPlot('subjectivePlot', plotData, layout, config);
    }
    
    displayCurrentConcentrations(bodyWeight, age) {
        const now = new Date();
        const summaryDiv = document.getElementById('currentSummary') || this.createSummaryDiv();
        
        let summaryHTML = '<h3>Current Active Concentrations</h3>';
        let totalSubjectiveEffects = 0;
        
        this.doses.forEach(doseEntry => {
            const currentConc = PharmacokineticCalculator.getCurrentConcentration(
                doseEntry, now, bodyWeight, age
            );
            
            if (currentConc > 0.01) { // Only show if concentration > 0.01 ng/mL
                const subjectiveLevel = DrugNormalization.normalizeToSubjectiveEffects(currentConc, doseEntry.drug);
                totalSubjectiveEffects += subjectiveLevel;
                
                const drugName = doseEntry.drug.charAt(0).toUpperCase() + doseEntry.drug.slice(1);
                const timeAgo = Math.round((now - new Date(doseEntry.time)) / (1000 * 60));
                
                summaryHTML += `
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <strong>${drugName}</strong>: ${currentConc.toFixed(2)} ng/mL<br>
                        <small>Subjective Level: ${subjectiveLevel.toFixed(1)} mg/dL BAC-equiv</small><br>
                        <small>Dose: ${doseEntry.dose} ${doseEntry.unit}, ${timeAgo} minutes ago</small>
                    </div>
                `;
            }
        });
        
        const impairmentLevel = DrugNormalization.getImpairmentLevel(totalSubjectiveEffects);
        summaryHTML += `
            <div style="margin-top: 15px; padding: 15px; background: #e9ecef; border-radius: 4px;">
                <strong>Combined Subjective Effect Level: ${impairmentLevel}</strong><br>
                <small>Total BAC-equivalent: ${totalSubjectiveEffects.toFixed(1)} mg/dL</small><br>
                <small style="color: #666;">For reference: 0.08% BAC = 80 mg/dL (legal limit in many places)</small>
            </div>
        `;
        
        if (totalSubjectiveEffects < 5) {
            summaryHTML = '<h3>Current Active Concentrations</h3><p style="color: #666;">No significant active concentrations detected.</p>';
        }
        
        summaryDiv.innerHTML = summaryHTML;
    }
    
    createSummaryDiv() {
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'currentSummary';
        summaryDiv.style.marginTop = '20px';
        summaryDiv.style.padding = '20px';
        summaryDiv.style.backgroundColor = 'white';
        summaryDiv.style.borderRadius = '8px';
        summaryDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        document.querySelector('.container').appendChild(summaryDiv);
        return summaryDiv;
    }
}

// Global functions for HTML onclick handlers
let app;

function addDose() {
    app.addDose();
}

function clearAllDoses() {
    app.clearAllDoses();
}

function updatePlot() {
    app.updatePlot();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new DrugConcentrationApp();
});