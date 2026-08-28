import { getDigitValue } from "./validation.js";

export function convertToDecimal(value, base) {
    let decimalValue = 0n;

    for (const character of value) {
        const digitValue =
            getDigitValue(character);

        decimalValue =
            decimalValue * BigInt(base) +
            BigInt(digitValue);
    }

    return decimalValue;
}

export function displayDecimal(decimalValue) {
    return decimalValue.toString(10);
}

export function createDecimalInputSolution(value, base) {
    const expansion = [];
    const evaluatedTerms = [];
    const simplifiedTerms = [];

    value.split("").forEach(function (character, index) {
        const digitValue =
            getDigitValue(character);

        const exponent = value.length - index - 1;

        const placeValue =
            BigInt(base) ** BigInt(exponent);

        const product =
            BigInt(digitValue) * placeValue;

        expansion.push(
            `${character} × ${base}^${exponent}`
        );

        evaluatedTerms.push(
            `${digitValue} × ${placeValue}`
        );

        simplifiedTerms.push(product.toString(10));
    });

    const decimalValue =
        convertToDecimal(value, base);

    return [
        "Convert the input value to decimal:",
        expansion.join(" + "),
        `= ${evaluatedTerms.join(" + ")}`,
        `= ${simplifiedTerms.join(" + ")}`,
        `= ${decimalValue}`
    ].join("\n");
}

export function createDecimalOutputSolution(decimalValue) {
    const finalValue =
        displayDecimal(decimalValue);

    return [
        "Convert the decimal value to Decimal:",
        "The value is already in Base 10.",
        `Final result: ${finalValue}`
    ].join("\n");
}
