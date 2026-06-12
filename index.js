'use strict';

class Calculator {
  constructor() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operator = null;
    this.shouldResetScreen = false;
    this.justCalculated = false;

    this.mainDisplay = document.getElementById('display-main');
    this.expressionDisplay = document.getElementById('display-expression');

    this.init();
  }

  init() {
    // Number buttons
    document.querySelectorAll('.btn-num').forEach(btn => {
      btn.addEventListener('click', () => this.inputDigit(btn.dataset.value));
    });

    // Operator buttons
    document.querySelectorAll('.btn-op[data-op]').forEach(btn => {
      btn.addEventListener('click', () => this.setOperator(btn.dataset.op));
    });

    // Function buttons
    document.getElementById('btn-clear').addEventListener('click', () => this.clear());
    document.getElementById('btn-sign').addEventListener('click', () => this.toggleSign());
    document.getElementById('btn-percent').addEventListener('click', () => this.percent());
    document.getElementById('btn-decimal').addEventListener('click', () => this.inputDecimal());
    document.getElementById('btn-equals').addEventListener('click', () => this.calculate());

    // Keyboard support
    document.addEventListener('keydown', e => this.handleKeyboard(e));
  }

  updateDisplay(flash = false) {
    this.mainDisplay.textContent = this.formatNumber(this.currentInput);
    this.mainDisplay.classList.toggle('error', this.currentInput === 'Error');

    if (flash) {
      this.mainDisplay.classList.remove('flash');
      void this.mainDisplay.offsetWidth; // reflow
      this.mainDisplay.classList.add('flash');
    }

    // Auto-shrink font for long numbers
    const len = this.mainDisplay.textContent.length;
    if (len > 10) {
      this.mainDisplay.style.fontSize = '22px';
    } else if (len > 7) {
      this.mainDisplay.style.fontSize = '28px';
    } else {
      this.mainDisplay.style.fontSize = '';
    }
  }

  formatNumber(value) {
    if (value === 'Error') return 'Error';
    if (value === '' || value === '-') return value;

    // Don't format if it ends with decimal or has trailing zeros after decimal
    if (value.endsWith('.')) return value;

    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // Handle very large or very small numbers
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(4);
    }

    // Limit decimal places to avoid overflow
    const parts = value.split('.');
    if (parts[1] && parts[1].length > 8) {
      return parseFloat(num.toFixed(8)).toString();
    }

    return value;
  }

  inputDigit(digit) {
    if (this.currentInput === 'Error') {
      this.currentInput = digit;
      this.updateDisplay();
      return;
    }

    if (this.shouldResetScreen || this.justCalculated) {
      if (this.justCalculated) {
        this.previousInput = '';
        this.operator = null;
        this.expressionDisplay.textContent = '';
        this.clearActiveOp();
      }
      this.currentInput = digit;
      this.shouldResetScreen = false;
      this.justCalculated = false;
    } else {
      if (this.currentInput === '0') {
        this.currentInput = digit;
      } else {
        if (this.currentInput.length >= 12) return;
        this.currentInput += digit;
      }
    }

    this.updateDisplay();
  }

  inputDecimal() {
    if (this.shouldResetScreen) {
      this.currentInput = '0.';
      this.shouldResetScreen = false;
      this.updateDisplay();
      return;
    }

    if (this.justCalculated) {
      this.currentInput = '0.';
      this.previousInput = '';
      this.operator = null;
      this.expressionDisplay.textContent = '';
      this.clearActiveOp();
      this.justCalculated = false;
      this.updateDisplay();
      return;
    }

    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }
    this.updateDisplay();
  }

  setOperator(op) {
    if (this.currentInput === 'Error') return;

    // If there's a pending operation, calculate first
    if (this.operator && !this.shouldResetScreen) {
      this.calculate(true);
    }

    this.previousInput = this.currentInput;
    this.operator = op;
    this.shouldResetScreen = true;
    this.justCalculated = false;

    // Update expression display
    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    this.expressionDisplay.textContent = `${this.formatNumber(this.previousInput)} ${opSymbols[op]}`;

    // Highlight active operator button
    this.clearActiveOp();
    const activeBtn = document.querySelector(`.btn-op[data-op="${op}"]`);
    if (activeBtn) activeBtn.classList.add('active-op');
  }

  calculate(chaining = false) {
    if (!this.operator || this.previousInput === '') return;

    const prev = parseFloat(this.previousInput);
    const curr = parseFloat(this.currentInput);

    if (isNaN(prev) || isNaN(curr)) return;

    let result;
    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    switch (this.operator) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '*': result = prev * curr; break;
      case '/':
        if (curr === 0) {
          this.currentInput = 'Error';
          this.expressionDisplay.textContent = 'Cannot divide by zero';
          this.operator = null;
          this.previousInput = '';
          this.shouldResetScreen = true;
          this.updateDisplay(true);
          return;
        }
        result = prev / curr;
        break;
    }

    // Handle floating point precision
    result = parseFloat(result.toPrecision(10));

    if (!chaining) {
      this.expressionDisplay.textContent =
        `${this.formatNumber(this.previousInput)} ${opSymbols[this.operator]} ${this.formatNumber(this.currentInput)} =`;
    }

    this.currentInput = result.toString();
    this.operator = null;
    this.shouldResetScreen = true;
    this.justCalculated = !chaining;
    this.clearActiveOp();

    this.updateDisplay(!chaining);
  }

  clear() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operator = null;
    this.shouldResetScreen = false;
    this.justCalculated = false;
    this.expressionDisplay.textContent = '';
    this.clearActiveOp();

    // Update button label
    document.getElementById('btn-clear').textContent = 'AC';

    this.updateDisplay(true);
  }

  toggleSign() {
    if (this.currentInput === '0' || this.currentInput === 'Error') return;
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
    this.updateDisplay();
  }

  percent() {
    if (this.currentInput === 'Error') return;
    const num = parseFloat(this.currentInput);
    if (isNaN(num)) return;

    if (this.operator && this.previousInput !== '') {
      // Percentage of previous value
      this.currentInput = (parseFloat(this.previousInput) * (num / 100)).toString();
    } else {
      this.currentInput = (num / 100).toString();
    }
    this.updateDisplay();
  }

  clearActiveOp() {
    document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active-op'));
  }

  handleKeyboard(e) {
    if (e.key >= '0' && e.key <= '9') this.inputDigit(e.key);
    else if (e.key === '.') this.inputDecimal();
    else if (e.key === '+') this.setOperator('+');
    else if (e.key === '-') this.setOperator('-');
    else if (e.key === '*') this.setOperator('*');
    else if (e.key === '/') { e.preventDefault(); this.setOperator('/'); }
    else if (e.key === 'Enter' || e.key === '=') this.calculate();
    else if (e.key === 'Escape') this.clear();
    else if (e.key === 'Backspace') this.backspace();
    else if (e.key === '%') this.percent();
  }

  backspace() {
    if (this.shouldResetScreen || this.justCalculated || this.currentInput === 'Error') return;
    if (this.currentInput.length === 1 || (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
      this.currentInput = '0';
    } else {
      this.currentInput = this.currentInput.slice(0, -1);
    }
    this.updateDisplay();
  }
}

// Boot the calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Calculator();
});