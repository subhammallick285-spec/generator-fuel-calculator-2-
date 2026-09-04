// ============================================================
// GENERATOR FUEL CALCULATOR - CLOUDFLARE WORKER
// ============================================================

const ACCOUNT_ID = "4b5679a6b80f3058805fa9169e1322cb";

// ============================================================
// GENERATOR CHARTS
// ============================================================

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


// ============================================================
// BASIC RESPONSE HELPERS
// ============================================================

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );

}


function number(value, name) {

  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return n;

}


// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

function checkAdminKey(request, env) {

  const configuredKey =
    String(env.ADMIN_KEY || "").trim();

  if (!configuredKey) {

    return {
      ok: false,
      response: json(
        {
          success: false,
          error: "Admin key is not configured."
        },
        500
      )
    };

  }

  const suppliedKey =
    String(
      request.headers.get("X-Admin-Key") || ""
    ).trim();

  if (!suppliedKey) {

    return {
      ok: false,
      response: json(
        {
          success: false,
          error: "Admin key is required."
        },
        401
      )
    };

  }

  if (suppliedKey !== configuredKey) {

    return {
      ok: false,
      response: json(
        {
          success: false,
          error: "Invalid admin key."
        },
        403
      )
    };

  }

  return {
    ok: true
  };

}


// ============================================================
// CALCULATOR
// ============================================================

async function calculate(request, env) {

  try {

    const body =
      await request.json();

    const model =
      String(body.model || "").trim();

    if (!model) {

      return json(
        {
          success: false,
          error: "Generator model is required."
        },
        400
      );

    }

    if (!CHARTS[model]) {

      return json(
        {
          success: false,
          error: "Invalid generator model."
        },
        400
      );

    }


    const A =
      number(body.current_hmr, "Current HMR");

    const B =
      number(body.current_kwh, "Current kWh");

    const C =
      number(body.previous_hmr, "Previous HMR");

    const D =
      number(body.previous_kwh, "Previous kWh");

    const E =
      number(body.previous_balance, "Previous balance");


    // --------------------------------------------------------
    // FORMULA
    // --------------------------------------------------------

    const Z = A - C;

    const Y = B - D;


    if (Z <= 0) {

      return json(
        {
          success: false,
          error: "Current HMR must be greater than previous HMR."
        },
        400
      );

    }


    if (Y < 0) {

      return json(
        {
          success: false,
          error: "Current kWh cannot be lower than previous kWh."
        },
        400
      );

    }


    const X =
      Y / Z;


    // --------------------------------------------------------
    // FIND L FROM CHART
    // --------------------------------------------------------

    const chart =
      CHARTS[model];

    const row =
      chart.rows.find(
        ([lo, hi]) =>
          X >= lo - 1e-10 &&
          X <= hi + 1e-10
      );


    if (!row) {

      return json(
        {
          success: false,
          error:
            `Calculated kWh/HMR value (${X.toFixed(4)}) is outside the ${chart.name} chart range.`
        },
        400
      );

    }


    const L =
      row[2];


    // --------------------------------------------------------
    // REMAINING CALCULATION
    // --------------------------------------------------------

    const S =
      L * Z;

    const T =
      E - S;


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return json({

      success: true,

      model,

      model_name: chart.name,

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

      T,

      chart_range: {
        min: row[0],
        max: row[1]
      }

    });

  } catch (error) {

    console.error(
      "calculate error:",
      error
    );

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


// ============================================================
// GET SITE
// ============================================================

async function getSite(request, env) {

  if (!env.DB) {

    return json(
      {
        success: false,
        error: "D1 database is not configured."
      },
      500
    );

  }


  try {

    const url =
      new URL(request.url);

    const siteId =
      String(
        url.searchParams.get("site_id") || ""
      ).trim();


    if (!siteId) {

      return json(
        {
          success: false,
          error: "Site ID is required."
        },
        400
      );

    }


    const site =
      await env.DB.prepare(`
        SELECT
          id,
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


    if (!site) {

      return json(
        {
          success: false,
          error: "Site not found."
        },
        404
      );

    }


    return json({
      success: true,
      site
    });


  } catch (error) {

    console.error(
      "getSite error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to load site."
      },
      500
    );

  }

}


// ============================================================
// ADMIN DIRECT SAVE
// Kept only for compatibility.
// PUBLIC USERS CANNOT USE THIS.
// ============================================================

async function saveCalculatorSite(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  if (!env.DB) {

    return json(
      {
        success: false,
        error: "D1 database is not configured."
      },
      500
    );

  }


  try {

    const body =
      await request.json();


    const siteId =
      String(
        body.site_id || ""
      ).trim();

    const siteName =
      String(
        body.site_name || siteId
      ).trim();

    const model =
      String(
        body.model || ""
      ).trim();

    const currentHmr =
      number(
        body.current_hmr,
        "Current HMR"
      );

    const currentKwh =
      number(
        body.current_kwh,
        "Current kWh"
      );

    const currentBalance =
      number(
        body.current_balance,
        "Current balance"
      );


    if (!siteId) {

      return json(
        {
          success: false,
          error: "Site ID is required."
        },
        400
      );

    }


    if (!CHARTS[model]) {

      return json(
        {
          success: false,
          error: "Invalid generator model."
        },
        400
      );

    }


    const now =
      new Date().toISOString();


    const existingSite =
      await env.DB.prepare(`
        SELECT id
        FROM sites
        WHERE site_id = ?
        LIMIT 1
      `)
      .bind(siteId)
      .first();


    const statements = [];


    if (existingSite) {

      statements.push(
        env.DB.prepare(`
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
          currentHmr,
          currentKwh,
          currentBalance,
          now,
          "admin",
          siteId
        )
      );

    } else {

      statements.push(
        env.DB.prepare(`
          INSERT INTO sites (
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          siteId,
          siteName,
          model,
          currentHmr,
          currentKwh,
          currentBalance,
          now,
          null,
          "admin"
        )
      );

    }


    statements.push(
      env.DB.prepare(`
        INSERT INTO readings (
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
        currentHmr,
        currentKwh,
        currentBalance,
        now,
        "admin"
      )
    );


    await env.DB.batch(
      statements
    );


    return json({
      success: true,
      message: "Site saved successfully."
    });


  } catch (error) {

    console.error(
      "saveCalculatorSite error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to save site."
      },
      500
    );

  }

}


// ============================================================
// CREATE SAVE REQUEST
// PUBLIC USER CAN USE THIS.
// IT DOES NOT UPDATE sites.
// ============================================================

async function createSaveRequest(request, env) {

  try {

    if (!env.DB) {

      return json(
        {
          success: false,
          error: "D1 database is not configured."
        },
        500
      );

    }


    const body =
      await request.json();


    const siteId =
      String(
        body.site_id || ""
      ).trim();

    const model =
      String(
        body.model || ""
      ).trim();

    const currentHmr =
      Number(body.current_hmr);

    const currentKwh =
      Number(body.current_kwh);

    const currentBalance =
      Number(body.current_balance);


    if (!siteId) {

      return json(
        {
          success: false,
          error: "Site ID is required."
        },
        400
      );

    }


    if (!model || !CHARTS[model]) {

      return json(
        {
          success: false,
          error: "Invalid generator model."
        },
        400
      );

    }


    if (
      !Number.isFinite(currentHmr) ||
      !Number.isFinite(currentKwh) ||
      !Number.isFinite(currentBalance)
    ) {

      return json(
        {
          success: false,
          error:
            "Invalid HMR, kWh or balance."
        },
        400
      );

    }


    const now =
      new Date().toISOString();


    await env.DB.prepare(`
      INSERT INTO save_requests
      (
        site_id,
        site_name,
        model,
        current_hmr,
        current_kwh,
        current_balance,
        requested_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      siteId,
      siteId,
      model,
      currentHmr,
      currentKwh,
      currentBalance,
      now,
      "pending"
    )
    .run();


    return json({
      success: true,
      message:
        "Save request sent to admin for approval."
    });


  } catch (error) {

    console.error(
      "createSaveRequest error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to create save request."
      },
      500
    );

  }

}


// ============================================================
// GET PENDING SAVE REQUESTS
// ADMIN ONLY
// ============================================================

async function getSaveRequests(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  if (!env.DB) {

    return json(
      {
        success: false,
        error: "D1 database is not configured."
      },
      500
    );

  }


  try {

    const result =
      await env.DB.prepare(`
        SELECT
          id,
          site_id,
          site_name,
          model,
          current_hmr,
          current_kwh,
          current_balance,
          requested_at,
          status
        FROM save_requests
        WHERE status = 'pending'
        ORDER BY requested_at DESC
      `)
      .all();


    return json({
      success: true,
      requests:
        result.results || []
    });


  } catch (error) {

    console.error(
      "getSaveRequests error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to load save requests."
      },
      500
    );

  }

}


// ============================================================
// APPROVE / REJECT SAVE REQUEST
// ADMIN ONLY
// ============================================================

async function reviewSaveRequest(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  if (!env.DB) {

    return json(
      {
        success: false,
        error: "D1 database is not configured."
      },
      500
    );

  }


  try {

    const body =
      await request.json();


    const id =
      Number(body.id);

    const action =
      String(body.action || "")
        .toLowerCase()
        .trim();


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return json(
        {
          success: false,
          error: "Invalid request ID."
        },
        400
      );

    }


    if (
      action !== "approve" &&
      action !== "reject"
    ) {

      return json(
        {
          success: false,
          error:
            "Action must be approve or reject."
        },
        400
      );

    }


    const requestResult =
      await env.DB.prepare(`
        SELECT
          id,
          site_id,
          site_name,
          model,
          current_hmr,
          current_kwh,
          current_balance,
          status
        FROM save_requests
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first();


    if (!requestResult) {

      return json(
        {
          success: false,
          error:
            "Save request not found."
        },
        404
      );

    }


    if (
      requestResult.status !== "pending"
    ) {

      return json(
        {
          success: false,
          error:
            "This request has already been reviewed."
        },
        409
      );

    }


    // --------------------------------------------------------
    // REJECT
    // --------------------------------------------------------

    if (action === "reject") {

      const reviewedAt =
        new Date().toISOString();


      const result =
        await env.DB.prepare(`
          UPDATE save_requests
          SET
            status = 'rejected',
            reviewed_at = ?,
            reviewed_by = ?
          WHERE id = ?
            AND status = 'pending'
        `)
        .bind(
          reviewedAt,
          "admin",
          id
        )
        .run();


      if (
        !result.meta ||
        result.meta.changes !== 1
      ) {

        return json(
          {
            success: false,
            error:
              "Request could not be rejected."
          },
          409
        );

      }


      return json({
        success: true,
        message:
          "Save request rejected."
      });

    }


    // --------------------------------------------------------
    // APPROVE
    // --------------------------------------------------------

    const siteId =
      String(
        requestResult.site_id || ""
      ).trim();

    const model =
      String(
        requestResult.model || ""
      ).trim();

    const currentHmr =
      Number(
        requestResult.current_hmr
      );

    const currentKwh =
      Number(
        requestResult.current_kwh
      );

    const currentBalance =
      Number(
        requestResult.current_balance
      );


    if (
      !siteId ||
      !CHARTS[model] ||
      !Number.isFinite(currentHmr) ||
      !Number.isFinite(currentKwh) ||
      !Number.isFinite(currentBalance)
    ) {

      return json(
        {
          success: false,
          error:
            "Save request contains invalid data."
        },
        400
      );

    }


    const now =
      new Date().toISOString();


    const existingSite =
      await env.DB.prepare(`
        SELECT
          site_name
        FROM sites
        WHERE site_id = ?
        LIMIT 1
      `)
      .bind(siteId)
      .first();


    const siteName =
      existingSite?.site_name ||
      requestResult.site_name ||
      siteId;


    const statements = [];


    // --------------------------------------------------------
    // UPDATE EXISTING SITE
    // --------------------------------------------------------

    if (existingSite) {

      statements.push(
        env.DB.prepare(`
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
          currentHmr,
          currentKwh,
          currentBalance,
          now,
          "calculator-approved",
          siteId
        )
      );

    }

    // --------------------------------------------------------
    // CREATE NEW SITE
    // --------------------------------------------------------

    else {

      statements.push(
        env.DB.prepare(`
          INSERT INTO sites (
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          siteId,
          siteName,
          model,
          currentHmr,
          currentKwh,
          currentBalance,
          now,
          null,
          "manual"
        )
      );

    }


    // --------------------------------------------------------
    // SAVE READING HISTORY
    // --------------------------------------------------------

    statements.push(
      env.DB.prepare(`
        INSERT INTO readings (
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
        currentHmr,
        currentKwh,
        currentBalance,
        now,
        "manual"
      )
    );


    // --------------------------------------------------------
    // EXECUTE DATABASE CHANGES
    // --------------------------------------------------------

    await env.DB.batch(
      statements
    );


    return json({
      success: true,
      message: "Site updated successfully."
    });


  } catch (error) {

    console.error(
      "updateSite error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to update site."
      },
      500
    );

  }

}


// ============================================================
// EXTRACT DATA FROM SCREENSHOT USING LLAMA VISION
// ============================================================

async function extractImage(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  if (!env.AI) {

    return json(
      {
        success: false,
        error:
          "Workers AI is not configured."
      },
      500
    );

  }


  try {

    if (
      request.method !== "POST"
    ) {

      return json(
        {
          success: false,
          error: "POST required."
        },
        405
      );

    }


    const contentType =
      request.headers.get("content-type") || "";


    if (
      !contentType.includes(
        "multipart/form-data"
      )
    ) {

      return json(
        {
          success: false,
          error:
            "Multipart form-data image is required."
        },
        400
      );

    }


    const form =
      await request.formData();


    const file =
      form.get("image") ||
      form.get("file");


    if (
      !(file instanceof File)
    ) {

      return json(
        {
          success: false,
          error: "Image file is required."
        },
        400
      );

    }


    const MAX_SIZE =
      10 * 1024 * 1024;


    if (
      file.size > MAX_SIZE
    ) {

      return json(
        {
          success: false,
          error:
            "Image is too large. Maximum size is 10 MB."
        },
        400
      );

    }


    const buffer =
      await file.arrayBuffer();


    const bytes =
      new Uint8Array(buffer);


    let binary = "";


    const CHUNK_SIZE =
      0x8000;


    for (
      let i = 0;
      i < bytes.length;
      i += CHUNK_SIZE
    ) {

      binary += String.fromCharCode(
        ...bytes.subarray(
          i,
          i + CHUNK_SIZE
        )
      );

    }


    const base64 =
      btoa(binary);


    const mime =
      file.type ||
      "image/jpeg";


    const imageData =
      `data:${mime};base64,${base64}`;


    const prompt = `
You are reading a generator control-panel screenshot.

Extract only information that is clearly visible.

Return ONLY valid JSON.

Use exactly these fields:

{
  "model": "",
  "current_hmr": null,
  "current_kwh": null,
  "previous_balance": null,
  "fuel_filled": null,
  "current_balance": null
}

Rules:

1. Do not guess.
2. If a value is not visible, use null.
3. current_hmr means the current HMR/hour-meter reading.
4. current_kwh means the current kWh reading.
5. previous_balance means the balance before filling.
6. fuel_filled means fuel added during filling.
7. current_balance means the balance after filling.
8. Keep decimal values exactly as visible where possible.
9. Return no markdown.
10. Return JSON only.
`;


    const aiResult =
      await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ]
        }
      );


    let rawText = "";


    if (
      typeof aiResult === "string"
    ) {

      rawText =
        aiResult;

    } else {

      rawText =
        aiResult?.response ||
        aiResult?.result?.response ||
        JSON.stringify(aiResult);

    }


    rawText =
      String(rawText)
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    let extracted;


    try {

      extracted =
        JSON.parse(rawText);

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
              "AI returned invalid JSON.",
            raw: rawText
          },
          502
        );

      }


      extracted =
        JSON.parse(match[0]);

    }


    function cleanNumber(value) {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }


      const cleaned =
        String(value)
          .replace(/,/g, "")
          .replace(/[^\d.-]/g, "");


      if (!cleaned) {
        return null;
      }


      const n =
        Number(cleaned);


      return Number.isFinite(n)
        ? n
        : null;

    }


    const model =
      String(
        extracted.model || ""
      ).trim();


    const current_hmr =
      cleanNumber(
        extracted.current_hmr
      );

    const current_kwh =
      cleanNumber(
        extracted.current_kwh
      );

    const previous_balance =
      cleanNumber(
        extracted.previous_balance
      );

    const fuel_filled =
      cleanNumber(
        extracted.fuel_filled
      );

    let current_balance =
      cleanNumber(
        extracted.current_balance
      );


    if (
      current_balance === null &&
      previous_balance !== null &&
      fuel_filled !== null
    ) {

      current_balance =
        previous_balance +
        fuel_filled;

    }


    return json({

      success: true,

      data: {
        model,
        current_hmr,
        current_kwh,
        previous_balance,
        fuel_filled,
        current_balance
      }

    });


  } catch (error) {

    console.error(
      "extractImage error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to extract screenshot data."
      },
      500
    );

  }

}


// ============================================================
// AGREE / ACTIVATE LLAMA
// ============================================================

async function agreeLlama(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  try {

    const response =
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/models/accept`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${env.CLOUDFLARE_API_TOKEN}`
          },

          body: JSON.stringify({
            model:
              "@cf/meta/llama-3.2-11b-vision-instruct"
          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      return json(
        {
          success: false,
          error:
            data?.errors?.[0]?.message ||
            "Unable to activate Llama AI.",
          cloudflare: data
        },
        response.status
      );

    }


    return json({
      success: true,
      message:
        "Llama AI activated successfully.",
      cloudflare: data
    });


  } catch (error) {

    console.error(
      "agreeLlama error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to activate Llama AI."
      },
      500
    );

  }

}


// ============================================================
// DEBUG CONFIGURATION
// ADMIN ONLY
// ============================================================

async function debugConfig(request, env) {

  const auth =
    checkAdminKey(request, env);

  if (!auth.ok) {
    return auth.response;
  }


  return json({

    success: true,

    db:
      !!env.DB,

    ai:
      !!env.AI,

    assets:
      !!env.ASSETS,

    admin_key:
      !!String(
        env.ADMIN_KEY || ""
      ).trim(),

    cloudflare_api_token:
      !!String(
        env.CLOUDFLARE_API_TOKEN || ""
      ).trim(),

    charts:
      Object.keys(CHARTS),

    routes: [
      "POST /api/calculate",
      "GET /api/site",
      "POST /api/save-request",
      "GET /api/admin/save-requests",
      "POST /api/admin/save-request/review",
      "POST /api/admin/update-site",
      "POST /api/admin/extract-image",
      "POST /api/admin/agree-llama",
      "POST /api/save-site",
      "GET /api/debug"
    ]

  });

}


// ============================================================
// MAIN ROUTER
// ============================================================

export default {

  async fetch(request, env, ctx) {

    const url =
      new URL(request.url);

    const path =
      url.pathname;

    const method =
      request.method.toUpperCase();


    try {

      // ------------------------------------------------------
      // CALCULATOR
      // ------------------------------------------------------

      if (
        path === "/api/calculate" &&
        method === "POST"
      ) {

        return await calculate(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // SITE LOOKUP
      // ------------------------------------------------------

      if (
        path === "/api/site" &&
        method === "GET"
      ) {

        return await getSite(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // PUBLIC SAVE REQUEST
      // ------------------------------------------------------

      if (
        path === "/api/save-request" &&
        method === "POST"
      ) {

        return await createSaveRequest(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // ADMIN SAVE REQUESTS
      // ------------------------------------------------------

      if (
        path === "/api/admin/save-requests" &&
        method === "GET"
      ) {

        return await getSaveRequests(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // ADMIN APPROVE / REJECT
      // ------------------------------------------------------

      if (
        path === "/api/admin/save-request/review" &&
        method === "POST"
      ) {

        return await reviewSaveRequest(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // ADMIN UPDATE SITE
      // ------------------------------------------------------

      if (
        path === "/api/admin/update-site" &&
        method === "POST"
      ) {

        return await updateSite(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // ADMIN OCR
      // ------------------------------------------------------

      if (
        path === "/api/admin/extract-image" &&
        method === "POST"
      ) {

        return await extractImage(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // ADMIN LLAMA AGREEMENT
      // ------------------------------------------------------

      if (
        path === "/api/admin/agree-llama" &&
        method === "POST"
      ) {

        return await agreeLlama(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // DEBUG
      // ------------------------------------------------------

      if (
        path === "/api/debug" &&
        method === "GET"
      ) {

        return await debugConfig(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // OLD DIRECT SAVE
      // ADMIN ONLY
      // ------------------------------------------------------

      if (
        path === "/api/save-site" &&
        method === "POST"
      ) {

        return await saveCalculatorSite(
          request,
          env
        );

      }


      // ------------------------------------------------------
      // STATIC ASSETS
      // ------------------------------------------------------

      if (env.ASSETS) {

        return await env.ASSETS.fetch(
          request
        );

      }


      return new Response(
        "Not Found",
        {
          status: 404,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        }
      );


    } catch (error) {

      console.error(
        "Worker router error:",
        error
      );


      return json(
        {
          success: false,
          error:
            error?.message ||
            "Internal server error."
        },
        500
      );

    }

  }

};
