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
const refCode = new URLSearchParams(window.location.search).get("ref") || "direct";
const visitLoggerUrl = "https://script.google.com/macros/s/AKfycbxj0F7g0m5CsIyFx6zJ6d2L2I9ZxChDHwOCsCvGejZ00DDyJIETVbGLg77S-S9885f73g/exec";
let previousNumber = 0;
let visitLogged = false;

function trackEvent(eventName, parameters = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    app_name: "Brain Math",
    ref_code: refCode,
    ...parameters,
  });
}

function logVisitToSheet() {
  if (visitLogged) {
    return;
  }

  if (!visitLoggerUrl.startsWith("https://script.google.com/")) {
    return;
  }

  visitLogged = true;

  const separator = visitLoggerUrl.includes("?") ? "&" : "?";
  const requestUrl =
    `${visitLoggerUrl}${separator}` +
    new URLSearchParams({
      username: refCode,
      visit_time: new Date().toISOString(),
    }).toString();

  if (navigator.sendBeacon) {
    navigator.sendBeacon(requestUrl);
    return;
  }

  fetch(requestUrl, {
    method: "GET",
    mode: "no-cors",
    keepalive: true,
  }).catch(() => {});
}

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
    trackEvent("brain_math_invalid_input", {
      invalid_value: rawValue,
    });
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
    trackEvent("brain_math_invalid_submit", {
      invalid_value: rawValue,
    });
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
    trackEvent("brain_math_range_exceeded", {
      entered_number: String(currentNumber),
      previous_number: String(numberToAdd),
    });
    setMessage("Result cannot be greater than 9999", "error");
    return;
  }

  hideAngryImage();
  hideOwnerImage();
  previousNumber = currentNumber;
  syncEnteredDisplay(String(currentNumber));
  syncDisplay(result, `${currentNumber} + ${numberToAdd} = ${result}`);
  numberInput.value = "";
  trackEvent("brain_math_result", {
    entered_number: String(currentNumber),
    previous_number: String(numberToAdd),
    result_value: String(result),
  });
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
    trackEvent("brain_math_digit_click", {
      digit_value: button.dataset.value,
    });
    appendDigit(button.dataset.value);
  });
});

backspaceButton.addEventListener("click", () => {
  numberInput.value = numberInput.value.slice(0, -1);
  trackEvent("brain_math_backspace");
  refreshInputState();
  numberInput.focus();
});

clearButton.addEventListener("click", () => {
  trackEvent("brain_math_clear");
  clearAll();
});

resultButton.addEventListener("click", calculateResult);

numberInput.addEventListener("input", () => {
  refreshInputState();
});

numberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    calculateResult();
  }
});

trackEvent("brain_math_open", {
  page_path: window.location.pathname,
  page_title: document.title,
});
logVisitToSheet();

clearAll();
