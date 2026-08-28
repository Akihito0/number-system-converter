function formatRemainder(remainder) {
    const decimalRemainder = remainder.toString(10);

    if (remainder >= 10n) {
        return `${decimalRemainder} (${remainder.toString(16).toUpperCase()})`;
    }

    return decimalRemainder;
}

export function createDivisionSolution(
    decimalValue,
    targetBase,
    targetName
) {
    let currentValue = decimalValue;
    const divisionSteps = [];

    do {
        const quotient =
            currentValue / BigInt(targetBase);

        const remainder =
            currentValue % BigInt(targetBase);

        divisionSteps.push(
            `${currentValue} ÷ ${targetBase} = ${quotient} remainder ${formatRemainder(remainder)}`
        );

        currentValue = quotient;
    } while (currentValue > 0n);

    const finalValue =
        decimalValue.toString(targetBase).toUpperCase();

    return [
        `Convert decimal ${decimalValue} to ${targetName}:`,
        ...divisionSteps,
        `Read the remainders from bottom to top: ${finalValue}`,
        `Final result: ${finalValue}`
    ].join("\n");
}
