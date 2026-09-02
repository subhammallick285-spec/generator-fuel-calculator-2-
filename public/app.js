const $ = (id) =>
  document.getElementById(id);


// -------------------------
// ELEMENTS
// -------------------------

const siteIdInput = $("siteId");
const findSiteButton = $("findSite");
const findSiteText = $("findSiteText");
const findSpinner = $("findSpinner");

const siteSearchCard = $("siteSearchCard");
const siteSearchMessage = $("siteSearchMessage");

const siteInfoCard = $("siteInfoCard");
const calculatorCard = $("calculatorCard");

const changeSiteButton = $("changeSite");

const activeModel = $("activeModel");


const MODEL_NAMES = {
  eicher10: "Eicher 10 KVA",
  eicher20: "Eicher 20 KVA",
  koel20: "KOEL 20 KVA",
  mahindra20: "Mahindra 20 KVA",
  mahindra10: "Mahindra 10 KVA"
};


// -------------------------
// FORMAT NUMBER
// -------------------------

function formatNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "—";
  }

  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 4
  });
}


// -------------------------
// SHOW MESSAGE
// -------------------------

function showSiteMessage(message, type = "") {

  siteSearchMessage.textContent = message;

  siteSearchMessage.className =
    "message " + type;
}


// -------------------------
// SET LOADING
// -------------------------

function setFindLoading(loading) {

  findSiteButton.disabled = loading;

  if (loading) {

    findSiteText.textContent =
      "Checking...";

    findSpinner.classList.remove("hidden");

  } else {

    findSiteText.textContent =
      "Find Site";

    findSpinner.classList.add("hidden");
  }
}


// -------------------------
// FIND SITE
// -------------------------

async function findSite() {

  const siteId =
    siteIdInput.value.trim();

  siteInfoCard.classList.add("hidden");
  calculatorCard.classList.add("hidden");
  $("resultCard").classList.add("hidden");

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

    const response = await fetch(
      `/api/site?site_id=${encodeURIComponent(siteId)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
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

      prepareManualCalculator();

      return;
    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        `Server error (${response.status}).`
      );
    }


    if (!data.success || !data.site) {

      throw new Error(
        data.error ||
        "Unable to load site."
      );
    }


    // -------------------------
    // SITE FOUND
    // -------------------------

    const site = data.site;

    localStorage.setItem(
      "lastSiteId",
      site.site_id
    );


    displaySite(site);

    prepareExistingSiteCalculator(site);

    showSiteMessage(
      "✓ Existing site data loaded automatically.",
      "success-message"
    );


  } catch (error) {

    showSiteMessage(
      error?.message ||
      "Unable to connect to the site database.",
      "error-message"
    );

  } finally {

    setFindLoading(false);
  }
}


// -------------------------
// DISPLAY SITE
// -------------------------

function displaySite(site) {

  const modelName =
    MODEL_NAMES[site.model] ||
    site.model ||
    "Unknown";


  $("displaySiteName").textContent =
    site.site_name ||
    site.site_id;

  $("displayModel").textContent =
    modelName;

  $("displayHmr").textContent =
    formatNumber(site.current_hmr);

  $("displayKwh").textContent =
    formatNumber(site.current_kwh);

  $("displayBalance").textContent =
    `${formatNumber(site.current_balance)} L`;


  siteInfoCard.classList.remove("hidden");
}

// -------------------------
// EXISTING SITE CALCULATOR
// -------------------------

function prepareExistingSiteCalculator(site) {

  activeModel.textContent =
    MODEL_NAMES[site.model] ||
    site.model ||
    "Unknown";


  // Saved D1 values are PREVIOUS readings
  $("c").value =
    site.current_hmr ?? "";

  $("d").value =
    site.current_kwh ?? "";

  $("e").value =
    site.current_balance ?? "";


  // Current readings must be entered by the user
  $("a").value = "";
  $("b").value = "";


  // Reset fuel filling
  $("fuelFilling").value = "";


  // Hide old balance-after-filling result
  $("balanceAfterFillingBox")
    .classList
    .add("hidden");

  $("balanceAfterFilling").textContent =
    "—";


  $("calculatorDescription").textContent =
    "Previous HMR, kWh and balance were loaded from your saved site data. Enter the current meter readings.";


  calculatorCard.classList.remove("hidden");


  setTimeout(() => {
    $("a").focus();
  }, 150);
}


// -------------------------
// -------------------------
// MANUAL / INCOGNITO CALCULATOR
// -------------------------

function prepareManualCalculator() {

  delete siteInfoCard.dataset.model;

  activeModel.textContent =
    "Manual Selection";


  $("calculatorDescription").textContent =
    "Enter all generator readings manually. Nothing will be saved to D1.";


  // Previous readings
  $("c").value = "";
  $("d").value = "";
  $("e").value = "";


  // Current readings
  $("a").value = "";
  $("b").value = "";


  // Fuel filling
  $("fuelFilling").value = "";


  // Reset balance-after-filling display
  $("balanceAfterFilling").textContent =
    "—";

  $("balanceAfterFillingBox")
    .classList
    .add("hidden");


  // Hide old result
  $("resultCard")
    .classList
    .add("hidden");

  $("error").textContent = "";


  calculatorCard.classList.remove("hidden");


  setTimeout(() => {
    $("a").focus();
  }, 150);
}


// -------------------------
// CHANGE SITE
// -------------------------

changeSiteButton.addEventListener(
  "click",
  () => {

    siteInfoCard.classList.add("hidden");
    calculatorCard.classList.add("hidden");
    $("resultCard").classList.add("hidden");

    siteSearchMessage.textContent = "";

    siteIdInput.focus();
  }
);


// -------------------------
// FIND BUTTON
// -------------------------

findSiteButton.addEventListener(
  "click",
  findSite
);

// -------------------------
// INCOGNITO / MANUAL MODE
// -------------------------

const incognitoModeButton =
  $("incognitoMode");

incognitoModeButton.addEventListener(
  "click",
  () => {

    siteInfoCard.classList.add("hidden");

    $("resultCard")
      .classList
      .add("hidden");

    siteSearchMessage.textContent = "";

    prepareManualCalculator();
  }
);



// -------------------------
// ENTER KEY
// -------------------------

siteIdInput.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {
      event.preventDefault();
      findSite();
    }

  }
);


// -------------------------
// CALCULATE
// -------------------------

$("calculate").addEventListener(
  "click",
  async () => {

    $("error").textContent = "";

    const fuelFilling =
  Number($("fuelFilling").value || 0);

const previousBalance =
  Number($("e").value || 0);

const balanceAfterFilling =
  previousBalance + fuelFilling;

// Show balance after filling
$("balanceAfterFilling").textContent =
  balanceAfterFilling.toFixed(2) + " L";

$("balanceAfterFillingBox")
  .classList
  .remove("hidden");

const payload = {

  model:
    getCurrentModel(),

  A:
    $("a").value,

  B:
    $("b").value,

  C:
    $("c").value,

  D:
    $("d").value,

  E:
    balanceAfterFilling
};


    try {

      const res = await fetch(
        "/api/calculate",
        {
          method: "POST",

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

      let data = {};


      if (responseText.trim()) {

        try {

          data =
            JSON.parse(responseText);

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
      // SHOW RESULT
      // -------------------------

      $("resultCard")
        .classList
        .remove("hidden");


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


      $("resultCard")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });


    } catch (err) {

      $("resultCard")
        .classList
        .add("hidden");

      $("error").textContent =
        err?.message ||
        "Something went wrong.";

    }

  }
);


// -------------------------
// GET CURRENT MODEL
// -------------------------

function getCurrentModel() {

  const siteModel =
    siteInfoCard.dataset.model;

  if (siteModel) {
    return siteModel;
  }

  return $("manualModel").value;
}


// -------------------------
// CLEAR
// -------------------------

$("clear").addEventListener(
  "click",
  () => {

    $("a").value = "";
    $("b").value = "";
    $("c").value = "";
    $("d").value = "";
    $("e").value = "";
    $("fuelFilling").value = "";

$("balanceAfterFilling").textContent =
  "—";

$("balanceAfterFillingBox")
  .classList
  .add("hidden");

    $("resultCard")
      .classList
      .add("hidden");

    $("error").textContent = "";

    $("a").focus();
  }
);


// -------------------------
// STORE MODEL WHEN SITE FOUND
// -------------------------

const originalDisplaySite =
  displaySite;

displaySite = function(site) {

  siteInfoCard.dataset.model =
    site.model;

  originalDisplaySite(site);
};


// -------------------------
// LOAD LAST SITE
// -------------------------

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
