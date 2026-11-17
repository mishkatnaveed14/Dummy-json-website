document.addEventListener("DOMContentLoaded", () => {
  const categoryGroups = Array.from(document.querySelectorAll(".docs-group[data-docs-category]"));
  const categorySections = Array.from(document.querySelectorAll(".docs-content > .docs-section[data-docs-category]"));
  const overviewTitle = document.querySelector(".docs-overview h1");
  const overviewDescription = document.querySelector(".docs-overview p");
  const dynamicImageCallout = document.getElementById("dynamic-image-callout");
  const categoryCopy = {
    intro: ["Intro — Docs", "Quick-start examples for testing requests, query options, and API responses."],
    tools: ["Developer Tools — Docs", "DataDino developer tools help you test and prototype: generate TOTP codes, create custom JSON endpoints, and inspect webhook requests."],
    "dynamic-image": ["Image — Docs", "The image endpoint provides customizable placeholder images by size, with options for background color, text color, and display text. Use them in websites and wireframes."],
    auth: ["Authentication — Docs", "Explore login and authenticated user endpoints."],
    products: ["Products — Docs", "Browse the products collection and retrieve individual products."]
  };

  const activateCategory = (activeGroup) => {
    const category = activeGroup.dataset.docsCategory;
    categoryGroups.forEach((group) => {
      group.open = group === activeGroup;
    });
    categorySections.forEach((section) => {
      section.hidden = section.dataset.docsCategory !== category;
    });
    dynamicImageCallout.hidden = category !== "dynamic-image";
    overviewTitle.textContent = categoryCopy[category][0];
    overviewDescription.textContent = categoryCopy[category][1];
    document.title = `${categoryCopy[category][0]} | DataDino`;
  };

  categoryGroups.forEach((group) => {
    group.addEventListener("toggle", () => {
      if (group.open) {
        activateCategory(group);
      }
    });
  });
  activateCategory(categoryGroups.find((group) => group.open) || categoryGroups[0]);

  const totpButtons = document.querySelectorAll("[data-totp-method]");

  totpButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const secretInput = document.getElementById(button.dataset.secret);
      const codeBlock = document.getElementById(button.dataset.code);
      const output = document.getElementById(button.dataset.output);
      const secret = secretInput.value.trim();

      output.hidden = false;
      if (!secret) {
        output.textContent = "Enter a test Base32 secret to run this request.";
        secretInput.focus();
        return;
      }

      let url = "https://dummyjson.com/2fa";
      const options = {};

      if (button.dataset.totpMethod === "GET") {
        const endpoint = new URL(url);
        endpoint.searchParams.set("key", secret);
        url = endpoint.toString();
        codeBlock.textContent = `fetch(${JSON.stringify(url)})\n  .then(response => response.json())\n  .then(console.log);`;
      } else {
        options.method = "POST";
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ key: secret });
        codeBlock.textContent = `fetch("https://dummyjson.com/2fa", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ key: ${JSON.stringify(secret)} })\n})\n  .then(response => response.json())\n  .then(console.log);`;
      }

      button.disabled = true;
      output.textContent = "Loading response…";

      try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
          const reason = result && (result.message || result.error);
          throw new Error(reason || `Request failed with status ${response.status}.`);
        }

        output.textContent = JSON.stringify(result, null, 2);
      } catch (error) {
        output.textContent = `Unable to load the 2FA response: ${error.message}`;
      } finally {
        button.disabled = false;
      }
    });
  });

  const webhookButton = document.getElementById("webhook-send-test");
  const webhookOutput = document.getElementById("webhook-output");

  if (webhookButton && webhookOutput) {
    webhookButton.addEventListener("click", async () => {
      webhookButton.disabled = true;
      webhookOutput.hidden = false;
      webhookOutput.textContent = "Sending sample event…";

      try {
        const response = await fetch("/api/webhooks/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.created",
            data: { orderId: 123 }
          })
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Request failed with status ${response.status}.`);
        }

        webhookOutput.textContent = JSON.stringify(result, null, 2);
      } catch (error) {
        webhookOutput.textContent = `Unable to send the sample event: ${error.message}`;
      } finally {
        webhookButton.disabled = false;
      }
    });
  }
});
