/**
 * Mini HTML Editor JS
 * Clean, structured vanilla JavaScript WYSIWYG editor implementation.
 */

// Application State
const state = {
    savedSelectionRange: null,
};

// DOM Elements
const editor = document.getElementById("editor");
const editorContainer = document.querySelector(".editor-container");
const headingSelect = document.getElementById("heading-select");
const htmlOutput = document.getElementById("html-output");
const copyBtn = document.getElementById("copy-btn");
const copyStatus = document.getElementById("copy-status");
const clearBtn = document.getElementById("clear-btn");
const linkBtn = document.getElementById("link-btn");

// Ensure browser standardizes on paragraph tags instead of nested divs when hitting Enter
document.execCommand("defaultParagraphSeparator", false, "p");

/**
 * Saves the current cursor position/highlight selection if it is inside the editor limits.
 */
function saveSelection() {
    const sel = window.getSelection();

    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);

        if (editor.contains(range.commonAncestorContainer)) {
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
    if (!editor || typeof command !== "string" || typeof document.execCommand !== "function") {
        return false;
    }

    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
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
        
        // BUG INTRODUCED HERE: Disable italic command
        if (commandName === "italic") {
            return false;
        }

        const commandValue = commandName === "bold" || value == null ? null : value;

        const executed = document.execCommand(
            normalizedCommand,
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
 * Escapes tags for presentation inside output display structures.
 * @param {string} html - Raw HTML.
 */
function escapeHTML(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Filters out raw initial structure noise to normalize clean visual output.
 */
function getNormalizedHTML() {
    let rawHTML = editor.innerHTML;

    // Standard cleanup checks for empty browser elements
    if (rawHTML === "<p><br></p>" || rawHTML === "<p></p>" || rawHTML === "" || rawHTML === "<br>") {
        return "";
    }

    return rawHTML.trim();
}

/**
 * Updates the preview panel rendering.
 */
function updateHtmlOutput() {
    const cleanHTML = getNormalizedHTML();

    if (cleanHTML) {
        htmlOutput.innerHTML = escapeHTML(cleanHTML);
    } else {
        htmlOutput.textContent = "";
    }
}

/**
 * Updates placeholder display states, HTML outputs, and toolbar button styling.
 */
function updateEditorState() {
    const cleanText = editor.innerText ? editor.innerText.trim() : "";
    const cleanHTML = getNormalizedHTML();

    if (cleanText === "" && cleanHTML === "") {
        editorContainer.classList.remove("has-content");
    } else {
        editorContainer.classList.add("has-content");
    }

    updateHtmlOutput();
    updateToolbarActiveStates();
}

/**
 * Highlights active configurations on appropriate action buttons.
 */
function updateToolbarActiveStates() {
    const commands = ["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"];

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

    // Handle styling type on format drop-down menus
    let blockType = document.queryCommandValue("formatBlock");

    if (!blockType) {
        blockType = "p";
    }

    blockType = blockType.toLowerCase().replace(/<|>/g, "");

    if (["h1", "h2", "h3"].includes(blockType)) {
        headingSelect.value = blockType;
    } else {
        headingSelect.value = "p";
    }
}

/**
 * Resolves insertion actions for anchors.
 */
function handleLinkInsertion() {
    saveSelection();

    let url = prompt("Enter the URL link:", "https://");

    if (url === null) {
        return;
    }

    url = url.trim();

    if (url === "" || url === "https://") {
        alert("Please enter a valid URL.");
        return;
    }

    restoreSelection();

    const selection = window.getSelection();

    if (selection.toString().trim() === "") {
        // If selection is empty, insert a clean link node with fallback text
        const anchorHtml = `<a href="${url}" target="_blank">${url}</a>`;
        document.execCommand("insertHTML", false, anchorHtml);
    } else {
        document.execCommand("createLink", false, url);

        // Ensure standard links default to opening in a new tab
        const anchor = selection.anchorNode.parentElement;

        if (anchor && anchor.tagName === "A") {
            anchor.setAttribute("target", "_blank");
        }
    }

    updateEditorState();
}

/**
 * Clear text container.
 */
function clearEditor() {
    editor.innerHTML = "<p><br></p>";
    editor.focus();
    updateEditorState();
}

/**
 * Handles text copy.
 */
function copyHtmlToClipboard() {
    const cleanHTML = getNormalizedHTML();

    if (!cleanHTML) {
        showCopyStatus("Nothing to copy!", "rgba(239, 68, 68, 0.9)");
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanHTML)
            .then(() => {
                showCopyStatus("HTML copied!", "#10b981");
            })
            .catch(() => {
                showCopyStatus("Unable to copy HTML.", "rgba(239, 68, 68, 0.9)");
            });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = cleanHTML;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand("copy");
            showCopyStatus("HTML copied (fallback)!", "#10b981");
        } catch (err) {
            showCopyStatus("Unable to copy HTML.", "rgba(239, 68, 68, 0.9)");
        }

        document.body.removeChild(textArea);
    }
}

/**
 * Brief status display handler.
 */
function showCopyStatus(message, color) {
    copyStatus.textContent = message;
    copyStatus.style.color = color;
    copyStatus.classList.add("show");

    setTimeout(() => {
        copyStatus.classList.remove("show");
    }, 2000);
}

// Event Bindings and Initializations
function init() {
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
                case "z":
                    e.preventDefault();
                    executeCommand("undo");
                    break;
                case "y":
                    e.preventDefault();
                    executeCommand("redo");
                    break;
            }
        }
    });

    // Listen to selections to maintain active context and statuses
    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();

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

    // Special click interception setup for insertion prompts
    linkBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handleLinkInsertion();
    });

    headingSelect.addEventListener("mousedown", () => {
        saveSelection();
    });

    headingSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        restoreSelection();
        executeCommand("formatBlock", val);
    });

    copyBtn.addEventListener("click", copyHtmlToClipboard);
    clearBtn.addEventListener("click", clearEditor);
}

document.addEventListener("DOMContentLoaded", init);