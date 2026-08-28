import {
    createDivisionSolution
} from "./division-solution.js";

export function convertToBinary(decimalValue) {
    return decimalValue.toString(2);
}

export function createBinarySolution(decimalValue) {
    return createDivisionSolution(
        decimalValue,
        2,
        "Binary"
    );
}
