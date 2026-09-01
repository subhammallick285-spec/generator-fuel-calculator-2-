const $ = (id) =>
  document.getElementById(id);


/* =====================================================
   MESSAGE
   ===================================================== */

function message(element, text, type) {

  element.textContent = text;

  element.className =
    "message " + type;
}


function clearMessage(element) {

  element.textContent = "";

  element.className =
    "message";
}


/* =====================================================
   SHOW SITE
   ===================================================== */

function showSite(site) {

  $("siteInfo")
    .classList
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

    $("extractedModel").value =
      site.model;
  }


  if (
    site.current_hmr !== null &&
    site.current_hmr !== undefined
  ) {

    $("currentHmr").value =
      site.current_hmr;
  }


  if (
    site.current_kwh !== null &&
    site.current_kwh !== undefined
  ) {

    $("currentKwh").value =
      site.current_kwh;
  }


  if (
    site.current_balance !== null &&
    site.current_balance !== undefined
  ) {

    $("currentBalance").value =
      site.current_balance;
  }
}


/* =====================================================
   LOAD EXISTING SITE
   ===================================================== */

$("loadSite")
.addEventListener(
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


    $("loadSite").disabled =
      true;

    $("loadSite").textContent =
      "Loading...";


    try {

      const response =
        await fetch(
          "/api/site?site_id=" +
          encodeURIComponent(siteId)
        );


      const text =
        await response.text();


      let data = {};

      try {

        data =
          text.trim()
            ? JSON.parse(text)
            : {};

      } catch {

        throw new Error(
          "Server returned an invalid response."
        );
      }


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          "Unable to load site."
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
        error.message ||
        "Unable to load site.",
        "error"
      );


    } finally {

      $("loadSite").disabled =
        false;

      $("loadSite").textContent =
        "🔄 LOAD EXISTING SITE";
    }

  }
);


/* =====================================================
   IMAGE SELECTION
   ===================================================== */

$("imageInput")
.addEventListener(
  "change",
  () => {

    clearMessage(
      $("authMessage")
    );


    const file =
      $("imageInput")
        .files[0];


    if (!file) {

      $("preview")
        .classList
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


/* =====================================================
   MANUAL READING BUTTON
   ===================================================== */

$("manualButton")
.addEventListener(
  "click",
  () => {

    const section =
      $("manualSection");


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


/* =====================================================
   EXTRACT DETAILS FROM IMAGE
   ===================================================== */

$("extractButton")
.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("authMessage")
    );


    const file =
      $("imageInput")
        .files[0];


    const adminKey =
      $("adminKey")
        .value
        .trim();


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
        "Please enter the admin key.",
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


    $("extractButton").disabled =
      true;

    $("extractButton").textContent =
      "EXTRACTING...";


    $("extractLoading")
      .classList
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


      const text =
        await response.text();


      let data = {};

      try {

        data =
          text.trim()
            ? JSON.parse(text)
            : {};

      } catch {

        throw new Error(
          "Server returned an invalid response."
        );
      }


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          "Image extraction failed."
        );
      }


      /* =========================
         FILL EXTRACTED VALUES
      ========================== */

      if (data.model) {

        $("extractedModel").value =
          data.model;
      }


      if (
        data.current_hmr !== undefined &&
        data.current_hmr !== null
      ) {

        $("extractedHmr").value =
          data.current_hmr;
      }


      if (
        data.current_kwh !== undefined &&
        data.current_kwh !== null
      ) {

        $("extractedKwh").value =
          data.current_kwh;
      }


      if (
        data.previous_balance !== undefined &&
        data.previous_balance !== null
      ) {

        $("extractedPreviousBalance").value =
          data.previous_balance;
      }


      if (
        data.fuel_filled !== undefined &&
        data.fuel_filled !== null
      ) {

        $("extractedFuelFilled").value =
          data.fuel_filled;
      }


      if (
        data.current_balance !== undefined &&
        data.current_balance !== null
      ) {

        $("extractedBalance").value =
          data.current_balance;
      }


      /* =========================
         SHOW REVIEW SECTION
      ========================== */

      $("extractionSection")
        .classList
        .add("show");


      $("extractionSection")
        .scrollIntoView({
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
        error.message ||
        "Image extraction failed.",
        "error"
      );


    } finally {

      $("extractButton").disabled =
        false;

      $("extractButton").textContent =
        "✨ EXTRACT DETAILS";


      $("extractLoading")
        .classList
        .remove("show");
    }

  }
);


/* =====================================================
   SAVE MANUAL READING
   ===================================================== */

$("updateSite")
.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("updateMessage")
    );


    const adminKey =
      $("adminKey")
        .value
        .trim();


    const siteId =
      $("siteId")
        .value
        .trim();


    const model =
      $("model")
        .value;


    const hmr =
      $("currentHmr")
        .value;


    const kwh =
      $("currentKwh")
        .value;


    const balance =
      $("currentBalance")
        .value;


    if (!adminKey) {

      message(
        $("updateMessage"),
        "Please enter the admin key.",
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


    if (
      !model
    ) {

      message(
        $("updateMessage"),
        "Please select a generator model.",
        "error"
      );

      return;
    }


    if (
      hmr === "" ||
      kwh === "" ||
      balance === ""
    ) {

      message(
        $("updateMessage"),
        "Please fill all manual reading fields.",
        "error"
      );

      return;
    }


    $("updateSite").disabled =
      true;

    $("updateSite").textContent =
      "SAVING...";


    try {

      const response =
        await fetch(
          "/api/admin/update-site",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json",

              "X-Admin-Key":
                adminKey
            },

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
                  balance

              })
          }
        );


      const text =
        await response.text();


      let data = {};

      try {

        data =
          text.trim()
            ? JSON.parse(text)
            : {};

      } catch {

        throw new Error(
          "Server returned an invalid response."
        );
      }


      if (
        !response.ok ||
        !data.success
      ) {

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
        .classList
        .add("show");


      $("siteHmr").textContent =
        hmr;


      $("siteKwh").textContent =
        kwh;


      $("siteBalance").textContent =
        balance;


      $("siteModel").textContent =
        model;


    } catch (error) {

      message(
        $("updateMessage"),
        error.message ||
        "Site update failed.",
        "error"
      );


    } finally {

      $("updateSite").disabled =
        false;

      $("updateSite").textContent =
        "💾 SAVE MANUAL READING";
    }

  }
);


/* =====================================================
   CONFIRM & SAVE OCR RESULT
   ===================================================== */

$("saveExtracted")
.addEventListener(
  "click",
  async () => {

    clearMessage(
      $("extractMessage")
    );


    const adminKey =
      $("adminKey")
        .value
        .trim();


    const siteId =
      $("siteId")
        .value
        .trim();


    const model =
      $("extractedModel")
        .value;


    const hmr =
      $("extractedHmr")
        .value;


    const kwh =
      $("extractedKwh")
        .value;


    const balance =
      $("extractedBalance")
        .value;


    if (!adminKey) {

      message(
        $("extractMessage"),
        "Please enter the admin key.",
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
      hmr === "" ||
      kwh === "" ||
      balance === ""
    ) {

      message(
        $("extractMessage"),
        "Please review all required extracted fields.",
        "error"
      );

      return;
    }


    $("saveExtracted").disabled =
      true;

    $("saveExtracted").textContent =
      "SAVING...";


    try {

      const response =
        await fetch(
          "/api/admin/update-site",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json",

              "X-Admin-Key":
                adminKey
            },

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
                  balance

              })
          }
        );


      const text =
        await response.text();


      let data = {};

      try {

        data =
          text.trim()
            ? JSON.parse(text)
            : {};

      } catch {

        throw new Error(
          "Server returned an invalid response."
        );
      }


      if (
        !response.ok ||
        !data.success
      ) {

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
        .classList
        .add("show");


      $("siteModel").textContent =
        model;


      $("siteHmr").textContent =
        hmr;


      $("siteKwh").textContent =
        kwh;


      $("siteBalance").textContent =
        balance;


      /* =========================
         CLEAR TEMPORARY IMAGE
      ========================== */

      $("imageInput").value =
        "";


      $("previewImage").src =
        "";


      $("fileName").textContent =
        "";


      $("preview")
        .classList
        .remove("show");


      $("extractionSection")
        .classList
        .remove("show");


    } catch (error) {

      message(
        $("extractMessage"),
        error.message ||
        "Save failed.",
        "error"
      );


    } finally {

      $("saveExtracted").disabled =
        false;

      $("saveExtracted").textContent =
        "✅ CONFIRM & SAVE";
    }

  }
);
