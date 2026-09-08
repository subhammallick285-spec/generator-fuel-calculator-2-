/* =========================================================
   GENERATOR FUEL CALCULATOR — ADMIN.JS
   CLEAN REBUILD
========================================================= */

(() => {
  "use strict";

  if (window.__GENERATOR_ADMIN_JS_LOADED__) {
    console.warn("ADMIN JS already loaded; duplicate load ignored.");
    return;
  }

  window.__GENERATOR_ADMIN_JS_LOADED__ = true;

  console.log("ADMIN JS STARTED");

  const $ = (id) => document.getElementById(id);

  /* =========================================================
     MESSAGE HELPERS
  ========================================================= */

  function message(element, text, type = "") {
    if (!element) return;

    element.textContent = text || "";

    element.className =
      type
        ? `message ${type}`
        : "message";
  }

  function clearMessage(element) {
    message(element, "");
  }

  /* =========================================================
     ADMIN KEY
  ========================================================= */

  function getAdminKey() {
    return (
      sessionStorage.getItem("adminKey") ||
      $("adminKey")?.value?.trim() ||
      ""
    );
  }

  function headers(json = false) {
    const result = {
      Accept: "application/json",
      "X-Admin-Key": getAdminKey()
    };

    if (json) {
      result["Content-Type"] = "application/json";
    }

    return result;
  }

  /* =========================================================
     RESPONSE HELPER
  ========================================================= */

  async function readJson(response) {
    const text = await response.text();

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

    if (!response.ok || data.success === false) {
      throw new Error(
        data.error ||
        `Server error (${response.status}).`
      );
    }

    return data;
  }

  async function requestJSON(url, options = {}) {
    const response = await fetch(
      url,
      {
        cache: "no-store",
        ...options
      }
    );

    return readJson(response);
  }

  /* =========================================================
     MODEL FORMAT
  ========================================================= */

  function formatModel(model) {
    const names = {
      eicher10: "Eicher 10 KVA",
      mahindra10: "Mahindra 10 KVA",
      eicher20: "Eicher 20 KVA",
      mahindra20: "Mahindra 20 KVA",
      koel20: "KOEL 20 KVA"
    };

    return (
      names[model] ||
      model ||
      "—"
    );
  }

  /* =========================================================
     VISIBILITY
  ========================================================= */

  function show(element) {
    if (!element) return;

    element.style.display = "block";

    if (element.classList) {
      element.classList.add("show");
    }
  }

  function hide(element) {
    if (!element) return;

    element.style.display = "none";

    if (element.classList) {
      element.classList.remove("show");
    }
  }

  /* =========================================================
     SITE DISPLAY
  ========================================================= */

  function fillSite(site) {
    if (!site) return;

    if ($("siteName")) {
      $("siteName").textContent =
        site.site_name || "—";
    }

    if ($("siteIdDisplay")) {
      $("siteIdDisplay").textContent =
        site.site_id
          ? `Site ID: ${site.site_id}`
          : "Saved Site";
    }

    if ($("siteModel")) {
      $("siteModel").textContent =
        formatModel(site.model);
    }

    if ($("siteHmr")) {
      $("siteHmr").textContent =
        site.current_hmr ?? "—";
    }

    if ($("siteKwh")) {
      $("siteKwh").textContent =
        site.current_kwh ?? "—";
    }

    if ($("siteBalance")) {
      $("siteBalance").textContent =
        site.current_balance ?? "—";
    }

    if ($("siteId")) {
      $("siteId").value =
        site.site_id || "";
    }

    if ($("editSiteId")) {
      $("editSiteId").value =
        site.site_id || "";
    }

    if ($("editSiteName")) {
      $("editSiteName").value =
        site.site_name || "";
    }

    if ($("editModel")) {
      $("editModel").value =
        site.model || "";
    }

    if ($("editHmr")) {
      $("editHmr").value =
        site.current_hmr ?? "";
    }

    if ($("editKwh")) {
      $("editKwh").value =
        site.current_kwh ?? "";
    }

    if ($("editBalance")) {
      $("editBalance").value =
        site.current_balance ?? "";
    }

    if ($("model")) {
      $("model").value =
        site.model || "";
    }

    show($("siteInfo"));
  }

  /* =========================================================
     LOAD EXISTING SITE
  ========================================================= */

  async function loadSite() {
    const siteId =
      $("siteId")?.value?.trim() ||
      "";

    if (!siteId) {
      message(
        $("authMessage"),
        "Please enter a Site ID.",
        "error"
      );
      return;
    }

    if (!getAdminKey()) {
      message(
        $("authMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );
      return;
    }

    const button =
      $("loadSite");

    if (button) {
      button.disabled = true;
      button.textContent =
        "LOADING...";
    }

    clearMessage(
      $("authMessage")
    );

    try {
      const data =
        await requestJSON(
          `/api/site?site_id=${encodeURIComponent(siteId)}`,
          {
            method: "GET",
            headers: headers()
          }
        );

      if (!data.site) {
        throw new Error(
          "Site data was not returned."
        );
      }

      fillSite(data.site);

      const edit =
        window.confirm(
          "Site found.\n\nDo you want to edit this site?"
        );

      if (edit) {
        openEdit();

        message(
          $("authMessage"),
          "Edit Site opened.",
          "success"
        );
      } else {
        message(
          $("authMessage"),
          "Site loaded successfully.",
          "success"
        );
      }

    } catch (error) {

      if (
        error?.message?.includes("404")
      ) {
        message(
          $("authMessage"),
          "Site not found.",
          "error"
        );
      } else {
        message(
          $("authMessage"),
          error?.message ||
            "Unable to load site.",
          "error"
        );
      }

      console.error(
        "Load site error:",
        error
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent =
          "🔄 LOAD EXISTING SITE";
      }
    }
  }

  /* =========================================================
     EDIT SITE
  ========================================================= */

  function openEdit() {
    show(
      $("editSiteSection")
    );

    if ($("extractionCard")) {
      show(
        $("extractionCard")
      );
    }

    $("editSiteSection")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

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
      message(
        $("editSiteMessage"),
        "Site ID is required.",
        "error"
      );
      return;
    }

    if (!model) {
      message(
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
      message(
        $("editSiteMessage"),
        "Please enter valid HMR, kWh and Balance.",
        "error"
      );
      return;
    }

    const button =
      $("saveSiteEdit");

    if (button) {
      button.disabled = true;
      button.textContent =
        "SAVING...";
    }

    clearMessage(
      $("editSiteMessage")
    );

    try {

      const data =
        await requestJSON(
          "/api/admin/update-site",
          {
            method: "POST",
            headers: headers(true),
            body: JSON.stringify({
              site_id: siteId,
              site_name: siteName,
              model,
              current_hmr: hmr,
              current_kwh: kwh,
              current_balance: balance
            })
          }
        );

      message(
        $("editSiteMessage"),
        data.message ||
          "Site updated successfully.",
        "success"
      );

      await loadSiteSilently(
        siteId
      );

    } catch (error) {

      message(
        $("editSiteMessage"),
        error?.message ||
          "Unable to save site changes.",
        "error"
      );

      console.error(
        "Save site edit error:",
        error
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent =
          "💾 SAVE SITE CHANGES";
      }
    }
  }

  async function loadSiteSilently(
    siteId
  ) {

    try {

      const data =
        await requestJSON(
          `/api/site?site_id=${encodeURIComponent(siteId)}`,
          {
            method: "GET",
            headers: headers()
          }
        );

      if (data.site) {
        fillSite(
          data.site
        );
      }

    } catch (error) {

      console.error(
        "Silent site refresh failed:",
        error
      );
    }
  }

  /* =========================================================
     LLAMA ACTIVATION
  ========================================================= */

  async function activateLlama() {

    const button =
      $("activateLlama");

    if (!getAdminKey()) {
      message(
        $("llamaMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent =
        "ACTIVATING...";
    }

    clearMessage(
      $("llamaMessage")
    );

    try {

      const data =
        await requestJSON(
          "/api/admin/agree-llama",
          {
            method: "POST",
            headers: headers(true),
            body: JSON.stringify({})
          }
        );

      message(
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

      message(
        $("llamaMessage"),
        error?.message ||
          "Unable to activate Llama AI.",
        "error"
      );

      if (button) {
        button.disabled = false;
        button.textContent =
          "🤖 ACTIVATE LLAMA AI";
      }

      console.error(
        "Llama activation error:",
        error
      );
    }
  }

  /* =========================================================
     IMAGE PREVIEW
  ========================================================= */

  function handleImageSelection() {

    const file =
      $("imageInput")
        ?.files?.[0];

    if (!file) {
      $("preview")
        ?.classList
        .remove("show");
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      message(
        $("llamaMessage"),
        "Please select an image file.",
        "error"
      );

      if ($("imageInput")) {
        $("imageInput").value =
          "";
      }

      return;
    }

    const reader =
      new FileReader();

    reader.onload = (
      event
    ) => {

      if ($("previewImage")) {
        $("previewImage").src =
          event.target.result;
      }

      if ($("fileName")) {
        $("fileName").textContent =
          file.name;
      }

      $("preview")
        ?.classList
        .add("show");
    };

    reader.onerror = () => {

      message(
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
     EXTRACT IMAGE
  ========================================================= */

  async function extractImage() {

    const file =
      $("imageInput")
        ?.files?.[0];

    const siteId =
      $("siteId")
        ?.value?.trim() ||
      "";

    if (!getAdminKey()) {
      message(
        $("llamaMessage"),
        "Please unlock the Admin panel first.",
        "error"
      );
      return;
    }

    if (!siteId) {
      message(
        $("llamaMessage"),
        "Please enter the Site ID first.",
        "error"
      );
      return;
    }

    if (!file) {
      message(
        $("llamaMessage"),
        "Please upload a generator screenshot first.",
        "error"
      );
      return;
    }

    const button =
      $("extractButton");

    if (button) {
      button.disabled = true;
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
        await requestJSON(
          "/api/admin/extract-image",
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "X-Admin-Key":
                getAdminKey()
            },
            body: form
          }
        );

      const extracted =
        data.data ||
        data.extracted ||
        data;

      if (
        extracted.model != null
      ) {
        $("extractedModel").value =
          extracted.model;
      }

      if (
        extracted.current_hmr != null
      ) {
        $("extractedHmr").value =
          extracted.current_hmr;
      }

      if (
        extracted.current_kwh != null
      ) {
        $("extractedKwh").value =
          extracted.current_kwh;
      }

      if (
        extracted.previous_balance != null
      ) {
        $("extractedPreviousBalance").value =
          extracted.previous_balance;
      }

      if (
        extracted.fuel_filled != null
      ) {
        $("extractedFuelFilled").value =
          extracted.fuel_filled;
      }

      if (
        extracted.current_balance != null
      ) {
        $("extractedBalance").value =
          extracted.current_balance;
      }

      show(
        $("extractionSection")
      );

      $("extractionSection")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      message(
        $("extractMessage"),
        "Details extracted. Review every field before saving.",
        "success"
      );

    } catch (error) {

      message(
        $("extractMessage"),
        error?.message ||
          "Image extraction failed.",
        "error"
      );

      console.error(
        "Image extraction error:",
        error
      );

    } finally {

      hide(
        $("extractLoading")
      );

      if (button) {
        button.disabled = false;
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
      $("siteId")
        ?.value?.trim() ||
      "";

    const model =
      $("extractedModel")
        ?.value ||
      "";

    const hmr =
      Number(
        $("extractedHmr")
          ?.value
      );

    const kwh =
      Number(
        $("extractedKwh")
          ?.value
      );

    const balance =
      Number(
        $("extractedBalance")
          ?.value
      );

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
        "Please select/confirm the generator model.",
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
        "Please confirm valid HMR, kWh and Current Balance.",
        "error"
      );
      return;
    }

    const button =
      $("saveExtracted");

    if (button) {
      button.disabled = true;
      button.textContent =
        "SAVING...";
    }

    try {

      const data =
        await requestJSON(
          "/api/admin/update-site",
          {
            method: "POST",
            headers: headers(true),
            body: JSON.stringify({
              site_id: siteId,
              site_name:
                $("editSiteName")
                  ?.value?.trim() ||
                $("siteName")
                  ?.textContent?.trim() ||
                siteId,
              model,
              current_hmr: hmr,
              current_kwh: kwh,
              current_balance:
                balance
            })
          }
        );

      message(
        $("extractMessage"),
        data.message ||
          "Extracted data saved successfully.",
        "success"
      );

      await loadSiteSilently(
        siteId
      );

    } catch (error) {

      message(
        $("extractMessage"),
        error?.message ||
          "Unable to save extracted data.",
        "error"
      );

      console.error(
        "Save extracted error:",
        error
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent =
          "✅ CONFIRM & SAVE";
      }
    }
  }

  /* =========================================================
     MANUAL BUTTON
  ========================================================= */

  function toggleManual() {

    const section =
      $("manualSection");

    const button =
      $("manualButton");

    if (!section) return;

    const open =
      section.style.display ===
      "block";

    if (open) {

      hide(section);

      if (button) {
        button.textContent =
          "＋ ENTER MANUAL READING";
      }

      return;
    }

    show(section);

    if (button) {
      button.textContent =
        "− HIDE MANUAL READING";
    }

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  /* =========================================================
     SAVE REQUESTS
  ========================================================= */

  function escapeHtml(value) {

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
        String(items.length);
    }

    if (!list) return;

    if (!items.length) {

      list.innerHTML =
        '<div class="message">No pending save requests.</div>';

      return;
    }

    list.innerHTML =
      items.map(
        (item) => `
      <div class="card" data-request-id="${escapeHtml(item.id)}">

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
      formatModel(item.model)
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

    ).join("");

  }

  async function loadSaveRequests(
    showStatus = false
  ) {

    if (!getAdminKey()) {
      return;
    }

    try {

      const data =
        await requestJSON(
          "/api/admin/save-requests",
          {
            method: "GET",
            headers: headers()
          }
        );

      renderRequests(
        data.requests || []
      );

      if (showStatus) {

        message(
          $("requestMessage"),
          "Save requests loaded.",
          "success"
        );

      }

    } catch (error) {

      if (showStatus) {

        message(
          $("requestMessage"),
          error?.message ||
            "Unable to load save requests.",
          "error"
        );

      }

      console.error(
        "Load save requests error:",
        error
      );

    }

  }


  async function reviewRequest(
    id,
    action
  ) {

    if (!getAdminKey()) {
      return;
    }

    try {

      const data =
        await requestJSON(
          "/api/admin/save-request/review",
          {
            method: "POST",
            headers: headers(true),
            body: JSON.stringify({
              id: Number(id),
              action
            })
          }
        );

      message(
        $("requestMessage"),
        data.message ||
          `Request ${action}d successfully.`,
        "success"
      );

      await loadSaveRequests(
        false
      );

    } catch (error) {

      message(
        $("requestMessage"),
        error?.message ||
          `Unable to ${action} request.`,
        "error"
      );

      console.error(
        "Review request error:",
        error
      );

    }

  }


  function requestListClick(
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
     EVENT LISTENERS
  ========================================================= */

  function bindEvents() {

    const loadSiteButton =
      $("loadSite");

    if (loadSiteButton) {

      loadSiteButton.addEventListener(
        "click",
        loadSite
      );

    }


    const editButton =
      $("editSiteButton");

    if (editButton) {

      editButton.addEventListener(
        "click",
        openEditSite
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
        handleImageChange
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
        toggleManualSection
      );

    }


    const refreshButton =
      $("refreshRequests");

    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        () => {

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
        requestListClick
      );

    }


    const siteIdInput =
      $("siteId");

    if (siteIdInput) {

      siteIdInput.addEventListener(
        "keydown",
        event => {

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


    const editSiteIdInput =
      $("editSiteId");

    if (editSiteIdInput) {

      editSiteIdInput.addEventListener(
        "keydown",
        event => {

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

      const adminKey =
        getAdminKey();

      if (!adminKey) {

        console.warn(
          "Admin key not found."
        );

        return;
      }


      /*
       * Load pending save requests
       * after the admin page is unlocked.
       */

      loadSaveRequests(
        false
      );


      /*
       * If a site ID is already present,
       * do not automatically load it.
       *
       * The admin must explicitly press
       * FIND / LOAD SITE.
       */

      const siteIdInput =
        $("siteId");

      if (
        siteIdInput &&
        siteIdInput.value
      ) {

        siteIdInput.focus();

      }

    } catch (error) {

      console.error(
        "Admin initialization error:",
        error
      );

      const authMessage =
        $("authMessage");

      if (authMessage) {

        message(
          authMessage,
          error?.message ||
            "Unable to initialize admin panel.",
          "error"
        );

      }

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
        once: true
      }
    );

  } else {

    initializeAdmin();

  }


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

        /*
         * Only refresh if the
         * admin session still exists.
         */

        if (
          getAdminKey()
        ) {

          loadSaveRequests(
            false
          );

        }

      }

    },
    20000
  );


  console.log(
    "ADMIN JS FINISHED"
  );

})();
