import {
    createDivisionSolution
} from "./division-solution.js";

export function convertToHexadecimal(decimalValue) {
    return decimalValue
        .toString(16)
        .toUpperCase();
}

export function createHexadecimalSolution(decimalValue) {
    return createDivisionSolution(
        decimalValue,
        16,
        "Hexadecimal"
    );
}
