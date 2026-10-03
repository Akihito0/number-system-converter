import {
    validateOperandInput,
    validateBCDInput,
    decimalToBCD,
    evaluateBCDExpression,
    addBCDWithSolution,
    subtractBCDUsing9sComplement,
    subtractBCDUsing10sComplement
} from "./bcd.js";

// ═══════════════════════════════════════════════════════
// DOM References
// ═══════════════════════════════════════════════════════

const bcdInputCount = document.getElementById("bcdInputCount");
const bcdSetInputsButton = document.getElementById("bcdSetInputsButton");
const bcdVariableButtons = document.getElementById("bcdVariableButtons");
const bcdClearExpressionButton = document.getElementById("bcdClearExpressionButton");
const bcdExpressionInput = document.getElementById("bcdExpressionInput");
const bcdPerformArithmeticButton = document.getElementById("bcdPerformArithmeticButton");
const bcdOperandsContainer = document.getElementById("bcdOperandsContainer");
const bcdResultContainer = document.getElementById("bcdResultContainer");

// ═══════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════

let operandCount = 4;

// ═══════════════════════════════════════════════════════
// Helper: Get input letter
// ═══════════════════════════════════════════════════════

function getInputLetter(index) {
    return String.fromCharCode(65 + index);
}

// ═══════════════════════════════════════════════════════
// Cursor Insertion Helper
// ═══════════════════════════════════════════════════════

function insertAtCursor(inputElement, textToInsert) {
    const start = inputElement.selectionStart ?? inputElement.value.length;
    const end = inputElement.selectionEnd ?? inputElement.value.length;
    const originalText = inputElement.value;

    const needsSpaces = /[+\-]/.test(textToInsert);
    const formattedInsert = needsSpaces ? ` ${textToInsert} ` : textToInsert;

    inputElement.value =
        originalText.substring(0, start) +
        formattedInsert +
        originalText.substring(end);

    const newCursorPos = start + formattedInsert.length;
    inputElement.focus();
    inputElement.setSelectionRange(newCursorPos, newCursorPos);
}

// ═══════════════════════════════════════════════════════
// Update Variable Buttons Toolbar
// ═══════════════════════════════════════════════════════

function updateVariableButtons(count) {
    if (!bcdVariableButtons) return;
    bcdVariableButtons.replaceChildren();

    for (let i = 0; i < count; i++) {
        const letter = getInputLetter(i);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-expr btn-var";
        btn.setAttribute("data-var", letter);
        btn.setAttribute("data-insert", letter);
        btn.title = `Insert operand ${letter} into expression`;

        const letterSpan = document.createElement("span");
        letterSpan.className = "var-letter";
        letterSpan.textContent = letter;

        const previewSpan = document.createElement("span");
        previewSpan.className = "var-preview";
        previewSpan.id = `bcd-var-preview-${letter}`;
        previewSpan.textContent = "—";

        btn.append(letterSpan, previewSpan);

        btn.addEventListener("click", function () {
            insertAtCursor(bcdExpressionInput, letter);
        });

        bcdVariableButtons.appendChild(btn);
    }
}

// ═══════════════════════════════════════════════════════
// Update Variable Badges Previews
// ═══════════════════════════════════════════════════════

function updateVariablePreviews() {
    const cards = bcdOperandsContainer.querySelectorAll(".bcd-operand-card");
    cards.forEach((card, index) => {
        const letter = getInputLetter(index);
        const previewSpan = document.getElementById(`bcd-var-preview-${letter}`);
        if (!previewSpan) return;

        const input = card.querySelector(".operand-input");
        const base = Number(card.getAttribute("data-selected-base") || 10);
        const rawValue = input.value.trim();

        if (rawValue === "") {
            previewSpan.textContent = "—";
            previewSpan.title = `No valid value set for ${letter}`;
            return;
        }

        const validation = validateOperandInput(rawValue, base);
        if (validation.valid) {
            const display = `${validation.isNegative ? "-" : ""}${validation.digits}`;
            previewSpan.textContent = display;
            previewSpan.title = `Current value for ${letter}: ${display}`;
        } else {
            previewSpan.textContent = "?";
            previewSpan.title = `Invalid value for ${letter}`;
        }
    });
}

// ═══════════════════════════════════════════════════════
// Create Operand Cards (4 by row in CSS grid)
// ═══════════════════════════════════════════════════════

function createOperandCards(count) {
    bcdOperandsContainer.replaceChildren();
    bcdResultContainer.hidden = true;
    bcdResultContainer.replaceChildren();

    updateVariableButtons(count);

    // Set default initial expression: e.g. A + B - C + D
    const defaultTokens = [];
    for (let i = 0; i < count; i++) {
        const letter = getInputLetter(i);
        if (i === 0) {
            defaultTokens.push(letter);
        } else {
            // Alternate + and - for rich demonstration
            const op = i % 2 === 1 ? "+" : "−";
            defaultTokens.push(op, letter);
        }
    }
    bcdExpressionInput.value = defaultTokens.join(" ");

    for (let i = 0; i < count; i++) {
        const letter = getInputLetter(i);

        // ── Operand Card ──
        const card = document.createElement("div");
        card.className = "bcd-operand-card";
        card.setAttribute("data-operand-index", String(i));
        card.setAttribute("data-operand-letter", letter);
        card.setAttribute("data-selected-base", "10");

        // Header Row: Badge & Title
        const headerRow = document.createElement("div");
        headerRow.className = "card-header-row";

        const badgeGroup = document.createElement("div");
        badgeGroup.className = "card-badge-group";

        const badge = document.createElement("span");
        badge.className = "operand-badge";
        badge.textContent = letter;

        const title = document.createElement("span");
        title.className = "operand-title";
        title.textContent = `Operand ${letter}`;

        badgeGroup.append(badge, title);
        headerRow.appendChild(badgeGroup);
        card.appendChild(headerRow);

        // ── Base Selector (10 Dec vs 2 Bin) ──
        const baseGroup = document.createElement("div");
        baseGroup.className = "base-btn-group";
        baseGroup.setAttribute("role", "group");
        baseGroup.setAttribute("aria-label", `Operand ${letter} base`);

        const decBtn = document.createElement("button");
        decBtn.type = "button";
        decBtn.className = "btn-base active";
        decBtn.setAttribute("data-base", "10");
        decBtn.innerHTML = `10 <span class="base-tag">Dec</span>`;

        const binBtn = document.createElement("button");
        binBtn.type = "button";
        binBtn.className = "btn-base";
        binBtn.setAttribute("data-base", "2");
        binBtn.innerHTML = `2 <span class="base-tag">Bin</span>`;

        baseGroup.append(decBtn, binBtn);
        card.appendChild(baseGroup);

        // ── Input Section ──
        const inputSection = document.createElement("div");
        inputSection.className = "operand-input-section";

        const inputLabel = document.createElement("label");
        inputLabel.className = "operand-input-label";
        inputLabel.setAttribute("for", `bcd-operand-${letter}`);
        inputLabel.textContent = `Value (Decimal):`;

        const input = document.createElement("input");
        input.type = "text";
        input.id = `bcd-operand-${letter}`;
        input.className = "operand-input";
        input.placeholder = `Enter decimal number for ${letter}`;
        input.autocomplete = "off";
        input.spellcheck = false;

        inputSection.append(inputLabel, input);
        card.appendChild(inputSection);

        // ── Live BCD / Decimal Preview ──
        const bcdPreview = document.createElement("div");
        bcdPreview.className = "operand-bcd-preview";
        bcdPreview.textContent = "BCD: —";
        card.appendChild(bcdPreview);

        // ── Validation Message ──
        const validationMsg = document.createElement("p");
        validationMsg.className = "validation-message";
        card.appendChild(validationMsg);

        bcdOperandsContainer.appendChild(card);

        // ── Base Toggle Event Handler ──
        baseGroup.addEventListener("click", function (e) {
            const btn = e.target.closest(".btn-base");
            if (!btn || btn.classList.contains("active")) return;

            const oldBase = Number(card.getAttribute("data-selected-base") || 10);
            const newBase = Number(btn.getAttribute("data-base"));

            baseGroup.querySelectorAll(".btn-base").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            card.setAttribute("data-selected-base", String(newBase));

            // Update label and placeholder
            if (newBase === 10) {
                inputLabel.textContent = `Value (Decimal):`;
                input.placeholder = `Enter decimal number for ${letter}`;

                const curVal = input.value.trim();
                if (curVal !== "") {
                    const validation = validateOperandInput(curVal, oldBase);
                    if (validation.valid) {
                        input.value = `${validation.isNegative ? "-" : ""}${validation.digits}`;
                    }
                }
            } else {
                inputLabel.textContent = `Value (Binary):`;
                input.placeholder = `e.g. 0100 0101 (BCD) or 101101`;

                const curVal = input.value.trim();
                if (curVal !== "") {
                    const validation = validateOperandInput(curVal, oldBase);
                    if (validation.valid) {
                        input.value = validation.bcdString;
                    }
                }
            }

            updateCardPreview(card);
            updateVariablePreviews();
        });

        // ── Real-time Input Validation & Preview ──
        input.addEventListener("input", function () {
            updateCardPreview(card);
            updateVariablePreviews();
        });
    }

    updateVariablePreviews();
}

// ═══════════════════════════════════════════════════════
// Update Preview for a Single Card
// ═══════════════════════════════════════════════════════

function updateCardPreview(card) {
    const input = card.querySelector(".operand-input");
    const preview = card.querySelector(".operand-bcd-preview");
    const validationMsg = card.querySelector(".validation-message");
    const base = Number(card.getAttribute("data-selected-base") || 10);

    const rawValue = input.value.trim();

    if (rawValue === "") {
        preview.textContent = "BCD: —";
        validationMsg.textContent = "";
        validationMsg.className = "validation-message";
        return;
    }

    const validation = validateOperandInput(rawValue, base);
    validationMsg.textContent = validation.message;
    validationMsg.className = validation.valid
        ? "validation-message valid"
        : "validation-message invalid";

    if (validation.valid) {
        preview.textContent = validation.displayInfo;
    } else {
        preview.textContent = "BCD: —";
    }
}

// ═══════════════════════════════════════════════════════
// Gather Variable Values
// ═══════════════════════════════════════════════════════

function gatherVariableValues() {
    const varValues = {};
    const cards = bcdOperandsContainer.querySelectorAll(".bcd-operand-card");

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const letter = getInputLetter(i);
        const input = card.querySelector(".operand-input");
        const base = Number(card.getAttribute("data-selected-base") || 10);
        const rawValue = input.value.trim();
        const validation = validateOperandInput(rawValue, base);

        if (!validation.valid) {
            const validationMsg = card.querySelector(".validation-message");
            validationMsg.textContent = rawValue === "" ? "This field is required." : validation.message;
            validationMsg.className = "validation-message invalid";
            input.focus();
            return null;
        }

        varValues[letter] = `${validation.isNegative ? "-" : ""}${validation.digits}`;
    }

    return varValues;
}

// ═══════════════════════════════════════════════════════
// Perform BCD Calculation & Display Result
// ═══════════════════════════════════════════════════════

function performCalculation() {
    const exprText = bcdExpressionInput.value.trim();
    if (!exprText) {
        alert("Please enter or construct an arithmetic expression.");
        bcdExpressionInput.focus();
        return;
    }

    const varValues = gatherVariableValues();
    if (!varValues) return;

    const evalResult = evaluateBCDExpression(exprText, varValues);

    if (evalResult.error) {
        alert(`Expression Error: ${evalResult.error}`);
        bcdExpressionInput.focus();
        return;
    }

    bcdResultContainer.hidden = false;

    // Build result HTML
    let html = `
        <div class="bcd-result-header">
            <h2>BCD Arithmetic Result</h2>
            <span class="bcd-result-badge">BCD (8421 Code)</span>
        </div>

        <div class="bcd-expression-row">
            Expression: ${exprText} = ${evalResult.finalDecimal}
        </div>

        <div class="bcd-final-result-box">
            <span class="bcd-final-result-label">Final Answer</span>
            <span class="bcd-final-result-value">${evalResult.isNegative ? "−" : ""}${evalResult.finalBCD}</span>
            <span class="bcd-final-result-decimal">${evalResult.finalDecimal} (Decimal)</span>
        </div>
    `;

    // Individual operation cards
    for (let i = 0; i < evalResult.operationResults.length; i++) {
        const op = evalResult.operationResults[i];

        html += `
            <div class="bcd-operation-card">
                <div class="bcd-operation-card-header">
                    <span class="bcd-op-step-badge">Step ${op.stepNumber || i + 1}</span>
                    <span class="bcd-op-title">${op.operandA} ${op.op === "+" ? "+" : "−"} ${op.operandB}</span>
                </div>
        `;

        if (op.type === "addition") {
            html += `
                <span class="bcd-method-label">BCD Addition (+6 Correction)</span>
                <div class="bcd-op-result-box">
                    <span class="bcd-op-result-label">Result:</span>
                    <span class="bcd-op-result-value">${op.result} (Decimal) = ${op.bcdResult} (BCD)</span>
                </div>
            `;
        } else if (op.type === "subtraction") {
            const nines = op.ninesResult || op;
            const tens = op.tensResult || op;

            html += `
                <span class="bcd-method-label">Using 9's Complement</span>
                <div class="bcd-op-result-box">
                    <span class="bcd-op-result-label">A − B via 9's complement:</span>
                    <span class="bcd-op-result-value">${nines.decimalResult} (Decimal) = ${nines.isNegative ? "−" : ""}${nines.bcdResult} (BCD)</span>
                </div>

                <span class="bcd-method-label">Using 10's Complement</span>
                <div class="bcd-op-result-box">
                    <span class="bcd-op-result-label">A − B via 10's complement:</span>
                    <span class="bcd-op-result-value">${tens.decimalResult} (Decimal) = ${tens.isNegative ? "−" : ""}${tens.bcdResult} (BCD)</span>
                </div>
            `;
        } else {
            html += `
                <div class="bcd-op-result-box">
                    <span class="bcd-op-result-label">Result:</span>
                    <span class="bcd-op-result-value">${op.result} (Decimal) = ${op.bcdResult} (BCD)</span>
                </div>
            `;
        }

        html += `</div>`;
    }

    // Solution toggle
    html += `
        <button type="button" class="solution-toggle" aria-expanded="false" id="bcdSolutionToggle">
            <span>Show step-by-step solution</span>
            <span class="solution-chevron">⌄</span>
        </button>
        <div class="solution-container" id="bcdSolutionContainer" hidden></div>
    `;

    bcdResultContainer.innerHTML = html;

    // Solution text
    const solContainer = bcdResultContainer.querySelector("#bcdSolutionContainer");
    solContainer.textContent = evalResult.fullSolution;

    // Solution toggle listener
    const toggleBtn = bcdResultContainer.querySelector("#bcdSolutionToggle");
    toggleBtn.addEventListener("click", function () {
        const isOpening = solContainer.hidden;
        solContainer.hidden = !isOpening;
        toggleBtn.setAttribute("aria-expanded", String(isOpening));
        toggleBtn.querySelector("span:first-child").textContent = isOpening
            ? "Hide step-by-step solution"
            : "Show step-by-step solution";
        toggleBtn.querySelector(".solution-chevron").textContent = isOpening
            ? "⌃"
            : "⌄";
        if (isOpening) {
            setTimeout(() => {
                solContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 60);
        }
    });

    // Scroll smoothly to result
    scrollToResult();
}

/**
 * Smoothly scrolls the window to the result container
 * with a pulse animation for visual feedback.
 */
function scrollToResult() {
    if (!bcdResultContainer || bcdResultContainer.hidden) return;

    requestAnimationFrame(() => {
        setTimeout(() => {
            bcdResultContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            bcdResultContainer.classList.remove("highlight-pulse");
            void bcdResultContainer.offsetWidth;
            bcdResultContainer.classList.add("highlight-pulse");
        }, 50);
    });
}

// ═══════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════

bcdSetInputsButton.addEventListener("click", function () {
    const count = Number(bcdInputCount.value);
    if (!Number.isInteger(count) || count < 2 || count > 10) {
        alert("Please enter a valid number of operands (from 2 to 10).");
        return;
    }
    operandCount = count;
    createOperandCards(count);
});

// Expression operators toolbar buttons
document.querySelectorAll(".expression-toolbar .btn-expr[data-insert]").forEach(btn => {
    btn.addEventListener("click", function () {
        const insertText = btn.getAttribute("data-insert");
        insertAtCursor(bcdExpressionInput, insertText);
    });
});

if (bcdClearExpressionButton) {
    bcdClearExpressionButton.addEventListener("click", function () {
        bcdExpressionInput.value = "";
        bcdExpressionInput.focus();
    });
}

if (bcdPerformArithmeticButton) {
    bcdPerformArithmeticButton.addEventListener("click", function () {
        performCalculation();
    });
}

// Allow Enter key in expression input to trigger calculation
bcdExpressionInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performCalculation();
    }
});

// ═══════════════════════════════════════════════════════
// Initialization: Start with 4 operands (4 by row)
// ═══════════════════════════════════════════════════════

createOperandCards(4);
