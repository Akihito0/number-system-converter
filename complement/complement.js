import {
    getDigitValue
} from "../conversions/validation.js";

/**
 * Validates signed or unsigned input for a given base.
 * Accepts optional leading '+' or '-'.
 */
export function validateSignedInput(value, base) {
    const trimmed = value.trim().toUpperCase();

    if (trimmed === "") {
        return {
            valid: false,
            message: "Input cannot be empty."
        };
    }

    let sign = "+";
    let digits = trimmed;

    if (trimmed.startsWith("-") || trimmed.startsWith("+")) {
        sign = trimmed[0];
        digits = trimmed.slice(1);
    }

    if (digits === "") {
        return {
            valid: false,
            message: "Please enter digits after the sign."
        };
    }

    for (const character of digits) {
        const digitValue = getDigitValue(character);
        if (digitValue < 0 || digitValue >= base) {
            return {
                valid: false,
                message: `Invalid character '${character}' for Base ${base}.`
            };
        }
    }

    return {
        valid: true,
        sign,
        isNegative: sign === "-",
        digits,
        normalizedValue: `${sign === "-" ? "-" : ""}${digits}`,
        message: "Valid input."
    };
}

/**
 * Converts a digit string in any supported base (2, 8, 10, 16) to a BigInt.
 */
export function baseToBigInt(digits, base) {
    let result = 0n;
    const b = BigInt(base);
    for (const ch of digits.toUpperCase()) {
        const d = BigInt(getDigitValue(ch));
        result = result * b + d;
    }
    return result;
}

/**
 * Returns complement names for display.
 */
export function getComplementNames() {
    return {
        rMinus1: "1's",
        r: "2's",
        rMinus1Full: "(r-1)'s complement (1's)",
        rFull: "r's complement (2's)"
    };
}

/**
 * Formats a binary string with spaces separating 4-bit nibbles from right to left.
 * Example: "00001010" → "0000 1010"
 */
export function formatBinaryWithSpaces(binaryStr) {
    if (!binaryStr) return "";
    const isNeg = binaryStr.startsWith("-");
    const raw = isNeg ? binaryStr.slice(1) : binaryStr;

    // Pad to multiple of 4 for clean grouping
    const rem = raw.length % 4;
    const padded = rem === 0 ? raw : "0".repeat(4 - rem) + raw;

    const parts = [];
    for (let i = 0; i < padded.length; i += 4) {
        parts.push(padded.slice(i, i + 4));
    }
    return (isNeg ? "−" : "") + parts.join(" ");
}

/**
 * Pads a binary string with leading zeros to reach target length.
 */
export function padBinary(binaryStr, numBits) {
    if (binaryStr.length >= numBits) {
        return binaryStr;
    }
    return "0".repeat(numBits - binaryStr.length) + binaryStr;
}

/**
 * Computes the 1's complement of a binary string by inverting every bit (0 ↔ 1).
 */
export function compute1sComplement(binaryStr) {
    let result = "";
    for (const bit of binaryStr) {
        result += bit === "0" ? "1" : "0";
    }
    return result;
}

/**
 * Computes the 2's complement of a binary string: 1's complement + 1.
 */
export function compute2sComplement(binaryStr) {
    const ones = compute1sComplement(binaryStr);
    const digits = ones.split("").map(Number);
    let carry = 1;

    for (let i = digits.length - 1; i >= 0 && carry > 0; i--) {
        const sum = digits[i] + carry;
        digits[i] = sum % 2;
        carry = Math.floor(sum / 2);
    }

    return digits.join("");
}

/**
 * Adds two binary strings of equal length.
 * Returns { result: string, carry: number }
 */
export function addBinary(aBin, bBin) {
    const len = Math.max(aBin.length, bBin.length);
    const aPadded = padBinary(aBin, len);
    const bPadded = padBinary(bBin, len);
    const digits = [];
    let carry = 0;

    for (let i = len - 1; i >= 0; i--) {
        const sum = Number(aPadded[i]) + Number(bPadded[i]) + carry;
        digits.unshift(sum % 2);
        carry = Math.floor(sum / 2);
    }

    return {
        result: digits.join(""),
        carry
    };
}

/**
 * Computes all complement representations for an input value.
 */
export function computeComplements(valueStr, base, userNumBits = 8) {
    const validation = validateSignedInput(valueStr, base);
    if (!validation.valid) {
        return null;
    }

    const { isNegative, digits, normalizedValue } = validation;
    const decimalBigInt = baseToBigInt(digits, base);
    const rawBinary = decimalBigInt.toString(2);

    // Determine working bit length:
    // User requested bits, but expand if raw binary needs more bits
    let effectiveBits = Math.max(Number(userNumBits) || 8, rawBinary.length);

    // Round up to nearest multiple of 4 for clean nibble alignment
    if (effectiveBits % 4 !== 0) {
        effectiveBits += 4 - (effectiveBits % 4);
    }

    const trueBinary = padBinary(rawBinary, effectiveBits);
    const onesComp = compute1sComplement(trueBinary);
    const twosComp = compute2sComplement(trueBinary);

    // Signed binary representations
    // For positive: identical to unsigned binary (MSB = 0)
    // For negative: 1's comp and 2's comp of magnitude (MSB = 1)
    const signed1sComp = isNegative ? onesComp : trueBinary;
    const signed2sComp = isNegative ? twosComp : trueBinary;

    return {
        isNegative,
        normalizedValue,
        decimalValue: decimalBigInt.toString(10),
        rawBinary,
        effectiveBits,
        trueBinary,
        onesComplement: onesComp,
        twosComplement: twosComp,
        signed1sComplement: signed1sComp,
        signed2sComplement: signed2sComp,
        formattedTrueBinary: formatBinaryWithSpaces(trueBinary),
        formatted1sComplement: formatBinaryWithSpaces(onesComp),
        formatted2sComplement: formatBinaryWithSpaces(twosComp),
        formattedSigned1s: formatBinaryWithSpaces(signed1sComp),
        formattedSigned2s: formatBinaryWithSpaces(signed2sComp)
    };
}

/**
 * Generates an educational step-by-step solution for 1's and 2's complement computation.
 */
export function createComplementSolution(valueStr, base, userNumBits = 8) {
    const comp = computeComplements(valueStr, base, userNumBits);
    if (!comp) {
        return "Please enter a valid input to view the step-by-step solution.";
    }

    const {
        isNegative,
        normalizedValue,
        decimalValue,
        effectiveBits,
        trueBinary,
        onesComplement,
        twosComplement,
        formattedTrueBinary,
        formatted1sComplement,
        formatted2sComplement,
        formattedSigned1s,
        formattedSigned2s
    } = comp;

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("      1's AND 2's COMPLEMENT COMPUTATION (BINARY)        ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Input: ${normalizedValue} (Base ${base})`);
    lines.push(`Decimal Value: ${isNegative ? "-" : ""}${decimalValue}`);
    lines.push(`Working word length: ${effectiveBits} bit(s)`);
    lines.push("");

    // Step 1: Conversion to Binary
    lines.push("── STEP 1: Convert Input to Binary ──");
    if (base === 2) {
        lines.push(`  Value is already in Base 2: ${trueBinary}`);
    } else if (base === 10) {
        lines.push(`  Decimal ${decimalValue} converted to ${effectiveBits}-bit binary:`);
        lines.push(`  True Binary = ${formattedTrueBinary}`);
    } else {
        lines.push(`  Convert ${normalizedValue} (Base ${base}) → Decimal ${decimalValue} → ${effectiveBits}-bit binary:`);
        lines.push(`  True Binary = ${formattedTrueBinary}`);
    }
    lines.push("");

    // Step 2: 1's Complement
    lines.push("── STEP 2: Compute 1's Complement (r-1)'s ──");
    lines.push("  Method: Invert every bit of the binary representation (0 ↔ 1).");
    lines.push("");
    lines.push(`  True Binary:    ${formattedTrueBinary}`);
    lines.push(`  Inverted (1's): ${formatted1sComplement}`);
    lines.push("");
    lines.push(`  (r-1)'s complement (1's) = ${formatted1sComplement}`);
    lines.push("");

    // Step 3: 2's Complement
    lines.push("── STEP 3: Compute 2's Complement (r's) ──");
    lines.push("  Method: Add 1 to the 1's complement.");
    lines.push("");
    lines.push(`    ${formatted1sComplement}   (1's Complement)`);
    lines.push(`  + ${formatBinaryWithSpaces(padBinary("1", effectiveBits))}   (+ 1)`);
    lines.push(`  ${"─".repeat(formatted1sComplement.length + 4)}`);
    lines.push(`    ${formatted2sComplement}   (2's Complement)`);
    lines.push("");
    lines.push(`  r's complement (2's) = ${formatted2sComplement}`);
    lines.push("");

    // Step 4: Signed Representation
    lines.push("── STEP 4: Signed Binary Representation Analysis ──");
    if (!isNegative) {
        lines.push(`  For positive numbers (+${decimalValue}):`);
        lines.push(`  • In signed systems, positive values keep sign bit MSB = 0:`);
        lines.push(`    Signed 1's Complement = ${formattedSigned1s}`);
        lines.push(`    Signed 2's Complement = ${formattedSigned2s}`);
        lines.push(`  • The bitwise complements represent the negation (−${decimalValue}):`);
        lines.push(`    Negative value (−${decimalValue}) in 1's Comp = ${formatted1sComplement}`);
        lines.push(`    Negative value (−${decimalValue}) in 2's Comp = ${formatted2sComplement}`);
    } else {
        lines.push(`  For negative numbers (−${decimalValue}):`);
        lines.push(`  • Magnitude in binary: ${formattedTrueBinary}`);
        lines.push(`  • Signed 1's Complement (−${decimalValue}): ${formattedSigned1s} (MSB = 1)`);
        lines.push(`  • Signed 2's Complement (−${decimalValue}): ${formattedSigned2s} (MSB = 1)`);
    }

    return lines.join("\n");
}

/**
 * Performs binary subtraction A − B using the 1's complement method.
 */
export function subtractUsing1sComplement(minuendStr, subtrahendStr, base, userNumBits = 8) {
    const valA = validateSignedInput(minuendStr, base);
    const valB = validateSignedInput(subtrahendStr, base);

    if (!valA.valid || !valB.valid) {
        return { error: "Invalid inputs." };
    }

    const decA = baseToBigInt(valA.digits, base) * (valA.isNegative ? -1n : 1n);
    const decB = baseToBigInt(valB.digits, base) * (valB.isNegative ? -1n : 1n);

    const binRawA = (decA < 0n ? -decA : decA).toString(2);
    const binRawB = (decB < 0n ? -decB : decB).toString(2);

    let effectiveBits = Math.max(Number(userNumBits) || 8, binRawA.length, binRawB.length);
    if (effectiveBits % 4 !== 0) {
        effectiveBits += 4 - (effectiveBits % 4);
    }

    const binA = padBinary(binRawA, effectiveBits);
    const binB = padBinary(binRawB, effectiveBits);

    // 1's complement of subtrahend B
    const onesB = compute1sComplement(binB);

    // Add A + 1's comp of B
    const addResult = addBinary(binA, onesB);

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("     SUBTRACTION USING (r-1)'s COMPLEMENT (1's)          ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Minuend (A):    ${valA.normalizedValue} (Base ${base}) = ${formatBinaryWithSpaces(binA)}₂ (${decA})`);
    lines.push(`Subtrahend (B): ${valB.normalizedValue} (Base ${base}) = ${formatBinaryWithSpaces(binB)}₂ (${decB})`);
    lines.push(`Working word length: ${effectiveBits} bit(s)`);
    lines.push("");

    // Step 1
    lines.push(`Step 1: Find the 1's complement of Subtrahend B (${formatBinaryWithSpaces(binB)})`);
    lines.push(`  Invert each bit: ${formatBinaryWithSpaces(binB)} → ${formatBinaryWithSpaces(onesB)}`);
    lines.push(`  1's complement of B = ${formatBinaryWithSpaces(onesB)}`);
    lines.push("");

    // Step 2
    lines.push("Step 2: Add Minuend A + 1's complement of Subtrahend B");
    lines.push(`    ${formatBinaryWithSpaces(binA)}   (Minuend A)`);
    lines.push(`  + ${formatBinaryWithSpaces(onesB)}   (1's complement of B)`);
    lines.push(`  ${"─".repeat(formatBinaryWithSpaces(binA).length + 4)}`);

    let finalBinary;
    let isNegative = false;
    let finalDec;

    if (addResult.carry > 0) {
        // Step 3a: End-around carry
        lines.push(`  1 ${formatBinaryWithSpaces(addResult.result)}   ← End-around carry of 1`);
        lines.push("");
        lines.push("Step 3: End-around carry detected → Result is POSITIVE (+)");
        lines.push("  Add the end-around carry (+1) back to the result:");

        const carryResult = addBinary(addResult.result, padBinary("1", effectiveBits));
        finalBinary = carryResult.result;
        finalDec = BigInt("0b" + finalBinary);

        lines.push(`    ${formatBinaryWithSpaces(addResult.result)}`);
        lines.push(`  + ${formatBinaryWithSpaces(padBinary("1", effectiveBits))}`);
        lines.push(`  ${"─".repeat(formatBinaryWithSpaces(finalBinary).length + 4)}`);
        lines.push(`    ${formatBinaryWithSpaces(finalBinary)}`);
        lines.push("");
        lines.push(`Final Answer: A − B = ${formatBinaryWithSpaces(finalBinary)}₂ (+${finalDec.toString(10)} in Base 10)`);
    } else {
        // Step 3b: No carry → negative result
        lines.push(`    ${formatBinaryWithSpaces(addResult.result)}   ← No carry detected (0)`);
        lines.push("");
        lines.push("Step 3: No end-around carry → Result is NEGATIVE (−)");
        lines.push("  Take the 1's complement of the sum to find the magnitude, then negate:");

        const invertedSum = compute1sComplement(addResult.result);
        finalBinary = invertedSum;
        isNegative = true;
        finalDec = BigInt("0b" + finalBinary);

        lines.push(`  Invert sum: ${formatBinaryWithSpaces(addResult.result)} → ${formatBinaryWithSpaces(invertedSum)}`);
        lines.push("");
        lines.push(`Final Answer: A − B = −${formatBinaryWithSpaces(finalBinary)}₂ (−${finalDec.toString(10)} in Base 10)`);
    }

    return {
        isNegative,
        rawBinary: finalBinary,
        formattedBinary: formatBinaryWithSpaces(finalBinary),
        decimalValue: (isNegative ? -finalDec : finalDec).toString(10),
        decimalString: (isNegative ? "-" : "+") + finalDec.toString(10),
        solution: lines.join("\n")
    };
}

/**
 * Performs binary subtraction A − B using the 2's complement method.
 */
export function subtractUsing2sComplement(minuendStr, subtrahendStr, base, userNumBits = 8) {
    const valA = validateSignedInput(minuendStr, base);
    const valB = validateSignedInput(subtrahendStr, base);

    if (!valA.valid || !valB.valid) {
        return { error: "Invalid inputs." };
    }

    const decA = baseToBigInt(valA.digits, base) * (valA.isNegative ? -1n : 1n);
    const decB = baseToBigInt(valB.digits, base) * (valB.isNegative ? -1n : 1n);

    const binRawA = (decA < 0n ? -decA : decA).toString(2);
    const binRawB = (decB < 0n ? -decB : decB).toString(2);

    let effectiveBits = Math.max(Number(userNumBits) || 8, binRawA.length, binRawB.length);
    if (effectiveBits % 4 !== 0) {
        effectiveBits += 4 - (effectiveBits % 4);
    }

    const binA = padBinary(binRawA, effectiveBits);
    const binB = padBinary(binRawB, effectiveBits);

    // 2's complement of subtrahend B
    const onesB = compute1sComplement(binB);
    const twosB = compute2sComplement(binB);

    // Add A + 2's comp of B
    const addResult = addBinary(binA, twosB);

    const lines = [];
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("       SUBTRACTION USING r's COMPLEMENT (2's)             ");
    lines.push("══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(`Minuend (A):    ${valA.normalizedValue} (Base ${base}) = ${formatBinaryWithSpaces(binA)}₂ (${decA})`);
    lines.push(`Subtrahend (B): ${valB.normalizedValue} (Base ${base}) = ${formatBinaryWithSpaces(binB)}₂ (${decB})`);
    lines.push(`Working word length: ${effectiveBits} bit(s)`);
    lines.push("");

    // Step 1
    lines.push(`Step 1: Find the 2's complement of Subtrahend B (${formatBinaryWithSpaces(binB)})`);
    lines.push(`  1's complement of B: ${formatBinaryWithSpaces(onesB)}`);
    lines.push(`  Add 1:              ${formatBinaryWithSpaces(twosB)}`);
    lines.push(`  2's complement of B = ${formatBinaryWithSpaces(twosB)}`);
    lines.push("");

    // Step 2
    lines.push("Step 2: Add Minuend A + 2's complement of Subtrahend B");
    lines.push(`    ${formatBinaryWithSpaces(binA)}   (Minuend A)`);
    lines.push(`  + ${formatBinaryWithSpaces(twosB)}   (2's complement of B)`);
    lines.push(`  ${"─".repeat(formatBinaryWithSpaces(binA).length + 4)}`);

    let finalBinary;
    let isNegative = false;
    let finalDec;

    if (addResult.carry > 0) {
        // Step 3a: Carry detected → discard
        lines.push(`  1 ${formatBinaryWithSpaces(addResult.result)}   ← Carry of 1 detected`);
        lines.push("");
        lines.push("Step 3: Carry detected → DISCARD the carry → Result is POSITIVE (+)");
        lines.push("  Discarding the overflow carry gives:");

        finalBinary = addResult.result;
        finalDec = BigInt("0b" + finalBinary);

        lines.push(`  Result = ${formatBinaryWithSpaces(finalBinary)}`);
        lines.push("");
        lines.push(`Final Answer: A − B = ${formatBinaryWithSpaces(finalBinary)}₂ (+${finalDec.toString(10)} in Base 10)`);
    } else {
        // Step 3b: No carry → negative result
        lines.push(`    ${formatBinaryWithSpaces(addResult.result)}   ← No carry detected (0)`);
        lines.push("");
        lines.push("Step 3: No carry detected → Result is NEGATIVE (−)");
        lines.push("  Take the 2's complement of the sum to find the magnitude, then negate:");

        const twosSum = compute2sComplement(addResult.result);
        finalBinary = twosSum;
        isNegative = true;
        finalDec = BigInt("0b" + finalBinary);

        lines.push(`  1's comp of sum: ${formatBinaryWithSpaces(compute1sComplement(addResult.result))}`);
        lines.push(`  Add 1:           ${formatBinaryWithSpaces(twosSum)}`);
        lines.push("");
        lines.push(`Final Answer: A − B = −${formatBinaryWithSpaces(finalBinary)}₂ (−${finalDec.toString(10)} in Base 10)`);
    }

    return {
        isNegative,
        rawBinary: finalBinary,
        formattedBinary: formatBinaryWithSpaces(finalBinary),
        decimalValue: (isNegative ? -finalDec : finalDec).toString(10),
        decimalString: (isNegative ? "-" : "+") + finalDec.toString(10),
        solution: lines.join("\n")
    };
}

// Aliases for compatibility
export const computeRMinus1Complement = compute1sComplement;
export const computeRComplement = compute2sComplement;
export const subtractUsingRMinus1Complement = subtractUsing1sComplement;
export const subtractUsingRComplement = subtractUsing2sComplement;
export const padValue = padBinary;
