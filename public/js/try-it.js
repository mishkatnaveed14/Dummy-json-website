const resourceSelect = document.getElementById("demo-resource");
const responsePanel = document.getElementById("demo-response");
const output = document.getElementById("demo-output");
const status = document.getElementById("demo-status");

if (!resourceSelect || !responsePanel || !output || !status) {
    console.error("Try-it demo markup is missing required elements.");
} else {
    const resources = new Set([
        "products", "carts", "users", "posts",
        "comments", "quotes", "recipes", "todos"
    ]);

    let requestNumber = 0;
    let activeController = null;

    async function loadResource() {
        const resource = resourceSelect.value;

        if (!resources.has(resource)) {
            status.textContent = "Please select a valid resource.";
            output.textContent = "Invalid resource selected.";
            return;
        }

        requestNumber += 1;
        const currentRequest = requestNumber;

        if (activeController) activeController.abort();
        activeController = new AbortController();

        responsePanel.setAttribute("aria-busy", "true");
        status.textContent = `Loading ${resource}…`;
        output.textContent = "Fetching JSON response…";

        try {
            const response = await fetch(
                `https://dummyjson.com/${resource}?limit=10`,
                { signal: activeController.signal }
            );

            if (!response.ok) {
                throw new Error(`Request failed (HTTP ${response.status}).`);
            }

            const data = await response.json();

            if (currentRequest !== requestNumber) return;

            output.textContent = JSON.stringify(data, null, 2);
            const items = data[resource];
            status.textContent = Array.isArray(items)
                ? `${items.length} ${resource} loaded`
                : `${resource} loaded`;
        } catch (error) {
            if (error.name === "AbortError" || currentRequest !== requestNumber) return;

            const message = error instanceof Error ? error.message : String(error);
            status.textContent = `Request failed: ${message}`;
            output.textContent = `Could not load ${resource}.\n${message}`;
        } finally {
            if (currentRequest === requestNumber) {
                responsePanel.setAttribute("aria-busy", "false");
            }
        }
    }

    resourceSelect.addEventListener("change", loadResource);
    loadResource();
}