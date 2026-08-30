const $ = id => document.getElementById(id);

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Handle non-200 responses safely BEFORE running .json()
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = "Calculation failed.";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error || errMsg;
      } catch (e) {
        errMsg = `Server Error (${res.status}): Make sure calculate.js returns valid JSON.`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json();

    // Display calculated output
    $("resultCard").classList.remove("hidden");
    $("result").textContent = data.T ? data.T.toFixed(2) : "0.00";
    if ($("z")) $("z").textContent = data.Z ? data.Z.toFixed(4) : "";
    if ($("y")) $("y").textContent = data.Y ? data.Y.toFixed(4) : "";
    if ($("x")) $("x").textContent = data.X ? data.X.toFixed(4) : "";
    if ($("l")) $("l").textContent = data.L ? data.L.toFixed(2) + " L/hr" : "";
    if ($("s")) $("s").textContent = data.S ? data.S.toFixed(2) : "";
    if ($("t")) $("t").textContent = data.T ? data.T.toFixed(2) : "";
    
    if ($("band") && data.modelName) {
      $("band").textContent = `${data.modelName}: X = ${data.X ? data.X.toFixed(4) : ""} falls in ${data.band || "chart"}`;
    }
  } catch (err) {
    $("resultCard").classList.add("hidden");
    $("error").textContent = err.message;
  }
});

$("clear").addEventListener("click", () => {
  ["a", "b", "c", "d", "e"].forEach(id => {
    if ($(id)) $(id).value = "";
  });
  $("resultCard").classList.add("hidden");
  $("error").textContent = "";
  $("a").focus();
});
