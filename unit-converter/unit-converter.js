class UnitConverter {
    constructor() {
        this.conversionData = {
            length: {
                units: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
                baseUnit: 'm',
                conversions: {
                    mm: { to: 0.001, from: 1000 },
                    cm: { to: 0.01, from: 100 },
                    m: { to: 1, from: 1 },
                    km: { to: 1000, from: 0.001 },
                    in: { to: 0.0254, from: 39.3701 },
                    ft: { to: 0.3048, from: 3.28084 },
                    yd: { to: 0.9144, from: 1.09361 },
                    mi: { to: 1609.34, from: 0.000621371 }
                },
                quickConversions: [
                    { from: 'm', to: 'ft', label: 'Meters ↔ Feet' },
                    { from: 'km', to: 'mi', label: 'Kilometers ↔ Miles' },
                    { from: 'cm', to: 'in', label: 'Centimeters ↔ Inches' }
                ]
            },
            weight: {
                units: ['mg', 'g', 'kg', 'oz', 'lb', 'st'],
                baseUnit: 'g',
                conversions: {
                    mg: { to: 0.001, from: 1000 },
                    g: { to: 1, from: 1 },
                    kg: { to: 1000, from: 0.001 },
                    oz: { to: 28.3495, from: 0.035274 },
                    lb: { to: 453.592, from: 0.00220462 },
                    st: { to: 6350.29, from: 0.000157473 }
                },
                quickConversions: [
                    { from: 'kg', to: 'lb', label: 'Kilograms ↔ Pounds' },
                    { from: 'g', to: 'oz', label: 'Grams ↔ Ounces' }
                ]
            },
            temperature: {
                units: ['°C', '°F', 'K'],
                baseUnit: '°C',
                conversions: {
                    '°C': { 
                        toBase: (value) => value,
                        fromBase: (value) => value
                    },
                    '°F': { 
                        toBase: (value) => (value - 32) * 5/9,
                        fromBase: (value) => (value * 9/5) + 32
                    },
                    'K': { 
                        toBase: (value) => value - 273.15,
                        fromBase: (value) => value + 273.15
                    }
                },
                quickConversions: [
                    { from: '°C', to: '°F', label: 'Celsius ↔ Fahrenheit' },
                    { from: '°C', to: 'K', label: 'Celsius ↔ Kelvin' }
                ]
            },
            volume: {
                units: ['ml', 'l', 'gal', 'qt', 'pt', 'cup', 'fl oz'],
                baseUnit: 'l',
                conversions: {
                    ml: { to: 0.001, from: 1000 },
                    l: { to: 1, from: 1 },
                    gal: { to: 3.78541, from: 0.264172 },
                    qt: { to: 0.946353, from: 1.05669 },
                    pt: { to: 0.473176, from: 2.11338 },
                    cup: { to: 0.236588, from: 4.22675 },
                    'fl oz': { to: 0.0295735, from: 33.814 }
                },
                quickConversions: [
                    { from: 'l', to: 'gal', label: 'Liters ↔ Gallons' },
                    { from: 'ml', to: 'fl oz', label: 'Milliliters ↔ Fluid Ounces' }
                ]
            },
            area: {
                units: ['mm²', 'cm²', 'm²', 'km²', 'in²', 'ft²', 'yd²', 'ac', 'ha'],
                baseUnit: 'm²',
                conversions: {
                    'mm²': { to: 0.000001, from: 1000000 },
                    'cm²': { to: 0.0001, from: 10000 },
                    'm²': { to: 1, from: 1 },
                    'km²': { to: 1000000, from: 0.000001 },
                    'in²': { to: 0.00064516, from: 1550 },
                    'ft²': { to: 0.092903, from: 10.7639 },
                    'yd²': { to: 0.836127, from: 1.19599 },
                    'ac': { to: 4046.86, from: 0.000247105 },
                    'ha': { to: 10000, from: 0.0001 }
                },
                quickConversions: [
                    { from: 'm²', to: 'ft²', label: 'Square Meters ↔ Square Feet' },
                    { from: 'ha', to: 'ac', label: 'Hectares ↔ Acres' }
                ]
            },
            speed: {
                units: ['m/s', 'km/h', 'mph', 'kn'],
                baseUnit: 'm/s',
                conversions: {
                    'm/s': { to: 1, from: 1 },
                    'km/h': { to: 0.277778, from: 3.6 },
                    'mph': { to: 0.44704, from: 2.23694 },
                    'kn': { to: 0.514444, from: 1.94384 }
                },
                quickConversions: [
                    { from: 'km/h', to: 'mph', label: 'KM/H ↔ MPH' },
                    { from: 'kn', to: 'mph', label: 'Knots ↔ MPH' }
                ]
            },
            time: {
                units: ['ms', 's', 'min', 'h', 'd', 'wk', 'mo', 'yr'],
                baseUnit: 's',
                conversions: {
                    ms: { to: 0.001, from: 1000 },
                    s: { to: 1, from: 1 },
                    min: { to: 60, from: 0.0166667 },
                    h: { to: 3600, from: 0.000277778 },
                    d: { to: 86400, from: 1.15741e-5 },
                    wk: { to: 604800, from: 1.65344e-6 },
                    mo: { to: 2.628e+6, from: 3.80517e-7 },
                    yr: { to: 3.156e+7, from: 3.171e-8 }
                },
                quickConversions: [
                    { from: 'h', to: 'd', label: 'Hours ↔ Days' },
                    { from: 'd', to: 'wk', label: 'Days ↔ Weeks' }
                ]
            },
            digital: {
                units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
                baseUnit: 'B',
                conversions: {
                    B: { to: 1, from: 1 },
                    KB: { to: 1024, from: 1/1024 },
                    MB: { to: 1048576, from: 1/1048576 },
                    GB: { to: 1073741824, from: 1/1073741824 },
                    TB: { to: 1099511627776, from: 1/1099511627776 },
                    PB: { to: 1125899906842624, from: 1/1125899906842624 }
                },
                quickConversions: [
                    { from: 'MB', to: 'GB', label: 'MB ↔ GB' },
                    { from: 'GB', to: 'TB', label: 'GB ↔ TB' }
                ]
            }
        };

        this.history = [];
        this.initializeElements();
        this.setupEventListeners();
        this.loadHistory();
    }

    initializeElements() {
        // Get DOM elements
        this.categorySelect = document.getElementById('categorySelect');
        this.fromUnitSelect = document.getElementById('fromUnit');
        this.toUnitSelect = document.getElementById('toUnit');
        this.inputValue = document.getElementById('inputValue');
        this.outputValue = document.getElementById('outputValue');
        this.swapBtn = document.getElementById('swapBtn');
        this.quickButtons = document.getElementById('quickButtons');
        this.historyList = document.getElementById('historyList');
        this.historyContainer = document.getElementById('history');
        this.clearHistoryBtn = document.getElementById('clearHistory');

        // Initialize category and units
        this.updateUnits(this.categorySelect.value);
    }

    setupEventListeners() {
        // Category change
        this.categorySelect.addEventListener('change', () => {
            this.updateUnits(this.categorySelect.value);
            this.convert();
            this.updateQuickButtons();
        });

        // Unit changes
        this.fromUnitSelect.addEventListener('change', () => this.convert());
        this.toUnitSelect.addEventListener('change', () => this.convert());

        // Input value change
        this.inputValue.addEventListener('input', () => this.convert());

        // Swap button
        this.swapBtn.addEventListener('click', () => this.swapUnits());

        // Clear history
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    updateUnits(category) {
        const units = this.conversionData[category].units;
        
        // Clear existing options
        this.fromUnitSelect.innerHTML = '';
        this.toUnitSelect.innerHTML = '';

        // Add new options
        units.forEach(unit => {
            this.fromUnitSelect.add(new Option(unit, unit));
            this.toUnitSelect.add(new Option(unit, unit));
        });

        // Set default 'to' unit to second option if available
        if (units.length > 1) {
            this.toUnitSelect.selectedIndex = 1;
        }

        this.updateQuickButtons();
    }

    updateQuickButtons() {
        const category = this.categorySelect.value;
        const quickConversions = this.conversionData[category].quickConversions;

        this.quickButtons.innerHTML = '';
        quickConversions.forEach(conversion => {
            const button = document.createElement('button');
            button.className = 'btn btn-secondary btn-sm';
            button.textContent = conversion.label;
            button.addEventListener('click', () => {
                this.fromUnitSelect.value = conversion.from;
                this.toUnitSelect.value = conversion.to;
                this.convert();
            });
            this.quickButtons.appendChild(button);
        });
    }

    convert() {
        const category = this.categorySelect.value;
        const fromUnit = this.fromUnitSelect.value;
        const toUnit = this.toUnitSelect.value;
        const inputVal = parseFloat(this.inputValue.value);

        if (isNaN(inputVal)) {
            this.outputValue.value = '';
            return;
        }

        let result;
        if (category === 'temperature') {
            // Special handling for temperature
            const toBaseValue = this.conversionData[category].conversions[fromUnit].toBase(inputVal);
            result = this.conversionData[category].conversions[toUnit].fromBase(toBaseValue);
        } else {
            // Standard conversion through base unit
            const conversions = this.conversionData[category].conversions;
            const toBaseUnit = inputVal * conversions[fromUnit].to;
            result = toBaseUnit * conversions[toUnit].from;
        }

        // Format result
        this.outputValue.value = this.formatNumber(result);

        // Add to history
        this.addToHistory(inputVal, result, fromUnit, toUnit, category);
    }

    formatNumber(num) {
        // Handle very small or very large numbers
        if (Math.abs(num) < 0.000001 || Math.abs(num) > 999999999999) {
            return num.toExponential(6);
        }
        // Regular numbers: up to 6 decimal places, trim trailing zeros
        return parseFloat(num.toFixed(6)).toString();
    }

    swapUnits() {
        const tempUnit = this.fromUnitSelect.value;
        const tempValue = this.inputValue.value;

        this.fromUnitSelect.value = this.toUnitSelect.value;
        this.inputValue.value = this.outputValue.value;
        this.toUnitSelect.value = tempUnit;

        this.convert();
    }

    addToHistory(inputVal, outputVal, fromUnit, toUnit, category) {
        const conversion = {
            timestamp: new Date().toISOString(),
            category,
            from: { value: inputVal, unit: fromUnit },
            to: { value: outputVal, unit: toUnit }
        };

        this.history.unshift(conversion);
        if (this.history.length > 10) this.history.pop();
        
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyContainer.style.display = 'none';
            return;
        }

        this.historyContainer.style.display = 'block';
        this.historyList.innerHTML = '';

        this.history.forEach(conversion => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div>${this.formatNumber(conversion.from.value)} ${conversion.from.unit} = 
                     ${this.formatNumber(conversion.to.value)} ${conversion.to.unit}</div>
                <div>${new Date(conversion.timestamp).toLocaleString()}</div>
            `;
            this.historyList.appendChild(div);
        });
    }

    saveHistory() {
        localStorage.setItem('unitConverterHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('unitConverterHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.updateHistoryDisplay();
    }
}

// Initialize the converter when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UnitConverter();
});

