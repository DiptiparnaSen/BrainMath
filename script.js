const numberInput = document.getElementById("numberInput");
const message = document.getElementById("message");
const calculationValue = document.getElementById("calculationValue");
const enteredValue = document.getElementById("enteredValue");
const angryInputImage = document.getElementById("angryInputImage");
const resultValue = document.getElementById("resultValue");
const ownerResultImage = document.getElementById("ownerResultImage");
const resultButton = document.getElementById("resultButton");
const clearButton = document.getElementById("clearButton");
const backspaceButton = document.getElementById("backspaceButton");
const digitButtons = document.querySelectorAll("[data-value]");

const MAX_VALUE = 9999;
let previousNumber = 0;

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = type ? `message ${type}` : "message";
}

function showOwnerImage() {
  resultValue.hidden = true;
  ownerResultImage.hidden = false;
}

function hideOwnerImage() {
  resultValue.hidden = false;
  ownerResultImage.hidden = true;
}

function showAngryImage() {
  enteredValue.hidden = true;
  angryInputImage.hidden = false;
}

function hideAngryImage() {
  enteredValue.hidden = false;
  angryInputImage.hidden = true;
}

function syncDisplay(result, calculationText) {
  resultValue.textContent = String(result);
  calculationValue.textContent = calculationText;
}

function syncEnteredDisplay(value) {
  enteredValue.textContent = value === "" ? "0" : value;
}

function syncEnteredFromInput(rawValue) {
  if (rawValue === "") {
    hideAngryImage();
    syncEnteredDisplay("");
    return;
  }

  if (/^\d+$/.test(rawValue)) {
    hideAngryImage();
    syncEnteredDisplay(rawValue);
    return;
  }

  showAngryImage();
}

function refreshInputState() {
  const rawValue = numberInput.value;

  hideOwnerImage();
  syncEnteredFromInput(rawValue);

  if (rawValue === "") {
    setMessage("");
    return;
  }

  if (!/^\d+$/.test(rawValue)) {
    setMessage("Enter values 0-9", "error");
    return;
  }

  if (Number(rawValue) > MAX_VALUE) {
    setMessage("Largest allowed number is 9999", "error");
    return;
  }

  setMessage("");
}

function getValidatedInput() {
  const rawValue = numberInput.value.trim();

  if (!rawValue) {
    hideAngryImage();
    syncEnteredDisplay("");
    setMessage("Enter values 0-9", "error");
    return null;
  }

  if (!/^\d+$/.test(rawValue)) {
    showAngryImage();
    setMessage("Enter values 0-9", "error");
    return null;
  }

  const currentNumber = Number(rawValue);

  if (currentNumber > MAX_VALUE) {
    hideAngryImage();
    setMessage("Largest allowed number is 9999", "error");
    return null;
  }

  return currentNumber;
}

function calculateResult() {
  const currentNumber = getValidatedInput();

  if (currentNumber === null) {
    return;
  }

  const numberToAdd = previousNumber;
  const result = currentNumber + numberToAdd;

  if (result > MAX_VALUE) {
    hideAngryImage();
    showOwnerImage();
    calculationValue.textContent = `${currentNumber} + ${numberToAdd} = Too big`;
    setMessage("Result cannot be greater than 9999", "error");
    return;
  }

  hideAngryImage();
  hideOwnerImage();
  previousNumber = currentNumber;
  syncEnteredDisplay(String(currentNumber));
  syncDisplay(result, `${currentNumber} + ${numberToAdd} = ${result}`);
  numberInput.value = "";
  setMessage("");
  numberInput.focus();
}

function appendDigit(digit) {
  const currentValue = /^\d+$/.test(numberInput.value) ? numberInput.value : "";

  if (currentValue.length >= 4) {
    setMessage("Largest allowed number is 9999", "error");
    return;
  }

  const nextValue = `${currentValue}${digit}`;

  if (Number(nextValue) > MAX_VALUE) {
    setMessage("Largest allowed number is 9999", "error");
    return;
  }

  numberInput.value = nextValue;
  hideOwnerImage();
  hideAngryImage();
  syncEnteredDisplay(nextValue);
  setMessage("");
  numberInput.focus();
}

function clearAll() {
  previousNumber = 0;
  numberInput.value = "";
  hideOwnerImage();
  hideAngryImage();
  syncEnteredDisplay("");
  syncDisplay(0, "0 + 0 = 0");
  setMessage("");
  numberInput.focus();
}

function triggerSparkle(button) {
  button.classList.remove("sparkle");
  void button.offsetWidth;
  button.classList.add("sparkle");

  if (button.sparkleTimeoutId) {
    window.clearTimeout(button.sparkleTimeoutId);
  }

  button.sparkleTimeoutId = window.setTimeout(() => {
    button.classList.remove("sparkle");
  }, 550);
}

digitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    triggerSparkle(button);
    appendDigit(button.dataset.value);
  });
});

backspaceButton.addEventListener("click", () => {
  numberInput.value = numberInput.value.slice(0, -1);
  refreshInputState();
  numberInput.focus();
});

resultButton.addEventListener("click", calculateResult);
clearButton.addEventListener("click", clearAll);

numberInput.addEventListener("input", () => {
  refreshInputState();
});

numberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    calculateResult();
  }
});

clearAll();
