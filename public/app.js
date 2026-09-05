// ============================================================
// GENERATOR FUEL CALCULATOR
// COMPLETE FRESH APP.JS
// ============================================================


// ============================================================
// HELPER
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// ELEMENTS
// ============================================================

const siteIdInput =
  $("siteId");

const findSiteButton =
  $("findSite");

const findSiteText =
  $("findSiteText");

const findSpinner =
  $("findSpinner");

const siteSearchCard =
  $("siteSearchCard");

const siteSearchMessage =
  $("siteSearchMessage");

const siteInfoCard =
  $("siteInfoCard");

const calculatorCard =
  $("calculatorCard");

const changeSiteButton =
  $("changeSite");

const activeModel =
  $("activeModel");


// ============================================================
// MODEL NAMES
// ============================================================

const MODEL_NAMES = {

  eicher10:
    "Eicher 10 KVA",

  eicher20:
    "Eicher 20 KVA",

  koel20:
    "KOEL 20 KVA",

  mahindra20:
    "Mahindra 20 KVA",

  mahindra10:
    "Mahindra 10 KVA"

};


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "—";

  }


  const n =
    Number(value);


  if (!Number.isFinite(n)) {

    return "—";

  }


  return n.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 4
    }
  );

}


// ============================================================
// SHOW SITE MESSAGE
// ============================================================

function showSiteMessage(
  message,
  type = ""
) {

  siteSearchMessage.textContent =
    message;

  siteSearchMessage.className =
    "message " + type;

}


// ============================================================
// FIND BUTTON LOADING
// ============================================================

function setFindLoading(
  loading
) {

  findSiteButton.disabled =
    loading;


  if (loading) {

    findSiteText.textContent =
      "Checking...";

    findSpinner
      .classList
      .remove("hidden");

  } else {

    findSiteText.textContent =
      "Find Site";

    findSpinner
      .classList
      .add("hidden");

  }

}


// ============================================================
// RESET RESULT
// ============================================================

function resetResult() {

  $("resultCard")
    .classList
    .add("hidden");

  $("result").textContent =
    "—";

  $("z").textContent =
    "—";

  $("y").textContent =
    "—";

  $("x").textContent =
    "—";

  $("l").textContent =
    "—";

  $("s").textContent =
    "—";

  $("t").textContent =
    "—";

  $("band").textContent =
    "";

}


// ============================================================
// RESET E2
// ============================================================

function resetE2() {

  $("e2").textContent =
    "—";

  $("currentBalanceAfterFillingBox")
    .classList
    .add("hidden");

}


// ============================================================
// FIND SITE
// ============================================================

async function findSite() {

  const siteId =
    siteIdInput.value.trim();


  siteInfoCard
    .classList
    .add("hidden");


  calculatorCard
    .classList
    .add("hidden");


  resetResult();


  if (!siteId) {

    showSiteMessage(
      "Please enter a Site ID.",
      "error-message"
    );

    siteIdInput.focus();

    return;

  }


  setFindLoading(true);


  showSiteMessage(
    "Checking saved site data..."
  );


  try {

    const response =
      await fetch(
        `/api/site?site_id=${encodeURIComponent(siteId)}`,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json"
          },

          cache:
            "no-store"
        }
      );


    const responseText =
      await response.text();


    let data = {};


    if (responseText.trim()) {

      try {

        data =
          JSON.parse(responseText);

      } catch {

        throw new Error(
          `Server returned invalid JSON (${response.status}).`
        );

      }

    }


    // -------------------------
    // SITE NOT FOUND
    // -------------------------

    if (response.status === 404) {

      showSiteMessage(
        "Site not found. You can continue with the normal manual calculator.",
        "warning-message"
      );


      prepareManualCalculator(
        false
      );


      return;

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        `Server error (${response.status}).`
      );

    }


    if (
      !data.success ||
      !data.site
    ) {

      throw new Error(
        data.error ||
        "Unable to load site."
      );

    }


    // -------------------------
    // SITE FOUND
    // -------------------------

    const site =
      data.site;


    localStorage.setItem(
      "lastSiteId",
      site.site_id
    );


    displaySite(site);


    prepareExistingSiteCalculator(
      site
    );


    showSiteMessage(
      "✓ Existing site data loaded automatically.",
      "success-message"
    );


  } catch (error) {

    console.error(error);


    showSiteMessage(
      error?.message ||
      "Unable to connect to the site database.",
      "error-message"
    );


  } finally {

    setFindLoading(false);

  }

}


// ============================================================
// DISPLAY SITE
// ============================================================

function displaySite(site) {

  // Store model directly on site card
  siteInfoCard.dataset.model =
    site.model || "";


  const modelName =
    MODEL_NAMES[site.model] ||
    site.model ||
    "Unknown";


  $("displaySiteName").textContent =
    site.site_name ||
    site.site_id ||
    "—";


  $("displayModel").textContent =
    modelName;


  // IMPORTANT:
  // HMR comes from current_hmr
  $("displayHmr").textContent =
    formatNumber(
      site.current_hmr
    );


  // IMPORTANT:
  // kWh comes from current_kwh
  $("displayKwh").textContent =
    formatNumber(
      site.current_kwh
    );


  // current_balance is the latest
  // saved E2 and therefore becomes
  // the next calculation's E1.
  $("displayBalance").textContent =
    `${formatNumber(site.current_balance)} L`;


  siteInfoCard
    .classList
    .remove("hidden");

}


// ============================================================
// EXISTING SITE CALCULATOR
// ============================================================

function prepareExistingSiteCalculator(
  site
) {

  window.calculatorIncognito =
    false;


  // Existing site already has model
  $("manualModelField")
    .classList
    .add("hidden");


  activeModel.textContent =
    MODEL_NAMES[site.model] ||
    site.model ||
    "Unknown";


  // -------------------------
  // PREVIOUS READINGS
  // -------------------------

  // C = previous HMR
  $("c").value =
    site.current_hmr ?? "";


  // D = previous kWh
  $("d").value =
    site.current_kwh ?? "";


  // E1 = previous balance
  // after filling.
  // This is the saved E2
  // from the previous cycle.
  $("e1").value =
    site.current_balance ?? "";


  // -------------------------
  // CURRENT READINGS
  // -------------------------

  $("a").value =
    "";

  $("b").value =
    "";

  $("q1").value =
    "";

  $("q2").value =
    "";


  resetE2();

  resetResult();


  $("saveForFuture")
    .classList
    .add("hidden");


  $("saveMessage")
    .textContent =
    "";


  $("calculatorDescription")
    .textContent =
    "Previous HMR, kWh and balance after filling were loaded automatically. Enter the current readings and balance.";


  calculatorCard
    .classList
    .remove("hidden");


  setTimeout(
    () => {
      $("a").focus();
    },
    150
  );

}


// ============================================================
// MANUAL / INCOGNITO CALCULATOR
// ============================================================

function prepareManualCalculator(
  isIncognito = false
) {

  window.calculatorIncognito =
    isIncognito;


  $("manualModelField")
    .classList
    .remove("hidden");


  delete siteInfoCard.dataset.model;


  activeModel.textContent =
    "Manual Selection";


  $("calculatorDescription")
    .textContent =
    isIncognito
      ? "Manual / Incognito mode. Nothing will be saved to D1."
      : "Enter all generator readings manually.";


  // -------------------------
  // PREVIOUS
  // -------------------------

  $("c").value =
    "";

  $("d").value =
    "";

  $("e1").value =
    "";


  // -------------------------
  // CURRENT
  // -------------------------

  $("a").value =
    "";

  $("b").value =
    "";

  $("q1").value =
    "";

  $("q2").value =
    "";


  $("manualModel").value =
    "";


  resetE2();

  resetResult();


  $("saveForFuture")
    .classList
    .add("hidden");


  $("saveMessage")
    .textContent =
    "";

  $("error")
    .textContent =
    "";


  calculatorCard
    .classList
    .remove("hidden");


  setTimeout(
    () => {
      $("manualModel").focus();
    },
    150
  );

}


// ============================================================
// GET CURRENT MODEL
// ============================================================

function getCurrentModel() {

  const siteModel =
    siteInfoCard.dataset.model;


  if (siteModel) {

    return siteModel;

  }


  return $("manualModel").value;

}


// ============================================================
// FIND SITE BUTTON
// ============================================================

findSiteButton.addEventListener(
  "click",
  findSite
);


// ============================================================
// ENTER KEY ON SITE ID
// ============================================================

siteIdInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      findSite();

    }

  }
);


// ============================================================
// CHANGE SITE
// ============================================================

changeSiteButton.addEventListener(
  "click",
  () => {

    siteInfoCard
      .classList
      .add("hidden");


    calculatorCard
      .classList
      .add("hidden");


    resetResult();


    siteSearchMessage
      .textContent =
      "";


    siteIdInput.focus();

  }
);


// ============================================================
// INCOGNITO
// ============================================================

const incognitoModeButton =
  $("incognitoMode");


incognitoModeButton.addEventListener(
  "click",
  () => {

    siteInfoCard
      .classList
      .add("hidden");


    siteSearchMessage
      .textContent =
      "";


    prepareManualCalculator(
      true
    );

  }
);


// ============================================================
// CALCULATE
// ============================================================

$("calculate").addEventListener(
  "click",
  async () => {

    $("error").textContent =
      "";


    // -------------------------
    // MODEL
    // -------------------------

    const selectedModel =
      getCurrentModel();


    if (!selectedModel) {

      $("error").textContent =
        "Please select a DG Model.";


      $("manualModel").focus();


      return;

    }


    // -------------------------
    // READINGS
    // -------------------------

    const A =
      Number($("a").value);


    const B =
      Number($("b").value);


    const C =
      Number($("c").value);


    const D =
      Number($("d").value);


    // E1
    const E1 =
      Number($("e1").value);


    // Q1
    const Q1 =
      Number($("q1").value);


    // Q2
    const Q2 =
      Number($("q2").value);


    // -------------------------
    // VALIDATION
    // -------------------------

    if (
      !Number.isFinite(A) ||
      !Number.isFinite(B) ||
      !Number.isFinite(C) ||
      !Number.isFinite(D)
    ) {

      $("error").textContent =
        "Please enter valid HMR and kWh readings.";

      return;

    }


    if (
      !Number.isFinite(E1) ||
      !Number.isFinite(Q1) ||
      !Number.isFinite(Q2)
    ) {

      $("error").textContent =
        "Please enter valid E1, Q1 and Q2 values.";

      return;

    }


    if (
      A <= C
    ) {

      $("error").textContent =
        "Current HMR must be greater than Previous HMR.";

      return;

    }


    if (
      B < D
    ) {

      $("error").textContent =
        "Current kWh cannot be lower than Previous kWh.";

      return;

    }


    // -------------------------
    // E2
    // -------------------------

    const E2 =
      Q1 + Q2;


    $("e2").textContent =
      E2.toFixed(2) + " L";


    $("currentBalanceAfterFillingBox")
      .classList
      .remove("hidden");


    // -------------------------
    // SEND TO WORKER
    // -------------------------

    const payload = {
  model: selectedModel,
  current_hmr: A,
  current_kwh: B,
  previous_hmr: C,
  previous_kwh: D,
  previous_balance: E1
};

    try {

      const res =
        await fetch(
          "/api/calculate",
          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body:
              JSON.stringify(payload)

          }
        );


      const responseText =
        await res.text();


      let data =
        {};


      if (
        responseText.trim()
      ) {

        try {

          data =
            JSON.parse(
              responseText
            );

        } catch {

          throw new Error(
            `Server returned invalid JSON (${res.status}).`
          );

        }

      }


      if (!res.ok) {

        throw new Error(
          data.error ||
          `Server Error (${res.status})`
        );

      }


      if (!data.success) {

        throw new Error(
          data.error ||
          "Calculation failed."
        );

      }


      // -------------------------
      // SHOW Z
      // -------------------------

      $("z").textContent =
        Number(data.Z)
          .toFixed(4);


      // -------------------------
      // SHOW Y
      // -------------------------

      $("y").textContent =
        Number(data.Y)
          .toFixed(4);


      // -------------------------
      // SHOW X
      // -------------------------

      $("x").textContent =
        Number(data.X)
          .toFixed(4);


      // -------------------------
      // SHOW L
      // -------------------------

      $("l").textContent =
        Number(data.L)
          .toFixed(2) +
        " L/hr";


      // -------------------------
      // SHOW S
      // -------------------------

      $("s").textContent =
        Number(data.S)
          .toFixed(2);


      // -------------------------
      // SHOW T
      // -------------------------

      $("result").textContent =
        Number(data.T)
          .toFixed(2);


      $("t").textContent =
        Number(data.T)
          .toFixed(2);


      // -------------------------
      // CHART RANGE
      // -------------------------

      const range =
        data.chart_range;


      if (range) {

        $("band").textContent =
          `${data.model}: X = ` +
          `${Number(data.X).toFixed(4)} ` +
          `falls in ${range.min}–${range.max}. ` +
          `Chart value L = ` +
          `${Number(data.L).toFixed(2)} L/hr.`;

      } else {

        $("band").textContent =
          `${data.model}: chart value L = ` +
          `${Number(data.L).toFixed(2)} L/hr.`;

      }


      // -------------------------
      // SHOW RESULT
      // -------------------------

      $("resultCard")
        .classList
        .remove("hidden");


      // -------------------------
      // SAVE BUTTON
      // -------------------------

      if (
        !window.calculatorIncognito
      ) {

        $("saveForFuture")
          .classList
          .remove("hidden");

      }


      $("saveMessage")
        .textContent =
        "";


      // -------------------------
      // SCROLL
      // -------------------------

      $("resultCard")
        .scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });


    } catch (err) {

      console.error(err);


      $("resultCard")
        .classList
        .add("hidden");


      $("error").textContent =
        err?.message ||
        "Something went wrong.";

    }

  }
);


// ============================================================
// CLEAR
// ============================================================

$("clear").addEventListener(
  "click",
  () => {

    $("a").value =
      "";

    $("b").value =
      "";

    $("c").value =
      "";

    $("d").value =
      "";

    $("e1").value =
      "";

    $("q1").value =
      "";

    $("q2").value =
      "";

    $("manualModel").value =
      "";


    resetE2();

    resetResult();


    $("saveForFuture")
      .classList
      .add("hidden");


    $("error").textContent =
      "";

    $("saveMessage").textContent =
      "";


    $("a").focus();

  }
);


// ============================================================
// SAVE DETAILS FOR FUTURE
// ============================================================

$("saveForFuture").addEventListener(
  "click",
  async () => {

    $("saveMessage").textContent =
      "Saving site details...";


    const siteId =
      siteIdInput.value.trim();


    const model =
      getCurrentModel();


    const currentHmr =
      Number(
        $("a").value
      );


    const currentKwh =
      Number(
        $("b").value
      );


    // IMPORTANT:
    // E2 is saved as current_balance.
    // On the next visit it will be
    // loaded into E1.
    const E2 =
      Number(
        $("e2")
          .textContent
          .replace(" L", "")
      );

// -------------------------
    // VALIDATION
    // -------------------------

    if (
      !Number.isFinite(A) ||
      !Number.isFinite(B) ||
      !Number.isFinite(C) ||
      !Number.isFinite(D)
    ) {

      $("error").textContent =
        "Please enter valid HMR and kWh readings.";

      return;

    }


    if (
      !Number.isFinite(E1) ||
      !Number.isFinite(Q1) ||
      !Number.isFinite(Q2)
    ) {

      $("error").textContent =
        "Please enter valid E1, Q1 and Q2 values.";

      return;

    }


    if (
      A <= C
    ) {

      $("error").textContent =
        "Current HMR must be greater than Previous HMR.";

      return;

    }


    if (
      B < D
    ) {

      $("error").textContent =
        "Current kWh cannot be lower than Previous kWh.";

      return;

    }


    // -------------------------
    // E2
    // -------------------------

    const E2 =
      Q1 + Q2;


    $("e2").textContent =
      E2.toFixed(2) + " L";


    $("currentBalanceAfterFillingBox")
      .classList
      .remove("hidden");


    // -------------------------
    // SEND TO WORKER
    // -------------------------

    const payload = {

      model:
        selectedModel,

      A:
        A,

      B:
        B,

      C:
        C,

      D:
        D,

      // IMPORTANT:
      // Worker E = E1
      E:
        E1

    };


    try {

      const res =
        await fetch(
          "/api/calculate",
          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body:
              JSON.stringify(payload)

          }
        );


      const responseText =
        await res.text();


      let data =
        {};


      if (
        responseText.trim()
      ) {

        try {

          data =
            JSON.parse(
              responseText
            );

        } catch {

          throw new Error(
            `Server returned invalid JSON (${res.status}).`
          );

        }

      }


      if (!res.ok) {

        throw new Error(
          data.error ||
          `Server Error (${res.status})`
        );

      }


      if (!data.success) {

        throw new Error(
          data.error ||
          "Calculation failed."
        );

      }


      // -------------------------
      // SHOW Z
      // -------------------------

      $("z").textContent =
        Number(data.Z)
          .toFixed(4);


      // -------------------------
      // SHOW Y
      // -------------------------

      $("y").textContent =
        Number(data.Y)
          .toFixed(4);


      // -------------------------
      // SHOW X
      // -------------------------

      $("x").textContent =
        Number(data.X)
          .toFixed(4);


      // -------------------------
      // SHOW L
      // -------------------------

      $("l").textContent =
        Number(data.L)
          .toFixed(2) +
        " L/hr";


      // -------------------------
      // SHOW S
      // -------------------------

      $("s").textContent =
        Number(data.S)
          .toFixed(2);


      // -------------------------
      // SHOW T
      // -------------------------

      $("result").textContent =
        Number(data.T)
          .toFixed(2);


      $("t").textContent =
        Number(data.T)
          .toFixed(2);


      // -------------------------
      // CHART RANGE
      // -------------------------

      const range =
        data.chart_range;


      if (range) {

        $("band").textContent =
          `${data.model}: X = ` +
          `${Number(data.X).toFixed(4)} ` +
          `falls in ${range.from}–${range.to}. ` +
          `Chart value L = ` +
          `${Number(data.L).toFixed(2)} L/hr.`;

      } else {

        $("band").textContent =
          `${data.model}: chart value L = ` +
          `${Number(data.L).toFixed(2)} L/hr.`;

      }


      // -------------------------
      // SHOW RESULT
      // -------------------------

      $("resultCard")
        .classList
        .remove("hidden");


      // -------------------------
      // SAVE BUTTON
      // -------------------------

      if (
        !window.calculatorIncognito
      ) {

        $("saveForFuture")
          .classList
          .remove("hidden");

      }


      $("saveMessage")
        .textContent =
        "";


      // -------------------------
      // SCROLL
      // -------------------------

      $("resultCard")
        .scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });


    } catch (err) {

      console.error(err);


      $("resultCard")
        .classList
        .add("hidden");


      $("error").textContent =
        err?.message ||
        "Something went wrong.";

    }

  }
);


// ============================================================
// CLEAR
// ============================================================

$("clear").addEventListener(
  "click",
  () => {

    $("a").value =
      "";

    $("b").value =
      "";

    $("c").value =
      "";

    $("d").value =
      "";

    $("e1").value =
      "";

    $("q1").value =
      "";

    $("q2").value =
      "";

    $("manualModel").value =
      "";


    resetE2();

    resetResult();


    $("saveForFuture")
      .classList
      .add("hidden");


    $("error").textContent =
      "";

    $("saveMessage").textContent =
      "";


    $("a").focus();

  }
);



// ============================================================
// SAVE DETAILS FOR FUTURE — REQUEST ADMIN APPROVAL
// ============================================================

$("saveForFuture").addEventListener(
  "click",
  async () => {

    const siteId =
      siteIdInput.value.trim();

    const model =
      getCurrentModel();

    const currentHmr =
      Number($("a").value);

    const currentKwh =
      Number($("b").value);

    const E2Text =
      $("e2").textContent
        .replace(" L", "")
        .trim();

    const E2 =
      Number(E2Text);


    // -------------------------
    // VALIDATION
    // -------------------------

    if (!siteId) {

      $("saveMessage").textContent =
        "Site ID is missing.";

      return;

    }


    if (!model) {

      $("saveMessage").textContent =
        "DG Model is missing.";

      return;

    }


    if (
      !Number.isFinite(currentHmr) ||
      !Number.isFinite(currentKwh)
    ) {

      $("saveMessage").textContent =
        "Please enter valid current HMR and kWh readings.";

      return;

    }


    if (!Number.isFinite(E2)) {

      $("saveMessage").textContent =
        "Please calculate E2 before requesting to save.";

      return;

    }


    // -------------------------
    // CONFIRMATION
    // -------------------------

    const confirmed =
      window.confirm(
        "Are you sure you want to request saving these details?\n\n" +
        "The details will be sent to Admin for review and approval."
      );


    if (!confirmed) {

      $("saveMessage").textContent =
        "Save request cancelled.";

      return;

    }


    // -------------------------
    // DISABLE BUTTON
    // -------------------------

    const button =
      $("saveForFuture");

    button.disabled =
      true;

    $("saveMessage").textContent =
      "Sending save request to Admin...";


    // -------------------------
    // REQUEST PAYLOAD
    // -------------------------

    const payload = {

      site_id:
        siteId,

      model:
        model,

      current_hmr:
        currentHmr,

      current_kwh:
        currentKwh,

      // E2 becomes the
      // future E1 after approval.
      current_balance:
        E2

    };


    try {

      const response =
        await fetch(
          "/api/save-request",
          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body:
              JSON.stringify(payload)

          }
        );


      const responseText =
        await response.text();


      let data =
        {};


      if (
        responseText.trim()
      ) {

        try {

          data =
            JSON.parse(
              responseText
            );

        } catch {

          throw new Error(
            `Server returned invalid JSON (${response.status}).`
          );

        }

      }


      if (!response.ok) {

        throw new Error(
          data.error ||
          `Server error (${response.status}).`
        );

      }


      if (!data.success) {

        throw new Error(
          data.error ||
          "Unable to send save request."
        );

      }


      // -------------------------
      // SUCCESS
      // -------------------------

      $("saveMessage").textContent =
        "✓ Save request sent to Admin. Waiting for approval.";


      button.textContent =
        "Request Sent ✓";


      button.disabled =
        true;


    } catch (error) {

      console.error(error);


      $("saveMessage").textContent =
        error?.message ||
        "Unable to send save request.";


      button.disabled =
        false;

    }

  }
);
      

// ============================================================
// LOAD LAST SITE ID
// ============================================================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    const lastSite =
      localStorage.getItem(
        "lastSiteId"
      );


    if (lastSite) {

      siteIdInput.value =
        lastSite;

    }

  }
);

     
