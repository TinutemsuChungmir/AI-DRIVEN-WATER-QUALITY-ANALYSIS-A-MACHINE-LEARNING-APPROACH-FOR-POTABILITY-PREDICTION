let selectedParams = [];
let paramValues = {};
let chartInstances = {};

const modelFeatureOrder = [
    'ph', 'hardness', 'dissolvedOxygen', 'bod', 
    'heavyMetals', 'nitrates', 'phosphates', 'turbidity', 'conductivity'
];

const parameterDescriptions = {
    ph: "Measures acidity/alkalinity (Standard: 6.5-8.5)",
    hardness: "Calcium/magnesium levels (Standard: 60-120 mg/L)",
    dissolvedOxygen: "Oxygen available for aquatic life (Standard: 5-7 mg/L)",
    bod: "Biological Oxygen Demand (Standard: <5 mg/L)",
    heavyMetals: "Toxic metals like lead (Standard: <10 µg/L)",
    nitrates: "Nutrient pollution indicator (Standard: <10 mg/L)",
    phosphates: "Cause of algal blooms (Standard: <0.1 mg/L)",
    turbidity: "Water clarity measure (Standard: <5 NTU)",
    conductivity: "Ion concentration (Standard: 150-500 µS/cm)"
};

const parameterUnits = {
    ph: "",
    hardness: "mg/L",
    dissolvedOxygen: "mg/L",
    bod: "mg/L",
    heavyMetals: "µg/L",
    nitrates: "mg/L",
    phosphates: "mg/L",
    turbidity: "NTU",
    conductivity: "µS/cm"
};

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    const chartDataElement = document.getElementById('chartData');
    if (chartDataElement) {
        selectedParams = JSON.parse(chartDataElement.dataset.params);
        paramValues = JSON.parse(chartDataElement.dataset.values);
        createVisualizations();
    }
});

function toTitleCase(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function clearGraphs() {
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
        }
    });
    chartInstances = {};
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');

    if (step === 2) {
        const checkboxes = document.querySelectorAll('input[name="parameter"]:checked');
        selectedParams = Array.from(checkboxes).map(cb => cb.value);
        if (selectedParams.length === 0) {
            alert('Please select at least one parameter.');
            showStep(1);
            return;
        }
        renderValueInputs();
    }
}

function renderValueInputs() {
    const valueInputs = document.getElementById('valueInputs');
    valueInputs.innerHTML = '';
    selectedParams.forEach(param => {
        const div = document.createElement('div');
        div.className = 'input-group';
        const displayName = param === 'ph' ? 'pH' : toTitleCase(param);
        const unit = parameterUnits[param] ? ` (${parameterUnits[param]})` : '';
        div.innerHTML = `
            <label>${displayName}${unit}</label>
            <input type="number" name="${param}" placeholder="Enter value" required step="0.01">
            <div class="description">${parameterDescriptions[param]}</div>
        `;
        valueInputs.appendChild(div);
    });
}

async function submitToModel() {
    const inputs = document.querySelectorAll('#valueInputs input');
    paramValues = {};
    inputs.forEach(input => {
        paramValues[input.name] = parseFloat(input.value) || 0;
    });

    try {
        const form = document.querySelector('#step2 form');
        form.submit();
    } catch (error) {
        alert(`Submission failed: ${error.message}`);
        showStep(2);
    }
}

function createVisualizations() {
    clearGraphs();
    
    const labels = selectedParams.map(param => 
        param === 'ph' ? 'pH' : toTitleCase(param)
    );
    const data = selectedParams.map(param => paramValues[param]);

    // Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    chartInstances.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Bar Graph
    const barCtx = document.getElementById('barGraph').getContext('2d');
    chartInstances.barGraph = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Values',
                data: data,
                backgroundColor: '#ffeb3b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Scatter Graph
    const scatterCtx = document.getElementById('scatterGraph').getContext('2d');
    chartInstances.scatterGraph = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Values',
                data: data.map((val, idx) => ({ x: idx, y: val })),
                backgroundColor: '#ff6f61',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });

    // pH Gauge (only if selected)
    if (selectedParams.includes('ph')) {
        const phValue = paramValues.ph || 7;
        const gaugeCtx = document.getElementById('gaugeGraph').getContext('2d');
        chartInstances.gaugeGraph = new Chart(gaugeCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [phValue, 14 - phValue],
                    backgroundColor: [phValue < 7 ? '#ff0d00' : '#00ffcc', '#b0bec5'],
                    borderWidth: 0
                }]
            },
            options: {
                circumference: 180,
                rotation: -90,
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Ribbon Chart
    const ribbonCtx = document.getElementById('ribbonChart').getContext('2d');
    chartInstances.ribbonChart = new Chart(ribbonCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Trend',
                data: data,
                fill: true,
                backgroundColor: 'rgba(255, 235, 59, 0.3)',
                borderColor: '#ffeb3b',
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function reset() {
    selectedParams = [];
    paramValues = {};
    document.getElementById('parameterForm').reset();
    document.getElementById('valueForm').reset();
    clearGraphs();
    showStep(1);
}