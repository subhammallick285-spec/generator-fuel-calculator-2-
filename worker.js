const CHARTS = {
  eicher10: {
    name: "Eicher 10 KVA",
    rows: [
      [0, 0.8, 1.15],
      [0.8, 1.6, 1.30],
      [1.6, 2.0, 1.35],
      [2.0, 2.4, 1.39],
      [2.4, 3.2, 1.68],
      [3.2, 4.0, 1.72],
      [4.0, 4.8, 1.99],
      [4.8, 5.6, 2.22],
      [5.6, 6.0, 2.23],
      [6.0, 6.4, 2.52],
      [6.4, 7.2, 2.71],
      [7.2, 8.0, 2.74]
    ]
  },

  mahindra10: {
    name: "Mahindra 10 KVA",
    rows: [
      [0, 0.8, 1.02],
      [0.8, 1.6, 1.20],
      [1.6, 2.0, 1.28],
      [2.0, 2.4, 1.37],
      [2.4, 3.2, 1.60],
      [3.2, 4.0, 1.79],
      [4.0, 4.8, 1.95],
      [4.8, 5.6, 2.20],
      [5.6, 6.0, 2.30],
      [6.0, 6.4, 2.41],
      [6.4, 7.2, 2.66],
      [7.2, 8.0, 2.84]
    ]
  },

  eicher20: {
    name: "Eicher 20 KVA",
    rows: [
      [0, 1.6, 1.33],
      [1.6, 3.2, 1.63],
      [3.2, 4.0, 1.92],
      [4.0, 4.8, 1.99],
      [4.8, 6.4, 2.29],
      [6.4, 8.0, 2.55],
      [8.0, 9.6, 2.92],
      [9.6, 11.2, 3.10]
    ]
  },

  mahindra20: {
    name: "Mahindra 20 KVA",
    rows: [
      [0, 1.6, 1.70],
      [1.6, 3.2, 1.80],
      [3.2, 4.0, 1.90],
      [4.0, 4.8, 2.64],
      [4.8, 6.4, 2.64],
      [6.4, 8.0, 2.64],
      [8.0, 9.6, 3.48],
      [9.6, 11.2, 3.48]
    ]
  },

  koel20: {
    name: "KOEL 20 KVA",
    rows: [
      [0, 1.6, 1.32],
      [1.6, 3.2, 1.58],
      [3.2, 4.0, 1.78],
      [4.0, 4.8, 1.85],
      [4.8, 6.4, 2.13],
      [6.4, 8.0, 2.42],
      [8.0, 9.6, 2.77],
      [9.6, 11.2, 3.02]
    ]
  }
};


/* =====================================================
   COMMON JSON RESPONSE
===================================================== */

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store"
      }
    }
  );
}


/* =====================================================
   NUMBER VALIDATION
===================================================== */

function number(value, name) {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `${name} is required.`
    );
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(
      `${name} must be a valid number.`
    );
  }

  return n;
}


/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

function checkAdminKey(request, env) {

  const adminKey =
    request.headers.get(
      "X-Admin-Key"
    );

  if (!env.ADMIN_KEY) {

    return {
      ok: false,

      response: json(
        {
          success: false,

          error:
            "ADMIN_KEY is not configured in Cloudflare."
        },
        500
      )
    };
  }

  if (
    !adminKey ||
    adminKey !== env.ADMIN_KEY
  ) {

    return {
      ok: false,

      response: json(
        {
          success: false,

          error:
            "Unauthorized."
        },
        401
      )
    };
  }

  return {
    ok: true
  };
}


/* =====================================================
   CALCULATOR
===================================================== */

async function calculate(request) {

  try {

    const body =
      await request.json();

    const A =
      number(
        body.A,
        "Current HMR"
      );

    const B =
      number(
        body.B,
        "Current kWh"
      );

    const C =
      number(
        body.C,
        "Previous HMR"
      );

    const D =
      number(
        body.D,
        "Previous kWh"
      );

    const E =
      number(
        body.E,
        "Previous balance"
      );

    const model =
      String(
        body.model || ""
      ).trim();

    const chart =
      CHARTS[model];

    if (!chart) {

      throw new Error(
        "Please select a valid generator model."
      );
    }

    if (A <= C) {

      throw new Error(
        "Current HMR must be greater than previous HMR."
      );
    }

    if (B < D) {

      throw new Error(
        "Current kWh cannot be less than previous kWh."
      );
    }

    const Z =
      A - C;

    const Y =
      B - D;

    const X =
      Y / Z;

    const row =
      chart.rows.find(
        ([lo, hi]) =>
          X >= lo && X <= hi
      );

    if (!row) {

      const max =
        chart.rows[
          chart.rows.length - 1
        ][1];

      throw new Error(
        `X = ${X.toFixed(4)} is outside the ${chart.name} chart range (0-${max}).`
      );
    }

    const [lo, hi, L] =
      row;

    const S =
      L * Z;

    const T =
      E - S;

    return json({

      success: true,

      modelName:
        chart.name,

      band:
        `${lo}-${hi} kW/hr`,

      A,
      B,
      C,
      D,
      E,
      Z,
      Y,
      X,
      L,
      S,
      T

    });

  } catch (error) {

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Calculation failed."
      },
      400
    );
  }
}


/* =====================================================
   GET SITE
===================================================== */

async function getSite(request, env) {

  try {

    const url =
      new URL(request.url);

    const siteId =
      url.searchParams.get(
        "site_id"
      );

    if (!siteId) {

      return json(
        {
          success: false,

          error:
            "site_id is required."
        },
        400
      );
    }

    const result =
      await env.DB
        .prepare(`
          SELECT
            site_id,
            site_name,
            model,
            current_hmr,
            current_kwh,
            current_balance,
            last_updated,
            screenshot_url,
            data_source
          FROM sites
          WHERE site_id = ?
          LIMIT 1
        `)
        .bind(siteId)
        .first();

    if (!result) {

      return json(
        {
          success: false,

          error:
            "Site ID not found."
        },
        404
      );
    }

    return json({

      success: true,

      site: result

    });

  } catch (error) {

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Database error."
      },
      500
    );
  }
}


/* =====================================================
   UPDATE SITE
===================================================== */

async function updateSite(
  request,
  env
) {

  try {

    const auth =
      checkAdminKey(
        request,
        env
      );

    if (!auth.ok) {
      return auth.response;
    }

    const body =
      await request.json();

    const siteId =
      String(
        body.site_id || ""
      ).trim();

    if (!siteId) {

      throw new Error(
        "site_id is required."
      );
    }

    const hmr =
      number(
        body.current_hmr,
        "Current HMR"
      );

    const kwh =
      number(
        body.current_kwh,
        "Current kWh"
      );

    const balance =
      number(
        body.current_balance,
        "Current balance"
      );

    const model =
      String(
        body.model || ""
      ).trim();

    if (!CHARTS[model]) {

      throw new Error(
        "Please select a valid generator model."
      );
    }

    const existing =
      await env.DB
        .prepare(`
          SELECT site_id
          FROM sites
          WHERE site_id = ?
          LIMIT 1
        `)
        .bind(siteId)
        .first();

    if (!existing) {

      return json(
        {
          success: false,

          error:
            "Site ID not found."
        },
        404
      );
    }

    const now =
      new Date().toISOString();


    await env.DB
      .prepare(`
        UPDATE sites
        SET
          model = ?,
          current_hmr = ?,
          current_kwh = ?,
          current_balance = ?,
          last_updated = ?,
          data_source = ?
        WHERE site_id = ?
      `)
      .bind(
        model,
        hmr,
        kwh,
        balance,
        now,
        "image",
        siteId
      )
      .run();


    await env.DB
      .prepare(`
        INSERT INTO readings
        (
          site_id,
          hmr,
          kwh,
          balance,
          reading_date,
          source
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        siteId,
        hmr,
        kwh,
        balance,
        now,
        "image"
      )
      .run();


    return json({

      success: true,

      message:
        "Site updated successfully.",

      site_id:
        siteId,

      current_hmr:
        hmr,

      current_kwh:
        kwh,

      current_balance:
        balance,

      updated_at:
        now,

      source:
        "image"

    });

  } catch (error) {

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Site update failed."
      },
      400
    );
  }
}


/* =====================================================
   IMAGE → BASE64
===================================================== */

async function fileToDataUrl(file) {

  const buffer =
    await file.arrayBuffer();

  const bytes =
    new Uint8Array(buffer);

  let binary = "";

  const chunkSize = 8192;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {

    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        Math.min(
          i + chunkSize,
          bytes.length
        )
      )
    );
  }

  const base64 =
    btoa(binary);

  return `data:${file.type};base64,${base64}`;
}


/* =====================================================
   IMAGE EXTRACTION
===================================================== */

async function extractImage(
  request,
  env
) {

  try {

    const auth =
      checkAdminKey(
        request,
        env
      );

    if (!auth.ok) {
      return auth.response;
    }


    if (!env.AI) {

      return json(
        {
          success: false,

          error:
            "Workers AI binding is not configured."
        },
        500
      );
    }


    const contentType =
      request.headers.get(
        "content-type"
      ) || "";


    if (
      !contentType.includes(
        "multipart/form-data"
      )
    ) {

      return json(
        {
          success: false,

          error:
            "Please upload an image."
        },
        400
      );
    }


    const form =
      await request.formData();


    const image =
      form.get("image");


    const siteId =
      String(
        form.get("site_id") || ""
      ).trim();


    if (!image) {

      return json(
        {
          success: false,

          error:
            "Image is required."
        },
        400
      );
    }


    if (
      typeof image === "string" ||
      !image.type ||
      !image.type.startsWith(
        "image/"
      )
    ) {

      return json(
        {
          success: false,

          error:
            "The uploaded file must be an image."
        },
        400
      );
    }


    if (
      image.size &&
      image.size > 10 * 1024 * 1024
    ) {

      return json(
        {
          success: false,

          error:
            "Image is too large. Please use an image under 10 MB."
        },
        400
      );
    }


    const imageData =
      await fileToDataUrl(
        image
      );


    const prompt = `
You are reading a generator controller/genset screenshot.

Extract ONLY the following four values from the image:

1. generator model
2. current HMR
3. current kWh
4. current balance

Possible generator models are:

eicher10 = Eicher 10 KVA
mahindra10 = Mahindra 10 KVA
eicher20 = Eicher 20 KVA
mahindra20 = Mahindra 20 KVA
koel20 = KOEL 20 KVA

Return ONLY valid JSON.

Use exactly this structure:

{
  "model": "eicher10",
  "current_hmr": 123.45,
  "current_kwh": 456.78,
  "current_balance": 50
}

Rules:

- Do not guess a value.
- If a value cannot be clearly read, use null.
- Carefully distinguish HMR from kWh.
- Read decimal points accurately.
- Do not use commas inside numbers.
- Do not include markdown.
- Do not include explanations.
- The model must be one of the five model codes above.
- If the model cannot be identified, use null.
`;


    const aiResponse =
      await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          messages: [
            {
              role: "system",
              content:
                "You extract structured meter readings from generator screenshots. Return only JSON."
            },

            {
              role: "user",
              content: prompt
            }
          ],

          image:
            imageData,

          max_tokens:
            300
        }
      );


    let rawText = "";


    if (
      typeof aiResponse ===
      "string"
    ) {

      rawText =
        aiResponse;

    } else if (
      aiResponse?.response
    ) {

      rawText =
        aiResponse.response;

    } else if (
      aiResponse?.result
    ) {

      if (
        typeof aiResponse.result ===
        "string"
      ) {

        rawText =
          aiResponse.result;

      } else if (
        aiResponse.result.response
      ) {

        rawText =
          aiResponse.result.response;
      }
    }


    if (!rawText) {

      return json(
        {
          success: false,

          error:
            "The vision model returned no readable result."
        },
        502
      );
    }


    rawText =
      rawText
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();


    let extracted;


    try {

      extracted =
        JSON.parse(
          rawText
        );

    } catch {

      const match =
        rawText.match(
          /\{[\s\S]*\}/
        );

      if (!match) {

        return json(
          {
            success: false,

            error:
              "The image was processed, but the extracted response was not valid JSON."
          },
          502
        );
      }

      extracted =
        JSON.parse(
          match[0]
        );
    }


    const allowedModels =
      new Set([
        "eicher10",
        "mahindra10",
        "eicher20",
        "mahindra20",
        "koel20"
      ]);


    const model =
      allowedModels.has(
        extracted.model
      )
        ? extracted.model
        : null;


    const currentHmr =
      extracted.current_hmr == null
        ? null
        : Number(
            extracted.current_hmr
          );


    const currentKwh =
      extracted.current_kwh == null
        ? null
        : Number(
            extracted.current_kwh
          );


    const currentBalance =
      extracted.current_balance == null
        ? null
        : Number(
            extracted.current_balance
          );


    if (
      currentHmr !== null &&
      !Number.isFinite(
        currentHmr
      )
    ) {

      return json(
        {
          success: false,

          error:
            "The extracted HMR is not a valid number."
        },
        502
      );
    }


    if (
      currentKwh !== null &&
      !Number.isFinite(
        currentKwh
      )
    ) {

      return json(
        {
          success: false,

          error:
            "The extracted kWh is not a valid number."
        },
        502
      );
    }


    if (
      currentBalance !== null &&
      !Number.isFinite(
        currentBalance
      )
    ) {

      return json(
        {
          success: false,

          error:
            "The extracted balance is not a valid number."
        },
        502
      );
    }


    return json({

      success: true,

      site_id:
        siteId || null,

      model,

      current_hmr:
        currentHmr,

      current_kwh:
        currentKwh,

      current_balance:
        currentBalance,

      image_stored:
        false

    });


  } catch (error) {

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Image extraction failed."
      },
      500
    );
  }
}
<!-- =====================================================
     PART 2 — ADMIN.HTML JAVASCRIPT
     ===================================================== -->

<script>

const $ = (id) => document.getElementById(id);


/* -------------------------------------------------------
   MESSAGE HELPER
------------------------------------------------------- */

function showMessage(element, text, type) {

  element.textContent = text;

  element.className =
    "message " + type;

}


function clearMessage(element) {

  element.textContent = "";

  element.className = "message";

}


/* -------------------------------------------------------
   SITE DISPLAY
------------------------------------------------------- */

function showSite(site) {

  $("siteInfo").classList.add("show");

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


/* -------------------------------------------------------
   LOAD SITE
------------------------------------------------------- */

$("loadSite").addEventListener(
  "click",
  async () => {

    clearMessage($("authMessage"));

    const siteId =
      $("siteId").value.trim();


    if (!siteId) {

      showMessage(
        $("authMessage"),
        "Please enter a Site ID.",
        "error"
      );

      return;

    }


    $("loadSite").disabled = true;
    $("loadSite").textContent = "Loading...";


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


      showSite(data.site);


      showMessage(
        $("authMessage"),
        "Site loaded successfully.",
        "success"
      );


    } catch (error) {

      showMessage(
        $("authMessage"),
        error.message ||
        "Unable to load site.",
        "error"
      );

    } finally {

      $("loadSite").disabled = false;
      $("loadSite").textContent =
        "Load Existing Site";

    }

  }
);


/* -------------------------------------------------------
   IMAGE SELECTION + PREVIEW
------------------------------------------------------- */

$("imageInput").addEventListener(
  "change",
  () => {

    clearMessage($("authMessage"));


    const file =
      $("imageInput").files[0];


    if (!file) {

      $("preview")
        .classList
        .remove("show");

      return;

    }


    if (
      !file.type ||
      !file.type.startsWith("image/")
    ) {

      showMessage(
        $("authMessage"),
        "Please select a valid image.",
        "error"
      );

      $("imageInput").value = "";

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


    reader.readAsDataURL(file);

  }
);


/* -------------------------------------------------------
   MANUAL FALLBACK
------------------------------------------------------- */

$("manualButton").addEventListener(
  "click",
  () => {

    const section =
      $("manualSection");


    section.classList.toggle("show");


    if (
      section.classList.contains("show")
    ) {

      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  }
);


/* =======================================================
   EXTRACT DETAILS
   ======================================================= */

$("extractButton").addEventListener(
  "click",
  async () => {

    clearMessage($("authMessage"));


    const adminKey =
      $("adminKey")
        .value
        .trim();


    const siteId =
      $("siteId")
        .value
        .trim();


    const file =
      $("imageInput")
        .files[0];


    /* ---------------------------------------------------
       VALIDATION
    --------------------------------------------------- */

    if (!adminKey) {

      showMessage(
        $("authMessage"),
        "Please enter the admin key first.",
        "error"
      );

      return;

    }


    if (!siteId) {

      showMessage(
        $("authMessage"),
        "Please enter the Site ID first.",
        "error"
      );

      return;

    }


    if (!file) {

      showMessage(
        $("authMessage"),
        "Please upload a generator screenshot first.",
        "error"
      );

      return;

    }


    if (
      !file.type ||
      !file.type.startsWith("image/")
    ) {

      showMessage(
        $("authMessage"),
        "The selected file is not an image.",
        "error"
      );

      return;

    }


    /* ---------------------------------------------------
       BUTTON STATE
    --------------------------------------------------- */

    $("extractButton").disabled = true;

    $("extractButton").textContent =
      "Extracting details...";


    try {

      /* -------------------------------------------------
         CREATE TEMPORARY FORM DATA

         The image is sent directly to Worker.

         It is NOT stored by this frontend.
      ------------------------------------------------- */

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


      /* -------------------------------------------------
         SEND IMAGE TO WORKER
      ------------------------------------------------- */

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
          "The extraction server returned an invalid response."
        );

      }


      /* -------------------------------------------------
         HANDLE ERROR
      ------------------------------------------------- */

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          "Could not extract details from the image."
        );

      }


      /* -------------------------------------------------
         CHECK REQUIRED VALUES
      ------------------------------------------------- */

      if (
        data.model === undefined ||
        data.current_hmr === undefined ||
        data.current_kwh === undefined ||
        data.current_balance === undefined
      ) {

        throw new Error(
          "The image was received, but one or more required readings were not detected."
        );

      }


      /* -------------------------------------------------
         PUT EXTRACTED DATA INTO REVIEW FIELDS
      ------------------------------------------------- */

      $("extractedModel").value =
        data.model;


      $("extractedHmr").value =
        data.current_hmr;


      $("extractedKwh").value =
        data.current_kwh;


      $("extractedBalance").value =
        data.current_balance;


      /* -------------------------------------------------
         SHOW EXTRACTION RESULT
      ------------------------------------------------- */

      $("extractionSection")
        .style
        .display = "block";


      /* -------------------------------------------------
         SUCCESS MESSAGE
      ------------------------------------------------- */

      showMessage(
        $("authMessage"),
        "Details extracted successfully. Please review or edit them before saving.",
        "success"
      );


      /* -------------------------------------------------
         SCROLL TO REVIEW
      ------------------------------------------------- */

      $("extractionSection")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });


    } catch (error) {

      showMessage(
        $("authMessage"),
        error.message ||
        "Image extraction failed.",
        "error"
      );

    } finally {

      $("extractButton").disabled =
        false;

      $("extractButton").textContent =
        "Extract Details";

    }

  }
);


/* =======================================================
   SAVE MANUAL READING
   ======================================================= */

$("updateSite").addEventListener(
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


    const currentHmr =
      $("currentHmr")
        .value;


    const currentKwh =
      $("currentKwh")
        .value;


    const currentBalance =
      $("currentBalance")
        .value;


    if (!adminKey) {

      showMessage(
        $("updateMessage"),
        "Please enter the admin key.",
        "error"
      );

      return;

    }


    if (!siteId) {

      showMessage(
        $("updateMessage"),
        "Site ID is required.",
        "error"
      );

      return;

    }


    if (
      currentHmr === "" ||
      currentKwh === "" ||
      currentBalance === ""
    ) {

      showMessage(
        $("updateMessage"),
        "Please fill all manual reading fields.",
        "error"
      );

      return;

    }


    $("updateSite").disabled =
      true;

    $("updateSite").textContent =
      "Saving...";


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
                  currentHmr,

                current_kwh:
                  currentKwh,

                current_balance:
                  currentBalance

              })

          }
        );


      const text =
        await response.text();


      const data =
        text.trim()
          ? JSON.parse(text)
          : {};


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          "Site update failed."
        );

      }


      showMessage(
        $("updateMessage"),
        "Site updated successfully.",
        "success"
      );


    } catch (error) {

      showMessage(
        $("updateMessage"),
        error.message ||
        "Site update failed.",
        "error"
      );

    } finally {

      $("updateSite").disabled =
        false;

      $("updateSite").textContent =
        "Save Manual Reading";

    }

  }
);


/* =======================================================
   CONFIRM & SAVE EXTRACTED DATA
   ======================================================= */

$("saveExtracted").addEventListener(
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
        .value
        .trim();


    const kwh =
      $("extractedKwh")
        .value
        .trim();


    const balance =
      $("extractedBalance")
        .value
        .trim();


    /* ---------------------------------------------------
       VALIDATION
    --------------------------------------------------- */

    if (!adminKey) {

      showMessage(
        $("extractMessage"),
        "Please enter the admin key.",
        "error"
      );

      return;

    }


    if (!siteId) {

      showMessage(
        $("extractMessage"),
        "Please enter the Site ID.",
        "error"
      );

      return;

    }


    if (
      hmr === "" ||
      kwh === "" ||
      balance === ""
    ) {

      showMessage(
        $("extractMessage"),
        "Please review and fill all extracted fields.",
        "error"
      );

      return;

    }


    /* ---------------------------------------------------
       SAVE BUTTON STATE
    --------------------------------------------------- */

    $("saveExtracted").disabled =
      true;

    $("saveExtracted").textContent =
      "Saving...";


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


      /* -------------------------------------------------
         SUCCESS
      ------------------------------------------------- */

      showMessage(
        $("extractMessage"),
        "Extracted reading saved successfully.",
        "success"
      );


      /* -------------------------------------------------
         UPDATE SITE DISPLAY
      ------------------------------------------------- */

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


      /* -------------------------------------------------
         CLEAR IMAGE AFTER SUCCESSFUL SAVE

         The image is removed from the browser.

         It was never stored by this page.
      ------------------------------------------------- */

      $("imageInput").value = "";


      $("preview")
        .classList
        .remove("show");


      $("previewImage").src = "";


      $("fileName").textContent = "";


    } catch (error) {

      showMessage(
        $("extractMessage"),
        error.message ||
        "Save failed.",
        "error"
      );

    } finally {

      $("saveExtracted").disabled =
        false;

      $("saveExtracted").textContent =
        "Confirm & Save";

    }

  }
);

</script>

</body>
</html>
