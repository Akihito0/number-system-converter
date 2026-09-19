import {
    validateSignedInput,
    computeComplements,
    createComplementSolution,
    subtractUsing1sComplement,
    subtractUsing2sComplement,
    getComplementNames,
    formatBinaryWithSpaces
} from "./complement.js";

// ═══════════════════════════════════════════════════════
// Number Systems
// ═══════════════════════════════════════════════════════

const numberSystems = [
    { name: "Decimal",     base: 10, short: "Dec" },
    { name: "Binary",      base: 2,  short: "Bin" },
    { name: "Octal",       base: 8,  short: "Oct" },
    { name: "Hexadecimal", base: 16, short: "Hex" }
];

// ═══════════════════════════════════════════════════════
// DOM References
// ═══════════════════════════════════════════════════════

const tabBar = document.getElementById("tabBar");
const panelComplements = document.getElementById("panel-complements");
const panelSubtraction = document.getElementById("panel-subtraction");

// Tab 1
const complementInputCount = document.getElementById("complementInputCount");
const complementSetInputsButton = document.getElementById("complementSetInputsButton");
const complementInputsContainer = document.getElementById("complementInputsContainer");

// Tab 2
const subBaseButtonGroup = document.getElementById("subBaseButtonGroup");
const subDigitWidth = document.getElementById("subDigitWidth");
const subMinuend = document.getElementById("subMinuend");
const subSubtrahend = document.getElementById("subSubtrahend");
const subMinuendValidation = document.getElementById("subMinuendValidation");
const subSubtrahendValidation = document.getElementById("subSubtrahendValidation");
const performSubtractionButton = document.getElementById("performSubtractionButton");
const subtractionResultContainer = document.getElementById("subtractionResultContainer");

// ═══════════════════════════════════════════════════════
// Tab Switching
// ═══════════════════════════════════════════════════════

tabBar.addEventListener("click", function (e) {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;

    const tabName = btn.getAttribute("data-tab");

    tabBar.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) {
        targetPanel.classList.add("active");
    }
});

// ═══════════════════════════════════════════════════════
// Helper: Get input letter
// ═══════════════════════════════════════════════════════

function getInputLetter(index) {
    return String.fromCharCode(65 + (index - 1));
}

// ═══════════════════════════════════════════════════════
// Helper: Create base button group
// ═══════════════════════════════════════════════════════

function createBaseButtonGroup(groupName, initialBase, onSelectChange) {
    const group = document.createElement("div");
    group.className = `base-btn-group ${groupName}-group`;
    group.setAttribute("role", "group");
    group.setAttribute("data-selected-base", String(initialBase));

    numberSystems.forEach(function (ns) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn-base ${ns.base === initialBase ? "active" : ""}`;
        btn.setAttribute("data-base", String(ns.base));

        const numSpan = document.createElement("span");
        numSpan.className = "base-num";
        numSpan.textContent = ns.base;

        const tagSpan = document.createElement("span");
        tagSpan.className = "base-tag";
        tagSpan.textContent = ns.short;

        btn.append(numSpan, tagSpan);

        btn.addEventListener("click", function () {
            if (btn.classList.contains("active")) return;

            group.querySelectorAll(".btn-base").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            group.setAttribute("data-selected-base", String(ns.base));

            if (typeof onSelectChange === "function") {
                onSelectChange(ns.base);
            }
        });

        group.appendChild(btn);
    });

    return group;
}

// ═══════════════════════════════════════════════════════
// TAB 1: Create Input Boxes
// ═══════════════════════════════════════════════════════

function createComplementInputBoxes(count) {
    complementInputsContainer.replaceChildren();

    for (let i = 1; i <= count; i++) {
        const letter = getInputLetter(i);

        const inputContainer = document.createElement("article");
        inputContainer.className = "input-container";
        inputContainer.setAttribute("data-variable", letter);

        // Header
        const header = document.createElement("div");
        header.className = "box-header";

        const badge = document.createElement("span");
        badge.className = "box-badge";
        badge.textContent = letter;

        const title = document.createElement("h2");
        title.textContent = `Input Box ${letter}`;

        header.append(badge, title);

        // Input section
        const inputSection = document.createElement("div");
        inputSection.className = "input-section";

        const inputSystemLabel = document.createElement("label");
        inputSystemLabel.textContent = "Input number system:";

        const inputBaseGroup = createBaseButtonGroup("input-base", 2, function () {
            processComplementInput(inputContainer);
        });

        const digitWidthLabel = document.createElement("label");
        digitWidthLabel.setAttribute("for", `digit-width-${letter}`);
        digitWidthLabel.textContent = "Working word length (bits):";

        const digitWidthInput = document.createElement("input");
        digitWidthInput.type = "number";
        digitWidthInput.id = `digit-width-${letter}`;
        digitWidthInput.className = "digit-width-input";
        digitWidthInput.min = "1";
        digitWidthInput.max = "64";
        digitWidthInput.value = "8";

        digitWidthInput.addEventListener("input", function () {
            processComplementInput(inputContainer);
        });

        const numberLabel = document.createElement("label");
        numberLabel.setAttribute("for", `number-input-${letter}`);
        numberLabel.textContent = "Enter value:";

        const numberInput = document.createElement("input");
        numberInput.type = "text";
        numberInput.id = `number-input-${letter}`;
        numberInput.className = "number-input";
        numberInput.placeholder = `Enter value for ${letter} (Base 2)`;
        numberInput.autocomplete = "off";
        numberInput.spellcheck = false;

        const validationMessage = document.createElement("p");
        validationMessage.className = "validation-message";

        inputSection.append(
            inputSystemLabel,
            inputBaseGroup,
            digitWidthLabel,
            digitWidthInput,
            numberLabel,
            numberInput,
            validationMessage
        );

        // Complement result card
        const complementResult = document.createElement("div");
        complementResult.className = "complement-result";
        complementResult.hidden = true;

        const complementTitle = document.createElement("h3");
        complementTitle.className = "complement-result-title";
        complementTitle.textContent = "Complements (Binary)";

        // True binary row
        const trueBinaryRow = document.createElement("div");
        trueBinaryRow.className = "complement-row";
        const trueBinaryLabel = document.createElement("span");
        trueBinaryLabel.className = "complement-label";
        trueBinaryLabel.textContent = "True Binary:";
        const trueBinaryValue = document.createElement("span");
        trueBinaryValue.className = "complement-value true-binary-value";
        trueBinaryValue.textContent = "—";
        trueBinaryRow.append(trueBinaryLabel, trueBinaryValue);

        // 1's complement row
        const rMinus1Row = document.createElement("div");
        rMinus1Row.className = "complement-row";
        const rMinus1Label = document.createElement("span");
        rMinus1Label.className = "complement-label r-minus-1-label";
        rMinus1Label.textContent = "(r-1)'s complement (1's):";
        const rMinus1Value = document.createElement("span");
        rMinus1Value.className = "complement-value r-minus-1-value";
        rMinus1Value.textContent = "—";
        rMinus1Row.append(rMinus1Label, rMinus1Value);

        // 2's complement row
        const rRow = document.createElement("div");
        rRow.className = "complement-row";
        const rLabel = document.createElement("span");
        rLabel.className = "complement-label r-label";
        rLabel.textContent = "r's complement (2's):";
        const rValue = document.createElement("span");
        rValue.className = "complement-value r-value";
        rValue.textContent = "—";
        rRow.append(rLabel, rValue);

        // Signed 1's rep row
        const signed1sRow = document.createElement("div");
        signed1sRow.className = "complement-row signed-row";
        const signed1sLabel = document.createElement("span");
        signed1sLabel.className = "complement-label signed-1s-label";
        signed1sLabel.textContent = "Signed 1's Comp:";
        const signed1sValue = document.createElement("span");
        signed1sValue.className = "complement-value signed-1s-value";
        signed1sValue.textContent = "—";
        signed1sRow.append(signed1sLabel, signed1sValue);

        // Signed 2's rep row
        const signed2sRow = document.createElement("div");
        signed2sRow.className = "complement-row signed-row";
        const signed2sLabel = document.createElement("span");
        signed2sLabel.className = "complement-label signed-2s-label";
        signed2sLabel.textContent = "Signed 2's Comp:";
        const signed2sValue = document.createElement("span");
        signed2sValue.className = "complement-value signed-2s-value";
        signed2sValue.textContent = "—";
        signed2sRow.append(signed2sLabel, signed2sValue);

        complementResult.append(
            complementTitle,
            trueBinaryRow,
            rMinus1Row,
            rRow,
            signed1sRow,
            signed2sRow
        );

        // Solution toggle
        const solutionButton = document.createElement("button");
        solutionButton.type = "button";
        solutionButton.className = "solution-toggle";
        solutionButton.setAttribute("aria-expanded", "false");

        const solutionButtonText = document.createElement("span");
        solutionButtonText.textContent = "Show solution";
        const solutionChevron = document.createElement("span");
        solutionChevron.className = "solution-chevron";
        solutionChevron.textContent = "⌄";
        solutionButton.append(solutionButtonText, solutionChevron);

        const solutionContainer = document.createElement("div");
        solutionContainer.className = "solution-container";
        solutionContainer.textContent = "Solution will appear here after you enter a valid value.";
        solutionContainer.hidden = true;

        solutionButton.addEventListener("click", function () {
            const isOpening = solutionContainer.hidden;
            solutionContainer.hidden = !isOpening;
            solutionButton.setAttribute("aria-expanded", String(isOpening));
            solutionButtonText.textContent = isOpening ? "Hide solution" : "Show solution";
            solutionChevron.textContent = isOpening ? "⌃" : "⌄";
        });

        inputContainer.append(
            header,
            inputSection,
            complementResult,
            solutionButton,
            solutionContainer
        );

        complementInputsContainer.appendChild(inputContainer);

        // Real-time processing
        numberInput.addEventListener("input", function () {
            processComplementInput(inputContainer);
        });
    }
}

// ═══════════════════════════════════════════════════════
// TAB 1: Process complement input for a single box
// ═══════════════════════════════════════════════════════

function processComplementInput(inputContainer) {
    const numberInput = inputContainer.querySelector(".number-input");
    const inputBaseGroup = inputContainer.querySelector(".input-base-group");
    const validationMessage = inputContainer.querySelector(".validation-message");
    const complementResult = inputContainer.querySelector(".complement-result");
    const trueBinaryValue = complementResult.querySelector(".true-binary-value");
    const rMinus1Value = complementResult.querySelector(".r-minus-1-value");
    const rValue = complementResult.querySelector(".r-value");
    const signed1sLabel = complementResult.querySelector(".signed-1s-label");
    const signed1sValue = complementResult.querySelector(".signed-1s-value");
    const signed2sLabel = complementResult.querySelector(".signed-2s-label");
    const signed2sValue = complementResult.querySelector(".signed-2s-value");
    const solutionContainer = inputContainer.querySelector(".solution-container");
    const digitWidthInput = inputContainer.querySelector(".digit-width-input");
    const letter = inputContainer.getAttribute("data-variable");

    const base = Number(inputBaseGroup.getAttribute("data-selected-base") || 2);
    const numBits = Number(digitWidthInput.value || 8);

    numberInput.placeholder = `Enter value for ${letter} (Base ${base})`;

    const rawValue = numberInput.value.trim();
    if (rawValue === "") {
        validationMessage.textContent = "";
        validationMessage.className = "validation-message";
        complementResult.hidden = true;
        trueBinaryValue.textContent = "—";
        rMinus1Value.textContent = "—";
        rValue.textContent = "—";
        signed1sValue.textContent = "—";
        signed2sValue.textContent = "—";
        solutionContainer.textContent = "Solution will appear here after you enter a valid value.";
        return;
    }

    const validation = validateSignedInput(rawValue, base);
    validationMessage.textContent = validation.message;
    validationMessage.className = validation.valid
        ? "validation-message valid"
        : "validation-message invalid";

    if (!validation.valid) {
        complementResult.hidden = true;
        trueBinaryValue.textContent = "—";
        rMinus1Value.textContent = "—";
        rValue.textContent = "—";
        signed1sValue.textContent = "—";
        signed2sValue.textContent = "—";
        solutionContainer.textContent = `Enter a valid value for Base ${base} to see complements.`;
        return;
    }

    // Compute binary complements
    const comp = computeComplements(rawValue, base, numBits);
    if (!comp) {
        complementResult.hidden = true;
        return;
    }

    const signPrefix = comp.isNegative ? "−" : "+";

    trueBinaryValue.textContent = comp.formattedTrueBinary;
    rMinus1Value.textContent = comp.formatted1sComplement;
    rValue.textContent = comp.formatted2sComplement;

    signed1sLabel.textContent = `Signed 1's (${signPrefix}${comp.decimalValue}):`;
    signed1sValue.textContent = comp.formattedSigned1s;

    signed2sLabel.textContent = `Signed 2's (${signPrefix}${comp.decimalValue}):`;
    signed2sValue.textContent = comp.formattedSigned2s;

    complementResult.hidden = false;

    // Generate solution
    const solution = createComplementSolution(rawValue, base, numBits);
    solutionContainer.textContent = solution;
}

// ═══════════════════════════════════════════════════════
// TAB 1: Set Input Boxes button
// ═══════════════════════════════════════════════════════

complementSetInputsButton.addEventListener("click", function () {
    const count = Number(complementInputCount.value);
    if (!Number.isInteger(count) || count < 1 || count > 10) {
        alert("Please enter a valid number of input boxes (from 1 to 10).");
        return;
    }
    createComplementInputBoxes(count);
});

// ═══════════════════════════════════════════════════════
// TAB 2: Base selection and placeholders
// ═══════════════════════════════════════════════════════

function getSubBase() {
    const activeBtn = subBaseButtonGroup.querySelector(".btn-base.active");
    return activeBtn ? Number(activeBtn.getAttribute("data-base")) : 2;
}

function updateSubPlaceholders() {
    const base = getSubBase();
    subMinuend.placeholder = `Enter Minuend A (Base ${base})`;
    subSubtrahend.placeholder = `Enter Subtrahend B (Base ${base})`;
}

subBaseButtonGroup.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-base");
    if (!btn) return;

    subBaseButtonGroup.querySelectorAll(".btn-base").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    updateSubPlaceholders();

    // Clear results on base change
    subtractionResultContainer.hidden = true;
    subtractionResultContainer.replaceChildren();
    subMinuendValidation.textContent = "";
    subSubtrahendValidation.textContent = "";
});

// ═══════════════════════════════════════════════════════
// TAB 2: Perform Subtraction
// ═══════════════════════════════════════════════════════

function performSubtraction() {
    const base = getSubBase();
    const numBits = Number(subDigitWidth.value || 8);
    const baseName = numberSystems.find(ns => ns.base === base)?.name || `Base ${base}`;

    // Validate minuend
    const aRaw = subMinuend.value.trim();
    if (aRaw === "") {
        subMinuendValidation.textContent = "Minuend (A) cannot be empty.";
        subMinuendValidation.className = "validation-message invalid";
        subMinuend.focus();
        return;
    }
    const aVal = validateSignedInput(aRaw, base);
    subMinuendValidation.textContent = aVal.message;
    subMinuendValidation.className = aVal.valid
        ? "validation-message valid"
        : "validation-message invalid";
    if (!aVal.valid) {
        subMinuend.focus();
        return;
    }

    // Validate subtrahend
    const bRaw = subSubtrahend.value.trim();
    if (bRaw === "") {
        subSubtrahendValidation.textContent = "Subtrahend (B) cannot be empty.";
        subSubtrahendValidation.className = "validation-message invalid";
        subSubtrahend.focus();
        return;
    }
    const bVal = validateSignedInput(bRaw, base);
    subSubtrahendValidation.textContent = bVal.message;
    subSubtrahendValidation.className = bVal.valid
        ? "validation-message valid"
        : "validation-message invalid";
    if (!bVal.valid) {
        subSubtrahend.focus();
        return;
    }

    // Compute both complement subtraction methods
    const rMinus1Result = subtractUsing1sComplement(aRaw, bRaw, base, numBits);
    const rResult = subtractUsing2sComplement(aRaw, bRaw, base, numBits);

    if (rMinus1Result.error || rResult.error) {
        alert("An error occurred during subtraction calculation.");
        return;
    }

    // Complements of inputs for summary header
    const compA = computeComplements(aRaw, base, numBits);
    const compB = computeComplements(bRaw, base, numBits);
    const effectiveBits = compA ? compA.effectiveBits : numBits;

    subtractionResultContainer.hidden = false;
    subtractionResultContainer.innerHTML = `
        <div class="subtraction-result-header">
            <h2>Subtraction Result (Binary)</h2>
            <span class="subtraction-base-badge">${baseName} (Base ${base})</span>
        </div>

        <div class="subtraction-info-row">
            <strong>Minuend (A):</strong> ${aVal.normalizedValue} (Base ${base}) = <code>${compA ? compA.formattedTrueBinary : ""}</code>₂ &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Subtrahend (B):</strong> ${bVal.normalizedValue} (Base ${base}) = <code>${compB ? compB.formattedTrueBinary : ""}</code>₂ &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Working word length:</strong> ${effectiveBits} bit(s)
        </div>

        <span class="subtraction-method-label">Using 1's Complement</span>
        <div class="subtraction-result-value-box">
            <span class="subtraction-result-label">A − B using (r-1)'s complement (1's):</span>
            <span class="subtraction-result-value">${rMinus1Result.isNegative ? "−" : ""}${rMinus1Result.formattedBinary}₂ &nbsp;(${rMinus1Result.decimalString} in Base 10)</span>
        </div>

        <span class="subtraction-method-label">Using 2's Complement</span>
        <div class="subtraction-result-value-box">
            <span class="subtraction-result-label">A − B using r's complement (2's):</span>
            <span class="subtraction-result-value">${rResult.isNegative ? "−" : ""}${rResult.formattedBinary}₂ &nbsp;(${rResult.decimalString} in Base 10)</span>
        </div>

        <button type="button" class="solution-toggle" aria-expanded="false" id="subSolutionToggle">
            <span>Show solution</span>
            <span class="solution-chevron">⌄</span>
        </button>

        <div class="solution-container" id="subSolutionContainer" hidden></div>
    `;

    // Solution text
    const solContainer = subtractionResultContainer.querySelector("#subSolutionContainer");
    solContainer.textContent = rMinus1Result.solution + "\n\n" + rResult.solution;

    // Solution toggle
    const toggleBtn = subtractionResultContainer.querySelector("#subSolutionToggle");
    toggleBtn.addEventListener("click", function () {
        const isOpening = solContainer.hidden;
        solContainer.hidden = !isOpening;
        toggleBtn.setAttribute("aria-expanded", String(isOpening));
        toggleBtn.querySelector("span:first-child").textContent = isOpening
            ? "Hide solution"
            : "Show solution";
        toggleBtn.querySelector(".solution-chevron").textContent = isOpening
            ? "⌃"
            : "⌄";
        if (isOpening) {
            setTimeout(() => {
                solContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 60);
        }
    });

    // Smooth scroll to result
    scrollToSubtractionResult();
}

/**
 * Smoothly scrolls the window to the subtraction result container
 * with a pulse animation for visual feedback.
 */
function scrollToSubtractionResult() {
    if (!subtractionResultContainer || subtractionResultContainer.hidden) return;

    requestAnimationFrame(() => {
        setTimeout(() => {
            subtractionResultContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            subtractionResultContainer.classList.remove("highlight-pulse");
            void subtractionResultContainer.offsetWidth;
            subtractionResultContainer.classList.add("highlight-pulse");
        }, 50);
    });
}

performSubtractionButton.addEventListener("click", performSubtraction);

// Allow Enter key in subtraction inputs
subMinuend.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performSubtraction();
    }
});

subSubtrahend.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performSubtraction();
    }
});

// ═══════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════

createComplementInputBoxes(3);
updateSubPlaceholders();
