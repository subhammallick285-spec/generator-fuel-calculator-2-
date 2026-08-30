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
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Calculation failed.");

    $("resultCard").classList.remove("hidden");
    $("result").textContent = data.T.toFixed(2);
    $("z").textContent = data.Z.toFixed(4);
    $("y").textContent = data.Y.toFixed(4);
    $("x").textContent = data.X.toFixed(4);
    $("l").textContent = data.L.toFixed(2) + " L/hr";
    $("s").textContent = data.S.toFixed(2);
    $("t").textContent = data.T.toFixed(2);
    $("band").textContent = `${data.modelName}: X = ${data.X.toFixed(4)} falls in ${data.band}; chart value L = ${data.L.toFixed(2)} L/hr.`;
  } catch (err) {
    $("resultCard").classList.add("hidden");
    $("error").textContent = err.message;
  }
});

$("clear").addEventListener("click", () => {
  ["a","b","c","d","e"].forEach(id => $(id).value = "");
  $("resultCard").classList.add("hidden");
  $("error").textContent = "";
  $("a").focus();
});
