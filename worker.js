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


// -------------------------
// JSON RESPONSE
// -------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}


// -------------------------
// NUMBER VALIDATION
// -------------------------

function number(value, name) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return n;
}


// -------------------------
// ADMIN KEY
// -------------------------

function checkAdminKey(request, env) {
  const key = request.headers.get("X-Admin-Key");

  if (!env.ADMIN_KEY) {
    return {
      ok: false,
      response: json(
        {
          success: false,
          error: "ADMIN_KEY is not configured."
        },
        500
      )
    };
  }

  if (!key || key !== env.ADMIN_KEY) {
    return {
      ok: false,
      response: json(
        {
          success: false,
          error: "Invalid admin key."
        },
        401
      )
    };
  }

  return {
    ok: true
  };
}


// -------------------------
// CALCULATOR
// -------------------------

async function calculate(request) {
  try {
    const body = await request.json();

    const modelKey = String(body.model || "").trim();

    if (!CHARTS[modelKey]) {
      return json(
        {
          success: false,
          error: "Invalid generator model."
        },
        400
      );
    }

    const A = number(body.A, "A");
    const B = number(body.B, "B");
    const C = number(body.C, "C");
    const D = number(body.D, "D");
    const E = number(body.E, "E");

    const Z = A - C;
    const Y = B - D;

    if (Z === 0) {
      return json(
        {
          success: false,
          error: "A − C cannot be zero."
        },
        400
      );
    }

    const X = Y / Z;

    const chart = CHARTS[modelKey];

    const row = chart.rows.find(([lo, hi]) => {
      return X >= lo && X <= hi;
    });

    if (!row) {
      return json(
        {
          success: false,
          error: `X value ${X.toFixed(4)} is outside the chart range.`
        },
        400
      );
    }

    const L = row[2];

    const S = L * Z;

    const T = E - S;

    return json({
      success: true,
      model: chart.name,

      A,
      B,
      C,
      D,
      E,

      X,
      Y,
      Z,

      L,
      S,
      T,

      chart_range: {
        from: row[0],
        to: row[1]
      }
    });

  } catch (error) {
    return json(
      {
        success: false,
        error: error?.message || String(error)
      },
      400
    );
  }
}


// -------------------------
// GET SITE
// -------------------------

async function getSite(request, env) {
  try {
    const url = new URL(request.url);

    const siteId = url.searchParams.get("site_id");

    if (!siteId) {
      return json(
        {
          success: false,
          error: "site_id is required."
        },
        400
      );
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

    const site = await env.DB
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
    return json(
      {
        success: false,
        error: error?.message || String(error)
      },
      500
    );
  }
}


// -------------------------
// UPDATE SITE
// -------------------------

async function updateSite(request, env) {
  try {
    const auth = checkAdminKey(request, env);

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

    const body = await request.json();

    const siteId = String(body.site_id || "").trim();

    if (!siteId) {
      return json(
        {
          success: false,
          error: "site_id is required."
        },
        400
      );
    }

    const model = String(body.model || "").trim();

    if (!CHARTS[model]) {
      return json(
        {
          success: false,
          error: "Invalid generator model."
        },
        400
      );
    }

    const currentHmr = number(body.current_hmr, "current_hmr");
    const currentKwh = number(body.current_kwh, "current_kwh");
    const currentBalance = number(
      body.current_balance,
      "current_balance"
    );

    const site = await env.DB
      .prepare(`
        SELECT site_id
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
          error: "Site not found. Create the site in D1 first."
        },
        404
      );
    }

    const now = new Date().toISOString();

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
        currentHmr,
        currentKwh,
        currentBalance,
        now,
        body.source || "admin",
        siteId
      )
      .run();

    await env.DB
      .prepare(`
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
        body.source || "admin"
      )
      .run();

    return json({
      success: true,
      message: "Site updated successfully.",
      site_id: siteId,
      model,
      current_hmr: currentHmr,
      current_kwh: currentKwh,
      current_balance: currentBalance,
      last_updated: now
    });

  } catch (error) {
    return json(
      {
        success: false,
        error: error?.message || String(error)
      },
      500
    );
  }
}


// -------------------------
// Llama Vision IMAGE EXTRACTION
// -------------------------

async function extractImage(request, env) {
  try {

    const auth = checkAdminKey(request, env);

    if (!auth.ok) {
      return auth.response;
    }

    if (!env.AI) {
      return json(
        {
          success: false,
          error: "Workers AI binding (AI) is not configured."
        },
        500
      );
    }

    const contentType =
      request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return json(
        {
          success: false,
          error: "Please upload an image using multipart/form-data."
        },
        400
      );
    }

    const form = await request.formData();

    const image = form.get("image");

    const siteId = String(
      form.get("site_id") || ""
    ).trim();

    if (!siteId) {
      return json(
        {
          success: false,
          error: "site_id is required."
        },
        400
      );
    }

    if (!image) {
      return json(
        {
          success: false,
          error: "Image is required."
        },
        400
      );
    }

    if (
      typeof image === "string" ||
      !image.type ||
      !image.type.startsWith("image/")
    ) {
      return json(
        {
          success: false,
          error: "The uploaded file must be an image."
        },
        400
      );
    }

    const imageBuffer = await image.arrayBuffer();

    if (!imageBuffer.byteLength) {
      return json(
        {
          success: false,
          error: "The uploaded image is empty."
        },
        400
      );
    }

    const maxImageSize = 10 * 1024 * 1024;

    if (imageBuffer.byteLength > maxImageSize) {
      return json(
        {
          success: false,
          error: "Image is too large. Maximum size is 10 MB."
        },
        400
      );
    }


    // -------------------------
    // CONVERT IMAGE TO BASE64
    // -------------------------

    const bytes = new Uint8Array(imageBuffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (
      let i = 0;
      i < bytes.length;
      i += chunkSize
    ) {
      binary += String.fromCharCode(
        ...bytes.subarray(
          i,
          Math.min(i + chunkSize, bytes.length)
        )
      );
    }

    const base64 = btoa(binary);

    const imageDataUrl =
      `data:${image.type};base64,${base64}`;


    // -------------------------
    // OCR PROMPT
    // -------------------------

    const prompt = `
You are reading a generator monitoring screenshot.

Extract only information that is visibly readable in the image.

Return ONLY valid JSON.

Do not use markdown.
Do not add explanations.

Use exactly this JSON structure:

{
  "model": null,
  "current_hmr": null,
  "current_kwh": null,
  "previous_balance": null,
  "fuel_filled": null,
  "current_balance": null
}

Rules:

1. current_hmr:
   Extract the generator's current running hours / HMR.

2. current_kwh:
   Extract the current kWh reading.

3. previous_balance:
   Extract the balance BEFORE fuel was added, if visible.

4. fuel_filled:
   Extract the fuel quantity filled/added, if visible.

5. current_balance:
   Extract the balance AFTER fuel was added, if visible.

6. model:
   Identify the generator model only if it is clearly visible.
   Otherwise return null.

7. Numbers must contain numbers only.
   Do not include units such as L, Ltr, kWh or hrs.

8. If a value is not clearly visible, return null.

9. Never guess a value.

10. Preserve decimal values exactly as displayed.
`;


    // -------------------------
    // -------------------------
// LLAMA 3.2 VISION
// -------------------------

const model =
  "@cf/meta/llama-3.2-11b-vision-instruct";

let aiResult;

try {

  aiResult = await env.AI.run(model, {
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    image: imageDataUrl,
    max_tokens: 512,
    temperature: 0
  });

} catch (aiError) {

  const aiMessage =
    aiError?.message ||
    String(aiError);

  return json(
    {
      success: false,
      error: "Workers AI error: " + aiMessage
    },
    502
  );
}

// -------------------------
// READ AI RESPONSE
// -------------------------

let output = "";

if (
  aiResult &&
  typeof aiResult.response === "string"
) {
  output = aiResult.response.trim();
}

if (!output) {
  return json(
    {
      success: false,
      error: "Workers AI returned an empty response.",
      ai_response: aiResult || null,
      ai_type: typeof aiResult,
      ai_keys: aiResult
        ? Object.keys(aiResult)
        : []
    },
    502
  );
}


// Remove markdown code fences if AI adds them

output = output
  .replace(/^```json\s*/i, "")
  .replace(/^```\s*/i, "")
  .replace(/\s*```$/i, "")
  .trim();


    // -------------------------
    // PARSE JSON
    // -------------------------

    let extracted;

    try {

      extracted = JSON.parse(output);

    } catch (error) {

      return json(
        {
          success: false,
          error: "OCR model returned invalid JSON.",
          raw_response: output.slice(0, 3000)
        },
        502
      );
    }


    // -------------------------
    // CLEAN NUMBERS
    // -------------------------

    const cleanNumber = (value) => {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      if (typeof value === "number") {
        return Number.isFinite(value)
          ? value
          : null;
      }

      const text = String(value)
        .replace(/,/g, "")
        .trim();

      const match =
        text.match(/-?\d+(?:\.\d+)?/);

      if (!match) {
        return null;
      }

      const n = Number(match[0]);

      return Number.isFinite(n)
        ? n
        : null;
    };


    const extractedModel =
      extracted.model
        ? String(extracted.model).trim()
        : null;

    const currentHmr =
      cleanNumber(extracted.current_hmr);

    const currentKwh =
      cleanNumber(extracted.current_kwh);

    const previousBalance =
      cleanNumber(extracted.previous_balance);

    const fuelFilled =
      cleanNumber(extracted.fuel_filled);

    let currentBalance =
      cleanNumber(extracted.current_balance);


    // If current balance isn't directly visible,
    // calculate it from previous balance + fuel filled.

    if (
      currentBalance === null &&
      previousBalance !== null &&
      fuelFilled !== null
    ) {
      currentBalance =
        previousBalance + fuelFilled;
    }


    return json({
      success: true,
      extraction_ready: true,

      site_id: siteId,

      model: extractedModel,

      current_hmr: currentHmr,
      current_kwh: currentKwh,

      previous_balance: previousBalance,
      fuel_filled: fuelFilled,
      current_balance: currentBalance
    });
  }catch (error) {

    return json(
      {
        success: false,
        error: error?.message || String(error)
      },
      500
    );
  }
}

// -------------------------
// LLAMA MODEL AGREEMENT
// -------------------------

async function agreeLlama(request, env) {
  try {

    const auth = checkAdminKey(request, env);

    if (!auth.ok) {
      return auth.response;
    }

    if (!env.CLOUDFLARE_API_TOKEN) {
      return json(
        {
          success: false,
          error: "CLOUDFLARE_API_TOKEN secret is missing."
        },
        500
      );
    }

    const accountId =
      "4b5679a6b80f3058805fa9169e1322cb";

    const model =
      "@cf/meta/llama-3.2-11b-vision-instruct";

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${env.CLOUDFLARE_API_TOKEN}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          prompt: "agree"
        })
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return json(
        {
          success: false,
          error:
            `Cloudflare returned HTTP ${response.status}: ${text}`
        },
        502
      );
    }


    // -------------------------
    // AGREEMENT SUCCESS
    // -------------------------

    const agreementMessage =
      JSON.stringify(data)
        .toLowerCase();

    if (
      agreementMessage.includes(
        "thank you for agreeing"
      ) &&
      agreementMessage.includes(
        "you may now use the model"
      )
    ) {
      return json({
        success: true,
        message:
          "✅ Llama 3.2 Vision agreement completed. The model is now activated."
      });
    }


    // -------------------------
    // OTHER CLOUDFLARE ERROR
    // -------------------------

    if (!response.ok || !data.success) {
      return json(
        {
          success: false,
          error:
            data.errors?.length
              ? JSON.stringify(data.errors)
              : `Cloudflare AI request failed (${response.status})`
        },
        502
      );
    }


    return json({
      success: true,
      message:
        "✅ Llama 3.2 Vision agreement completed successfully."
    });

  } catch (error) {

    return json(
      {
        success: false,
        error:
          error?.message ||
          String(error)
      },
      500
    );
  }
}
// -------------------------
// DEBUG CONFIGURATION
// -------------------------

async function debugConfig(request, env) {
  return json({
    success: true,
    db: !!env.DB,
    assets: !!env.ASSETS,
    admin_key: !!env.ADMIN_KEY,
    ai: !!env.AI,
    cloudflare_api_token: !!env.CLOUDFLARE_API_TOKEN
  });
}


// -------------------------
// WORKER
// -------------------------

export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;


    // Calculator
    if (
      path === "/api/calculate" &&
      method === "POST"
    ) {
      return calculate(request);
    }


    // Get site
    if (
      path === "/api/site" &&
      method === "GET"
    ) {
      return getSite(request, env);
    }


    // Update site
    if (
      path === "/api/admin/update-site" &&
      method === "POST"
    ) {
      return updateSite(request, env);
    }


    // Extract image
    if (
      path === "/api/admin/extract-image" &&
      method === "POST"
    ) {
      return extractImage(request, env);
    }


    // Activate Llama AI
    if (
      path === "/api/admin/agree-llama" &&
      method === "POST"
    ) {
      return agreeLlama(request, env);
    }


    // Debug
    if (
      path === "/api/debug" &&
      method === "GET"
    ) {
      return debugConfig(request, env);
    }


    // Serve website
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "Assets binding is not configured.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain"
        }
      }
    );
  }
};
