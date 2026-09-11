import {
    convertToDecimal,
    displayDecimal,
    createDecimalOutputSolution
} from "./to-decimal.js";

import {
    convertToBinary,
    createBinarySolution
} from "./to-binary.js";

import {
    convertToOctal,
    createOctalSolution
} from "./to-octal.js";

import {
    convertToHexadecimal,
    createHexadecimalSolution
} from "./to-hexadecimal.js";

const baseNames = {
    2: "Binary",
    8: "Octal",
    10: "Decimal",
    16: "Hexadecimal"
};

export function tokenize(input) {
    const tokens = [];
    let i = 0;
    const str = input.trim();

    while (i < str.length) {
        const char = str[i];

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (char === "+" || char === "-" || char === "−") {
            tokens.push({ type: "OP", value: char === "−" ? "-" : char, pos: i });
            i++;
        } else if (char === "*" || char === "×") {
            tokens.push({ type: "OP", value: "*", pos: i });
            i++;
        } else if (char === "/" || char === "÷") {
            tokens.push({ type: "OP", value: "/", pos: i });
            i++;
        } else if (char === "^") {
            tokens.push({ type: "OP", value: "^", pos: i });
            i++;
        } else if (char === "(") {
            tokens.push({ type: "LPAREN", value: "(", pos: i });
            i++;
        } else if (char === ")") {
            tokens.push({ type: "RPAREN", value: ")", pos: i });
            i++;
        } else if (/[a-zA-Z]/.test(char)) {
            tokens.push({ type: "VAR", value: char.toUpperCase(), pos: i });
            i++;
        } else if (/[0-9]/.test(char)) {
            let numStr = "";
            const startPos = i;
            while (i < str.length && /[0-9]/.test(str[i])) {
                numStr += str[i];
                i++;
            }
            tokens.push({ type: "NUMBER", value: BigInt(numStr), pos: startPos });
        } else {
            return { error: `Invalid character '${char}' at position ${i + 1}.` };
        }
    }

    if (tokens.length === 0) {
        return { error: "Expression is empty. Please enter an expression like (A + B - C) * D." };
    }

    return { tokens };
}

export function evaluateExpression(expressionStr, variableValues) {
    // variableValues is a map/object: { A: bigintValue, B: bigintValue, ... }
    const tokenResult = tokenize(expressionStr);
    if (tokenResult.error) {
        return { error: tokenResult.error };
    }

    const tokens = tokenResult.tokens;
    let index = 0;
    const steps = [];

    function peek() {
        return tokens[index];
    }

    function consume(expectedType, expectedValue) {
        const tok = tokens[index];
        if (!tok) {
            return { error: "Unexpected end of expression." };
        }
        if (expectedType && tok.type !== expectedType) {
            return { error: `Expected '${expectedValue || expectedType}', but found '${tok.value}' at position ${tok.pos + 1}.` };
        }
        if (expectedValue && tok.value !== expectedValue) {
            return { error: `Expected '${expectedValue}', but found '${tok.value}' at position ${tok.pos + 1}.` };
        }
        index++;
        return { token: tok };
    }

    // PEMDAS Grammar:
    // Expression := Additive
    // Additive := Multiplicative ( ('+' | '-') Multiplicative )*
    // Multiplicative := Exponential ( ('*' | '/') Exponential )*
    // Exponential := Unary ( '^' Exponential )?
    // Unary := ('+' | '-') Unary | Primary
    // Primary := '(' Expression ')' | VAR | NUMBER

    function parseExpression() {
        return parseAdditive();
    }

    function parseAdditive() {
        let leftResult = parseMultiplicative();
        if (leftResult.error) return leftResult;

        while (index < tokens.length && tokens[index].type === "OP" && (tokens[index].value === "+" || tokens[index].value === "-")) {
            const opTok = tokens[index++];
            const rightResult = parseMultiplicative();
            if (rightResult.error) return rightResult;

            const leftVal = leftResult.value;
            const rightVal = rightResult.value;
            let res;

            if (opTok.value === "+") {
                res = leftVal + rightVal;
                steps.push(`Evaluate addition: ${leftVal} + ${rightVal} = ${res}`);
            } else {
                res = leftVal - rightVal;
                steps.push(`Evaluate subtraction: ${leftVal} − ${rightVal} = ${res}`);
            }

            leftResult = { value: res };
        }

        return leftResult;
    }

    function parseMultiplicative() {
        let leftResult = parseExponential();
        if (leftResult.error) return leftResult;

        while (index < tokens.length && tokens[index].type === "OP" && (tokens[index].value === "*" || tokens[index].value === "/")) {
            const opTok = tokens[index++];
            const rightResult = parseExponential();
            if (rightResult.error) return rightResult;

            const leftVal = leftResult.value;
            const rightVal = rightResult.value;
            let res;

            if (opTok.value === "*") {
                res = leftVal * rightVal;
                steps.push(`Evaluate multiplication: ${leftVal} × ${rightVal} = ${res}`);
            } else {
                if (rightVal === 0n) {
                    return { error: `Division by zero encountered: ${leftVal} ÷ 0 is undefined.` };
                }
                res = leftVal / rightVal;
                const remainder = leftVal % rightVal;
                steps.push(`Evaluate integer division: ${leftVal} ÷ ${rightVal} = ${res}${remainder !== 0n ? ` (remainder ${remainder})` : ""}`);
            }

            leftResult = { value: res };
        }

        return leftResult;
    }

    function parseExponential() {
        let leftResult = parseUnary();
        if (leftResult.error) return leftResult;

        if (index < tokens.length && tokens[index].type === "OP" && tokens[index].value === "^") {
            index++;
            // Exponentiation is right-associative in PEMDAS: a ^ b ^ c = a ^ (b ^ c)
            const rightResult = parseExponential();
            if (rightResult.error) return rightResult;

            const baseVal = leftResult.value;
            const expVal = rightResult.value;

            if (expVal < 0n) {
                return { error: `Negative exponent '${expVal}' is not supported in integer arithmetic.` };
            }
            if (expVal > 1000n) {
                return { error: `Exponent '${expVal}' is too large (maximum allowed is 1000).` };
            }

            try {
                const res = baseVal ** expVal;
                steps.push(`Evaluate exponentiation: ${baseVal} ^ ${expVal} = ${res}`);
                leftResult = { value: res };
            } catch (e) {
                return { error: `Error evaluating exponentiation ${baseVal} ^ ${expVal}: ${e.message}` };
            }
        }

        return leftResult;
    }

    function parseUnary() {
        if (index < tokens.length && tokens[index].type === "OP") {
            const opTok = tokens[index];
            if (opTok.value === "-") {
                index++;
                const operand = parseUnary();
                if (operand.error) return operand;
                const res = -operand.value;
                steps.push(`Unary negation: -(${operand.value}) = ${res}`);
                return { value: res };
            } else if (opTok.value === "+") {
                index++;
                return parseUnary();
            }
        }
        return parsePrimary();
    }

    function parsePrimary() {
        const tok = tokens[index];
        if (!tok) {
            return { error: "Unexpected end of expression, expected operand." };
        }

        if (tok.type === "LPAREN") {
            index++;
            steps.push(`Begin evaluation inside parentheses '('`);
            const inner = parseExpression();
            if (inner.error) return inner;

            const close = consume("RPAREN", ")");
            if (close.error) {
                return { error: `Mismatched parentheses: missing closing ')' for '(' opened at position ${tok.pos + 1}.` };
            }
            steps.push(`Completed evaluation inside parentheses ')' -> value: ${inner.value}`);
            return inner;
        }

        if (tok.type === "VAR") {
            index++;
            const varName = tok.value;
            if (!(varName in variableValues)) {
                const available = Object.keys(variableValues).sort().join(", ");
                return {
                    error: `Variable '${varName}' is not defined. Available input boxes: ${available || "none"}.`
                };
            }
            return { value: variableValues[varName] };
        }

        if (tok.type === "NUMBER") {
            index++;
            return { value: tok.value };
        }

        return { error: `Unexpected token '${tok.value}' at position ${tok.pos + 1}.` };
    }

    const parseResult = parseExpression();
    if (parseResult.error) {
        return parseResult;
    }

    if (index < tokens.length) {
        return {
            error: `Unexpected extra token '${tokens[index].value}' at position ${tokens[index].pos + 1}.`
        };
    }

    return {
        result: parseResult.value,
        steps
    };
}

export function formatResultInBase(decimalValue, targetBase) {
    const isNegative = decimalValue < 0n;
    const absValue = isNegative ? -decimalValue : decimalValue;

    let representation = "";
    if (targetBase === 2) {
        representation = convertToBinary(absValue);
    } else if (targetBase === 8) {
        representation = convertToOctal(absValue);
    } else if (targetBase === 10) {
        representation = displayDecimal(absValue);
    } else if (targetBase === 16) {
        representation = convertToHexadecimal(absValue);
    } else {
        representation = absValue.toString(targetBase).toUpperCase();
    }

    if (isNegative) {
        representation = `-${representation}`;
    }

    return representation;
}

export function createExpressionSolution({
    expressionStr,
    variableMetadata,
    evaluationResult,
    targetBase
}) {
    const lines = [];

    lines.push("=== ARITHMETIC SOLUTION (PEMDAS & PARENTHESES) ===");
    lines.push("");
    lines.push(`Expression: ${expressionStr}`);
    lines.push("");

    // Step 1: Variables mapping
    lines.push("Step 1: Convert input variables to Decimal (Base 10):");
    const usedVars = Object.keys(variableMetadata).sort();
    usedVars.forEach(v => {
        const meta = variableMetadata[v];
        const outStr = meta.outputValue && meta.outputBase ? ` -> Output "${meta.outputValue}" (Base ${meta.outputBase})` : "";
        lines.push(
            `  Variable ${v} (Box ${v}): Input "${meta.rawValue}" (Base ${meta.base} - ${baseNames[meta.base] || meta.base})${outStr} = ${meta.decimalValue} (Decimal)`
        );
    });
    lines.push("");

    // Step 2: Substituted expression
    let substituted = expressionStr;
    usedVars.forEach(v => {
        const regex = new RegExp(`\\b${v}\\b`, "gi");
        substituted = substituted.replace(regex, variableMetadata[v].decimalValue.toString(10));
    });
    lines.push(`Step 2: Substituted Decimal Expression:\n  ${substituted}`);
    lines.push("");

    // Step 3: Evaluation steps
    lines.push("Step 3: Step-by-step evaluation following parentheses and PEMDAS precedence:");
    if (evaluationResult.steps && evaluationResult.steps.length > 0) {
        evaluationResult.steps.forEach(step => {
            lines.push(`  • ${step}`);
        });
    } else {
        lines.push(`  • Result: ${evaluationResult.result}`);
    }
    lines.push(`  • Final Decimal Result = ${evaluationResult.result}`);
    lines.push("");

    // Step 4: Base conversion
    const finalDecimal = evaluationResult.result;
    const isNegative = finalDecimal < 0n;
    const absDecimal = isNegative ? -finalDecimal : finalDecimal;
    const formattedResult = formatResultInBase(finalDecimal, targetBase);
    const targetName = baseNames[targetBase] || `Base ${targetBase}`;

    lines.push(`Step 4: Convert decimal result (${finalDecimal}) to ${targetName} (Base ${targetBase}):`);

    if (targetBase === 10) {
        lines.push("  The result is already in Decimal (Base 10).");
        lines.push(`  Final Answer: ${formattedResult}`);
    } else {
        if (isNegative) {
            lines.push(`  Note: Result is negative (${finalDecimal}). Converting absolute magnitude (${absDecimal}) and prefixing negative sign:`);
        }

        let baseSolution = "";
        if (targetBase === 2) {
            baseSolution = createBinarySolution(absDecimal);
        } else if (targetBase === 8) {
            baseSolution = createOctalSolution(absDecimal);
        } else if (targetBase === 16) {
            baseSolution = createHexadecimalSolution(absDecimal);
        }

        if (baseSolution) {
            baseSolution.split("\n").forEach(l => lines.push(`  ${l}`));
        }

        lines.push(`  Final Answer: ${formattedResult} (Base ${targetBase})`);
    }

    return lines.join("\n");
}
