import {
    validateInput
} from "./conversions/validation.js";

import {
    convertToDecimal,
    displayDecimal,
    createDecimalInputSolution,
    createDecimalOutputSolution
} from "./conversions/to-decimal.js";

import {
    convertToBinary,
    createBinarySolution
} from "./conversions/to-binary.js";

import {
    convertToOctal,
    createOctalSolution
} from "./conversions/to-octal.js";

import {
    convertToHexadecimal,
    createHexadecimalSolution
} from "./conversions/to-hexadecimal.js";

const numberSystems = [
    {
        name: "Binary",
        base: 2
    },
    {
        name: "Octal",
        base: 8
    },
    {
        name: "Decimal",
        base: 10
    },
    {
        name: "Hexadecimal",
        base: 16
    }
];

const inputCount =
    document.getElementById("inputCount");

const setInputsButton =
    document.getElementById("setInputsButton");

const inputsContainer =
    document.getElementById("inputsContainer");

function createNumberSystemSelect(className, inputNumber) {
    const select = document.createElement("select");

    select.className = className;
    select.id = `${className}${inputNumber}`;

    numberSystems.forEach(function (numberSystem) {
        const option = document.createElement("option");

        option.value = numberSystem.base;
        option.textContent =
            `${numberSystem.name} (Base ${numberSystem.base})`;

        select.appendChild(option);
    });

    return select;
}

function createInputBoxes(numberOfInputs) {
    inputsContainer.replaceChildren();

    for (
        let inputNumber = 1;
        inputNumber <= numberOfInputs;
        inputNumber++
    ) {
        const inputContainer =
            document.createElement("article");

        inputContainer.className =
            "input-container";

        const heading =
            document.createElement("h2");

        heading.textContent =
            `Input Number ${inputNumber}`;

        const inputSection =
            document.createElement("div");

        inputSection.className =
            "input-section";

        const inputSystemLabel =
            document.createElement("label");

        inputSystemLabel.textContent =
            "Input number system:";

        const inputSystemSelect =
            createNumberSystemSelect(
                "input-system",
                inputNumber
            );

        const numberLabel =
            document.createElement("label");

        numberLabel.textContent =
            "Enter number:";

        const numberInput =
            document.createElement("input");

        numberInput.type = "text";
        numberInput.className = "number-input";
        numberInput.placeholder =
            "Enter a number";

        const validationMessage =
            document.createElement("p");

        validationMessage.className =
            "validation-message";

        inputSection.append(
            inputSystemLabel,
            inputSystemSelect,
            numberLabel,
            numberInput,
            validationMessage
        );

        const outputSection =
            document.createElement("div");

        outputSection.className =
            "output-section";

        const outputSystemLabel =
            document.createElement("label");

        outputSystemLabel.textContent =
            "Output number system:";

        const outputSystemSelect =
            createNumberSystemSelect(
                "output-system",
                inputNumber
            );

        const outputContainer =
            document.createElement("div");

        outputContainer.className =
            "output-container";

        const outputLabel =
            document.createElement("span");

        outputLabel.textContent =
            "Converted value:";

        const outputValue =
            document.createElement("strong");

        outputValue.className =
            "output-value";

        outputValue.textContent = "—";

        outputContainer.append(
            outputLabel,
            outputValue
        );

        outputSection.append(
            outputSystemLabel,
            outputSystemSelect,
            outputContainer
        );

        const solutionButton =
            document.createElement("button");

        solutionButton.type = "button";
        solutionButton.className = "solution-toggle";
        solutionButton.setAttribute(
            "aria-expanded",
            "false"
        );
        solutionButton.setAttribute(
            "aria-controls",
            `solution-container-${inputNumber}`
        );

        const solutionButtonText =
            document.createElement("span");

        solutionButtonText.textContent =
            "Show solution";

        const solutionChevron =
            document.createElement("span");

        solutionChevron.className =
            "solution-chevron";

        solutionChevron.textContent = "⌄";

        solutionButton.append(
            solutionButtonText,
            solutionChevron
        );

        const solutionContainer =
            document.createElement("div");

        solutionContainer.id =
            `solution-container-${inputNumber}`;

        solutionContainer.className =
            "solution-container";

        solutionContainer.textContent =
            "Solution will appear here after you enter a valid number.";

        solutionContainer.hidden = true;

        solutionButton.addEventListener(
            "click",
            function () {
                const isOpening =
                    solutionContainer.hidden;

                solutionContainer.hidden =
                    !isOpening;

                solutionButton.setAttribute(
                    "aria-expanded",
                    String(isOpening)
                );

                solutionButtonText.textContent =
                    isOpening
                        ? "Hide solution"
                        : "Show solution";

                solutionChevron.textContent =
                    isOpening ? "⌃" : "⌄";
            }
        );

        inputContainer.append(
            heading,
            inputSection,
            outputSection,
            solutionButton,
            solutionContainer
        );

        inputsContainer.appendChild(inputContainer);

        numberInput.addEventListener("input", function () {
            processInput(inputContainer);
        });

        inputSystemSelect.addEventListener(
            "change",
            function () {
                processInput(inputContainer);
            }
        );

        outputSystemSelect.addEventListener(
            "change",
            function () {
                processInput(inputContainer);
            }
        );
    }
}


function processInput(inputContainer) {
    const numberInput =
        inputContainer.querySelector(".number-input");

    const inputSystem =
        inputContainer.querySelector(".input-system");

    const outputSystem =
        inputContainer.querySelector(".output-system");

    const validationMessage =
        inputContainer.querySelector(
            ".validation-message"
        );

    const outputValue =
        inputContainer.querySelector(".output-value");

    const solutionContainer =
        inputContainer.querySelector(
            ".solution-container"
        );

    const inputBase =
        Number(inputSystem.value);

    const outputBase =
        Number(outputSystem.value);

    const validation =
        validateInput(
            numberInput.value,
            inputBase
        );

    validationMessage.textContent =
        validation.message;

    validationMessage.className =
        validation.valid
            ? "validation-message valid"
            : "validation-message invalid";

    if (!validation.valid) {
        outputValue.textContent = "—";
        solutionContainer.textContent =
            "Enter a valid number to see the solution.";
        return false;
    }

    const decimalValue =
        convertToDecimal(
            validation.normalizedValue,
            inputBase
        );

    const conversionFunctions = {
        2: {
            convert: convertToBinary,
            createSolution: createBinarySolution
        },
        8: {
            convert: convertToOctal,
            createSolution: createOctalSolution
        },
        10: {
            convert: displayDecimal,
            createSolution: createDecimalOutputSolution
        },
        16: {
            convert: convertToHexadecimal,
            createSolution: createHexadecimalSolution
        }
    };

    const selectedConversion =
        conversionFunctions[outputBase];

    outputValue.textContent =
        selectedConversion.convert(decimalValue);

    solutionContainer.textContent = [
        `Input: ${validation.normalizedValue} (Base ${inputBase})`,
        "",
        createDecimalInputSolution(
            validation.normalizedValue,
            inputBase
        ),
        "",
        selectedConversion.createSolution(decimalValue)
    ].join("\n");

    return true;
}

setInputsButton.addEventListener(
    "click",
    function () {
        const numberOfInputs =
            Number(inputCount.value);

        if (
            !Number.isInteger(numberOfInputs) ||
            numberOfInputs < 3 ||
            numberOfInputs > 10
        ) {
            alert(
                "Please enter a number from 3 to 10."
            );

            return;
        }

        createInputBoxes(numberOfInputs);
    }
);

createInputBoxes(3);
