/**
 * ═══════════════════════════════════════════════════════
 *  BCD ARITHMETIC MODULE
 *  Core logic for BCD addition, subtraction using
 *  9's complement and 10's complement methods.
 * ═══════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════

/**
 * Validates that the input is a valid decimal number (digits 0-9 only).
 * Accepts optional leading '+' or '-'.
 */
export function validateBCDInput(value) {
    return validateOperandInput(value, 10);
}

/**
 * Validates operand input based on selected base (10 for Decimal, 2 for Binary).
 * For base 10: accepts digits 0-9 with optional leading '+' or '-'.
 * For base 2: accepts binary bits (0 and 1, spaces allowed) with optional sign.
 *   - Parses BCD nibbles (if 4-bit aligned or spaced, where each nibble <= 9)
 *   - Or parses standard binary integer and converts to decimal & BCD.
 * Returns normalized decimal digits, BCD string, and display preview info.
 */
export function validateOperandInput(value, base = 10) {
    const trimmed = value.trim();

    if (trimmed === "") {
        return {
            valid: false,
            message: "Input cannot be empty."
        };
    }

    let sign = "+";
    let body = trimmed;

    if (trimmed.startsWith("-") || trimmed.startsWith("+")) {
        sign = trimmed[0];
        body = trimmed.slice(1).trim();
    }

    if (body === "") {
        return {
            valid: false,
            message: "Please enter digits after the sign."
        };
    }

    if (base === 10) {
        // Remove leading zeros but keep at least one digit
        const stripped = body.replace(/^0+/, "") || "0";

        for (const ch of stripped) {
            if (ch < "0" || ch > "9") {
                return {
                    valid: false,
                    message: `Invalid character '${ch}'. Decimal accepts digits 0-9 only.`
                };
            }
        }

        const bcd = decimalToBCD(stripped);
        return {
            valid: true,
            sign,
            isNegative: sign === "-",
            digits: stripped,
            normalizedValue: `${sign === "-" ? "-" : ""}${stripped}`,
            bcdString: bcd.bcdString,
            displayInfo: `BCD: ${bcd.bcdString}`,
            message: "Valid decimal input."
        };
    } else if (base === 2) {
        // Binary mode: can be BCD nibbles (e.g. 0100 0101) or pure binary (e.g. 101101)
        const cleanBits = body.replace(/\s+/g, "");

        for (const ch of cleanBits) {
            if (ch !== "0" && ch !== "1") {
                return {
                    valid: false,
                    message: `Invalid character '${ch}' for Binary. Bits must be 0 or 1.`
                };
            }
        }

        if (cleanBits === "") {
            return {
                valid: false,
                message: "Please enter binary digits."
            };
        }

        const hasSpaces = body.includes(" ");
        let decimalDigits = "";
        let bcdString = "";
        let isBCDNibbles = false;

        // Try BCD nibble decoding if spaced or length is multiple of 4
        if (hasSpaces || cleanBits.length % 4 === 0) {
            const rem = cleanBits.length % 4;
            const padded = rem === 0 ? cleanBits : "0".repeat(4 - rem) + cleanBits;
            let validNibbles = true;
            let tempDec = "";

            for (let i = 0; i < padded.length; i += 4) {
                const nibble = padded.slice(i, i + 4);
                const val = parseInt(nibble, 2);
                if (val > 9) {
                    validNibbles = false;
                    break;
                }
                tempDec += val.toString();
            }

            if (validNibbles) {
                decimalDigits = tempDec.replace(/^0+/, "") || "0";
                bcdString = decimalToBCD(decimalDigits).bcdString;
                isBCDNibbles = true;
            }
        }

        if (!isBCDNibbles) {
            // Standard binary integer: parse to BigInt decimal then to BCD
            try {
                const bigVal = BigInt("0b" + cleanBits);
                decimalDigits = bigVal.toString();
                bcdString = decimalToBCD(decimalDigits).bcdString;
            } catch (e) {
                return {
                    valid: false,
                    message: "Invalid binary number."
                };
            }
        }

        return {
            valid: true,
            sign,
            isNegative: sign === "-",
            digits: decimalDigits,
            normalizedValue: `${sign === "-" ? "-" : ""}${decimalDigits}`,
            bcdString: bcdString,
            displayInfo: `Dec: ${sign === "-" ? "-" : ""}${decimalDigits} | BCD: ${bcdString}`,
            message: `Valid binary (${isBCDNibbles ? "BCD nibbles" : "Base 2"}).`
        };
    }

    return {
        valid: false,
        message: `Unsupported base ${base}.`
    };
}


// ═══════════════════════════════════════════════════════
// BCD Conversion Utilities
// ═══════════════════════════════════════════════════════

/**
 * Converts a single decimal digit (0-9) to its 4-bit BCD representation.
 */
export function digitToBCD(digit) {
    return digit.toString(2).padStart(4, "0");
}

/**
 * Converts a decimal number string to its BCD representation.
 * Each digit becomes a 4-bit group.
 * Returns an array of { digit, bcd } objects and the full BCD string.
 */
export function decimalToBCD(decimalStr) {
    const groups = [];
    for (const ch of decimalStr) {
        const d = Number(ch);
        groups.push({
            digit: d,
            bcd: digitToBCD(d)
        });
    }
    return {
        groups,
        bcdString: groups.map(g => g.bcd).join(" ")
    };
}

/**
 * Converts a BCD string (groups of 4 bits) back to decimal.
 * Returns null if any nibble > 9.
 */
export function bcdToDecimal(bcdGroups) {
    let result = "";
    for (const group of bcdGroups) {
        const val = parseInt(group, 2);
        if (val > 9) return null; // Invalid BCD
        result += val.toString();
    }
    // Remove leading zeros
    return result.replace(/^0+/, "") || "0";
}

/**
 * Splits a binary string into 4-bit nibbles from right to left.
 */
export function splitIntoNibbles(binaryStr) {
    // Pad to multiple of 4
    const rem = binaryStr.length % 4;
    const padded = rem === 0 ? binaryStr : "0".repeat(4 - rem) + binaryStr;
    const nibbles = [];
    for (let i = 0; i < padded.length; i += 4) {
        nibbles.push(padded.slice(i, i + 4));
    }
    return nibbles;
}

/**
 * Formats a BCD string with spaces between nibbles.
 */
export function formatBCD(bcdStr) {
    const clean = bcdStr.replace(/\s/g, "");
    return splitIntoNibbles(clean).join(" ");
}

// ═══════════════════════════════════════════════════════
// BCD Addition (single pair of digits)
// ═══════════════════════════════════════════════════════

/**
 * Adds two BCD-encoded decimal numbers digit by digit.
 * Applies +6 correction when a nibble sum exceeds 9.
 *
 * @param {string} aStr - First decimal number string
 * @param {string} bStr - Second decimal number string
 * @returns {object} - { result, bcdResult, steps, decimalResult }
 */
export function addBCD(aStr, bStr) {
    // Pad to equal length
    const maxLen = Math.max(aStr.length, bStr.length);
    const aPadded = aStr.padStart(maxLen, "0");
    const bPadded = bStr.padStart(maxLen, "0");

    const steps = [];
    const resultDigits = [];
    let carry = 0;

    // Process from right to left
    for (let i = maxLen - 1; i >= 0; i--) {
        const dA = Number(aPadded[i]);
        const dB = Number(bPadded[i]);
        const rawSum = dA + dB + carry;

        const step = {
            position: maxLen - 1 - i,
            digitA: dA,
            digitB: dB,
            carryIn: carry,
            rawSum: rawSum,
            bcdA: digitToBCD(dA),
            bcdB: digitToBCD(dB)
        };

        if (rawSum > 9) {
            // Correction needed: add 6 (0110)
            const corrected = rawSum - 10;
            step.needsCorrection = true;
            step.correctedDigit = corrected;
            step.correctedBCD = digitToBCD(corrected);
            carry = 1;
            resultDigits.unshift(corrected);
        } else {
            step.needsCorrection = false;
            step.correctedDigit = rawSum;
            step.correctedBCD = digitToBCD(rawSum);
            carry = 0;
            resultDigits.unshift(rawSum);
        }

        step.carryOut = carry;
        steps.push(step);
    }

    if (carry > 0) {
        resultDigits.unshift(carry);
    }

    const decimalResult = resultDigits.join("");
    const bcdResult = decimalToBCD(decimalResult);

    return {
        decimalResult,
        bcdResult: bcdResult.bcdString,
        carry,
        steps: steps.reverse() // Left to right for display
    };
}

/**
 * Computes the 9's complement of a decimal digit string.
 * Subtracts each decimal digit from 9.
 *
 * @param {string} decimalStr - String of decimal digits
 * @returns {string} - 9's complement string
 */
export function ninesComplement(decimalStr) {
    const digits = [];
    for (const ch of decimalStr) {
        digits.push(9 - Number(ch));
    }
    return digits.join("");
}

/**
 * Computes the 10's complement of a decimal digit string.
 * Adds 1 to the 9's complement using BCD addition rules.
 *
 * @param {string} decimalStr - String of decimal digits
 * @returns {string} - 10's complement string of equal length
 */
export function tensComplement(decimalStr) {
    const len = decimalStr.length;
    const nines = ninesComplement(decimalStr);
    const one = "1".padStart(len, "0");
    const res = addBCD(nines, one);
    const padded = res.decimalResult.padStart(len, "0");
    return padded.length > len ? padded.slice(padded.length - len) : padded;
}

/**
 * Subtracts two decimal digit strings using 9's complement method.
 * Returns step-by-step solution.
 */
export function subtractBCDUsing9sComplement(aStr, bStr) {
    // Pad to equal length
    const maxLen = Math.max(aStr.length, bStr.length);
    const aPadded = aStr.padStart(maxLen, "0");
    const bPadded = bStr.padStart(maxLen, "0");

    // Step 1: Find 9's complement of B
    const ninesCompStr = ninesComplement(bPadded);
    const ninesComp = ninesCompStr.split("").map(Number);

    // Step 2: Add A + 9's complement of B
    const addResult = addBCD(aPadded, ninesCompStr);

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("   BCD SUBTRACTION USING 9's COMPLEMENT                 ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Minuend (A):    ${aPadded} (Decimal) = ${decimalToBCD(aPadded).bcdString} (BCD)`);
    lines.push(`Subtrahend (B): ${bPadded} (Decimal) = ${decimalToBCD(bPadded).bcdString} (BCD)`);
    lines.push(`Number of BCD digits: ${maxLen}`);
    lines.push("");

    // Step 1: 9's complement
    lines.push("── STEP 1: Find the 9's Complement of B ──");
    lines.push("  Method: Subtract each digit of B from 9.");
    lines.push("");
    for (let i = 0; i < maxLen; i++) {
        lines.push(`  Digit ${i + 1}: 9 − ${bPadded[i]} = ${ninesComp[i]}`);
    }
    lines.push("");
    lines.push(`  9's complement of B = ${ninesCompStr}`);
    lines.push(`  In BCD: ${decimalToBCD(ninesCompStr).bcdString}`);
    lines.push("");

    // Step 2: Add
    lines.push("── STEP 2: Add A + 9's Complement of B (BCD Addition) ──");
    lines.push(`    ${aPadded}`);
    lines.push(`  + ${ninesCompStr}`);
    lines.push(`  ${"─".repeat(maxLen + 4)}`);

    let finalResult;
    let isNegative = false;

    if (addResult.carry > 0) {
        // End-around carry
        const sumWithoutCarry = addResult.decimalResult.length > maxLen
            ? addResult.decimalResult.slice(1)
            : addResult.decimalResult;

        lines.push(`  1 ${sumWithoutCarry.padStart(maxLen, "0")}   ← End-around carry of 1`);
        lines.push("");
        lines.push("── STEP 3: End-around carry detected → Result is POSITIVE (+) ──");
        lines.push("  Add the end-around carry (+1) back to the result:");
        lines.push("");

        // Add 1 back
        const endAroundResult = addBCD(sumWithoutCarry.padStart(maxLen, "0"), "1".padStart(maxLen, "0"));
        finalResult = endAroundResult.decimalResult;

        lines.push(`    ${sumWithoutCarry.padStart(maxLen, "0")}`);
        lines.push(`  + ${"1".padStart(maxLen, "0")}`);
        lines.push(`  ${"─".repeat(maxLen + 4)}`);
        lines.push(`    ${finalResult.padStart(maxLen, "0")}`);
        lines.push("");

        // Show BCD correction details for addition steps
        lines.push("  BCD Addition Details (with +6 correction if nibble > 9):");
        for (const step of addResult.steps) {
            if (step.needsCorrection) {
                lines.push(`    Position ${step.position}: ${step.digitA} + ${step.digitB} + ${step.carryIn} = ${step.rawSum} > 9 → ${step.rawSum} − 10 = ${step.correctedDigit}, carry 1 (Correction: +0110)`);
            } else {
                lines.push(`    Position ${step.position}: ${step.digitA} + ${step.digitB} + ${step.carryIn} = ${step.rawSum} ≤ 9 → No correction needed`);
            }
        }
        lines.push("");

        lines.push(`Final Answer: A − B = ${finalResult} (Decimal)`);
        lines.push(`  In BCD: ${decimalToBCD(finalResult).bcdString}`);
    } else {
        // No carry → negative
        const sumStr = addResult.decimalResult.padStart(maxLen, "0");
        lines.push(`    ${sumStr}   ← No carry detected`);
        lines.push("");
        lines.push("── STEP 3: No end-around carry → Result is NEGATIVE (−) ──");
        lines.push("  Take the 9's complement of the sum to find the magnitude:");
        lines.push("");

        const negComp = [];
        for (const ch of sumStr) {
            negComp.push(9 - Number(ch));
        }
        finalResult = negComp.join("").replace(/^0+/, "") || "0";
        isNegative = finalResult !== "0";

        for (let i = 0; i < maxLen; i++) {
            lines.push(`  Digit ${i + 1}: 9 − ${sumStr[i]} = ${negComp[i]}`);
        }
        lines.push("");
        lines.push(`  Magnitude = ${finalResult}`);
        lines.push("");
        lines.push(`Final Answer: A − B = ${isNegative ? "−" + finalResult : finalResult} (Decimal)`);
        lines.push(`  In BCD: ${decimalToBCD(finalResult).bcdString}`);
    }

    return {
        isNegative,
        decimalResult: isNegative ? `-${finalResult}` : finalResult,
        bcdResult: decimalToBCD(finalResult).bcdString,
        solution: lines.join("\n")
    };
}

/**
 * Subtracts two decimal digit strings using 10's complement method.
 * Returns step-by-step solution.
 */
export function subtractBCDUsing10sComplement(aStr, bStr) {
    // Pad to equal length
    const maxLen = Math.max(aStr.length, bStr.length);
    const aPadded = aStr.padStart(maxLen, "0");
    const bPadded = bStr.padStart(maxLen, "0");

    // Step 1: Find 10's complement of B = 9's complement + 1
    const ninesCompStr = ninesComplement(bPadded);
    const ninesComp = ninesCompStr.split("").map(Number);
    const tensCompDisplay = tensComplement(bPadded);

    // Step 2: Add A + 10's complement of B
    const addResult = addBCD(aPadded, tensCompDisplay);

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("   BCD SUBTRACTION USING 10's COMPLEMENT                ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Minuend (A):    ${aPadded} (Decimal) = ${decimalToBCD(aPadded).bcdString} (BCD)`);
    lines.push(`Subtrahend (B): ${bPadded} (Decimal) = ${decimalToBCD(bPadded).bcdString} (BCD)`);
    lines.push(`Number of BCD digits: ${maxLen}`);
    lines.push("");

    // Step 1: 10's complement
    lines.push("── STEP 1: Find the 10's Complement of B ──");
    lines.push("  Method: 9's complement + 1.");
    lines.push("");
    lines.push("  First, 9's complement (subtract each digit from 9):");
    for (let i = 0; i < maxLen; i++) {
        lines.push(`    Digit ${i + 1}: 9 − ${bPadded[i]} = ${ninesComp[i]}`);
    }
    lines.push(`  9's complement of B = ${ninesCompStr}`);
    lines.push("");
    lines.push("  Then add 1:");
    lines.push(`    ${ninesCompStr}`);
    lines.push(`  + ${"1".padStart(maxLen, "0")}`);
    lines.push(`  ${"─".repeat(maxLen + 4)}`);
    lines.push(`    ${tensCompDisplay}`);
    lines.push("");
    lines.push(`  10's complement of B = ${tensCompDisplay}`);
    lines.push(`  In BCD: ${decimalToBCD(tensCompDisplay).bcdString}`);
    lines.push("");

    // Step 2: Add
    lines.push("── STEP 2: Add A + 10's Complement of B (BCD Addition) ──");
    lines.push(`    ${aPadded}`);
    lines.push(`  + ${tensCompDisplay}`);
    lines.push(`  ${"─".repeat(maxLen + 4)}`);

    let finalResult;
    let isNegative = false;

    if (addResult.carry > 0) {
        // Carry detected → discard → positive
        const sumWithoutCarry = addResult.decimalResult.length > maxLen
            ? addResult.decimalResult.slice(1)
            : addResult.decimalResult;

        lines.push(`  1 ${sumWithoutCarry.padStart(maxLen, "0")}   ← Carry of 1 detected`);
        lines.push("");
        lines.push("── STEP 3: Carry detected → DISCARD the carry → Result is POSITIVE (+) ──");
        lines.push(`  Discarding the carry gives:`);

        finalResult = sumWithoutCarry.replace(/^0+/, "") || "0";

        lines.push(`  Result = ${finalResult}`);
        lines.push("");

        // Show BCD correction details
        lines.push("  BCD Addition Details (with +6 correction if nibble > 9):");
        for (const step of addResult.steps) {
            if (step.needsCorrection) {
                lines.push(`    Position ${step.position}: ${step.digitA} + ${step.digitB} + ${step.carryIn} = ${step.rawSum} > 9 → ${step.rawSum} − 10 = ${step.correctedDigit}, carry 1 (Correction: +0110)`);
            } else {
                lines.push(`    Position ${step.position}: ${step.digitA} + ${step.digitB} + ${step.carryIn} = ${step.rawSum} ≤ 9 → No correction needed`);
            }
        }
        lines.push("");

        lines.push(`Final Answer: A − B = ${finalResult} (Decimal)`);
        lines.push(`  In BCD: ${decimalToBCD(finalResult).bcdString}`);
    } else {
        // No carry → negative
        const sumStr = addResult.decimalResult.padStart(maxLen, "0");
        lines.push(`    ${sumStr}   ← No carry detected`);
        lines.push("");
        lines.push("── STEP 3: No carry → Result is NEGATIVE (−) ──");
        lines.push("  Take the 10's complement of the sum to find the magnitude:");
        lines.push("");

        // 10's complement of sum
        const negNines = [];
        for (const ch of sumStr) {
            negNines.push(9 - Number(ch));
        }
        const negNinesStr = negNines.join("");
        const negTensResult = addBCD(negNinesStr, "1".padStart(maxLen, "0"));
        const negTensStr = negTensResult.decimalResult.padStart(maxLen, "0");
        const negTensDisplay = negTensStr.length > maxLen ? negTensStr.slice(negTensStr.length - maxLen) : negTensStr;

        finalResult = negTensDisplay.replace(/^0+/, "") || "0";
        isNegative = finalResult !== "0";

        lines.push("  9's complement of sum:");
        for (let i = 0; i < maxLen; i++) {
            lines.push(`    Digit ${i + 1}: 9 − ${sumStr[i]} = ${negNines[i]}`);
        }
        lines.push(`  = ${negNinesStr}`);
        lines.push("");
        lines.push("  Add 1:");
        lines.push(`    ${negNinesStr}`);
        lines.push(`  + ${"1".padStart(maxLen, "0")}`);
        lines.push(`  ${"─".repeat(maxLen + 4)}`);
        lines.push(`    ${negTensDisplay}`);
        lines.push("");
        lines.push(`  Magnitude = ${finalResult}`);
        lines.push("");
        lines.push(`Final Answer: A − B = ${isNegative ? "−" + finalResult : finalResult} (Decimal)`);
        lines.push(`  In BCD: ${decimalToBCD(finalResult).bcdString}`);
    }

    return {
        isNegative,
        decimalResult: isNegative ? `-${finalResult}` : finalResult,
        bcdResult: decimalToBCD(finalResult).bcdString,
        solution: lines.join("\n")
    };
}

/**
 * Performs BCD addition with step-by-step solution.
 */
export function addBCDWithSolution(aStr, bStr) {
    const maxLen = Math.max(aStr.length, bStr.length);
    const aPadded = aStr.padStart(maxLen, "0");
    const bPadded = bStr.padStart(maxLen, "0");

    const result = addBCD(aPadded, bPadded);

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("              BCD ADDITION                               ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Addend (A):  ${aPadded} (Decimal) = ${decimalToBCD(aPadded).bcdString} (BCD)`);
    lines.push(`Addend (B):  ${bPadded} (Decimal) = ${decimalToBCD(bPadded).bcdString} (BCD)`);
    lines.push("");

    lines.push("── STEP 1: Convert each decimal digit to 4-bit BCD ──");
    lines.push(`  A: ${aPadded} → ${decimalToBCD(aPadded).bcdString}`);
    lines.push(`  B: ${bPadded} → ${decimalToBCD(bPadded).bcdString}`);
    lines.push("");

    lines.push("── STEP 2: Add BCD digits column by column (right to left) ──");
    lines.push("");

    for (const step of result.steps) {
        lines.push(`  Column ${step.position} (from right):`);
        lines.push(`    ${step.digitA} (${step.bcdA}) + ${step.digitB} (${step.bcdB}) + carry ${step.carryIn}`);
        lines.push(`    Raw sum = ${step.rawSum}`);

        if (step.needsCorrection) {
            lines.push(`    ${step.rawSum} > 9 → BCD CORRECTION needed!`);
            lines.push(`    Add 6 (0110): ${step.rawSum} + 6 = ${step.rawSum + 6} → digit = ${step.correctedDigit} (${step.correctedBCD}), carry = 1`);
        } else {
            lines.push(`    ${step.rawSum} ≤ 9 → No correction needed`);
            lines.push(`    Result digit = ${step.correctedDigit} (${step.correctedBCD}), carry = ${step.carryOut}`);
        }
        lines.push("");
    }

    if (result.carry > 0) {
        lines.push(`  Final carry: 1 → prepend to result`);
        lines.push("");
    }

    lines.push(`── RESULT ──`);
    lines.push(`  Decimal: ${result.decimalResult}`);
    lines.push(`  BCD:     ${decimalToBCD(result.decimalResult).bcdString}`);

    return {
        decimalResult: result.decimalResult,
        bcdResult: decimalToBCD(result.decimalResult).bcdString,
        steps: result.steps,
        solution: lines.join("\n")
    };
}

/**
 * Processes a chain of BCD operations (addition/subtraction) on multiple operands.
 * operators array: ["+", "-", "+", ...] with length = operands.length - 1
 *
 * For addition: direct BCD addition
 * For subtraction: uses both 9's and 10's complement methods
 *
 * Returns comprehensive step-by-step for each operation.
 */
export function processBCDChain(operands, operators) {
    if (operands.length === 0) {
        return { error: "No operands provided." };
    }

    if (operands.length === 1) {
        const bcd = decimalToBCD(operands[0]);
        return {
            finalDecimal: operands[0],
            finalBCD: bcd.bcdString,
            operationResults: [],
            fullSolution: `Single operand: ${operands[0]} = ${bcd.bcdString} (BCD)`
        };
    }

    const operationResults = [];
    let runningResult = operands[0];
    const allSolutionLines = [];

    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push("           BCD ARITHMETIC — FULL COMPUTATION             ");
    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push("");

    // Build expression string
    let expression = operands[0];
    for (let i = 0; i < operators.length; i++) {
        expression += ` ${operators[i] === "+" ? "+" : "−"} ${operands[i + 1]}`;
    }
    allSolutionLines.push(`Expression: ${expression}`);
    allSolutionLines.push("");

    for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        const nextOperand = operands[i + 1];

        allSolutionLines.push(`─────────────────────────────────────────`);
        allSolutionLines.push(`  Operation ${i + 1}: ${runningResult} ${op === "+" ? "+" : "−"} ${nextOperand}`);
        allSolutionLines.push(`─────────────────────────────────────────`);
        allSolutionLines.push("");

        if (op === "+") {
            const addSol = addBCDWithSolution(runningResult, nextOperand);
            operationResults.push({
                type: "addition",
                operandA: runningResult,
                operandB: nextOperand,
                result: addSol.decimalResult,
                bcdResult: addSol.bcdResult,
                solution: addSol.solution
            });
            runningResult = addSol.decimalResult;
            allSolutionLines.push(addSol.solution);
        } else {
            // Subtraction: show both complement methods
            // Determine if runningResult or nextOperand is negative (from previous negative results)
            let aStr = runningResult;
            let bStr = nextOperand;
            let effectiveSubtraction = true;

            // Handle negative running result
            let aIsNeg = false;
            let bIsNeg = false;

            if (aStr.startsWith("-")) {
                aIsNeg = true;
                aStr = aStr.slice(1);
            }
            if (bStr.startsWith("-")) {
                bIsNeg = true;
                bStr = bStr.slice(1);
            }

            // A - B:
            // If A positive, B positive: subtract normally
            // If A negative, B positive: -(|A| + |B|) → addition, negate
            // If A positive, B negative: |A| + |B| → addition
            // If A negative, B negative: -(|A| - |B|) or |B| - |A| depending

            if (!aIsNeg && !bIsNeg) {
                // Normal subtraction A - B
                const ninesSol = subtractBCDUsing9sComplement(aStr, bStr);
                const tensSol = subtractBCDUsing10sComplement(aStr, bStr);

                operationResults.push({
                    type: "subtraction",
                    operandA: runningResult,
                    operandB: nextOperand,
                    ninesResult: ninesSol,
                    tensResult: tensSol,
                    result: ninesSol.decimalResult,
                    bcdResult: ninesSol.bcdResult,
                    ninesSolution: ninesSol.solution,
                    tensSolution: tensSol.solution
                });

                runningResult = ninesSol.decimalResult;

                allSolutionLines.push("▸ Method 1: Using 9's Complement");
                allSolutionLines.push("");
                allSolutionLines.push(ninesSol.solution);
                allSolutionLines.push("");
                allSolutionLines.push("▸ Method 2: Using 10's Complement");
                allSolutionLines.push("");
                allSolutionLines.push(tensSol.solution);
            } else if (aIsNeg && !bIsNeg) {
                // -A - B = -(A + B)
                const addSol = addBCDWithSolution(aStr, bStr);
                const negResult = `-${addSol.decimalResult}`;

                operationResults.push({
                    type: "subtraction-via-addition",
                    operandA: runningResult,
                    operandB: nextOperand,
                    note: `−${aStr} − ${bStr} = −(${aStr} + ${bStr})`,
                    result: negResult,
                    bcdResult: decimalToBCD(addSol.decimalResult).bcdString,
                    solution: addSol.solution + `\n\nSince both signs are negative: result = −${addSol.decimalResult}`
                });

                runningResult = negResult;
                allSolutionLines.push(`Note: −${aStr} − ${bStr} = −(${aStr} + ${bStr})`);
                allSolutionLines.push(addSol.solution);
                allSolutionLines.push(`Result = −${addSol.decimalResult}`);
            } else if (!aIsNeg && bIsNeg) {
                // A - (-B) = A + B
                const addSol = addBCDWithSolution(aStr, bStr);

                operationResults.push({
                    type: "subtraction-becomes-addition",
                    operandA: runningResult,
                    operandB: nextOperand,
                    note: `${aStr} − (−${bStr}) = ${aStr} + ${bStr}`,
                    result: addSol.decimalResult,
                    bcdResult: addSol.bcdResult,
                    solution: addSol.solution
                });

                runningResult = addSol.decimalResult;
                allSolutionLines.push(`Note: ${aStr} − (−${bStr}) = ${aStr} + ${bStr}`);
                allSolutionLines.push(addSol.solution);
            } else {
                // -A - (-B) = B - A
                const ninesSol = subtractBCDUsing9sComplement(bStr, aStr);
                const tensSol = subtractBCDUsing10sComplement(bStr, aStr);

                operationResults.push({
                    type: "subtraction",
                    operandA: runningResult,
                    operandB: nextOperand,
                    note: `−${aStr} − (−${bStr}) = ${bStr} − ${aStr}`,
                    ninesResult: ninesSol,
                    tensResult: tensSol,
                    result: ninesSol.decimalResult,
                    bcdResult: ninesSol.bcdResult,
                    ninesSolution: ninesSol.solution,
                    tensSolution: tensSol.solution
                });

                runningResult = ninesSol.decimalResult;
                allSolutionLines.push(`Note: −${aStr} − (−${bStr}) = ${bStr} − ${aStr}`);
                allSolutionLines.push("");
                allSolutionLines.push("▸ Method 1: Using 9's Complement");
                allSolutionLines.push("");
                allSolutionLines.push(ninesSol.solution);
                allSolutionLines.push("");
                allSolutionLines.push("▸ Method 2: Using 10's Complement");
                allSolutionLines.push("");
                allSolutionLines.push(tensSol.solution);
            }
        }

        allSolutionLines.push("");
        allSolutionLines.push(`Running result after operation ${i + 1}: ${runningResult}`);
        allSolutionLines.push(`In BCD: ${decimalToBCD(runningResult.replace(/^-/, "")).bcdString}`);
        allSolutionLines.push("");
    }

    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push(`FINAL ANSWER: ${runningResult} (Decimal)`);
    allSolutionLines.push(`In BCD: ${decimalToBCD(runningResult.replace(/^-/, "")).bcdString}`);
    allSolutionLines.push("══════════════════════════════════════════════════════════");

    return {
        finalDecimal: runningResult,
        finalBCD: decimalToBCD(runningResult.replace(/^-/, "")).bcdString,
        isNegative: runningResult.startsWith("-"),
        operationResults,
        fullSolution: allSolutionLines.join("\n")
    };
}

/**
 * Normalizes a decimal string to remove redundant leading zeros
 * while correctly preserving negative signs and zero ("0").
 */
export function cleanDecimal(str) {
    if (str.startsWith("-")) {
        const stripped = str.slice(1).replace(/^0+/, "") || "0";
        return stripped === "0" ? "0" : `-${stripped}`;
    }
    return str.replace(/^0+/, "") || "0";
}

/**
 * Executes a single BCD operation (addition or subtraction) on two decimal values,
 * applying appropriate sign rules and computing step-by-step solutions
 * (BCD addition with +6 correction, and subtraction using 9's & 10's complement).
 */
export function evaluateBCDOperation(aStr, op, bStr) {
    const aIsNeg = aStr.startsWith("-");
    const bIsNeg = bStr.startsWith("-");
    const aMag = aIsNeg ? aStr.slice(1) : aStr;
    const bMag = bIsNeg ? bStr.slice(1) : bStr;

    if (op === "+") {
        if (!aIsNeg && !bIsNeg) {
            // A + B
            const res = addBCDWithSolution(aMag, bMag);
            return {
                decimalResult: cleanDecimal(res.decimalResult),
                bcdResult: res.bcdResult,
                type: "addition",
                solution: res.solution
            };
        } else if (!aIsNeg && bIsNeg) {
            // A + (-B) = A - B
            const nines = subtractBCDUsing9sComplement(aMag, bMag);
            const tens = subtractBCDUsing10sComplement(aMag, bMag);
            return {
                decimalResult: cleanDecimal(nines.decimalResult),
                bcdResult: nines.bcdResult,
                type: "subtraction",
                ninesResult: nines,
                tensResult: tens,
                solution: nines.solution + "\n\n" + tens.solution
            };
        } else if (aIsNeg && !bIsNeg) {
            // -A + B = B - A
            const nines = subtractBCDUsing9sComplement(bMag, aMag);
            const tens = subtractBCDUsing10sComplement(bMag, aMag);
            return {
                decimalResult: cleanDecimal(nines.decimalResult),
                bcdResult: nines.bcdResult,
                type: "subtraction",
                ninesResult: nines,
                tensResult: tens,
                solution: nines.solution + "\n\n" + tens.solution
            };
        } else {
            // -A + (-B) = -(A + B)
            const res = addBCDWithSolution(aMag, bMag);
            const negDec = cleanDecimal(`-${res.decimalResult}`);
            return {
                decimalResult: negDec,
                bcdResult: res.bcdResult,
                type: "addition-negated",
                solution: `Note: −${aMag} + (−${bMag}) = −(${aMag} + ${bMag})\n\n` + res.solution
            };
        }
    } else {
        // op === '-'
        if (!aIsNeg && !bIsNeg) {
            // A - B
            const nines = subtractBCDUsing9sComplement(aMag, bMag);
            const tens = subtractBCDUsing10sComplement(aMag, bMag);
            return {
                decimalResult: cleanDecimal(nines.decimalResult),
                bcdResult: nines.bcdResult,
                type: "subtraction",
                ninesResult: nines,
                tensResult: tens,
                solution: nines.solution + "\n\n" + tens.solution
            };
        } else if (!aIsNeg && bIsNeg) {
            // A - (-B) = A + B
            const res = addBCDWithSolution(aMag, bMag);
            return {
                decimalResult: cleanDecimal(res.decimalResult),
                bcdResult: res.bcdResult,
                type: "addition",
                solution: `Note: ${aMag} − (−${bMag}) = ${aMag} + ${bMag}\n\n` + res.solution
            };
        } else if (aIsNeg && !bIsNeg) {
            // -A - B = -(A + B)
            const res = addBCDWithSolution(aMag, bMag);
            const negDec = cleanDecimal(`-${res.decimalResult}`);
            return {
                decimalResult: negDec,
                bcdResult: res.bcdResult,
                type: "addition-negated",
                solution: `Note: −${aMag} − ${bMag} = −(${aMag} + ${bMag})\n\n` + res.solution
            };
        } else {
            // -A - (-B) = B - A
            const nines = subtractBCDUsing9sComplement(bMag, aMag);
            const tens = subtractBCDUsing10sComplement(bMag, aMag);
            return {
                decimalResult: cleanDecimal(nines.decimalResult),
                bcdResult: nines.bcdResult,
                type: "subtraction",
                ninesResult: nines,
                tensResult: tens,
                solution: `Note: −${aMag} − (−${bMag}) = ${bMag} − ${aMag}\n\n` + nines.solution + "\n\n" + tens.solution
            };
        }
    }
}

/**
 * Tokenizes a custom BCD expression string.
 * Supports: Variables (A-Z), +, -, parentheses (), and raw numbers.
 */
export function tokenizeBCDExpression(input) {
    const tokens = [];
    let i = 0;
    const str = input.trim();

    while (i < str.length) {
        const ch = str[i];

        if (/\s/.test(ch)) {
            i++;
            continue;
        }

        if (ch === "+" || ch === "-" || ch === "−") {
            tokens.push({ type: "OP", value: ch === "−" ? "-" : ch, pos: i });
            i++;
        } else if (ch === "(") {
            tokens.push({ type: "LPAREN", value: "(", pos: i });
            i++;
        } else if (ch === ")") {
            tokens.push({ type: "RPAREN", value: ")", pos: i });
            i++;
        } else if (/[a-zA-Z]/.test(ch)) {
            tokens.push({ type: "VAR", value: ch.toUpperCase(), pos: i });
            i++;
        } else if (/[0-9]/.test(ch)) {
            let num = "";
            const p = i;
            while (i < str.length && /[0-9]/.test(str[i])) {
                num += str[i++];
            }
            tokens.push({ type: "NUMBER", value: num, pos: p });
        } else {
            return {
                error: `Invalid character '${ch}' at position ${i + 1}. Only variables (A-Z), operators (+, −), and parentheses are allowed in BCD expressions.`
            };
        }
    }

    if (tokens.length === 0) {
        return { error: "Expression is empty. Please enter an expression like (A + B) − C or A + B + C." };
    }

    return { tokens };
}

/**
 * Evaluates an arbitrary user-defined BCD arithmetic expression using a
 * recursive descent parser. Performs step-by-step BCD addition and subtraction
 * (using both 9's and 10's complement), and returns comprehensive step records.
 *
 * @param {string} exprStr - Custom expression string (e.g. "(A + B) - C + D")
 * @param {object} varValues - Map of variable letters to decimal digit strings { A: "25", B: "18", ... }
 */
export function evaluateBCDExpression(exprStr, varValues) {
    const tRes = tokenizeBCDExpression(exprStr);
    if (tRes.error) return tRes;

    const tokens = tRes.tokens;
    let index = 0;
    const opSteps = [];
    const allSolutionLines = [];

    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push("       BCD ARITHMETIC EXPRESSION EVALUATION             ");
    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push(`Expression: ${exprStr}`);
    allSolutionLines.push("");

    // Show variable values
    const usedVars = Array.from(new Set(tokens.filter(t => t.type === "VAR").map(t => t.value)));
    for (const v of usedVars) {
        if (v in varValues) {
            allSolutionLines.push(`  Variable ${v} = ${varValues[v]} (Decimal) = ${decimalToBCD(varValues[v].replace(/^-/, "")).bcdString} (BCD)`);
        }
    }
    allSolutionLines.push("");

    function parseExpr() {
        let leftRes = parseTerm();
        if (leftRes.error) return leftRes;

        while (index < tokens.length && tokens[index].type === "OP") {
            const opTok = tokens[index++];
            const rightRes = parseTerm();
            if (rightRes.error) return rightRes;

            const leftVal = leftRes.value;
            const rightVal = rightRes.value;
            const opRes = evaluateBCDOperation(leftVal, opTok.value, rightVal);

            const stepIndex = opSteps.length + 1;
            allSolutionLines.push(`──────────────────────────────────────────────────────────`);
            allSolutionLines.push(`  Step ${stepIndex}: ${leftVal} ${opTok.value === "+" ? "+" : "−"} ${rightVal} = ${opRes.decimalResult}`);
            allSolutionLines.push(`──────────────────────────────────────────────────────────`);
            allSolutionLines.push(opRes.solution);
            allSolutionLines.push("");

            opSteps.push({
                stepNumber: stepIndex,
                operandA: leftVal,
                op: opTok.value,
                operandB: rightVal,
                result: opRes.decimalResult,
                bcdResult: opRes.bcdResult,
                type: opRes.type,
                ninesResult: opRes.ninesResult,
                tensResult: opRes.tensResult,
                solution: opRes.solution
            });

            leftRes = { value: opRes.decimalResult };
        }
        return leftRes;
    }

    function parseTerm() {
        if (index < tokens.length && tokens[index].type === "OP" && tokens[index].value === "-") {
            index++;
            const fact = parseFactor();
            if (fact.error) return fact;
            const negated = fact.value.startsWith("-") ? fact.value.slice(1) : `-${fact.value}`;
            return { value: negated };
        }
        if (index < tokens.length && tokens[index].type === "OP" && tokens[index].value === "+") {
            index++;
        }
        return parseFactor();
    }

    function parseFactor() {
        const tok = tokens[index++];
        if (!tok) return { error: "Unexpected end of expression." };

        if (tok.type === "LPAREN") {
            const inner = parseExpr();
            if (inner.error) return inner;
            if (index >= tokens.length || tokens[index].type !== "RPAREN") {
                return { error: 'Missing closing parenthesis ")".' };
            }
            index++; // consume RPAREN
            return inner;
        }

        if (tok.type === "VAR") {
            if (!(tok.value in varValues)) {
                return {
                    error: `Undefined variable "${tok.value}" in expression. Available inputs: ${Object.keys(varValues).join(", ")}`
                };
            }
            return { value: varValues[tok.value] };
        }

        if (tok.type === "NUMBER") {
            return { value: tok.value };
        }

        return { error: `Unexpected token "${tok.value}" at position ${tok.pos + 1}.` };
    }

    const finalRes = parseExpr();
    if (finalRes.error) return finalRes;

    if (index < tokens.length) {
        return { error: `Unexpected extra token "${tokens[index].value}" at position ${tokens[index].pos + 1}.` };
    }

    const finalDecimal = finalRes.value;
    const finalBCD = decimalToBCD(finalDecimal.replace(/^-/, "")).bcdString;

    allSolutionLines.push("══════════════════════════════════════════════════════════");
    allSolutionLines.push(`FINAL ANSWER: ${finalDecimal} (Decimal)`);
    allSolutionLines.push(`In BCD: ${finalDecimal.startsWith("-") ? "−" : ""}${finalBCD}`);
    allSolutionLines.push("══════════════════════════════════════════════════════════");

    return {
        finalDecimal,
        finalBCD,
        isNegative: finalDecimal.startsWith("-"),
        operationResults: opSteps,
        fullSolution: allSolutionLines.join("\n")
    };
}

