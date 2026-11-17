document.addEventListener("DOMContentLoaded", () => {
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
