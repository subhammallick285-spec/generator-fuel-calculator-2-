/* =========================================================
   GENERATOR FUEL CALCULATOR
   CLOUDFLARE WORKER
   ========================================================= */


/* =========================================================
   GENERATOR CHARTS
   ========================================================= */

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


/* =========================================================
   JSON RESPONSE
   ========================================================= */

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


/* =========================================================
   NUMBER VALIDATION
   ========================================================= */

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


/* =========================================================
   ADMIN AUTHENTICATION
   ========================================================= */

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
            "ADMIN_KEY is not configured."
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


/* =========================================================
   CALCULATOR
   ========================================================= */

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
          X >= lo &&
          X <= hi
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


    const [
      lo,
      hi,
      L
    ] = row;


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


/* =========================================================
   GET SITE
   ========================================================= */

async function getSite(
  request,
  env
) {

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


/* =========================================================
   UPDATE / CREATE SITE
   ========================================================= */

async function saveSite(
  request,
  env,
  source = "manual"
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


    const model =
      String(
        body.model || ""
      ).trim();


    if (!CHARTS[model]) {

      throw new Error(
        "Please select a valid generator model."
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


    const siteName =
      String(
        body.site_name ||
        siteId
      ).trim();


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


    const now =
      new Date().toISOString();


    /*
     * EXISTING SITE
     */

    if (existing) {

      await env.DB
        .prepare(`
          UPDATE sites
          SET
            site_name = ?,
            model = ?,
            current_hmr = ?,
            current_kwh = ?,
            current_balance = ?,
            last_updated = ?,
            data_source = ?
          WHERE site_id = ?
        `)
        .bind(
          siteName,
          model,
          hmr,
          kwh,
          balance,
          now,
          source,
          siteId
        )
        .run();


    }

    /*
     * NEW SITE
     */

    else {

      await env.DB
        .prepare(`
          INSERT INTO sites
          (
            site_id,
            site_name,
            model,
            current_hmr,
            current_kwh,
            current_balance,
            last_updated,
            screenshot_url,
            data_source
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
        `)
        .bind(
          siteId,
          siteName,
          model,
          hmr,
          kwh,
          balance,
          now,
          source
        )
        .run();

    }


    /*
     * SAVE READING HISTORY
     */

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
        source
      )
      .run();


    return json({

      success: true,

      action:
        existing
          ? "updated"
          : "created",

      message:
        existing
          ? "Site updated successfully."
          : "New site created successfully.",

      site_id:
        siteId,

      site_name:
        siteName,

      model,

      current_hmr:
        hmr,

      current_kwh:
        kwh,

      current_balance:
        balance,

      updated_at:
        now,

      source

    });


  } catch (error) {

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Site save failed."
      },

      400
    );

  }

}


/* =========================================================
   IMAGE → AI VISION EXTRACTION
   ========================================================= */

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


    /*
     * AI BINDING CHECK
     */

    if (!env.AI) {

      return json(
        {
          success: false,

          error:
            "Workers AI binding is missing. Add an AI binding named AI to this Worker."
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
            "Image must be uploaded as multipart/form-data."
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


    /*
     * Convert image to base64 data URL.
     *
     * It is held only during this request.
     * We do NOT save it.
     */

    const arrayBuffer =
      await image.arrayBuffer();


    const bytes =
      new Uint8Array(
        arrayBuffer
      );


    let binary = "";


    const chunkSize =
      0x8000;


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


    const imageData =
      `data:${image.type};base64,${base64}`;


    /*
     * IMPORTANT:
     *
     * We deliberately do NOT ask AI
     * to decide the generator model.
     *
     * The admin will choose:
     *
     * Eicher 10
     * Eicher 20
     * Mahindra 10
     * Mahindra 20
     * KOEL 20
     *
     * after extraction.
     */

    const systemPrompt = `
You extract readings from generator meter screenshots.

The screenshot format is consistent between sites,
but the numerical values can differ.

Extract ONLY information that is visibly present.

Do NOT guess.
Do NOT calculate missing values.
Do NOT invent values.

Return valid JSON only.

Fields:

{
  "current_hmr": number or null,
  "current_kwh": number or null,
  "balance_before_filling": number or null,
  "filling_quantity": number or null,
  "current_balance": number or null,
  "site_id": string or null,
  "confidence": number,
  "notes": string
}

Definitions:

current_hmr:
The current hour-meter reading.

current_kwh:
The current kWh reading.

balance_before_filling:
The fuel balance immediately before the latest filling.

filling_quantity:
The quantity added during the latest filling.

current_balance:
The resulting fuel balance after filling.
If the screenshot explicitly shows the final balance, extract it.
If it is NOT explicitly shown, return null.
Do not calculate it.

site_id:
Only extract it if visibly printed in the screenshot.
Otherwise return null.

confidence:
A number from 0 to 1 describing how clearly the values
were readable.

notes:
Briefly mention any field that was unclear or not visible.
`;


    /*
     * Call Cloudflare Workers AI Vision.
     */

    const aiResponse =
      await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          messages: [

            {
              role: "system",

              content:
                systemPrompt
            },

            {
              role: "user",

              content:
                "Read the generator screenshot and extract the requested fields."
            }

          ],

          image:
            imageData,

          max_tokens:
            700,

          temperature:
            0

        }
      );


    /*
     * Extract model output.
     */

    let rawText = "";


    if (
      aiResponse &&
      typeof aiResponse === "object"
    ) {

      if (
        typeof aiResponse.response ===
        "string"
      ) {

        rawText =
          aiResponse.response;

      }

      else if (
        typeof aiResponse.result ===
        "string"
      ) {

        rawText =
          aiResponse.result;

      }

    }


    if (!rawText) {

      rawText =
        String(
          aiResponse || ""
        );

    }


    /*
     * Remove accidental markdown fences.
     */

    rawText =
      rawText
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /\s*```$/i,
          ""
        )
        .trim();


    /*
     * Find JSON if model added extra text.
     */

    const firstBrace =
      rawText.indexOf("{");


    const lastBrace =
      rawText.lastIndexOf("}");


    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {

      return json(
        {
          success: false,

          error:
            "The AI could not return readable structured data.",

          raw:
            rawText

        },

        502
      );

    }


    const jsonText =
      rawText.slice(
        firstBrace,
        lastBrace + 1
      );


    let extracted;


    try {

      extracted =
        JSON.parse(
          jsonText
        );

    } catch {

      return json(
        {
          success: false,

          error:
            "The AI returned invalid extraction data.",

          raw:
            rawText

        },

        502
      );

    }


    /*
     * Normalize values.
     */

    function cleanNumber(value) {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {

        return null;

      }

      const n =
        Number(value);

      return Number.isFinite(n)
        ? n
        : null;

    }


    const result = {

      current_hmr:
        cleanNumber(
          extracted.current_hmr
        ),

      current_kwh:
        cleanNumber(
          extracted.current_kwh
        ),

      balance_before_filling:
        cleanNumber(
          extracted.balance_before_filling
        ),

      filling_quantity:
        cleanNumber(
          extracted.filling_quantity
        ),

      current_balance:
        cleanNumber(
          extracted.current_balance
        ),

      site_id:
        extracted.site_id
          ? String(
              extracted.site_id
            ).trim()
          : null,

      confidence:
        cleanNumber(
          extracted.confidence
        ),

      notes:
        String(
          extracted.notes || ""
        ).trim()

    };


    /*
     * Site ID supplied by admin has priority.
     */

    if (siteId) {

      result.site_id =
        siteId;

    }


    /*
     * IMPORTANT:
     *
     * The image is NOT stored anywhere.
     *
     * We return extracted values only.
     */

    return json({

      success: true,

      extraction_ready: true,

      site_id:
        result.site_id,

      extracted:
        result,

      message:
        "Image processed successfully. Review the extracted values before saving."

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


/* =========================================================
   DEBUG CONFIG
   ========================================================= */

async function debugConfig(
  request,
  env
) {

  return json({

    success: true,

    db:
      !!env.DB,

    assets:
      !!env.ASSETS,

    admin_key:
      !!env.ADMIN_KEY,

    ai:
      !!env.AI

  });

}


/* =========================================================
   MAIN WORKER
   ========================================================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);


    /*
     * CALCULATOR POST
     */

    if (
      url.pathname ===
        "/api/calculate" &&
      request.method ===
        "POST"
    ) {

      return calculate(
        request
      );

    }


    /*
     * CALCULATOR TEST
     */

    if (
      url.pathname ===
        "/api/calculate" &&
      request.method ===
        "GET"
    ) {

      return json({

        success: true,

        message:
          "Generator Fuel Calculator API is working."

      });

    }


    /*
     * GET SITE
     */

    if (
      url.pathname ===
        "/api/site" &&
      request.method ===
        "GET"
    ) {

      return getSite(
        request,
        env
      );

    }


    /*
     * MANUAL / CONFIRMED SAVE
     */

    if (
      url.pathname ===
        "/api/admin/update-site" &&
      request.method ===
        "POST"
    ) {

      return saveSite(
        request,
        env,
        "manual"
      );

}
    <!-- =====================================================
     PART 2 — ADMIN.HTML JAVASCRIPT
     ===================================================== -->

<script>

const $ = (id) => document.getElementById(id);


/* =====================================================
   MESSAGE HELPER
   ===================================================== */

function showMessage(element, text, type) {

  if (!element) return;

  element.textContent = text;

  element.className =
    "message " + type;

}


function clearMessage(element) {

  if (!element) return;

  element.textContent = "";

  element.className = "message";

}


/* =====================================================
   SITE DISPLAY
   ===================================================== */

function showSite(site) {

  const siteInfo =
    $("siteInfo");

  if (siteInfo) {
    siteInfo.classList.add("show");
  }


  if ($("siteName")) {
    $("siteName").textContent =
      site.site_name ?? "—";
  }


  if ($("siteModel")) {
    $("siteModel").textContent =
      site.model ?? "—";
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


  if (
    site.model &&
    $("model")
  ) {

    $("model").value =
      site.model;

  }


  if (
    site.current_hmr !== null &&
    site.current_hmr !== undefined &&
    $("currentHmr")
  ) {

    $("currentHmr").value =
      site.current_hmr;

  }


  if (
    site.current_kwh !== null &&
    site.current_kwh !== undefined &&
    $("currentKwh")
  ) {

    $("currentKwh").value =
      site.current_kwh;

  }


  if (
    site.current_balance !== null &&
    site.current_balance !== undefined &&
    $("currentBalance")
  ) {

    $("currentBalance").value =
      site.current_balance;

  }

}


/* =====================================================
   LOAD EXISTING SITE
   ===================================================== */

if ($("loadSite")) {

  $("loadSite").addEventListener(
    "click",
    async () => {

      const siteId =
        $("siteId")
          .value
          .trim();


      clearMessage(
        $("authMessage")
      );


      if (!siteId) {

        showMessage(
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
            "Unable to load site."
          );

        }


        showSite(
          data.site
        );


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

        $("loadSite").disabled =
          false;

        $("loadSite").textContent =
          "Load Existing Site";

      }

    }
  );

}


/* =====================================================
   IMAGE SELECTION
   ===================================================== */

if ($("imageInput")) {

  $("imageInput").addEventListener(
    "change",
    () => {

      const file =
        $("imageInput").files[0];


      if (!file) {

        if ($("preview")) {
          $("preview")
            .classList
            .remove("show");
        }

        return;

      }


      if (
        !file.type.startsWith("image/")
      ) {

        showMessage(
          $("authMessage"),
          "Please select a valid image.",
          "error"
        );

        $("imageInput").value =
          "";

        return;

      }


      if ($("fileName")) {

        $("fileName").textContent =
          file.name;

      }


      const reader =
        new FileReader();


      reader.onload =
        (event) => {

          if ($("previewImage")) {

            $("previewImage").src =
              event.target.result;

          }


          if ($("preview")) {

            $("preview")
              .classList
              .add("show");

          }

        };


      reader.onerror =
        () => {

          showMessage(
            $("authMessage"),
            "Unable to preview this image.",
            "error"
          );

        };


      reader.readAsDataURL(file);

    }
  );

}


/* =====================================================
   MANUAL ENTRY BUTTON
   ===================================================== */

if ($("manualButton")) {

  $("manualButton").addEventListener(
    "click",
    () => {

      const section =
        $("manualSection");


      if (!section) return;


      section.classList.toggle(
        "show"
      );


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

}


/* =====================================================
   IMAGE EXTRACTION
   ===================================================== */

if ($("extractButton")) {

  $("extractButton").addEventListener(
    "click",
    async () => {

      const file =
        $("imageInput").files[0];


      const adminKey =
        $("adminKey")
          .value
          .trim();


      const siteId =
        $("siteId")
          .value
          .trim();


      if (!file) {

        showMessage(
          $("authMessage"),
          "Please upload an image first.",
          "error"
        );

        return;

      }


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


      $("extractButton").disabled =
        true;

      $("extractButton").textContent =
        "Extracting...";


      clearMessage(
        $("authMessage")
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

              body:
                form
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


        const extracted =
          data.extracted || {};


        /*
         * FILL EXTRACTION RESULT
         */

        if ($("extractedHmr")) {

          $("extractedHmr").value =
            extracted.current_hmr ?? "";

        }


        if ($("extractedKwh")) {

          $("extractedKwh").value =
            extracted.current_kwh ?? "";

        }


        if ($("extractedBalance")) {

          $("extractedBalance").value =
            extracted.current_balance ?? "";

        }


        /*
         * GENERATOR MODEL IS NOT DECIDED
         * BY OCR.
         *
         * Admin chooses it manually.
         */

        if (
          $("extractedModel") &&
          $("model") &&
          $("model").value
        ) {

          $("extractedModel").value =
            $("model").value;

        }


        /*
         * EXTRA INFORMATION
         *
         * These fields may not exist in
         * the current HTML, so we don't
         * crash if they aren't present.
         */

        if ($("balanceBeforeFilling")) {

          $("balanceBeforeFilling").value =
            extracted.balance_before_filling ?? "";

        }


        if ($("fillingQuantity")) {

          $("fillingQuantity").value =
            extracted.filling_quantity ?? "";

        }


        if ($("extractedSiteId")) {

          $("extractedSiteId").value =
            extracted.site_id ||
            siteId;

        }


        /*
         * SHOW EXTRACTION SECTION
         */

        if ($("extractionSection")) {

          $("extractionSection").style.display =
            "block";


          $("extractionSection")
            .scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

        }


        showMessage(
          $("authMessage"),
          "Details extracted successfully. Please review and confirm every value before saving.",
          "success"
        );


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

}


/* =====================================================
   SAVE MANUAL READING
   ===================================================== */

if ($("updateSite")) {

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
        hmr === "" ||
        kwh === "" ||
        balance === ""
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
          data.message ||
          "Site updated successfully.",
          "success"
        );


        /*
         * Reload site information
         */

        if ($("loadSite")) {

          $("loadSite").click();

        }


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

}


/* =====================================================
   SAVE EXTRACTED READING
   ===================================================== */

if ($("saveExtracted")) {

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
          .value;


      const kwh =
        $("extractedKwh")
          .value;


      const balance =
        $("extractedBalance")
          .value;


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
          "Site ID is required.",
          "error"
        );

        return;

      }


      if (!model) {

        showMessage(
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

        showMessage(
          $("extractMessage"),
          "Please review and fill all extracted values before saving.",
          "error"
        );

        return;

      }


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
            "Save failed."
          );

        }


        showMessage(
          $("extractMessage"),
          data.message ||
          "Extracted reading saved successfully.",
          "success"
        );


        /*
         * Clear image from browser memory/UI
         *
         * The image was never stored by the Worker.
         */

        if ($("imageInput")) {

          $("imageInput").value =
            "";

        }


        if ($("preview")) {

          $("preview")
            .classList
            .remove("show");

        }


        if ($("previewImage")) {

          $("previewImage").removeAttribute(
            "src"
          );

        }


        if ($("fileName")) {

          $("fileName").textContent =
            "";

        }


        /*
         * Keep the extraction result visible
         * so admin can see what was saved.
         */


        /*
         * Reload site information
         */

        if ($("loadSite")) {

          $("loadSite").click();

        }


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

}


/* =====================================================
   PAGE INITIALIZATION
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
     * Nothing needs to be loaded automatically.
     *
     * Admin enters Site ID,
     * uploads screenshot,
     * extracts,
     * reviews,
     * selects generator model,
     * confirms and saves.
     */

  }
);

</script>
    
