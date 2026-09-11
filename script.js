import {
    validateInput
} from "./conversions/validation.js";

import {
    convertToDecimal,
    displayDecimal,
    createDecimalInputSolution,
    createDecimalOutputSolution
} from "./conversions/to-decimal.js";

import {
    convertToBinary,
    createBinarySolution
} from "./conversions/to-binary.js";

import {
    convertToOctal,
    createOctalSolution
} from "./conversions/to-octal.js";

import {
    convertToHexadecimal,
    createHexadecimalSolution
} from "./conversions/to-hexadecimal.js";

import {
    evaluateExpression,
    createExpressionSolution,
    formatResultInBase
} from "./conversions/arithmetic.js";

// Number systems ordered as requested: 10, 2, 8, 16
const numberSystems = [
    {
        name: "Decimal",
        base: 10,
        short: "Dec"
    },
    {
        name: "Binary",
        base: 2,
        short: "Bin"
    },
    {
        name: "Octal",
        base: 8,
        short: "Oct"
    },
    {
        name: "Hexadecimal",
        base: 16,
        short: "Hex"
    }
];

const inputCount =
    document.getElementById("inputCount");

const setInputsButton =
    document.getElementById("setInputsButton");

const inputsContainer =
    document.getElementById("inputsContainer");

const controlsContainer =
    document.getElementById("controlsContainer");

const expressionContainer =
    document.getElementById("expressionContainer");

const variableButtonsContainer =
    document.getElementById("variableButtons");

const expressionInput =
    document.getElementById("expressionInput");

const clearExpressionButton =
    document.getElementById("clearExpressionButton");

const resultSystemSelect =
    document.getElementById("resultSystemSelect");

const resultBaseButtonGroup =
    document.getElementById("resultBaseButtonGroup");

const performArithmeticButton =
    document.getElementById("performArithmeticButton");

const arithmeticResultContainer =
    document.getElementById("arithmeticResultContainer");

function getInputLetter(index) {
    return String.fromCharCode(65 + (index - 1));
}

/**
 * Creates a segmented button group for selecting number systems (10, 2, 8, 16)
 */
function createBaseButtonGroup(groupName, letter, initialBase, onSelectChange) {
    const group = document.createElement("div");
    group.className = `base-btn-group ${groupName}-group`;
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", `${groupName} for Box ${letter}`);
    group.setAttribute("data-selected-base", String(initialBase));

    numberSystems.forEach(function (ns) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn-base ${ns.base === initialBase ? "active" : ""}`;
        btn.setAttribute("data-base", String(ns.base));
        btn.title = `${ns.name} (Base ${ns.base})`;

        const numSpan = document.createElement("span");
        numSpan.className = "base-num";
        numSpan.textContent = ns.base;

        const tagSpan = document.createElement("span");
        tagSpan.className = "base-tag";
        tagSpan.textContent = ns.short;

        btn.append(numSpan, tagSpan);

        btn.addEventListener("click", function () {
            const currentBase = Number(group.getAttribute("data-selected-base"));
            if (currentBase === ns.base) return;

            group.setAttribute("data-selected-base", String(ns.base));
            group.querySelectorAll(".btn-base").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            if (typeof onSelectChange === "function") {
                onSelectChange(ns.base);
            }
        });

        group.appendChild(btn);
    });

    return group;
}

function insertAtCursor(inputElement, textToInsert) {
    const start = inputElement.selectionStart ?? inputElement.value.length;
    const end = inputElement.selectionEnd ?? inputElement.value.length;
    const originalText = inputElement.value;

    const needsSpaces = /[+\-*\/^]/.test(textToInsert);
    const formattedInsert = needsSpaces ? ` ${textToInsert} ` : textToInsert;

    inputElement.value =
        originalText.substring(0, start) +
        formattedInsert +
        originalText.substring(end);

    const newCursorPos = start + formattedInsert.length;
    inputElement.focus();
    inputElement.setSelectionRange(newCursorPos, newCursorPos);
}

/**
 * Updates variable buttons in the arithmetic toolbar and connects them to inputs
 */
function updateVariableButtons(numberOfInputs) {
    variableButtonsContainer.replaceChildren();

    for (let i = 1; i <= numberOfInputs; i++) {
        const letter = getInputLetter(i);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-expr btn-var";
        btn.setAttribute("data-var", letter);
        btn.setAttribute("data-insert", letter);
        btn.title = `Insert variable ${letter} into expression`;

        const letterSpan = document.createElement("span");
        letterSpan.className = "var-letter";
        letterSpan.textContent = letter;

        const previewSpan = document.createElement("span");
        previewSpan.className = "var-preview";
        previewSpan.id = `var-preview-${letter}`;
        previewSpan.textContent = "—";

        btn.append(letterSpan, previewSpan);

        btn.addEventListener("click", function () {
            insertAtCursor(expressionInput, letter);
        });

        variableButtonsContainer.appendChild(btn);
    }
}

/**
 * Synchronizes variable preview badges in the toolbar with current output values
 */
function updateVariablePreviews() {
    const inputArticles = Array.from(inputsContainer.querySelectorAll(".input-container"));
    inputArticles.forEach(container => {
        const letter = container.getAttribute("data-variable");
        const outputValue = container.querySelector(".output-value");
        const preview = document.getElementById(`var-preview-${letter}`);
        if (preview && outputValue) {
            const text = outputValue.textContent.trim();
            preview.textContent = text !== "—" ? text : "—";
            preview.title = text !== "—" ? `Current value for ${letter}: ${text}` : `No valid value set for ${letter}`;
        }
    });
}

/**
 * Generates input boxes labeled alphabetically with string inputs and base buttons
 */
function createInputBoxes(numberOfInputs) {
    inputsContainer.replaceChildren();

    if (arithmeticResultContainer) {
        arithmeticResultContainer.hidden = true;
        arithmeticResultContainer.replaceChildren();
    }

    updateVariableButtons(numberOfInputs);

    for (let inputNumber = 1; inputNumber <= numberOfInputs; inputNumber++) {
        const letter = getInputLetter(inputNumber);

        const inputContainer = document.createElement("article");
        inputContainer.className = "input-container";
        inputContainer.setAttribute("data-variable", letter);

        // Header with alphabetical letter badge
        const header = document.createElement("div");
        header.className = "box-header";

        const badge = document.createElement("span");
        badge.className = "box-badge";
        badge.textContent = letter;

        const heading = document.createElement("h2");
        heading.textContent = `Input Box ${letter}`;

        header.append(badge, heading);

        // Input section with base buttons (10, 2, 8, 16) and string input
        const inputSection = document.createElement("div");
        inputSection.className = "input-section";

        const inputSystemLabel = document.createElement("label");
        inputSystemLabel.textContent = "Input number system:";

        const inputBaseGroup = createBaseButtonGroup("input-base", letter, 10, function () {
            processInput(inputContainer);
        });

        const numberLabel = document.createElement("label");
        numberLabel.setAttribute("for", `number-input-${letter}`);
        numberLabel.textContent = `Enter string value:`;

        const numberInput = document.createElement("input");
        numberInput.type = "text";
        numberInput.id = `number-input-${letter}`;
        numberInput.className = "number-input";
        numberInput.placeholder = `Enter string for ${letter} (Base 10)`;
        numberInput.autocomplete = "off";
        numberInput.spellcheck = false;

        const validationMessage = document.createElement("p");
        validationMessage.className = "validation-message";

        inputSection.append(
            inputSystemLabel,
            inputBaseGroup,
            numberLabel,
            numberInput,
            validationMessage
        );

        // Output section with base buttons (10, 2, 8, 16) and converted value
        const outputSection = document.createElement("div");
        outputSection.className = "output-section";

        const outputSystemLabel = document.createElement("label");
        outputSystemLabel.textContent = "Output number system:";

        const outputBaseGroup = createBaseButtonGroup("output-base", letter, 2, function () {
            processInput(inputContainer);
        });

        const outputContainer = document.createElement("div");
        outputContainer.className = "output-container";

        const outputLabel = document.createElement("span");
        outputLabel.className = "output-label";
        outputLabel.textContent = "Converted value:";

        const outputValue = document.createElement("strong");
        outputValue.className = "output-value";
        outputValue.textContent = "—";

        outputContainer.append(outputLabel, outputValue);

        outputSection.append(
            outputSystemLabel,
            outputBaseGroup,
            outputContainer
        );

        // Solution toggle button and solution container
        const solutionButton = document.createElement("button");
        solutionButton.type = "button";
        solutionButton.className = "solution-toggle";
        solutionButton.setAttribute("aria-expanded", "false");
        solutionButton.setAttribute("aria-controls", `solution-container-${letter}`);

        const solutionButtonText = document.createElement("span");
        solutionButtonText.textContent = "Show solution";

        const solutionChevron = document.createElement("span");
        solutionChevron.className = "solution-chevron";
        solutionChevron.textContent = "⌄";

        solutionButton.append(solutionButtonText, solutionChevron);

        const solutionContainer = document.createElement("div");
        solutionContainer.id = `solution-container-${letter}`;
        solutionContainer.className = "solution-container";
        solutionContainer.textContent = "Solution will appear here after you enter a valid string.";
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
            outputSection,
            solutionButton,
            solutionContainer
        );

        inputsContainer.appendChild(inputContainer);

        numberInput.addEventListener("input", function () {
            processInput(inputContainer);
        });
    }

    updateVariablePreviews();
}

/**
 * Validates the string input, converts it, updates the output container, and syncs variables
 */
function processInput(inputContainer) {
    const numberInput = inputContainer.querySelector(".number-input");
    const inputBaseGroup = inputContainer.querySelector(".input-base-group");
    const outputBaseGroup = inputContainer.querySelector(".output-base-group");
    const validationMessage = inputContainer.querySelector(".validation-message");
    const outputValue = inputContainer.querySelector(".output-value");
    const solutionContainer = inputContainer.querySelector(".solution-container");
    const letter = inputContainer.getAttribute("data-variable");

    const inputBase = Number(inputBaseGroup.getAttribute("data-selected-base") || 10);
    const outputBase = Number(outputBaseGroup.getAttribute("data-selected-base") || 2);

    numberInput.placeholder = `Enter string for ${letter} (Base ${inputBase})`;

    const rawString = numberInput.value;
    if (rawString.trim() === "") {
        validationMessage.textContent = "";
        validationMessage.className = "validation-message";
        outputValue.textContent = "—";
        solutionContainer.textContent = "Solution will appear here after you enter a valid string.";
        updateVariablePreviews();
        return false;
    }

    const validation = validateInput(rawString, inputBase);
    validationMessage.textContent = validation.message;
    validationMessage.className = validation.valid
        ? "validation-message valid"
        : "validation-message invalid";

    if (!validation.valid) {
        outputValue.textContent = "—";
        solutionContainer.textContent = `Enter a valid string for Base ${inputBase} to see the conversion solution.`;
        updateVariablePreviews();
        return false;
    }

    const decimalValue = convertToDecimal(validation.normalizedValue, inputBase);

    const conversionFunctions = {
        2: {
            convert: convertToBinary,
            createSolution: createBinarySolution
        },
        8: {
            convert: convertToOctal,
            createSolution: createOctalSolution
        },
        10: {
            convert: displayDecimal,
            createSolution: createDecimalOutputSolution
        },
        16: {
            convert: convertToHexadecimal,
            createSolution: createHexadecimalSolution
        }
    };

    const selectedConversion = conversionFunctions[outputBase];
    const convertedString = selectedConversion.convert(decimalValue);
    outputValue.textContent = convertedString;

    solutionContainer.textContent = [
        `Input: ${validation.normalizedValue} (Base ${inputBase})`,
        "",
        createDecimalInputSolution(validation.normalizedValue, inputBase),
        "",
        selectedConversion.createSolution(decimalValue)
    ].join("\n");

    updateVariablePreviews();
    return true;
}

/**
 * Computes the arithmetic expression using PEMDAS with the alphabetical inputs
 */
function performArithmeticOperation() {
    const exprText = expressionInput.value.trim();

    if (!exprText) {
        arithmeticResultContainer.hidden = false;
        arithmeticResultContainer.innerHTML = `
            <div class="arithmetic-result-header">
                <h2>Arithmetic Result</h2>
            </div>
            <div class="arithmetic-error-message">
                Please enter an arithmetic expression to compute, e.g. <code>(A + B) * C</code> or <code>A ^ 2 + B</code>.
            </div>
        `;
        expressionInput.focus();
        arithmeticResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    const inputArticles = Array.from(
        inputsContainer.querySelectorAll(".input-container")
    );

    const variableMetadata = {};
    const variableValues = {};
    const inputValidationErrors = {};

    inputArticles.forEach(container => {
        const letter = container.getAttribute("data-variable");
        const numberInput = container.querySelector(".number-input");
        const inputBaseGroup = container.querySelector(".input-base-group");
        const outputBaseGroup = container.querySelector(".output-base-group");
        const outputValueElem = container.querySelector(".output-value");

        const inBase = Number(inputBaseGroup.getAttribute("data-selected-base") || 10);
        const outBase = Number(outputBaseGroup.getAttribute("data-selected-base") || 2);
        const rawVal = numberInput.value.trim();

        const validation = validateInput(rawVal, inBase);
        if (!validation.valid) {
            inputValidationErrors[letter] = {
                letter,
                message: validation.message,
                element: numberInput
            };
        } else {
            const decVal = convertToDecimal(validation.normalizedValue, inBase);
            variableValues[letter] = decVal;
            variableMetadata[letter] = {
                rawValue: validation.normalizedValue,
                base: inBase,
                outputBase: outBase,
                outputValue: outputValueElem ? outputValueElem.textContent : "—",
                decimalValue: decVal
            };
        }
    });

    const usedLetters = Array.from(new Set(
        (exprText.match(/[a-zA-Z]/g) || []).map(ch => ch.toUpperCase())
    ));

    const availableLetters = inputArticles.map(a => a.getAttribute("data-variable"));

    for (const letter of usedLetters) {
        if (!availableLetters.includes(letter)) {
            arithmeticResultContainer.hidden = false;
            arithmeticResultContainer.innerHTML = `
                <div class="arithmetic-result-header">
                    <h2>Arithmetic Result</h2>
                </div>
                <div class="arithmetic-error-message">
                    Undefined variable <strong>'${letter}'</strong> in expression. Available inputs: <strong>${availableLetters.join(", ")}</strong>.
                </div>
            `;
            arithmeticResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        if (inputValidationErrors[letter]) {
            const err = inputValidationErrors[letter];
            arithmeticResultContainer.hidden = false;
            arithmeticResultContainer.innerHTML = `
                <div class="arithmetic-result-header">
                    <h2>Arithmetic Result</h2>
                </div>
                <div class="arithmetic-error-message">
                    Cannot calculate: <strong>Input Box ${letter}</strong> has an invalid or empty value (${err.message}). Please enter a valid string for Box ${letter}.
                </div>
            `;
            err.element.focus();
            arithmeticResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }
    }

    const evalResult = evaluateExpression(exprText, variableValues);

    arithmeticResultContainer.hidden = false;

    if (evalResult.error) {
        arithmeticResultContainer.innerHTML = `
            <div class="arithmetic-result-header">
                <h2>Arithmetic Result</h2>
            </div>
            <div class="arithmetic-error-message">
                <strong>Arithmetic / Syntax Error:</strong> ${evalResult.error}
            </div>
        `;
        arithmeticResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    const targetBase = Number(resultSystemSelect.value || 10);
    const formattedResult = formatResultInBase(evalResult.result, targetBase);
    const targetName =
        numberSystems.find(ns => ns.base === targetBase)?.name ||
        `Base ${targetBase}`;

    const filteredMetadata = {};
    usedLetters.forEach(l => {
        if (variableMetadata[l]) {
            filteredMetadata[l] = variableMetadata[l];
        }
    });

    const solutionText = createExpressionSolution({
        expressionStr: exprText,
        variableMetadata: filteredMetadata,
        evaluationResult: evalResult,
        targetBase
    });

    // Build variable badges for display
    const variableChips = usedLetters.map(l => {
        const meta = variableMetadata[l];
        return `
            <div class="variable-summary-chip">
                <span class="chip-letter">${l}</span>
                <span class="chip-details">
                    In: <code>${meta.rawValue}</code> (B${meta.base}) &rarr; 
                    Out: <code>${meta.outputValue}</code> (B${meta.outputBase}) = 
                    <strong>${meta.decimalValue}</strong>
                </span>
            </div>
        `;
    }).join("");

    arithmeticResultContainer.innerHTML = `
        <div class="arithmetic-result-header">
            <h2>Arithmetic Result</h2>
            <span class="arithmetic-base-badge">${targetName} (Base ${targetBase})</span>
        </div>

        <div class="arithmetic-expression">
            <strong>Expression:</strong> <code>${exprText}</code>
        </div>

        ${variableChips ? `<div class="variable-chips-container">${variableChips}</div>` : ""}

        <div class="arithmetic-result-value-box">
            <span class="arithmetic-result-label">Calculated Answer (${targetName}):</span>
            <span class="arithmetic-result-value">${formattedResult}</span>
        </div>

        <button type="button" class="solution-toggle" aria-expanded="false" id="arithmeticSolutionToggle">
            <span>Show solution (PEMDAS Breakdown)</span>
            <span class="solution-chevron">⌄</span>
        </button>

        <div class="solution-container" id="arithmeticSolutionContainer" hidden></div>
    `;

    const toggleBtn =
        arithmeticResultContainer.querySelector("#arithmeticSolutionToggle");
    const solContainer =
        arithmeticResultContainer.querySelector("#arithmeticSolutionContainer");

    solContainer.textContent = solutionText;

    toggleBtn.addEventListener("click", function () {
        const isOpening = solContainer.hidden;
        solContainer.hidden = !isOpening;
        toggleBtn.setAttribute("aria-expanded", String(isOpening));
        toggleBtn.querySelector("span:first-child").textContent = isOpening
            ? "Hide solution (PEMDAS Breakdown)"
            : "Show solution (PEMDAS Breakdown)";
        toggleBtn.querySelector(".solution-chevron").textContent = isOpening
            ? "⌃"
            : "⌄";
        if (isOpening) {
            setTimeout(() => {
                solContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 60);
        }
    });

    scrollToResultContainer();
}

/**
 * Smoothly scrolls the window to the arithmetic result container,
 * accounting for sticky header height and applying a focus pulse effect.
 */
function scrollToResultContainer() {
    if (!arithmeticResultContainer || arithmeticResultContainer.hidden) return;

    requestAnimationFrame(() => {
        setTimeout(() => {
            const exprHeight = expressionContainer ? expressionContainer.offsetHeight : 0;
            const resultRect = arithmeticResultContainer.getBoundingClientRect();
            const targetY = window.scrollY + resultRect.top - exprHeight - 16;

            window.scrollTo({
                top: Math.max(0, targetY),
                behavior: "smooth"
            });

            arithmeticResultContainer.classList.remove("highlight-pulse");
            void arithmeticResultContainer.offsetWidth;
            arithmeticResultContainer.classList.add("highlight-pulse");
        }, 50);
    });
}

function handleStickyHeader() {
    if (!controlsContainer || !expressionContainer) return;

    const controlsBottom = controlsContainer.getBoundingClientRect().bottom;
    if (controlsBottom <= 0) {
        expressionContainer.classList.add("is-sticky");
    } else {
        expressionContainer.classList.remove("is-sticky");
    }
}

window.addEventListener("scroll", handleStickyHeader, { passive: true });

// Setup operators and expression buttons
document.querySelectorAll(".btn-expr[data-insert]").forEach(btn => {
    btn.addEventListener("click", function () {
        const text = btn.getAttribute("data-insert");
        insertAtCursor(expressionInput, text);
    });
});

clearExpressionButton.addEventListener("click", function () {
    expressionInput.value = "";
    expressionInput.focus();
});

// Setup result base button group
if (resultBaseButtonGroup) {
    resultBaseButtonGroup.querySelectorAll(".btn-base").forEach(btn => {
        btn.addEventListener("click", function () {
            const base = btn.getAttribute("data-base");
            resultBaseButtonGroup.querySelectorAll(".btn-base").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            if (resultSystemSelect) {
                resultSystemSelect.value = base;
            }
            if (arithmeticResultContainer && !arithmeticResultContainer.hidden && expressionInput.value.trim()) {
                performArithmeticOperation();
            }
        });
    });
}

setInputsButton.addEventListener("click", function () {
    const numberOfInputs = Number(inputCount.value);

    if (
        !Number.isInteger(numberOfInputs) ||
        numberOfInputs < 2 ||
        numberOfInputs > 26
    ) {
        alert("Please enter a valid number of input boxes (from 2 to 26).");
        return;
    }

    createInputBoxes(numberOfInputs);
});

// Allow Enter key in expression input to calculate
expressionInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performArithmeticOperation();
    }
});

performArithmeticButton.addEventListener("click", performArithmeticOperation);

// Initial generation
createInputBoxes(3);
handleStickyHeader();
