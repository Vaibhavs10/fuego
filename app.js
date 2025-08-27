// Main FUEGO Application
// Handles UI interactions, chart rendering, and real-time updates

class FuegoApp {
    constructor() {
        this.calculator = new FinancialCalculator();
        this.assumptions = FinancialCalculator.createDefaultAssumptions();
        this.currentPath = null;
        this.projections = [];
        this.charts = {
            netWorth: null,
            incomeExpenses: null
        };
        
        this.init();
    }

    init() {
        // Wait for DOM to be loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createSliders();
        this.initializeCharts();
        this.calculateAndUpdate();
        
        // Set up responsive chart resizing
        window.addEventListener('resize', () => {
            if (this.charts.netWorth) this.charts.netWorth.resize();
            if (this.charts.incomeExpenses) this.charts.incomeExpenses.resize();
        });
    }

    createSliders() {
        const slidersContainer = document.getElementById('sliders-container');
        slidersContainer.innerHTML = '';

        const sliderOrder = [
            'currentAge', 'currentSavings', 'salary', 'incomeTaxRate',
            'monthlyExpenses', 'monthlySavings', 'investmentReturn', 'inflationRate'
        ];

        sliderOrder.forEach(key => {
            const assumption = this.assumptions[key];
            const sliderHtml = this.createSliderHTML(assumption, key);
            slidersContainer.innerHTML += sliderHtml;
        });

        // Add event listeners for all sliders
        sliderOrder.forEach(key => {
            const slider = document.getElementById(`slider-${key}`);
            const valueDisplay = document.getElementById(`value-${key}`);
            
            slider.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                this.updateAssumption(key, newValue);
                this.updateSliderDisplay(key, newValue);
                this.calculateAndUpdate();
            });
        });
    }

    createSliderHTML(assumption, key) {
        const formatValue = (value) => {
            if (key === 'salary' || key === 'currentSavings' || key === 'monthlyExpenses' || key === 'monthlySavings') {
                return Formatters.currency(value);
            } else if (key === 'incomeTaxRate' || key === 'inflationRate' || key === 'investmentReturn') {
                return Formatters.percentage(value);
            } else {
                return `${value} ${assumption.unit}`;
            }
        };

        const percentage = ((assumption.value - assumption.min) / (assumption.max - assumption.min)) * 100;
        
        return `
            <div class="slider-container">
                <div class="slider-header">
                    <label class="slider-label">${assumption.name}</label>
                    <span class="slider-value" id="value-${key}">${formatValue(assumption.value)}</span>
                </div>
                <div class="slider-wrapper">
                    <input
                        type="range"
                        id="slider-${key}"
                        class="slider-input"
                        min="${assumption.min}"
                        max="${assumption.max}"
                        step="${assumption.step}"
                        value="${assumption.value}"
                        style="background: linear-gradient(to right, #000000 0%, #000000 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)"
                    />
                </div>
                <div class="slider-range">
                    <span>${formatValue(assumption.min)}</span>
                    <span>${formatValue(assumption.max)}</span>
                </div>
                <div class="slider-description">${assumption.description}</div>
            </div>
        `;
    }

    updateSliderDisplay(key, value) {
        const assumption = this.assumptions[key];
        const valueDisplay = document.getElementById(`value-${key}`);
        const slider = document.getElementById(`slider-${key}`);
        
        let formattedValue;
        if (key === 'salary' || key === 'currentSavings' || key === 'monthlyExpenses' || key === 'monthlySavings') {
            formattedValue = Formatters.currency(value);
        } else if (key === 'incomeTaxRate' || key === 'inflationRate' || key === 'investmentReturn') {
            formattedValue = Formatters.percentage(value);
        } else {
            formattedValue = `${value} ${assumption.unit}`;
        }
        
        valueDisplay.textContent = formattedValue;

        // Update slider track color
        const percentage = ((value - assumption.min) / (assumption.max - assumption.min)) * 100;
        slider.style.background = `linear-gradient(to right, #000000 0%, #000000 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`;
    }

    updateAssumption(key, value) {
        this.assumptions[key].value = value;
    }

    calculateAndUpdate() {
        // Create current path
        this.currentPath = {
            id: 'current',
            name: 'Current Path',
            description: 'Your financial journey with current assumptions',
            decisions: [],
            assumptions: this.assumptions,
            projections: [],
            targetAmount: this.assumptions.monthlyExpenses.value * 12 * 25,
            score: 0
        };

        // Calculate projections
        this.projections = this.calculator.projectPath(this.currentPath);
        this.currentPath.projections = this.projections;
        this.currentPath.score = this.calculator.calculatePathScore(this.currentPath);

        // Update all UI elements
        this.updateHeaderMetrics();
        this.updateQuickSummary();
        this.updateVisualizationHeader();
        this.updateCharts();
        this.updateMetricsCards();
        this.updateOptimizationSuggestions();
    }

    updateHeaderMetrics() {
        const retirementAge = this.projections.find(p => p.isFinanciallyIndependent)?.age;
        const finalNetWorth = this.projections[this.projections.length - 1]?.netWorth || 0;

        document.getElementById('header-retirement-age').textContent = retirementAge || 'Never';
        document.getElementById('header-net-worth').textContent = Formatters.currency(finalNetWorth);
    }

    updateQuickSummary() {
        const monthlyNetIncome = Math.round(this.assumptions.salary.value * (1 - this.assumptions.incomeTaxRate.value / 100) / 12);
        const monthlySavings = this.assumptions.monthlySavings.value;
        const savingsRate = Math.round((monthlySavings / Math.max(1, monthlyNetIncome)) * 100);
        const fiNumber = (this.assumptions.monthlyExpenses.value * 12 * 25) / 1000000;
        const retirementAge = this.projections.find(p => p.isFinanciallyIndependent)?.age;
        const yearsToFI = retirementAge ? retirementAge - this.assumptions.currentAge.value : 'Never';

        document.getElementById('monthly-net-income').textContent = Formatters.currency(monthlyNetIncome);
        document.getElementById('monthly-savings').textContent = Formatters.currency(monthlySavings);
        document.getElementById('monthly-savings').className = 'summary-value text-green';
        document.getElementById('savings-rate').textContent = `${savingsRate}%`;
        document.getElementById('savings-rate').className = 'summary-value text-blue';
        document.getElementById('fi-number').textContent = `€${fiNumber.toFixed(1)}M`;
        document.getElementById('fi-number').className = 'summary-value text-purple';
        document.getElementById('years-to-fi').textContent = yearsToFI;
        document.getElementById('years-to-fi').className = 'summary-value text-orange';
    }

    updateVisualizationHeader() {
        const retirementAge = this.projections.find(p => p.isFinanciallyIndependent)?.age;
        const finalNetWorth = this.projections[this.projections.length - 1]?.netWorth || 0;

        const fiBadge = document.getElementById('fi-badge');
        const netWorthBadge = document.getElementById('net-worth-badge');

        if (retirementAge) {
            document.getElementById('fi-age').textContent = retirementAge;
            document.getElementById('final-net-worth').textContent = Formatters.currency(finalNetWorth);
            fiBadge.style.display = 'inline-block';
            netWorthBadge.style.display = 'inline-block';
        } else {
            fiBadge.style.display = 'none';
            netWorthBadge.style.display = 'none';
        }
    }

    updateMetricsCards() {
        const retirementAge = this.projections.find(p => p.isFinanciallyIndependent)?.age;
        const finalNetWorth = this.projections[this.projections.length - 1]?.netWorth || 0;
        const yearsToFI = retirementAge ? retirementAge - this.assumptions.currentAge.value : 'N/A';
        const finalAnnualSavings = this.projections[this.projections.length - 1]?.monthlySavings * 12 || 0;

        document.getElementById('retirement-age').textContent = retirementAge || 'Never';
        document.getElementById('final-net-worth-card').textContent = Formatters.currency(finalNetWorth);
        document.getElementById('years-to-fi-card').textContent = yearsToFI;
        document.getElementById('final-annual-savings').textContent = Formatters.currency(finalAnnualSavings);
    }

    initializeCharts() {
        // Net Worth Chart
        const netWorthCtx = document.getElementById('net-worth-chart').getContext('2d');
        this.charts.netWorth = new Chart(netWorthCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Net Worth',
                    data: [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Net Worth: ${Formatters.currency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        },
                        grid: {
                            color: '#E5E7EB'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Net Worth'
                        },
                        grid: {
                            color: '#E5E7EB'
                        },
                        ticks: {
                            callback: (value) => Formatters.currency(value)
                        }
                    }
                }
            }
        });

        // Income vs Expenses Chart
        const incomeExpensesCtx = document.getElementById('income-expenses-chart').getContext('2d');
        this.charts.incomeExpenses = new Chart(incomeExpensesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Net Salary',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }, {
                    label: 'Annual Expenses',
                    data: [],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }, {
                    label: 'Annual Savings',
                    data: [],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${Formatters.currency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        },
                        grid: {
                            color: '#E5E7EB'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount'
                        },
                        grid: {
                            color: '#E5E7EB'
                        },
                        ticks: {
                            callback: (value) => Formatters.currency(value)
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (!this.projections.length) return;

        const ages = this.projections.map(p => p.age);
        const netWorthData = this.projections.map(p => p.netWorth);
        const netSalaryData = this.projections.map(p => p.netSalary);
        const expensesData = this.projections.map(p => p.monthlyExpenses * 12);
        const savingsData = this.projections.map(p => p.monthlySavings * 12);

        // Update Net Worth Chart
        this.charts.netWorth.data.labels = ages;
        this.charts.netWorth.data.datasets[0].data = netWorthData;
        
        // Add FI target reference line
        const targetAmount = this.currentPath.targetAmount;
        this.charts.netWorth.options.plugins.annotation = {
            annotations: {
                line1: {
                    type: 'line',
                    yMin: targetAmount,
                    yMax: targetAmount,
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        display: true,
                        content: 'FI Target',
                        position: 'end'
                    }
                }
            }
        };
        
        this.charts.netWorth.update('none');

        // Update Income vs Expenses Chart
        this.charts.incomeExpenses.data.labels = ages;
        this.charts.incomeExpenses.data.datasets[0].data = netSalaryData;
        this.charts.incomeExpenses.data.datasets[1].data = expensesData;
        this.charts.incomeExpenses.data.datasets[2].data = savingsData;
        this.charts.incomeExpenses.update('none');
    }

    updateOptimizationSuggestions() {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        suggestionsGrid.innerHTML = '';

        const suggestions = this.generateOptimizationSuggestions();
        
        suggestions.forEach(suggestion => {
            const suggestionHtml = `
                <div class="suggestion-card">
                    <h4 class="suggestion-title">${suggestion.icon} ${suggestion.title}</h4>
                    <p class="suggestion-description">${suggestion.description}</p>
                    <span class="suggestion-tag ${suggestion.category}">${suggestion.tag}</span>
                </div>
            `;
            suggestionsGrid.innerHTML += suggestionHtml;
        });
    }

    generateOptimizationSuggestions() {
        const suggestions = [];
        const currentRetirementAge = this.projections.find(p => p.isFinanciallyIndependent)?.age;

        // Income optimization
        if (this.assumptions.salary.value < 80000) {
            const testPath = { ...this.currentPath };
            testPath.assumptions = { ...this.assumptions };
            testPath.assumptions.salary = { ...this.assumptions.salary, value: this.assumptions.salary.value + 10000 };
            const testProjections = this.calculator.projectPath(testPath);
            const newRetirementAge = testProjections.find(p => p.isFinanciallyIndependent)?.age;
            const yearsSaved = currentRetirementAge && newRetirementAge ? Math.max(0, currentRetirementAge - newRetirementAge) : 0;

            suggestions.push({
                icon: '📈',
                title: 'Increase Income',
                description: `A €10k salary increase could reduce your retirement age by ${yearsSaved} years.`,
                tag: 'Career Growth',
                category: 'career'
            });
        }

        // Expense optimization
        if (this.assumptions.monthlyExpenses.value > 2000) {
            const testPath = { ...this.currentPath };
            testPath.assumptions = { ...this.assumptions };
            testPath.assumptions.monthlyExpenses = { ...this.assumptions.monthlyExpenses, value: this.assumptions.monthlyExpenses.value - 500 };
            const testProjections = this.calculator.projectPath(testPath);
            const newRetirementAge = testProjections.find(p => p.isFinanciallyIndependent)?.age;
            const yearsSaved = currentRetirementAge && newRetirementAge ? Math.max(0, currentRetirementAge - newRetirementAge) : 0;

            suggestions.push({
                icon: '💰',
                title: 'Reduce Expenses',
                description: `Reducing expenses by €500/month could save ${yearsSaved} years.`,
                tag: 'Lifestyle',
                category: 'lifestyle'
            });
        }

        // Investment optimization
        if (this.assumptions.investmentReturn.value < 8) {
            const testPath = { ...this.currentPath };
            testPath.assumptions = { ...this.assumptions };
            testPath.assumptions.investmentReturn = { ...this.assumptions.investmentReturn, value: 8 };
            const testProjections = this.calculator.projectPath(testPath);
            const newRetirementAge = testProjections.find(p => p.isFinanciallyIndependent)?.age;
            const yearsSaved = currentRetirementAge && newRetirementAge ? Math.max(0, currentRetirementAge - newRetirementAge) : 0;

            suggestions.push({
                icon: '📊',
                title: 'Investment Strategy',
                description: `Improving returns to 8% could save ${yearsSaved} years.`,
                tag: 'Investing',
                category: 'investing'
            });
        }

        // Tax optimization
        if (this.assumptions.incomeTaxRate.value > 25) {
            const testPath = { ...this.currentPath };
            testPath.assumptions = { ...this.assumptions };
            testPath.assumptions.incomeTaxRate = { ...this.assumptions.incomeTaxRate, value: 25 };
            const testProjections = this.calculator.projectPath(testPath);
            const newRetirementAge = testProjections.find(p => p.isFinanciallyIndependent)?.age;
            const yearsSaved = currentRetirementAge && newRetirementAge ? Math.max(0, currentRetirementAge - newRetirementAge) : 0;

            suggestions.push({
                icon: '🌍',
                title: 'Tax Optimization',
                description: `Moving to a location with 25% tax rate could save ${yearsSaved} years.`,
                tag: 'Location',
                category: 'location'
            });
        }

        return suggestions;
    }
}

// Initialize the app when page loads
const app = new FuegoApp();
