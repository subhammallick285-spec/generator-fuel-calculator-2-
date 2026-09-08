/* =========================================================
   GENERATOR FUEL CALCULATOR
   ADMIN.JS
   CLEAN REBUILD
   ========================================================= */

(() => {

  "use strict";

  /* ---------------------------------------------------------
     DUPLICATE LOAD PROTECTION
     --------------------------------------------------------- */

  if (window.__GENERATOR_ADMIN_JS_LOADED__) {
    console.warn(
      "ADMIN.JS already loaded."
    );
    return;
  }

  window.__GENERATOR_ADMIN_JS_LOADED__ = true;


  /* ---------------------------------------------------------
     SHORT DOM HELPER
     --------------------------------------------------------- */

  const $ = (id) => {
    return document.getElementById(id);
  };


  /* ---------------------------------------------------------
     ADMIN KEY
     --------------------------------------------------------- */

  function getAdminKey() {

    try {

      const stored =
        sessionStorage.getItem(
          "adminKey"
        );

      if (stored) {
        return stored.trim();
      }

    } catch (error) {

      console.warn(
        "Unable to read sessionStorage.",
        error
      );

    }


    const input =
      $("adminKey");

    if (
      input &&
      typeof input.value === "string"
    ) {

      return input.value.trim();

    }


    return "";

  }


  /* ---------------------------------------------------------
     REQUEST HEADERS
     --------------------------------------------------------- */

  function getHeaders(
    json = false
  ) {

    const result = {
      "Accept":
        "application/json",
      "X-Admin-Key":
        getAdminKey()
    };


    if (json) {

      result[
        "Content-Type"
      ] =
        "application/json";

    }


    return result;

  }


  /* ---------------------------------------------------------
     MESSAGE HELPER
     --------------------------------------------------------- */

  function setMessage(
    element,
    text,
    type = ""
  ) {

    if (!element) {
      return;
    }


    element.textContent =
      text || "";


    element.className =
      type
        ? `message ${type}`
        : "message";

  }


  function clearMessage(
    element
  ) {

    setMessage(
      element,
      ""
    );

  }


  /* ---------------------------------------------------------
     SHOW / HIDE
     --------------------------------------------------------- */

  function show(
    element
  ) {

    if (!element) {
      return;
    }


    element.style.display =
      "block";


    if (
      element.classList
    ) {

      element.classList.add(
        "show"
      );

    }

  }


  function hide(
    element
  ) {

    if (!element) {
      return;
    }


    element.style.display =
      "none";


    if (
      element.classList
    ) {

      element.classList.remove(
        "show"
      );

    }

  }


  /* ---------------------------------------------------------
     SAFE JSON RESPONSE
     --------------------------------------------------------- */

  async function parseResponse(
    response
  ) {

    const text =
      await response.text();


    let data = {};


    if (
      text &&
      text.trim()
    ) {

      try {

        data =
          JSON.parse(text);

      } catch (error) {

        throw new Error(
          `Server returned invalid JSON (${response.status}).`
        );

      }

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        data.message ||
        `Server error (${response.status}).`
      );

    }


    if (
      data &&
      data.success === false
    ) {

      throw new Error(
        data.error ||
        data.message ||
        "Request failed."
      );

    }


    return data;

  }


  /* ---------------------------------------------------------
     FETCH HELPER
     --------------------------------------------------------- */

  async function request(
    url,
    options = {}
  ) {

    const response =
      await fetch(
        url,
        {
          cache:
            "no-store",
          ...options
        }
      );


    return parseResponse(
      response
    );

  }


  /* =========================================================
     MODEL FORMAT
     ========================================================= */

  function formatModel(
    model
  ) {

    const models = {

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
      models[model] ||
      model ||
      "—"
    );

  }


  /* =========================================================
     SITE INFORMATION
     ========================================================= */

  function fillSite(
    site
  ) {

    if (!site) {
      return;
    }


    if ($("siteName")) {

      $("siteName").textContent =
        site.site_name ||
        "—";

    }


    if ($("siteIdDisplay")) {

      $("siteIdDisplay").textContent =
        site.site_id
          ? `Site ID: ${site.site_id}`
          : "Saved Site";

    }


    if ($("siteModel")) {

      $("siteModel").textContent =
        formatModel(
          site.model
        );

    }


    if ($("siteHmr")) {

      $("siteHmr").textContent =
        site.current_hmr ??
        "—";

    }


    if ($("siteKwh")) {

      $("siteKwh").textContent =
        site.current_kwh ??
        "—";

    }


    if ($("siteBalance")) {

      $("siteBalance").textContent =
        site.current_balance ??
        "—";

    }


    if ($("siteId")) {

      $("siteId").value =
        site.site_id ||
        "";

    }


    if ($("editSiteId")) {

      $("editSiteId").value =
        site.site_id ||
        "";

    }


    if ($("editSiteName")) {

      $("editSiteName").value =
        site.site_name ||
        "";

    }


    if ($("editModel")) {

      $("editModel").value =
        site.model ||
        "";

    }


    if ($("editHmr")) {

      $("editHmr").value =
        site.current_hmr ??
        "";

    }


    if ($("editKwh")) {

      $("editKwh").value =
        site.current_kwh ??
        "";

    }


    if ($("editBalance")) {

      $("editBalance").value =
        site.current_balance ??
        "";

    }


    if ($("model")) {

      $("model").value =
        site.model ||
        "";

    }


    show(
      $("siteInfo")
    );

  }


  /* =========================================================
     LOAD SITE
     ========================================================= */

  async function loadSite() {

    const siteInput =
      $("siteId");


    const siteId =
      siteInput &&
      typeof siteInput.value ===
        "string"
        ? siteInput.value.trim()
        : "";


    if (!siteId) {

      setMessage(
        $("authMessage"),
        "Please enter a Site ID.",
        "error"
      );

      return;

    }


    if (!getAdminKey()) {

      setMessage(
        $("authMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );

      return;

    }


    const button =
      $("loadSite");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "LOADING...";

    }


    clearMessage(
      $("authMessage")
    );


    try {

      const data =
        await request(
          `/api/site?site_id=${encodeURIComponent(siteId)}`,
          {
            method:
              "GET",
            headers:
              getHeaders()
          }
        );


      if (
        !data ||
        !data.site
      ) {

        throw new Error(
          "Site data was not returned."
        );

      }


      fillSite(
        data.site
      );


      setMessage(
        $("authMessage"),
        "Site loaded successfully.",
        "success"
      );


      /*
       * Open the edit section only
       * when the user explicitly clicks
       * EDIT SITE.
       */

    } catch (error) {

      console.error(
        "LOAD SITE ERROR:",
        error
      );


      setMessage(
        $("authMessage"),
        error &&
        error.message
          ? error.message
          : "Unable to load site.",
        "error"
      );

    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "🔄 LOAD EXISTING SITE";

      }

    }

  }


  /* =========================================================
     OPEN EDIT SITE
     ========================================================= */

  function openEdit() {

    const section =
      $("editSiteSection");


    if (!section) {

      console.warn(
        "editSiteSection not found."
      );

      return;

    }


    show(
      section
    );


    section.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });

  }


  /* =========================================================
     SAVE EDITED SITE
     ========================================================= */

  async function saveSiteEdit() {

    const siteId =
      $("editSiteId")?.value?.trim() ||
      $("siteId")?.value?.trim() ||
      "";


    const siteName =
      $("editSiteName")?.value?.trim() ||
      siteId;


    const model =
      $("editModel")?.value ||
      "";


    const hmr =
      Number(
        $("editHmr")?.value
      );


    const kwh =
      Number(
        $("editKwh")?.value
      );


    const balance =
      Number(
        $("editBalance")?.value
      );


    if (!siteId) {

      setMessage(
        $("editSiteMessage"),
        "Site ID is required.",
        "error"
      );

      return;

    }


    if (!model) {

      setMessage(
        $("editSiteMessage"),
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

      setMessage(
        $("editSiteMessage"),
        "Please enter valid HMR, kWh and Balance.",
        "error"
      );

      return;

    }


    if (!getAdminKey()) {

      setMessage(
        $("editSiteMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );

      return;

    }


    const button =
      $("saveSiteEdit");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "SAVING...";

    }


    clearMessage(
      $("editSiteMessage")
    );


    try {

      const data =
        await request(
          "/api/admin/update-site",
          {
            method:
              "POST",

            headers:
              getHeaders(true),

            body:
              JSON.stringify({

                site_id:
                  siteId,

                site_name:
                  siteName,

                model:
                  model,

                current_hmr:
                  hmr,

                current_kwh:
                  kwh,

                current_balance:
                  balance

              })

          }
        );


      setMessage(
        $("editSiteMessage"),
        data.message ||
        "Site updated successfully.",
        "success"
      );


      await refreshSite(
        siteId
      );


    } catch (error) {

      console.error(
        "SAVE SITE ERROR:",
        error
      );


      setMessage(
        $("editSiteMessage"),
        error &&
        error.message
          ? error.message
          : "Unable to save site changes.",
        "error"
      );

    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "💾 SAVE SITE CHANGES";

      }

    }

  }


  /* =========================================================
     REFRESH SITE WITHOUT UI MESSAGE
     ========================================================= */

  async function refreshSite(
    siteId
  ) {

    if (!siteId) {
      return;
    }


    try {

      const data =
        await request(
          `/api/site?site_id=${encodeURIComponent(siteId)}`,
          {
            method:
              "GET",
            headers:
              getHeaders()
          }
        );


      if (data.site) {

        fillSite(
          data.site
        );

      }

    } catch (error) {

      console.error(
        "SITE REFRESH ERROR:",
        error
      );

    }

  }


  /* =========================================================
     LLAMA ACTIVATION
     ========================================================= */

  async function activateLlama() {

    if (!getAdminKey()) {

      setMessage(
        $("llamaMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );

      return;

    }


    const button =
      $("activateLlama");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "ACTIVATING...";

    }


    clearMessage(
      $("llamaMessage")
    );


    try {

      const data =
        await request(
          "/api/admin/agree-llama",
          {
            method:
              "POST",

            headers:
              getHeaders(true),

            body:
              JSON.stringify({})
          }
        );


      setMessage(
        $("llamaMessage"),
        data.message ||
        "Llama AI activated successfully.",
        "success"
      );


      if (button) {

        button.textContent =
          "✅ LLAMA AI ACTIVATED";

      }


    } catch (error) {

      console.error(
        "LLAMA ERROR:",
        error
      );


      setMessage(
        $("llamaMessage"),
        error &&
        error.message
          ? error.message
          : "Unable to activate Llama AI.",
        "error"
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "🤖 ACTIVATE LLAMA AI";

      }

    }

  }


  /* =========================================================
     IMAGE SELECTION / PREVIEW
     ========================================================= */

  function handleImageSelection() {

    const input =
      $("imageInput");


    const file =
      input?.files?.[0];


    if (!file) {

      hide(
        $("preview")
      );

      return;

    }


    if (
      !file.type ||
      !file.type.startsWith(
        "image/"
      )
    ) {

      setMessage(
        $("llamaMessage"),
        "Please select an image file.",
        "error"
      );


      if (input) {

        input.value =
          "";

      }


      return;

    }


    const reader =
      new FileReader();


    reader.onload =
      function (event) {

        if (
          $("previewImage")
        ) {

          $("previewImage").src =
            event.target.result;

        }


        if (
          $("fileName")
        ) {

          $("fileName").textContent =
            file.name;

        }


        show(
          $("preview")
        );

      };


    reader.onerror =
      function () {

        setMessage(
          $("llamaMessage"),
          "Unable to read the selected image.",
          "error"
        );

      };


    reader.readAsDataURL(
      file
    );

  }


  /* =========================================================
     IMAGE EXTRACTION
     ========================================================= */

  async function extractImage() {

    const input =
      $("imageInput");


    const file =
      input?.files?.[0];


    const siteId =
      $("siteId")?.value?.trim() ||
      "";


    if (!getAdminKey()) {

      setMessage(
        $("llamaMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );

      return;

    }


    if (!siteId) {

      setMessage(
        $("llamaMessage"),
        "Please enter the Site ID first.",
        "error"
      );

      return;

    }


    if (!file) {

      setMessage(
        $("llamaMessage"),
        "Please upload a generator screenshot first.",
        "error"
      );

      return;

    }


    const button =
      $("extractButton");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "EXTRACTING...";

    }


    show(
      $("extractLoading")
    );


    try {

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


      const data =
        await request(
          "/api/admin/extract-image",
          {
            method:
              "POST",

            headers: {
              "Accept":
                "application/json",

              "X-Admin-Key":
                getAdminKey()
            },

            body:
              form
          }
        );


      const extracted =
        data.data ||
        data.extracted ||
        data;


      if (
        extracted &&
        extracted.model != null &&
        $("extractedModel")
      ) {

        $("extractedModel").value =
          extracted.model;

      }


      if (
        extracted &&
        extracted.current_hmr != null &&
        $("extractedHmr")
      ) {

        $("extractedHmr").value =
          extracted.current_hmr;

      }


      if (
        extracted &&
        extracted.current_kwh != null &&
        $("extractedKwh")
      ) {

        $("extractedKwh").value =
          extracted.current_kwh;

      }


      if (
        extracted &&
        extracted.previous_balance != null &&
        $("extractedPreviousBalance")
      ) {

        $("extractedPreviousBalance").value =
          extracted.previous_balance;

      }


      if (
        extracted &&
        extracted.fuel_filled != null &&
        $("extractedFuelFilled")
      ) {

        $("extractedFuelFilled").value =
          extracted.fuel_filled;

      }


      if (
        extracted &&
        extracted.current_balance != null &&
        $("extractedBalance")
      ) {

        $("extractedBalance").value =
          extracted.current_balance;

      }


      show(
        $("extractionSection")
      );


      $("extractionSection")
        ?.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start"
        });


      setMessage(
        $("extractMessage"),
        "Details extracted. Review every field before saving.",
        "success"
      );


    } catch (error) {

      console.error(
        "IMAGE EXTRACTION ERROR:",
        error
      );


      setMessage(
        $("extractMessage"),
        error &&
        error.message
          ? error.message
          : "Image extraction failed.",
        "error"
      );

    } finally {

      hide(
        $("extractLoading")
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "✨ EXTRACT DETAILS";

      }

    }

  }


    /* =========================================================
     SAVE EXTRACTED DATA
     ========================================================= */

  async function saveExtracted() {

    const siteId =
      $("siteId")?.value?.trim() ||
      "";


    const model =
      $("extractedModel")?.value ||
      "";


    const hmr =
      Number(
        $("extractedHmr")?.value
      );


    const kwh =
      Number(
        $("extractedKwh")?.value
      );


    const balance =
      Number(
        $("extractedBalance")?.value
      );


    if (!siteId) {

      setMessage(
        $("extractMessage"),
        "Site ID is required.",
        "error"
      );

      return;

    }


    if (!model) {

      setMessage(
        $("extractMessage"),
        "Please confirm the generator model.",
        "error"
      );

      return;

    }


    if (
      !Number.isFinite(hmr) ||
      !Number.isFinite(kwh) ||
      !Number.isFinite(balance)
    ) {

      setMessage(
        $("extractMessage"),
        "Please confirm valid HMR, kWh and Current Balance.",
        "error"
      );

      return;

    }


    if (!getAdminKey()) {

      setMessage(
        $("extractMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );

      return;

    }


    const button =
      $("saveExtracted");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "SAVING...";

    }


    try {

      const siteName =
        $("editSiteName")
          ?.value
          ?.trim() ||

        $("siteName")
          ?.textContent
          ?.trim() ||

        siteId;


      const data =
        await request(
          "/api/admin/update-site",
          {
            method:
              "POST",

            headers:
              getHeaders(true),

            body:
              JSON.stringify({

                site_id:
                  siteId,

                site_name:
                  siteName,

                model:
                  model,

                current_hmr:
                  hmr,

                current_kwh:
                  kwh,

                current_balance:
                  balance

              })

          }
        );


      setMessage(
        $("extractMessage"),
        data.message ||
        "Extracted data saved successfully.",
        "success"
      );


      await refreshSite(
        siteId
      );


    } catch (error) {

      console.error(
        "SAVE EXTRACTED ERROR:",
        error
      );


      setMessage(
        $("extractMessage"),
        error &&
        error.message
          ? error.message
          : "Unable to save extracted data.",
        "error"
      );

    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "✅ CONFIRM & SAVE";

      }

    }

  }


  /* =========================================================
     MANUAL SECTION
     ========================================================= */

  function toggleManual() {

    const section =
      $("manualSection");


    const button =
      $("manualButton");


    if (!section) {

      return;

    }


    const currentlyVisible =
      section.style.display ===
      "block";


    if (currentlyVisible) {

      hide(
        section
      );


      if (button) {

        button.textContent =
          "＋ ENTER MANUAL READING";

      }


      return;

    }


    show(
      section
    );


    if (button) {

      button.textContent =
        "− HIDE MANUAL READING";

    }


    section.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });

  }


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /* =========================================================
     SAVE REQUESTS
     ========================================================= */

  function renderRequests(
    requests
  ) {

    const list =
      $("saveRequestsList");


    const count =
      $("requestCount");


    const items =
      Array.isArray(requests)
        ? requests
        : [];


    if (count) {

      count.textContent =
        String(
          items.length
        );

    }


    if (!list) {

      return;

    }


    if (!items.length) {

      list.innerHTML =
        '<div class="message">No pending save requests.</div>';

      return;

    }


    list.innerHTML =
      items.map(
        function (item) {

          return `
            <div
              class="card"
              data-request-id="${escapeHtml(item.id)}"
            >

              <h3>
                ${escapeHtml(
                  item.site_name ||
                  item.site_id ||
                  "Unnamed Site"
                )}
              </h3>

              <p>
                <strong>Site ID:</strong>
                ${escapeHtml(
                  item.site_id
                )}
              </p>

              <p>
                <strong>Model:</strong>
                ${escapeHtml(
                  formatModel(
                    item.model
                  )
                )}
              </p>

              <p>
                <strong>HMR:</strong>
                ${escapeHtml(
                  item.current_hmr
                )}
              </p>

              <p>
                <strong>kWh:</strong>
                ${escapeHtml(
                  item.current_kwh
                )}
              </p>

              <p>
                <strong>Balance:</strong>
                ${escapeHtml(
                  item.current_balance
                )}
              </p>

              <p>
                <strong>Requested:</strong>
                ${escapeHtml(
                  item.requested_at
                )}
              </p>

              <div
                style="
                  display:flex;
                  gap:10px;
                  flex-wrap:wrap;
                  margin-top:12px;
                "
              >

                <button
                  type="button"
                  class="button button-success request-approve"
                  data-id="${escapeHtml(item.id)}"
                >
                  ✅ APPROVE
                </button>

                <button
                  type="button"
                  class="button button-secondary request-reject"
                  data-id="${escapeHtml(item.id)}"
                >
                  ❌ REJECT
                </button>

              </div>

            </div>
          `;

        }
      ).join("");

  }


  /* =========================================================
     LOAD SAVE REQUESTS
     ========================================================= */

  async function loadSaveRequests(
    showStatus = false
  ) {

    if (!getAdminKey()) {

      return;

    }


    try {

      const data =
        await request(
          "/api/admin/save-requests",
          {
            method:
              "GET",

            headers:
              getHeaders()
          }
        );


      renderRequests(
        data.requests || []
      );


      if (showStatus) {

        setMessage(
          $("requestMessage"),
          "Save requests loaded.",
          "success"
        );

      }


    } catch (error) {

      console.error(
        "LOAD SAVE REQUESTS ERROR:",
        error
      );


      if (showStatus) {

        setMessage(
          $("requestMessage"),
          error &&
          error.message
            ? error.message
            : "Unable to load save requests.",
          "error"
        );

      }

    }

  }


  /* =========================================================
     REVIEW SAVE REQUEST
     ========================================================= */

  async function reviewRequest(
    id,
    action
  ) {

    if (!getAdminKey()) {

      return;

    }


    const numericId =
      Number(id);


    if (
      !Number.isFinite(
        numericId
      )
    ) {

      setMessage(
        $("requestMessage"),
        "Invalid save request ID.",
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


    try {

      const data =
        await request(
          "/api/admin/save-request/review",
          {
            method:
              "POST",

            headers:
              getHeaders(true),

            body:
              JSON.stringify({

                id:
                  numericId,

                action:
                  action

              })

          }
        );


      setMessage(
        $("requestMessage"),
        data.message ||
        `Request ${action}d successfully.`,
        "success"
      );


      await loadSaveRequests(
        false
      );


    } catch (error) {

      console.error(
        "REVIEW REQUEST ERROR:",
        error
      );


      setMessage(
        $("requestMessage"),
        error &&
        error.message
          ? error.message
          : `Unable to ${action} request.`,
        "error"
      );

    }

  }


  /* =========================================================
     REQUEST LIST CLICK
     ========================================================= */

  function handleRequestClick(
    event
  ) {

    const approve =
      event.target.closest(
        ".request-approve"
      );


    const reject =
      event.target.closest(
        ".request-reject"
      );


    if (approve) {

      reviewRequest(
        approve.dataset.id,
        "approve"
      );

      return;

    }


    if (reject) {

      reviewRequest(
        reject.dataset.id,
        "reject"
      );

    }

  }


  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function bindEvents() {

    const loadButton =
      $("loadSite");


    if (loadButton) {

      loadButton.addEventListener(
        "click",
        loadSite
      );

    }


    const editButton =
      $("editSiteButton");


    if (editButton) {

      editButton.addEventListener(
        "click",
        openEdit
      );

    }


    const saveEditButton =
      $("saveSiteEdit");


    if (saveEditButton) {

      saveEditButton.addEventListener(
        "click",
        saveSiteEdit
      );

    }


    const llamaButton =
      $("activateLlama");


    if (llamaButton) {

      llamaButton.addEventListener(
        "click",
        activateLlama
      );

    }


    const imageInput =
      $("imageInput");


    if (imageInput) {

      imageInput.addEventListener(
        "change",
        handleImageSelection
      );

    }


    const extractButton =
      $("extractButton");


    if (extractButton) {

      extractButton.addEventListener(
        "click",
        extractImage
      );

    }


    const saveExtractedButton =
      $("saveExtracted");


    if (saveExtractedButton) {

      saveExtractedButton.addEventListener(
        "click",
        saveExtracted
      );

    }


    const manualButton =
      $("manualButton");


    if (manualButton) {

      manualButton.addEventListener(
        "click",
        toggleManual
      );

    }


    const refreshButton =
      $("refreshRequests");


    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        function () {

          loadSaveRequests(
            true
          );

        }
      );

    }


    const requestList =
      $("saveRequestsList");


    if (requestList) {

      requestList.addEventListener(
        "click",
        handleRequestClick
      );

    }


    const siteInput =
      $("siteId");


    if (siteInput) {

      siteInput.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();

            loadSite();

          }

        }
      );

    }


    const editSiteId =
      $("editSiteId");


    if (editSiteId) {

      editSiteId.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();

            saveSiteEdit();

          }

        }
      );

    }

  }


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function initializeAdmin() {

    try {

      bindEvents();


      const key =
        getAdminKey();


      if (!key) {

        console.warn(
          "Admin key is not available yet."
        );

        return;

      }


      loadSaveRequests(
        false
      );


      console.log(
        "ADMIN.JS INITIALIZED"
      );


    } catch (error) {

      console.error(
        "ADMIN INITIALIZATION ERROR:",
        error
      );


      setMessage(
        $("authMessage"),
        error &&
        error.message
          ? error.message
          : "Admin initialization failed.",
        "error"
      );

    }

  }


  /* =========================================================
     DOM READY
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeAdmin,
      {
        once:
          true
      }
    );

  } else {

    initializeAdmin();

  }


  /* =========================================================
     AUTO REFRESH
     ========================================================= */

  setInterval(
    function () {

      if (
        document.visibilityState !==
        "visible"
      ) {

        return;

      }


      if (!getAdminKey()) {

        return;

      }


      loadSaveRequests(
        false
      );

    },
    20000
  );


  console.log(
    "ADMIN.JS FINISHED"
  );


})();
