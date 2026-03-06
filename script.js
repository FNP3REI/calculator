const displayElement = document.getElementById("display");
const historyElement = document.getElementById("history");
const buttonsContainer = document.querySelector(".buttons");

// Global State Variables
let hasCalculated = false;
let lastNumericResult = null;
let isScientificMode = true;
let ansValue = "0";

buttonsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const type = button.dataset.type;
  const value = button.dataset.value;
  const maxLimit = 20;

  switch (type) {

    // 1. If a calculation was just finished, clear display before starting a new number
    case "number":
      if (hasCalculated) {
        displayElement.value = "";
        hasCalculated = false;
      }
      if (displayElement.value.length < maxLimit) {
        displayElement.value += value;
      }
      break;

    case "operator":
    case "special":

      // 2. ROOT RULE: If clicking √, reset display to start with the symbol
      if (value === "√" && hasCalculated) {
        displayElement.value = "";
        hasCalculated = false;
      }

      // 3. PI RULE: Acts like a number (does not trigger operator substitution)
      if (value === "π") {
        if (hasCalculated) {
          displayElement.value = "";
          hasCalculated = false;
        }
        if (displayElement.value.length < maxLimit)
          displayElement.value += value;
        break;
      }

      if (hasCalculated) hasCalculated = false;

      const lastChar = displayElement.value.slice(-1);

      // 4. SYMBOLS: List of symbols that should replace each other
      const symbols = ["+", "-", "*", "/", "X", "÷", "^", "!", "%", "²"];

      // 5. SUBSTITUTION RULE: Replace previous operator if a new one is pressed
      if (symbols.includes(lastChar) && symbols.includes(value)) {
        displayElement.value = displayElement.value.slice(0, -1) + value;
      }
      // 6. Handle empty display or starting with minus/parenthesis
      else if (displayElement.value === "" || displayElement.value === "0") {
        if (value === "-" || value === "(" || value === "√") displayElement.value = value;
      }
      // 7. Add symbol normally if within limit
      else if (displayElement.value.length < maxLimit) {
        displayElement.value += value;
      }
      break;

    // 8. CLEAR: clear display 
    case "clear":
      displayElement.value = "";
      if (historyElement) historyElement.innerText = "";
      hasCalculated = false;
      break;
    
    // 9. DEL: delete last digit
    case "del":
      displayElement.value = displayElement.value.slice(0, -1);
      hasCalculated = false;
      break;

    // 10. CALCULATE: execute the operation set
    case "calculate":
      calculate();
      break;
    
    // 11. SCI/DEC RULE: Toggle between Scientific and Decimal notation
    case "toggle":
      if (lastNumericResult !== null) {
        isScientificMode = !isScientificMode;
        displayElement.value = formatResult(lastNumericResult);
        adjustFontSize();
      }
      break;

    // 12. ANS: Save the last result into the ANS button
    case "ans":
      if (hasCalculated) {
        displayElement.value = "";
        hasCalculated = false;
      }
      if (displayElement.value.length + ansValue.length <= maxLimit) {
        displayElement.value += ansValue;
      }
      break;
  }
  adjustFontSize();
});

/* Main calculation logic: translates UI symbols to JS math and executes.*/

function calculate() {
  if (displayElement.value === "" || displayElement.value === "0") return;

  try {
    const originalExpression = displayElement.value;
    let translatedExp = originalExpression;

    // --- 1. STANDARDIZATION ---
    translatedExp = translatedExp.replace(/,/g, ".");
    translatedExp = translatedExp.replace(/X/gi, "*");
    translatedExp = translatedExp.replace(/÷/g, "/");

    // --- 2. IMPLICIT MULTIPLICATION (nπ, n√, n()) ---
    translatedExp = translatedExp.replace(/(\d)(π|√|\()/g, "$1*$2");
    translatedExp = translatedExp.replace(/(\)|π|!|²|%)([0-9π√\(])/g, "$1*$2");

    // --- 3. SPECIAL SYMBOL TRANSLATION ---
    translatedExp = translatedExp.split("^").join("**");
    translatedExp = translatedExp.replace(/π/g, `(${Math.PI})`);
    translatedExp = translatedExp.replace(/([0-9.]+)%/g, "($1/100)");
    translatedExp = translatedExp.replace(/√([0-9.]+)/g, "Math.sqrt($1)");
    translatedExp = translatedExp.replace(/([0-9.]+)²/g, "Math.pow($1, 2)");

    // Factorial support (integers only)
    translatedExp = translatedExp.replace(/([0-9]+)!/g, (match, n) =>
      factorial(parseInt(n)),
    );

    // --- 4. EXECUTION ---
    lastNumericResult = eval(translatedExp);
    
    // Store ANS with comma for localized UI insertion
    ansValue = lastNumericResult.toString().replace(".", ",");

    // --- 5. OUTPUT ---
    historyElement.innerText = originalExpression + " =";
    displayElement.value = formatResult(lastNumericResult);
    hasCalculated = true;
  } catch (error) {
    displayElement.value = "SYNTAX ERROR";
    lastNumericResult = null;
  }
}

/* Formats the numeric result based on Scientific or Decimal mode.*/
function formatResult(num) {
  let formattedString;
  if (isScientificMode) {
    
    // Scientific Mode: use exponential notation for very large/small numbers
    if (Math.abs(num) > 9999999999 || (Math.abs(num) < 0.000001 && num !== 0)) {
      formattedString = num.toExponential(2);
    } else {
      formattedString =
        num.toString().length > 10 ? num.toPrecision(8) : num.toString();
    }
  } else {
    
    // Decimal Mode: show the raw number or up to 20 digits of precision
    let rawString = num.toString();
    formattedString = rawString.length > 20 ? num.toPrecision(20) : rawString;
  }
  // Localize: back to comma as decimal separator for display
  return formattedString.replace(".", ",");
}

/* Factorial loop*/
function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = n; i > 1; i--) result *= i;
  return result;
}

/* Adjusts font size dynamically and handles the MAX CHAR indicator */
function adjustFontSize() {
  const indicator = document.getElementById("limit-indicator");

  // Font shrinkage if text is > 10 characters 
  if (displayElement.value.length > 10) {
    displayElement.classList.add("font-small");
  } else {
    displayElement.classList.remove("font-small");
  }

  // Visual warning for character limit (20 chars)
  if (displayElement.value.length >= 20 && indicator) {
    indicator.classList.add("active");
  } else if (indicator) {
    indicator.classList.remove("active");
  }
}