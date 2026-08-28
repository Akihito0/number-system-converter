import {
    createDivisionSolution
} from "./division-solution.js";

export function convertToOctal(decimalValue) {
    return decimalValue.toString(8);
}

export function createOctalSolution(decimalValue) {
    return createDivisionSolution(
        decimalValue,
        8,
        "Octal"
    );
}
