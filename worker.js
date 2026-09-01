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


/* =====================================================
   GET SITE
   ===================================================== */

async function getSite(
  request,
  env
) {

  try {

    const url =
      new URL(
        request.url
      );


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
          SELECT
            site_id
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
      new Date()
        .toISOString();


    await env.DB
      .prepare(`
        UPDATE sites
        SET
          model = ?,
          current_hmr = ?,
          current_kwh = ?,
          current_balance = ?,
          last_updated = ?,
          data_source = 'manual'
        WHERE site_id = ?
      `)
      .bind(
        model,
        hmr,
        kwh,
        balance,
        now,
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
        VALUES
        (?, ?, ?, ?, ?, 'manual')
      `)
      .bind(
        siteId,
        hmr,
        kwh,
        balance,
        now
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
        "manual"

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
   IMAGE EXTRACTION - WORKERS AI
   ===================================================== */

async function extractImage(
  request,
  env
) {

  try {

    /* -----------------------------------------------
       ADMIN AUTHENTICATION
    ------------------------------------------------ */

    const auth =
      checkAdminKey(
        request,
        env
      );

    if (!auth.ok) {
      return auth.response;
    }


    /* -----------------------------------------------
       CHECK AI BINDING
    ------------------------------------------------ */

    if (!env.AI) {

      return json(
        {
          success: false,
          error:
            "Workers AI binding (AI) is not configured."
        },
        500
      );

    }


    /* -----------------------------------------------
       CHECK CONTENT TYPE
    ------------------------------------------------ */

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
            "Please upload an image using multipart/form-data."
        },
        400
      );

    }


    /* -----------------------------------------------
       READ FORM
    ------------------------------------------------ */

    const form =
      await request.formData();


    const image =
      form.get("image");


    const siteId =
      String(
        form.get("site_id") || ""
      ).trim();


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


    /* -----------------------------------------------
       VALIDATE IMAGE
    ------------------------------------------------ */

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


    /* -----------------------------------------------
       READ IMAGE
    ------------------------------------------------ */

    const imageBuffer =
      await image.arrayBuffer();


    if (!imageBuffer.byteLength) {

      return json(
        {
          success: false,
          error:
            "The uploaded image is empty."
        },
        400
      );

    }


    /* -----------------------------------------------
       LIMIT IMAGE SIZE
    ------------------------------------------------ */

    const maxImageSize =
      10 * 1024 * 1024;


    if (
      imageBuffer.byteLength >
      maxImageSize
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


    /* -----------------------------------------------
       OCR / VISION PROMPT
    ------------------------------------------------ */

    const prompt = `
You are extracting data from a generator/DG monitoring screenshot.

Read the screenshot carefully and return ONLY valid JSON.

The screenshot belongs to one of these generator models:

- Eicher 10 KVA
- Mahindra 10 KVA
- Eicher 20 KVA
- Mahindra 20 KVA
- KOEL 20 KVA

Extract these fields when visible:

model
current_hmr
current_kwh
previous_balance
fuel_filled
current_balance

Important:

1. Do not invent values.
2. If a value cannot be read confidently, return null.
3. Keep decimal values as numbers.
4. Do not add units such as "L", "Lt", "KWh" or "hrs" to numeric fields.
5. current_balance means the balance after the latest filling.
6. previous_balance means the balance before the latest filling.
7. fuel_filled means the quantity added in the latest filling.
8. If previous_balance and fuel_filled are both available, current_balance should normally equal:
   previous_balance + fuel_filled
9. Return JSON only.
10. Do not include markdown fences.
11. Do not include explanations.

Required JSON structure:

{
  "model": null,
  "current_hmr": null,
  "current_kwh": null,
  "previous_balance": null,
  "fuel_filled": null,
  "current_balance": null
}
`;


    /* -----------------------------------------------
       CONVERT IMAGE TO BASE64
    ------------------------------------------------ */

    const bytes =
      new Uint8Array(
        imageBuffer
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


    /* -----------------------------------------------
       WORKERS AI VISION MODEL
    ------------------------------------------------ */

    const model =
      "@cf/meta/llama-3.2-11b-vision-instruct";


    const aiResult =
      await env.AI.run(
        model,
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
                  type: "image",
                  image: base64
                }
              ]
            }
          ]
        }
      );


    /* -----------------------------------------------
       GET AI TEXT
    ------------------------------------------------ */

    let output = "";


    if (
      aiResult &&
      typeof aiResult.response === "string"
    ) {

      output =
        aiResult.response.trim();

    }


    if (!output) {

      return json(
        {
          success: false,
          error:
            "Workers AI returned an empty response."
        },
        502
      );

    }


    /* -----------------------------------------------
       REMOVE MARKDOWN JSON FENCES
    ------------------------------------------------ */

    output =
      output
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


    /* -----------------------------------------------
       PARSE JSON
    ------------------------------------------------ */

    let extracted;


    try {

      extracted =
        JSON.parse(
          output
        );

    } catch {

      return json(
        {
          success: false,
          error:
            "OCR model returned invalid JSON.",
          raw_response:
            output.slice(
              0,
              2000
            )
        },
        502
      );

    }


    /* -----------------------------------------------
       NORMALIZE VALUES
    ------------------------------------------------ */

    const cleanNumber =
      (value) => {

        if (
          value === null ||
          value === undefined ||
          String(value).trim() === ""
        ) {
          return null;
        }

        const n =
          Number(
            String(value)
              .replace(
                /[^0-9.+-]/g,
                ""
              )
          );

        return Number.isFinite(n)
          ? n
          : null;

      };


    const extractedModel =
      extracted.model
        ? String(
            extracted.model
          ).trim()
        : null;


    const currentHmr =
      cleanNumber(
        extracted.current_hmr
      );


    const currentKwh =
      cleanNumber(
        extracted.current_kwh
      );


    const previousBalance =
      cleanNumber(
        extracted.previous_balance
      );


    const fuelFilled =
      cleanNumber(
        extracted.fuel_filled
      );


    let currentBalance =
      cleanNumber(
        extracted.current_balance
      );


    /* -----------------------------------------------
       CALCULATE BALANCE WHEN BOTH
       PREVIOUS BALANCE AND FILLING
       ARE AVAILABLE
    ------------------------------------------------ */

    if (
      currentBalance === null &&
      previousBalance !== null &&
      fuelFilled !== null
    ) {

      currentBalance =
        previousBalance +
        fuelFilled;

    }


    /* -----------------------------------------------
       RETURN OCR RESULT
    ------------------------------------------------ */

    return json({

      success: true,

      extraction_ready:
        true,

      site_id:
        siteId,

      model:
        extractedModel,

      current_hmr:
        currentHmr,

      current_kwh:
        currentKwh,

      previous_balance:
        previousBalance,

      fuel_filled:
        fuelFilled,

      current_balance:
        currentBalance

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

/* =====================================================
   DEBUG CONFIG
   ===================================================== */

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
      !!env.ADMIN_KEY
    ai:
    !!env.AI

  });

}


/* =====================================================
   MAIN WORKER
   ===================================================== */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );


    /* -----------------------------------------------
       CALCULATOR - POST
    ------------------------------------------------ */

    if (
      url.pathname ===
        "/api/calculate" &&
      request.method === "POST"
    ) {

      return calculate(
        request
      );

    }


    /* -----------------------------------------------
       CALCULATOR - GET TEST
    ------------------------------------------------ */

    if (
      url.pathname ===
        "/api/calculate" &&
      request.method === "GET"
    ) {

      return json({

        success: true,

        message:
          "Generator Fuel Calculator API is working."

      });

    }


    /* -----------------------------------------------
       GET SITE
    ------------------------------------------------ */

    if (
      url.pathname ===
        "/api/site" &&
      request.method === "GET"
    ) {

      return getSite(
        request,
        env
      );

    }


    /* -----------------------------------------------
       ADMIN UPDATE SITE
    ------------------------------------------------ */

    if (
      url.pathname ===
        "/api/admin/update-site" &&
      request.method === "POST"
    ) {

      return updateSite(
        request,
        env
      );

    }
    /* -----------------------------------------------
       DEBUG CONFIG
    ------------------------------------------------ */

    if (
      url.pathname ===
        "/api/debug-config" &&
      request.method === "GET"
    ) {

      return debugConfig(
        request,
        env
      );

    }


    /* -----------------------------------------------
       STATIC WEBSITE
    ------------------------------------------------ */

    return env.ASSETS.fetch(
      request
    );

  }

};
