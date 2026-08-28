export function getDigitValue(character) {
    const upperCharacter =
        character.toUpperCase();

    if (
        upperCharacter >= "0" &&
        upperCharacter <= "9"
    ) {
        return upperCharacter.charCodeAt(0) - 48;
    }

    if (
        upperCharacter >= "A" &&
        upperCharacter <= "F"
    ) {
        return upperCharacter.charCodeAt(0) - 55;
    }

    return -1;
}

export function validateInput(value, base) {
    const inputValue =
        value.trim().toUpperCase();

    if (inputValue === "") {
        return {
            valid: false,
            message: "Input cannot be empty."
        };
    }

    for (const character of inputValue) {
        const digitValue =
            getDigitValue(character);

        if (
            digitValue < 0 ||
            digitValue >= base
        ) {
            return {
                valid: false,
                message:
                    `Invalid input for Base ${base}.`
            };
        }
    }

    return {
        valid: true,
        message: "Valid input.",
        normalizedValue: inputValue
    };
}