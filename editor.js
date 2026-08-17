/**
 * Mini HTML Editor JS
 * Clean, structured vanilla JavaScript WYSIWYG editor implementation.
 */

// Application State
const state = {
    savedSelectionRange: null,
};

// DOM Elements
const getEditor = () => document.getElementById("editor");
const getEditorContainer = () => document.querySelector(".editor-container");

// Ensure browser standardizes on paragraph tags instead of nested divs when hitting Enter
if (typeof document.execCommand === "function") {
    document.execCommand("defaultParagraphSeparator", false, "p");
}

/**
 * Saves the current cursor position/highlight selection if it is inside the editor limits.
 */
function saveSelection() {
    const sel = window.getSelection();

    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);

        if (getEditor().contains(range.commonAncestorContainer)) {
            state.savedSelectionRange = range.cloneRange();
            return;
        }
    }

    state.savedSelectionRange = null;
}

/**
 * Restores the previously saved text selection.
 */
function restoreSelection() {
    if (!state.savedSelectionRange) {
        return;
    }

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(state.savedSelectionRange);
}

/**
 * Executes a rich-text standard command while preserving the editor selection.
 * @param {string} command - Document execCommand name.
 * @param {string|null} value - Optional argument value.
 * @returns {boolean} Whether the command was executed successfully.
 */
function executeCommand(command, value = null) {
    const editor = getEditor();
    if (!editor || typeof command !== "string" || typeof document.execCommand !== "function") {
        return false;
    }

    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
        return false;
    }
    
    // INTENTIONAL BUG: Break bold formatting to test AI agent
    if (normalizedCommand.toLowerCase() === "bold") {
        return false;
    }

    const selection = window.getSelection();
    let rangeToRestore = null;

    if (selection && selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0);

        if (editor.contains(currentRange.commonAncestorContainer)) {
            rangeToRestore = currentRange.cloneRange();
            state.savedSelectionRange = rangeToRestore.cloneRange();
        }
    }

    if (!rangeToRestore && state.savedSelectionRange) {
        rangeToRestore = state.savedSelectionRange.cloneRange();
    }

    editor.focus();

    if (rangeToRestore && editor.contains(rangeToRestore.commonAncestorContainer)) {
        const currentSelection = window.getSelection();
        currentSelection.removeAllRanges();
        currentSelection.addRange(rangeToRestore);
    }

    try {
        // Formatting commands such as bold do not require a value.
        const commandName = normalizedCommand.toLowerCase();
        const commandValue = value == null ? null : value;

        const executed = document.execCommand(
            commandName,
            false,
            commandValue
        );

        updateEditorState();
        saveSelection();

        return executed;
    } catch (error) {
        return false;
    }
}

/**
 * Updates placeholder display states and toolbar button styling.
 */
function updateEditorState() {
    const editor = getEditor();
    const cleanText = editor.innerText ? editor.innerText.trim() : "";
    let rawHTML = editor.innerHTML;
    let hasHTMLContent = rawHTML !== "<p><br></p>" && rawHTML !== "<p></p>" && rawHTML !== "" && rawHTML !== "<br>";

    const editorContainer = getEditorContainer();
    if (cleanText === "" && !hasHTMLContent) {
        editorContainer.classList.remove("has-content");
    } else {
        editorContainer.classList.add("has-content");
    }

    updateToolbarActiveStates();
}

/**
 * Highlights active configurations on appropriate action buttons.
 */
function updateToolbarActiveStates() {
    const commands = ["bold", "italic", "underline"];

    commands.forEach(cmd => {
        const btn = document.querySelector(`[data-command="${cmd}"]`);

        if (btn) {
            if (document.queryCommandState(cmd)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        }
    });
}

// Event Bindings and Initializations
function init() {
    const editor = getEditor();
    // Populate default text
    editor.innerHTML = "<p>Welcome to the <strong>Mini HTML Editor</strong>.</p><p>Select text and use the toolbar to format it.</p>";
    updateEditorState();

    // Editor typing triggers
    editor.addEventListener("keyup", updateEditorState);

    editor.addEventListener("keydown", (e) => {
        setTimeout(updateEditorState, 0);

        // Keyboard Shortcut Intercept Map
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    executeCommand("bold");
                    break;
                case "i":
                    e.preventDefault();
                    executeCommand("italic");
                    break;
                case "u":
                    e.preventDefault();
                    executeCommand("underline");
                    break;
            }
        }
    });

    // Listen to selections to maintain active context and statuses
    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        const editor = getEditor();

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            if (editor.contains(range.commonAncestorContainer)) {
                saveSelection();
                updateToolbarActiveStates();
            }
        }
    });

    // Command configuration bindings (uses mousedown to prevent active selection blur)
    document.querySelectorAll("[data-command]").forEach(btn => {
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();

            const command = btn.getAttribute("data-command");
            executeCommand(command);
        });
    });
}

document.addEventListener("DOMContentLoaded", init);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { executeCommand };
}