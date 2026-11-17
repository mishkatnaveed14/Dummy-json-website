const jsonEditor = document.getElementById("custom-json-editor");
const prettifyButton = document.getElementById("custom-prettify");
const generateButton = document.getElementById("custom-generate");
const copyButton = document.getElementById("custom-copy");
const customUrlInput = document.getElementById("custom-api-url");
const customStatus = document.getElementById("custom-response-status");

if (!jsonEditor || !prettifyButton || !generateButton || !copyButton || !customUrlInput || !customStatus) {
    console.error("Custom response form is missing required elements.");
} else {
    function setStatus(message, state) {
        customStatus.textContent = message;
        customStatus.dataset.state = state || "";
    }

    function parseJsonEditor() {
        let value;

        try {
            value = JSON.parse(jsonEditor.value);
        } catch {
            throw new Error("Enter valid JSON before continuing.");
        }

        if (value === null || typeof value !== "object") {
            throw new Error("The response must be a JSON object or array.");
        }

        return value;
    }

    prettifyButton.addEventListener("click", () => {
        try {
            jsonEditor.value = JSON.stringify(parseJsonEditor(), null, 2);
            setStatus("JSON formatted and ready to generate.", "success");
        } catch (error) {
            setStatus(error.message, "error");
            jsonEditor.focus();
        }
    });

    jsonEditor.addEventListener("input", () => {
        customUrlInput.value = "";
        customUrlInput.disabled = true;
        copyButton.disabled = true;
        setStatus("JSON changed. Generate a new URL to publish this response.");
    });

    generateButton.addEventListener("click", async () => {
        let responseBody;

        try {
            responseBody = parseJsonEditor();
        } catch (error) {
            setStatus(error.message, "error");
            jsonEditor.focus();
            return;
        }

        customUrlInput.value = "";
        customUrlInput.disabled = true;
        copyButton.disabled = true;
        generateButton.disabled = true;
        setStatus("Creating your custom API endpoint…");

        try {
            const response = await fetch("/api/custom-responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(responseBody)
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || `Request failed (HTTP ${response.status}).`);
            }

            if (typeof result.path !== "string") {
                throw new Error("The server did not return a valid API URL.");
            }

            customUrlInput.value = new URL(result.path, window.location.origin).href;
            customUrlInput.disabled = false;
            copyButton.disabled = false;
            setStatus("Your endpoint is ready. Open the URL to view its JSON response.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setStatus(`Could not create your endpoint: ${message}`, "error");
        } finally {
            generateButton.disabled = false;
        }
    });

    copyButton.addEventListener("click", async () => {
        if (!customUrlInput.value) return;

        try {
            await navigator.clipboard.writeText(customUrlInput.value);
            setStatus("API URL copied to clipboard.", "success");
        } catch {
            customUrlInput.focus();
            customUrlInput.select();
            setStatus("URL selected. Press Ctrl+C (or Command+C) to copy it.", "error");
        }
    });
}
