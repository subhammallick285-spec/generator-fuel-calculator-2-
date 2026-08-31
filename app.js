const $ = (id) => document.getElementById(id);

let siteData = null;


/* ================================
   LOAD SITE DATA FROM D1
================================ */

$("loadSite").addEventListener("click", async () => {

  $("error").textContent = "";
  $("siteStatus").textContent = "";
  $("previousData").classList.add("hidden");

  const siteId = $("siteId").value.trim();

  if (!siteId) {
    $("error").textContent = "Please enter a Site ID.";
    return;
  }

  try {

    $("siteStatus").textContent = "Loading site data...";

    const res = await fetch(
      `/api/site?site_id=${encodeURIComponent(siteId)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const responseText = await res.text();

    let data = {};

    if (responseText.trim()) {

      try {
        data = JSON.parse(responseText);

      } catch (jsonError) {

        throw new Error(
          `Server returned invalid JSON (${res.status}).`
        );
      }
    }

    if (!res.ok) {

      throw new Error(
        data.error ||
        `Server Error (${res.status}).`
      );
    }

    if (!data.success || !data.site) {

      throw new Error(
        data.error ||
        "Site data could not be loaded."
      );
    }


    /* Save the site information */

    siteData = data.site;


    /* Show fetched information */

    $("loadedModel").textContent =
      siteData.model || "—";

    $("loadedHmr").textContent =
      siteData.current_hmr ?? "—";

    $("loadedKwh").textContent =
      siteData.current_kwh ?? "—";

    $("loadedBalance").textContent =
      siteData.current_balance ?? "—";


    $("previousData").classList.remove("hidden");


    $("siteStatus").textContent =
      `Site loaded: ${siteData.site_name || siteData.site_id}`;


    /* Automatically scroll to current readings */

    $("a").focus();

  } catch (err) {

    siteData = null;

    $("siteStatus").textContent = "";

    $("error").textContent =
      err.message || "Unable to load site.";

  }

});


/* ================================
   CALCULATE
================================ */

$("calculate").addEventListener("click", async () => {

  $("error").textContent = "";

  $("resultCard").classList.add("hidden");


  /* Site must be loaded first */

  if (!siteData) {

    $("error").textContent =
      "Please enter a Site ID and load the site data first.";

    return;
  }


  /* Current readings */

  const A = $("a").value.trim();
  const B = $("b").value.trim();


  if (!A || !B) {

    $("error").textContent =
      "Please enter Current HMR and Current kWh.";

    return;
  }


  /* Values automatically fetched from D1 */

  const payload = {

    model: siteData.model,

    A: A,

    B: B,

    C: siteData.current_hmr,

    D: siteData.current_kwh,

    E: siteData.current_balance

  };


  try {

    const res = await fetch(
      "/api/calculate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify(payload)
      }
    );


    /*
      Read response as text first.
      This prevents Unexpected end of JSON input.
    */

    const responseText = await res.text();

    let data = {};


    if (responseText.trim()) {

      try {

        data = JSON.parse(responseText);

      } catch (jsonError) {

        throw new Error(
          `Server returned invalid JSON (${res.status}).`
        );

      }

    }


    if (!res.ok) {

      throw new Error(
        data.error ||
        `Server Error (${res.status}).`
      );

    }


    if (!data.success) {

      throw new Error(
        data.error ||
        "Calculation failed."
      );

    }


    /* ================================
       DISPLAY RESULT
    ================================ */

    $("resultCard").classList.remove("hidden");


    $("result").textContent =
      Number(data.T).toFixed(2);


    $("z").textContent =
      Number(data.Z).toFixed(4);


    $("y").textContent =
      Number(data.Y).toFixed(4);


    $("x").textContent =
      Number(data.X).toFixed(4);


    $("l").textContent =
      Number(data.L).toFixed(2) +
      " L/hr";


    $("s").textContent =
      Number(data.S).toFixed(2);


    $("t").textContent =
      Number(data.T).toFixed(2);


    $("band").textContent =
      `${data.modelName}: X = ` +
      `${Number(data.X).toFixed(4)} ` +
      `falls in ${data.band}; ` +
      `chart value L = ` +
      `${Number(data.L).toFixed(2)} L/hr.`;

  }


  catch (err) {

    $("resultCard").classList.add("hidden");

    $("error").textContent =
      err.message ||
      "Something went wrong.";

  }

});


/* ================================
   CLEAR
================================ */

$("clear").addEventListener("click", () => {

  $("siteId").value = "";

  $("a").value = "";

  $("b").value = "";


  siteData = null;


  $("loadedModel").textContent = "—";

  $("loadedHmr").textContent = "—";

  $("loadedKwh").textContent = "—";

  $("loadedBalance").textContent = "—";


  $("previousData").classList.add("hidden");

  $("resultCard").classList.add("hidden");


  $("error").textContent = "";

  $("siteStatus").textContent = "";


  $("siteId").focus();

});
