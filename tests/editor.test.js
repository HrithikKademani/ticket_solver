/**
 * @jest-environment jsdom
 */
const { executeCommand } = require("../editor");

describe("Mini HTML Editor Tests", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="editor" contenteditable="true">Hello World</div>
        `;
    });

    test("Bold command applies formatting", () => {
        const editor = document.getElementById("editor");
        
        // Select "World"
        const range = document.createRange();
        const textNode = editor.firstChild;
        range.setStart(textNode, 6);
        range.setEnd(textNode, 11);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Mock execCommand behavior in JSDOM (since JSDOM doesn't support execCommand natively)
        document.execCommand = jest.fn((command, showUI, value) => {
            if (command === "bold") {
                editor.innerHTML = "Hello <strong>World</strong>";
            }
            if (command === "italic") {
                editor.innerHTML = "Hello <em>World</em>";
            }
            if (command === "underline") {
                editor.innerHTML = "Hello <u>World</u>";
            }
        });

        executeCommand("bold");

        expect(document.execCommand).toHaveBeenCalledWith("bold", false, null);
        expect(editor.innerHTML).toContain("<strong>World</strong>");
    });

    test("Italic command applies formatting", () => {
        const editor = document.getElementById("editor");
        
        // Select "World"
        const range = document.createRange();
        const textNode = editor.firstChild;
        range.setStart(textNode, 6);
        range.setEnd(textNode, 11);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Mock execCommand behavior
        document.execCommand = jest.fn((command, showUI, value) => {
            if (command === "italic") {
                editor.innerHTML = "Hello <em>World</em>";
            }
        });

        executeCommand("italic");

        expect(document.execCommand).toHaveBeenCalledWith("italic", false, null);
        expect(editor.innerHTML).toContain("<em>World</em>");
    });

    test("Underline command applies formatting", () => {
        const editor = document.getElementById("editor");
        
        // Select "World"
        const range = document.createRange();
        const textNode = editor.firstChild;
        range.setStart(textNode, 6);
        range.setEnd(textNode, 11);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Mock execCommand behavior
        document.execCommand = jest.fn((command, showUI, value) => {
            if (command === "underline") {
                editor.innerHTML = "Hello <u>World</u>";
            }
        });

        executeCommand("underline");

        expect(document.execCommand).toHaveBeenCalledWith("underline", false, null);
        expect(editor.innerHTML).toContain("<u>World</u>");
    });
});