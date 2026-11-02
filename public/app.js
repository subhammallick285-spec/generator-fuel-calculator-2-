// ============================================================
// GENERATOR FUEL CALCULATOR
// COMPLETE FRESH APP.JS
// ============================================================


// ============================================================
// HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// ELEMENTS
// ============================================================

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


// ============================================================
// MODEL NAMES
// ============================================================

const MODEL_NAMES = {
  eicher10: "Eicher 10 KVA",
  eicher20: "Eicher 20 KVA",
  koel20: "KOEL 20 KVA",
  mahindra20: "Mahindra 20 KVA",
  mahindra10: "Mahindra 10 KVA"
};


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return "—";
  }
  return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
}


// ============================================================
// SHOW SITE MESSAGE
// ============================================================

function showSiteMessage(message, type = "") {
  siteSearchMessage.textContent = message;
  siteSearchMessage.className = "message " + type;
}


// ============================================================
// FIND BUTTON LOADING
// ============================================================

function setFindLoading(loading) {
  findSiteButton.disabled = loading;
  if (loading) {
    findSiteText.textContent = "Checking...";
    findSpinner.classList.remove("hidden");
  } else {
    findSiteText.textContent = "Find Site";
    findSpinner.classList.add("hidden");
  }
}


// ============================================================
// RESET RESULT
// ============================================================

function resetResult() {
  $("resultCard").classList.add("hidden");
  $("result").textContent = "—";
  $("z").textContent = "—";
  $("y").textContent = "—";
  $("x").textContent = "—";
  $("l").textContent = "—";
  $("s").textContent = "—";
  $("t").textContent = "—";
  $("band").textContent = "";
}


// ============================================================
// RESET E2
// ============================================================

function resetE2() {
  $("e2").textContent = "—";
  $("currentBalanceAfterFillingBox").classList.add("hidden");
}


// ============================================================
// FIND SITE
// ============================================================

async function findSite() {
  const siteId = siteIdInput.value.trim();

  siteInfoCard.classList.add("hidden");
  calculatorCard.classList.add("hidden");
  resetResult();

  if (!siteId) {
    showSiteMessage("Please enter a Site ID.", "error-message");
    siteIdInput.focus();
    return;
  }

  setFindLoading(true);
  showSiteMessage("Checking saved site data...");

  try {
    const response = await fetch(`/api/site?site_id=${encodeURIComponent(siteId)}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    const responseText = await response.text();
    let data = {};

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned invalid JSON (${response.status}).`);
      }
    }

    if (response.status === 404) {
      showSiteMessage("Site not found. You can continue with the normal manual calculator.", "warning-message");
      prepareManualCalculator(false);
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status}).`);
    }

    if (!data.success || !data.site) {
      throw new Error(data.error || "Unable to load site.");
    }

    const site = data.site;

    // --- DATE AUTO-FILL LOGIC ---
    if ($("dateOfFilling")) {
        if (site.date_of_filling) {
            $("dateOfFilling").value = site.date_of_filling;
        } else if (!$("dateOfFilling").value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            $("dateOfFilling").value = `${yyyy}-${mm}-${dd}`;
        }
    }

    localStorage.setItem("lastSiteId", site.site_id);

    displaySite(site);
    prepareExistingSiteCalculator(site);

    showSiteMessage("✓ Existing site data loaded automatically.", "success-message");

  } catch (error) {
    console.error(error);
    showSiteMessage(error?.message || "Unable to connect to the site database.", "error-message");
  } finally {
    setFindLoading(false);
  }
}


// ============================================================
// DISPLAY SITE
// ============================================================

function displaySite(site) {
  siteInfoCard.dataset.model = site.model || "";

  const modelName = MODEL_NAMES[site.model] || site.model || "Unknown";

  // Show Date
  if ($("displayDate")) {
    $("displayDate").textContent = site.date_of_filling || "—";
  }

  $("displaySiteName").textContent = site.site_name || site.site_id || "—";
  $("displayModel").textContent = modelName;
  $("displayHmr").textContent = formatNumber(site.current_hmr);
  $("displayKwh").textContent = formatNumber(site.current_kwh);
  $("displayBalance").textContent = `${formatNumber(site.current_balance)} L`;

  siteInfoCard.classList.remove("hidden");
}


// ============================================================
// EXISTING SITE CALCULATOR
// ============================================================

function prepareExistingSiteCalculator(site) {
  window.calculatorIncognito = false;

  $("manualModelField").classList.add("hidden");
  activeModel.textContent = MODEL_NAMES[site.model] || site.model || "Unknown";

  $("c").value = site.current_hmr ?? "";
  $("d").value = site.current_kwh ?? "";
  $("e1").value = site.current_balance ?? "";

  $("a").value = "";
  $("b").value = "";
  $("q1").value = "";
  $("q2").value = "";

  resetE2();
  resetResult();

  $("saveForFuture").classList.add("hidden");
  $("saveMessage").textContent = "";

  $("calculatorDescription").textContent = "Previous HMR, kWh and balance after filling were loaded automatically. Enter the current readings and balance.";

  calculatorCard.classList.remove("hidden");

  setTimeout(() => { $("a").focus(); }, 150);
}


// ============================================================
// MANUAL / INCOGNITO CALCULATOR
// ============================================================

function prepareManualCalculator(isIncognito = false) {
  window.calculatorIncognito = isIncognito;

  $("manualModelField").classList.remove("hidden");
  delete siteInfoCard.dataset.model;
  activeModel.textContent = "Manual Selection";

  $("calculatorDescription").textContent = isIncognito
      ? "Manual / Incognito mode. Nothing will be saved to D1."
      : "Enter all generator readings manually.";

  $("c").value = "";
  $("d").value = "";
  $("e1").value = "";
  $("a").value = "";
  $("b").value = "";
  $("q1").value = "";
  $("q2").value = "";
  $("manualModel").value = "";

  resetE2();
  resetResult();

  $("saveForFuture").classList.add("hidden");
  $("saveMessage").textContent = "";
  $("error").textContent = "";

  calculatorCard.classList.remove("hidden");

  setTimeout(() => { $("manualModel").focus(); }, 150);
}


// ============================================================
// GET CURRENT MODEL
// ============================================================

function getCurrentModel() {
  const siteModel = siteInfoCard.dataset.model;
  if (siteModel) {
    return siteModel;
  }
  return $("manualModel").value;
}


// ============================================================
// EVENT LISTENERS
// ============================================================

findSiteButton.addEventListener("click", findSite);

siteIdInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    findSite();
  }
});

changeSiteButton.addEventListener("click", () => {
  siteInfoCard.classList.add("hidden");
  calculatorCard.classList.add("hidden");
  resetResult();
  siteSearchMessage.textContent = "";
  siteIdInput.focus();
});

$("incognitoMode").addEventListener("click", () => {
  siteInfoCard.classList.add("hidden");
  siteSearchMessage.textContent = "";
  prepareManualCalculator(true);
});


// ============================================================
// CALCULATE
// ============================================================

$("calculate").addEventListener("click", async () => {
  $("error").textContent = "";

  const selectedModel = getCurrentModel();
  if (!selectedModel) {
    $("error").textContent = "Please select a DG Model.";
    $("manualModel").focus();
    return;
  }

  const A = Number($("a").value);
  const B = Number($("b").value);
  const C = Number($("c").value);
  const D = Number($("d").value);
  const E1 = Number($("e1").value);
  const Q1 = Number($("q1").value);
  const Q2 = Number($("q2").value);

  if (!Number.isFinite(A) || !Number.isFinite(B) || !Number.isFinite(C) || !Number.isFinite(D)) {
    $("error").textContent = "Please enter valid HMR and kWh readings.";
    return;
  }

  if (!Number.isFinite(E1) || !Number.isFinite(Q1) || !Number.isFinite(Q2)) {
    $("error").textContent = "Please enter valid E1, Q1 and Q2 values.";
    return;
  }

  if (A <= C) {
    $("error").textContent = "Current HMR must be greater than Previous HMR.";
    return;
  }

  if (B < D) {
    $("error").textContent = "Current kWh cannot be lower than Previous kWh.";
    return;
  }

  const E2 = Q1 + Q2;
  window.lastCalculatedE2 = E2; // Use window to avoid reference errors

  $("e2").textContent = E2.toFixed(2) + " L";
  $("currentBalanceAfterFillingBox").classList.remove("hidden");

  const payload = {
    model: selectedModel,
    current_hmr: A,
    current_kwh: B,
    previous_hmr: C,
    previous_kwh: D,
    previous_balance: E1
  };

  try {
    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();
    let data = {};

    if (responseText.trim()) {
      try { data = JSON.parse(responseText); } catch { throw new Error(`Server returned invalid JSON (${res.status}).`); }
    }

    if (!res.ok) throw new Error(data.error || `Server Error (${res.status})`);
    if (!data.success) throw new Error(data.error || "Calculation failed.");

    $("z").textContent = Number(data.Z).toFixed(4);
    $("y").textContent = Number(data.Y).toFixed(4);
    $("x").textContent = Number(data.X).toFixed(4);
    $("l").textContent = Number(data.L).toFixed(2) + " L/hr";
    $("s").textContent = Number(data.S).toFixed(2);
    $("result").textContent = Number(data.T).toFixed(2);
    $("t").textContent = Number(data.T).toFixed(2);

    const range = data.chart_range;
    if (range) {
      $("band").textContent = `${data.model}: X = ${Number(data.X).toFixed(4)} falls in ${range.min}–${range.max}. Chart value L = ${Number(data.L).toFixed(2)} L/hr.`;
    } else {
      $("band").textContent = `${data.model}: chart value L = ${Number(data.L).toFixed(2)} L/hr.`;
    }

    $("resultCard").classList.remove("hidden");

    if (!window.calculatorIncognito) {
      $("saveForFuture").classList.remove("hidden");
    }

    $("saveMessage").textContent = "";
    $("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    console.error(err);
    $("resultCard").classList.add("hidden");
    $("error").textContent = err?.message || "Something went wrong.";
  }
});


// ============================================================
// CLEAR
// ============================================================

$("clear").addEventListener("click", () => {
  $("a").value = "";
  $("b").value = "";
  $("c").value = "";
  $("d").value = "";
  $("e1").value = "";
  $("q1").value = "";
  $("q2").value = "";
  $("manualModel").value = "";

  resetE2();
  resetResult();
  window.lastCalculatedE2 = null;

  $("saveForFuture").classList.add("hidden");
  $("error").textContent = "";
  $("saveMessage").textContent = "";

  $("a").focus();
});


// ============================================================
// SAVE DETAILS FOR FUTURE
// ============================================================

$("saveForFuture").addEventListener("click", async () => {
  const siteId = siteIdInput.value.trim();
  const dateOfFilling = $("dateOfFilling").value; 
  
  if (!dateOfFilling) {
    $("saveMessage").textContent = "Error: Please select a Date of Filling before saving.";
    $("saveMessage").style.color = "#d32f2f";
    return;
  }

  const model = getCurrentModel();
  const currentHmr = Number($("a").value);
  const currentKwh = Number($("b").value);
  const E2 = window.lastCalculatedE2;

  if (E2 === null || !Number.isFinite(E2)) {
    $("saveMessage").textContent = "Please click Calculate first.";
    return;
  }

  $("saveMessage").textContent = "Sending save request to Admin...";
  $("saveMessage").style.color = "";

  try {
    const response = await fetch("/api/save-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          date_of_filling: dateOfFilling,
          model: model,
          current_hmr: currentHmr,
          current_kwh: currentKwh,
          current_balance: E2
        })
      }
    );

    const data = await response.json();
    $("saveMessage").textContent = data.message || "Save request sent.";
    $("saveMessage").style.color = "#2e7d32";

  } catch (error) {
    console.error(error);
    $("saveMessage").textContent = error?.message || "Unable to send save request.";
    $("saveMessage").style.color = "#d32f2f";
  }
});


// ============================================================
// GCU FAULT MODE ESTIMATION
// ============================================================

const gcuCheck = $("gcu_faulty_check");
const gcuBox = $("gcu_fault_box");

if (gcuCheck) {
    gcuCheck.addEventListener("change", () => {
        if (gcuCheck.checked) {
            gcuBox.classList.remove("hidden");
        } else {
            gcuBox.classList.add("hidden");
        }
    });

    $("btn_estimate").addEventListener("click", async () => {
        const selectedModel = getCurrentModel();
        if (!selectedModel) {
            $("estimate_msg").style.color = "#d32f2f";
            $("estimate_msg").textContent = "Please select a model first.";
            return;
        }

        const previousHmr = Number($("c").value);
        const previousKwh = Number($("d").value);
        const previousBalance = Number($("e1").value);
        const currentBalance = Number($("gcu_current_balance").value);

        if (!Number.isFinite(previousHmr) || !Number.isFinite(previousKwh) || !Number.isFinite(previousBalance)) {
            $("estimate_msg").style.color = "#d32f2f";
            $("estimate_msg").textContent = "Please ensure Previous HMR, kWh, and Balance are loaded above.";
            return;
        }
        
        if (!Number.isFinite(currentBalance)) {
            $("estimate_msg").style.color = "#d32f2f";
            $("estimate_msg").textContent = "Please enter a valid Current Balance.";
            return;
        }

        $("estimate_msg").style.color = "#666";
        $("estimate_msg").textContent = "Calculating...";

        try {
            const res = await fetch("/api/estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    previous_hmr: previousHmr,
                    previous_kwh: previousKwh,
                    previous_balance: previousBalance,
                    current_balance_before_filling: currentBalance 
                })
            });

            const data = await res.json();
            
            if (!data.success) throw new Error(data.error);

            $("a").value = data.data.estimated_current_hmr; 
            $("b").value = data.data.estimated_current_kwh; 

            $("estimate_msg").style.color = "#2e7d32";
            $("estimate_msg").textContent = `Success! Consumed ${data.data.total_fuel_consumed}L. Values auto-filled.`;
            
        } catch (err) {
            $("estimate_msg").style.color = "#d32f2f";
            $("estimate_msg").textContent = err.message;
        }
    });
}


// ============================================================
// LOAD LAST SITE ID & AUTO-FILL TODAY'S DATE
// ============================================================

window.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const dateInput = $("dateOfFilling");
    if (dateInput && !dateInput.value) {
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    const lastSite = localStorage.getItem("lastSiteId");
    if (lastSite) {
      siteIdInput.value = lastSite;
    }
});
