const $ = (id) => document.getElementById(id);


/* =========================================================
   MESSAGE HELPERS
========================================================= */

function message(element, text, type = "") {

  if (!element) return;

  element.textContent = text;

  element.className =
    type
      ? `message ${type}`
      : "message";
}


function clearMessage(element) {

  if (!element) return;

  element.textContent = "";
  element.className = "message";
}


/* =========================================================
   ADMIN KEY
========================================================= */

function getAdminKey() {
  return (
    sessionStorage.getItem("adminKey") ||
    $("adminKey")?.value.trim() ||
    ""
  );
}

  

function adminHeaders(json = false) {

  const headers = {
    "Accept": "application/json",
    "X-Admin-Key": getAdminKey()
  };

  if (json) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   JSON RESPONSE HELPER
========================================================= */

async function readJsonResponse(response) {

  const text =
    await response.text();

  let data = {};

  if (text.trim()) {

    try {

      data = JSON.parse(text);

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

  return data;
}


/* =========================================================
   SHOW SITE
========================================================= */

function showSite(site) {

  if (!site) return;

  $("siteInfo")
    ?.classList
    .add("show");


  $("siteName").textContent =
    site.site_name ?? "—";


  $("siteModel").textContent =
    site.model ?? "—";


  $("siteHmr").textContent =
    site.current_hmr ?? "—";


  $("siteKwh").textContent =
    site.current_kwh ?? "—";


  $("siteBalance").textContent =
    site.current_balance ?? "—";


  if (site.model) {

    $("model").value =
      site.model;

    $("editModel").value =
      site.model;

    $("extractedModel").value =
      site.model;
  }


  if (
    site.current_hmr !== null &&
    site.current_hmr !== undefined
  ) {

    $("currentHmr").value =
      site.current_hmr;

    $("editHmr").value =
      site.current_hmr;

    $("extractedHmr").value =
      site.current_hmr;
  }


  if (
    site.current_kwh !== null &&
    site.current_kwh !== undefined
  ) {

    $("currentKwh").value =
      site.current_kwh;

    $("editKwh").value =
      site.current_kwh;

    $("extractedKwh").value =
      site.current_kwh;
  }


  if (
    site.current_balance !== null &&
    site.current_balance !== undefined
  ) {

    $("currentBalance").value =
      site.current_balance;

    $("editBalance").value =
      site.current_balance;

    $("extractedBalance").value =
      site.current_balance;
  }


  $("editSiteId").value =
    site.site_id || "";


  $("editSiteName").value =
    site.site_name || "";
}


/* =========================================================
   LOAD EXISTING SITE
========================================================= */

$("loadSite")
?.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("authMessage")
    );


    const siteId =
      $("siteId")
        .value
        .trim();


    if (!siteId) {

      message(
        $("authMessage"),
        "Please enter a Site ID.",
        "error"
      );

      return;
    }


    const adminKey =
      getAdminKey();


    if (!adminKey) {

      message(
        $("authMessage"),
        "Please enter the Admin Key.",
        "error"
      );

      return;
    }


    const button =
      $("loadSite");


    button.disabled = true;

    button.textContent =
      "Loading...";


    try {

      const response =
        await fetch(
          "/api/site?site_id=" +
          encodeURIComponent(siteId),
          {
            method: "GET",
            headers: adminHeaders()
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Unable to load site."
        );
      }


      if (!data.site) {

        throw new Error(
          "Site data was not returned."
        );
      }


      showSite(
        data.site
      );


      message(
        $("authMessage"),
        "Site loaded successfully.",
        "success"
      );


    } catch (error) {

      message(
        $("authMessage"),
        error?.message ||
        "Unable to load site.",
        "error"
      );


    } finally {

      button.disabled =
        false;

      button.textContent =
        "🔄 LOAD EXISTING SITE";
    }

  }
);


/* =========================================================
   IMAGE SELECTION
========================================================= */

$("imageInput")
?.addEventListener(
  "change",
  () => {

    clearMessage(
      $("authMessage")
    );


    const file =
      $("imageInput")
        .files?.[0];


    if (!file) {

      $("preview")
        ?.classList
        .remove("show");

      return;
    }


    if (
      !file.type.startsWith("image/")
    ) {

      message(
        $("authMessage"),
        "Please select an image file.",
        "error"
      );

      $("imageInput").value =
        "";

      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      (event) => {

        $("previewImage").src =
          event.target.result;


        $("fileName").textContent =
          file.name;


        $("preview")
          .classList
          .add("show");
      };


    reader.onerror =
      () => {

        message(
          $("authMessage"),
          "Unable to read the selected image.",
          "error"
        );
      };


    reader.readAsDataURL(
      file
    );

  }
);


/* =========================================================
   MANUAL READING TOGGLE
========================================================= */

$("manualButton")
?.addEventListener(
  "click",
  () => {

    const section =
      $("manualSection");


    if (!section) return;


    section.classList.toggle(
      "show"
    );


    if (
      section.classList.contains(
        "show"
      )
    ) {

      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  }
);


/* =========================================================
   EXTRACT DETAILS FROM IMAGE
========================================================= */

$("extractButton")
?.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("authMessage")
    );


    const file =
      $("imageInput")
        .files?.[0];


    const adminKey =
      getAdminKey();


    const siteId =
      $("siteId")
        .value
        .trim();


    if (!file) {

      message(
        $("authMessage"),
        "Please upload an image first.",
        "error"
      );

      return;
    }


    if (!adminKey) {

      message(
        $("authMessage"),
        "Please enter the Admin Key.",
        "error"
      );

      return;
    }


    if (!siteId) {

      message(
        $("authMessage"),
        "Please enter the Site ID first.",
        "error"
      );

      return;
    }


    const form =
      new FormData();


    form.append(
      "image",
      file
    );


    form.append(
      "site_id",
      siteId
    );


    const button =
      $("extractButton");


    button.disabled =
      true;

    button.textContent =
      "EXTRACTING...";


    $("extractLoading")
      ?.classList
      .add("show");


    try {

      const response =
        await fetch(
          "/api/admin/extract-image",
          {
            method: "POST",

            headers: {
              "X-Admin-Key":
                adminKey,

              "Accept":
                "application/json"
            },

            body: form
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Image extraction failed."
        );
      }


      /*
       * Supports either:
       *
       * data.model
       *
       * or
       *
       * data.extracted.model
       */

      const extracted =
        data.extracted ||
        data.data ||
        data;


      if (
        extracted.model !== undefined &&
        extracted.model !== null
      ) {

        $("extractedModel").value =
          extracted.model;
      }


      if (
        extracted.current_hmr !== undefined &&
        extracted.current_hmr !== null
      ) {

        $("extractedHmr").value =
          extracted.current_hmr;
      }


      if (
        extracted.current_kwh !== undefined &&
        extracted.current_kwh !== null
      ) {

        $("extractedKwh").value =
          extracted.current_kwh;
      }


      if (
        extracted.previous_balance !== undefined &&
        extracted.previous_balance !== null
      ) {

        $("extractedPreviousBalance").value =
          extracted.previous_balance;
      }


      if (
        extracted.fuel_filled !== undefined &&
        extracted.fuel_filled !== null
      ) {

        $("extractedFuelFilled").value =
          extracted.fuel_filled;
      }


      if (
        extracted.current_balance !== undefined &&
        extracted.current_balance !== null
      ) {

        $("extractedBalance").value =
          extracted.current_balance;
      }


      $("extractionSection")
        ?.classList
        .add("show");


      $("extractionSection")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });


      message(
        $("authMessage"),
        "Details extracted. Please review and confirm every field.",
        "success"
      );


    } catch (error) {

      message(
        $("authMessage"),
        error?.message ||
        "Image extraction failed.",
        "error"
      );


    } finally {

      button.disabled =
        false;

      button.textContent =
        "✨ EXTRACT DETAILS";


      $("extractLoading")
        ?.classList
        .remove("show");
    }

  }
);


/* =========================================================
   SAVE MANUAL READING
========================================================= */

$("updateSite")
?.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("updateMessage")
    );


    const adminKey =
      getAdminKey();


    const siteId =
      $("siteId")
        .value
        .trim();


    const model =
      $("model")
        .value;


    const hmrText =
      $("currentHmr")
        .value
        .trim();


    const kwhText =
      $("currentKwh")
        .value
        .trim();


    const balanceText =
      $("currentBalance")
        .value
        .trim();


    const hmr =
      Number(hmrText);


    const kwh =
      Number(kwhText);


    const balance =
      Number(balanceText);


    if (!adminKey) {

      message(
        $("updateMessage"),
        "Please enter the Admin Key.",
        "error"
      );

      return;
    }


    if (!siteId) {

      message(
        $("updateMessage"),
        "Site ID is required.",
        "error"
      );

      return;
    }


    if (!model) {

      message(
        $("updateMessage"),
        "Please select a generator model.",
        "error"
      );

      return;
    }


    if (
      !Number.isFinite(hmr) ||
      !Number.isFinite(kwh) ||
      !Number.isFinite(balance)
    ) {

      message(
        $("updateMessage"),
        "Please enter valid HMR, kWh and Balance.",
        "error"
      );

      return;
    }


    const button =
      $("updateSite");


    button.disabled =
      true;

    button.textContent =
      "SAVING...";


    try {

      const response =
        await fetch(
          "/api/admin/update-site",
          {
            method: "POST",

            headers:
              adminHeaders(true),

            body:
              JSON.stringify({

                site_id:
                  siteId,

                model:
                  model,

                current_hmr:
                  hmr,

                current_kwh:
                  kwh,

                current_balance:
                  balance,

                data_source:
                  "admin"
              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Site update failed."
        );
      }


      message(
        $("updateMessage"),
        "Site updated successfully.",
        "success"
      );


      $("siteInfo")
        ?.classList
        .add("show");


      $("siteModel").textContent =
        model;

      $("siteHmr").textContent =
        hmr;

      $("siteKwh").textContent =
        kwh;

      $("siteBalance").textContent =
        balance;


    } catch (error) {

      message(
        $("updateMessage"),
        error?.message ||
        "Site update failed.",
        "error"
      );


    } finally {

      button.disabled =
        false;

      button.textContent =
        "💾 SAVE MANUAL READING";
    }

  }
);


/* =========================================================
   SAVE OCR RESULT
========================================================= */

$("saveExtracted")
?.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("extractMessage")
    );


    const adminKey =
      getAdminKey();


    const siteId =
      $("siteId")
        .value
        .trim();


    const model =
      $("extractedModel")
        .value
        .trim();


    const hmr =
      Number(
        $("extractedHmr").value
      );


    const kwh =
      Number(
        $("extractedKwh").value
      );


    const balance =
      Number(
        $("extractedBalance").value
      );


    if (!adminKey) {

      message(
        $("extractMessage"),
        "Please enter the Admin Key.",
        "error"
      );

      return;
    }


    if (!siteId) {

      message(
        $("extractMessage"),
        "Site ID is required.",
        "error"
      );

      return;
    }


    if (!model) {

      message(
        $("extractMessage"),
        "Please select the generator model.",
        "error"
      );

      return;
    }


    if (
      !Number.isFinite(hmr) ||
      !Number.isFinite(kwh) ||
      !Number.isFinite(balance)
    ) {

      message(
        $("extractMessage"),
        "Please review HMR, kWh and Current Balance.",
        "error"
      );

      return;
    }


    const confirmed =
      window.confirm(
        "Are you sure you want to save this extracted reading?"
      );


    if (!confirmed) {

      message(
        $("extractMessage"),
        "Save cancelled.",
        "error"
      );

      return;
    }


    const button =
      $("saveExtracted");


    button.disabled =
      true;

    button.textContent =
      "SAVING...";


    try {

      const response =
        await fetch(
          "/api/admin/update-site",
          {
            method: "POST",

            headers:
              adminHeaders(true),

            body:
              JSON.stringify({

                site_id:
                  siteId,

                model:
                  model,

                current_hmr:
                  hmr,

                current_kwh:
                  kwh,

                current_balance:
                  balance,

                data_source:
                  "ocr"
              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Save failed."
        );
      }


      message(
        $("extractMessage"),
        "Extracted reading saved successfully.",
        "success"
      );


      $("siteInfo")
        ?.classList
        .add("show");


      $("siteModel").textContent =
        model;

      $("siteHmr").textContent =
        hmr;

      $("siteKwh").textContent =
        kwh;

      $("siteBalance").textContent =
        balance;


      $("imageInput").value =
        "";


      $("previewImage").src =
        "";


      $("fileName").textContent =
        "";


      $("preview")
        ?.classList
        .remove("show");


      $("extractionSection")
        ?.classList
        .remove("show");


    } catch (error) {

      message(
        $("extractMessage"),
        error?.message ||
        "Save failed.",
        "error"
      );


    } finally {

      button.disabled =
        false;

      button.textContent =
        "✅ CONFIRM & SAVE";
    }

  }
);


/* =========================================================
   ACTIVATE LLAMA AI
========================================================= */

$("activateLlama")
?.addEventListener(
  "click",
  async () => {

    const key =
      getAdminKey();


    if (!key) {

      message(
        $("llamaMessage"),
        "Please enter the Admin Key first.",
        "error"
      );

      return;
    }


    const button =
      $("activateLlama");


    button.disabled =
      true;

    button.textContent =
      "Activating...";


    message(
      $("llamaMessage"),
      "Sending Llama agreement request...",
      ""
    );


    try {

      const response =
        await fetch(
          "/api/admin/agree-llama",
          {
            method: "POST",
            headers:
              adminHeaders()
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Llama activation failed."
        );
      }


      message(
        $("llamaMessage"),
        "✅ Llama AI activated successfully.",
        "success"
      );


      button.textContent =
        "Llama AI Activated";


    } catch (error) {

      message(
        $("llamaMessage"),
        "❌ " +
        (
          error?.message ||
          "Llama activation failed."
        ),
        "error"
      );


      button.disabled =
        false;

      button.textContent =
        "🤖 ACTIVATE LLAMA AI";
    }

  }
);


/* =========================================================
   SAVE SITE CHANGES
========================================================= */

$("saveSiteEdit")
?.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("editSiteMessage")
    );


    const adminKey =
      getAdminKey();


    const siteId =
      $("editSiteId")
        .value
        .trim();


    const siteName =
      $("editSiteName")
        .value
        .trim();


    const model =
      $("editModel")
        .value;


    const currentHmr =
      Number(
        $("editHmr").value
      );


    const currentKwh =
      Number(
        $("editKwh").value
      );


    const currentBalance =
      Number(
        $("editBalance").value
      );


    if (!adminKey) {

      message(
        $("editSiteMessage"),
        "Please enter the Admin Key.",
        "error"
      );

      return;
    }


    if (!siteId) {

      message(
        $("editSiteMessage"),
        "Please enter a Site ID.",
        "error"
      );

      return;
    }


    if (!model) {

            message(
        $("editSiteMessage"),
        "Please select a Generator Model.",
        "error"
      );

      return;
    }


    if (
      !Number.isFinite(currentHmr) ||
      !Number.isFinite(currentKwh) ||
      !Number.isFinite(currentBalance)
    ) {

      message(
        $("editSiteMessage"),
        "Please enter valid HMR, kWh and Balance.",
        "error"
      );

      return;
    }


    /* =====================================================
       CONFIRM SAVE
    ====================================================== */

    const confirmed =
      window.confirm(
        "Are you sure you want to save these site changes?"
      );


    if (!confirmed) {

      message(
        $("editSiteMessage"),
        "Save cancelled.",
        ""
      );

      return;
    }


    /* =====================================================
       SAVE
    ====================================================== */

    const button =
      $("saveSiteEdit");


    button.disabled =
      true;

    button.textContent =
      "SAVING...";


    try {

      message(
        $("editSiteMessage"),
        "Saving site changes...",
        ""
      );


      const response =
        await fetch(
          "/api/admin/update-site",
          {
            method: "POST",

            headers:
              adminHeaders(true),

            body:
              JSON.stringify({

                site_id:
                  siteId,

                site_name:
                  siteName ||
                  siteId,

                model:
                  model,

                current_hmr:
                  currentHmr,

                current_kwh:
                  currentKwh,

                current_balance:
                  currentBalance,

                data_source:
                  "admin"

              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (!data.success) {

        throw new Error(
          data.error ||
          "Unable to save site changes."
        );
      }


      /* ===================================================
         UPDATE CURRENT SITE DISPLAY
      ================================================== */

      if (data.site) {

        showSite(
          data.site
        );

      } else {

        $("siteName").textContent =
          siteName || siteId;

        $("siteModel").textContent =
          model;

        $("siteHmr").textContent =
          currentHmr;

        $("siteKwh").textContent =
          currentKwh;

        $("siteBalance").textContent =
          currentBalance;
      }


      $("siteInfo")
        ?.classList
        .add("show");


      message(
        $("editSiteMessage"),
        "✅ Site changes saved successfully.",
        "success"
      );


    } catch (error) {

      message(
        $("editSiteMessage"),
        error?.message ||
        "Unable to save site changes.",
        "error"
      );


    } finally {

      button.disabled =
        false;

      button.textContent =
        "💾 SAVE SITE CHANGES";
    }

  }
);


/* =========================================================
   SAVE REQUESTS — LOAD PENDING REQUESTS
========================================================= */

async function loadSaveRequests(
  showLoading = true
) {

  const list =
    $("saveRequestsList");

  const count =
    $("requestCount");

  const status =
    $("requestMessage");


  if (!list) {
    return;
  }


  const adminKey =
    getAdminKey();


  if (!adminKey) {

    list.innerHTML =
      "";

    if (count) {

      count.style.display =
        "none";
    }

    if (status) {

      message(
        status,
        "Enter the Admin Key to view save requests.",
        ""
      );
    }

    return;
  }


  if (showLoading) {

    message(
      status,
      "Loading pending requests...",
      ""
    );
  }


  try {

    const response =
      await fetch(
        "/api/admin/save-requests",
        {
          method: "GET",

          headers:
            adminHeaders()
        }
      );


    const data =
      await readJsonResponse(
        response
      );


    if (!data.success) {

      throw new Error(
        data.error ||
        "Unable to load save requests."
      );
    }


    const requests =
      Array.isArray(
        data.requests
      )
        ? data.requests
        : [];


    renderSaveRequests(
      requests
    );


  } catch (error) {

    list.innerHTML =
      "";

    if (count) {

      count.style.display =
        "none";
    }

    message(
      status,
      error?.message ||
      "Unable to load save requests.",
      "error"
    );
  }
}


/* =========================================================
   RENDER SAVE REQUESTS
========================================================= */

function renderSaveRequests(
  requests
) {

  const list =
    $("saveRequestsList");

  const count =
    $("requestCount");

  const status =
    $("requestMessage");


  if (!list) {
    return;
  }


  if (count) {

    if (requests.length > 0) {

      count.textContent =
        requests.length;

      count.style.display =
        "inline-block";

    } else {

      count.style.display =
        "none";
    }
  }


  if (!requests.length) {

    list.innerHTML = `
      <div class="request-empty">

        <div style="font-size:32px;">
          ✅
        </div>

        <strong>
          No pending save requests
        </strong>

        <span>
          New requests from the calculator will appear here.
        </span>

      </div>
    `;


    message(
      status,
      "No pending save requests.",
      ""
    );

    return;
  }


  message(
    status,
    `${requests.length} pending save request${requests.length === 1 ? "" : "s"}.`,
    ""
  );


  list.innerHTML =
    requests
      .map(
        (request) =>
          createRequestCard(
            request
          )
      )
      .join("");


  list
    .querySelectorAll(
      "[data-request-action]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.requestId;

            const action =
              button.dataset.requestAction;

            reviewSaveRequest(
              id,
              action
            );

          }
        );

      }
    );
}


/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createRequestCard(
  request
) {

  const id =
    escapeHtml(
      request.id
    );

  const siteId =
    escapeHtml(
      request.site_id
    );

  const siteName =
    escapeHtml(
      request.site_name ||
      request.site_id
    );

  const model =
    escapeHtml(
      formatModel(
        request.model
      )
    );

  const hmr =
    escapeHtml(
      request.current_hmr
    );

  const kwh =
    escapeHtml(
      request.current_kwh
    );

  const balance =
    escapeHtml(
      request.current_balance
    );

  const requestedAt =
    escapeHtml(
      formatDate(
        request.requested_at
      )
    );


  return `
    <div class="request-card">

      <div class="request-top">

        <div class="request-site">

          <strong>
            ${siteName}
          </strong>

          <span>
            ${siteId}
          </span>

        </div>

        <span class="pending-badge">
          PENDING
        </span>

      </div>


      <div class="request-details">

        <div class="request-value">

          <span class="request-label">
            DG Model
          </span>

          <strong>
            ${model}
          </strong>

        </div>


        <div class="request-value">

          <span class="request-label">
            Current HMR
          </span>

          <strong>
            ${hmr}
          </strong>

        </div>


        <div class="request-value">

          <span class="request-label">
            Current kWh
          </span>

          <strong>
            ${kwh}
          </strong>

        </div>


        <div class="request-value">

          <span class="request-label">
            Balance After Filling
          </span>

          <strong>
            ${balance}
          </strong>

        </div>

      </div>


      <div class="request-time">
        Requested: ${requestedAt}
      </div>


      <div class="request-actions">

        <button
          type="button"
          class="approve-button"
          data-request-action="approve"
          data-request-id="${id}"
        >
          ✅ APPROVE
        </button>


        <button
          type="button"
          class="reject-button"
          data-request-action="reject"
          data-request-id="${id}"
        >
          ❌ REJECT
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   FORMAT MODEL
========================================================= */

function formatModel(
  model
) {

  const names = {

    eicher10:
      "Eicher 10 KVA",

    mahindra10:
      "Mahindra 10 KVA",

    eicher20:
      "Eicher 20 KVA",

    mahindra20:
      "Mahindra 20 KVA",

    koel20:
      "KOEL 20 KVA"

  };


  return (
    names[model] ||
    model ||
    "—"
  );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;
  }


  return date.toLocaleString();
}


/* =========================================================
   APPROVE / REJECT REQUEST
========================================================= */

async function reviewSaveRequest(
  id,
  action
) {

  if (!id) {
    return;
  }


  const adminKey =
    getAdminKey();


  if (!adminKey) {

    message(
      $("requestMessage"),
      "Please enter the Admin Key.",
      "error"
    );

    return;
  }


  if (
    action !== "approve" &&
    action !== "reject"
  ) {

    return;
  }


  const confirmed =
    window.confirm(

      action === "approve"

        ? "Are you sure you want to APPROVE this save request?\n\nThe site's current HMR, kWh and balance will be updated."

        : "Are you sure you want to REJECT this save request?"

    );


  if (!confirmed) {
    return;
  }


  const requestCard =
    document
      .querySelector(
        `[data-request-action="${action}"][data-request-id="${CSS.escape(String(id))}"]`
      )
      ?.closest(
        ".request-card"
      );


  if (requestCard) {

    requestCard
      .querySelectorAll("button")
      .forEach(
        (button) => {

          button.disabled =
            true;
        }
      );
  }


  message(
    $("requestMessage"),

    action === "approve"
      ? "Approving save request..."
      : "Rejecting save request.",

    ""
  );


  try {

    const response =
      await fetch(
        "/api/admin/save-request/review",
        {
          method: "POST",

          headers:
            adminHeaders(true),

          body:
            JSON.stringify({

              id:
                Number(id),

              action:
                action

            })
        }
      );


    const data =
      await readJsonResponse(
        response
      );


    if (!data.success) {

      throw new Error(
        data.error ||
        "Unable to process save request."
      );
    }


    message(
      $("requestMessage"),

      action === "approve"

        ? "✅ Save request approved and site updated."

        : "✅ Save request rejected.",

      "success"
    );


    await loadSaveRequests(
      false
    );


  } catch (error) {

    message(
      $("requestMessage"),
      error?.message ||
      "Unable to process save request.",
      "error"
    );


    await loadSaveRequests(
      false
    );
  }
}


/* =========================================================
   REFRESH REQUESTS
========================================================= */

$("refreshRequests")
?.addEventListener(
  "click",
  async () => {

    const button =
      $("refreshRequests");


    button.disabled =
      true;

    button.textContent =
      "🔄 REFRESHING...";


    try {

      await loadSaveRequests(
        true
      );

    } finally {

      button.disabled =
        false;

      button.textContent =
        "🔄 REFRESH REQUESTS";
    }

  }
);


/* =========================================================
   ADMIN KEY CHANGE
========================================================= */

$("adminKey")
?.addEventListener(
  "change",
  () => {

    loadSaveRequests(
      true
    );

  }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      () => {

        loadSaveRequests(
          true
        );

      },
      300
    );

  }
);


/* =========================================================
   AUTO REFRESH
   Every 20 seconds
========================================================= */

setInterval(
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      loadSaveRequests(
        false
      );

    }

  },
  20000
);
