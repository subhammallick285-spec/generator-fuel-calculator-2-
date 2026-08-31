const $ = (id) => document.getElementById(id);

$("calculate").addEventListener("click", async () => {
  $("error").textContent = "";

  const payload = {
    model: $("model").value,
    A: $("a").value,
    B: $("b").value,
    C: $("c").value,
    D: $("d").value,
    E: $("e").value
  };

  try {
    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Read the response as TEXT first.
    // This prevents "Unexpected end of JSON input".
    const responseText = await res.text();

    let data = {};

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(
          `Server returned invalid JSON (${res.status}). Response: ${responseText.substring(0, 300)}`
        );
      }
    }

    if (!res.ok) {
      throw new Error(
        data.error ||
        `Server Error (${res.status}): ${res.statusText || "Request failed."}`
      );
    }

    if (!data.success) {
      throw new Error(data.error || "Calculation failed.");
    }

    $("resultCard").classList.remove("hidden");

    $("result").textContent = Number(data.T).toFixed(2);
    $("z").textContent = Number(data.Z).toFixed(4);
    $("y").textContent = Number(data.Y).toFixed(4);
    $("x").textContent = Number(data.X).toFixed(4);
    $("l").textContent = Number(data.L).toFixed(2) + " L/hr";
    $("s").textContent = Number(data.S).toFixed(2);
    $("t").textContent = Number(data.T).toFixed(2);

    $("band").textContent =
      `${data.modelName}: X = ${Number(data.X).toFixed(4)} ` +
      `falls in ${data.band}; chart value L = ` +
      `${Number(data.L).toFixed(2)} L/hr.`;

  } catch (err) {
    $("resultCard").classList.add("hidden");
    $("error").textContent =
      err.message || "Something went wrong.";
  }
});

$("clear").addEventListener("click", () => {
  ["a", "b", "c", "d", "e"].forEach(
    (id) => $(id).value = ""
  );

  $("model").selectedIndex = 0;

  $("resultCard").classList.add("hidden");
  $("error").textContent = "";

  $("a").focus();
});
