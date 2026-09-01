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


/* =======================================================
   COMMON JSON RESPONSE
======================================================= */

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


/* =======================================================
   NUMBER VALIDATION
======================================================= */

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


/* =======================================================
   CALCULATOR
======================================================= */

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


/* =======================================================
   GET SITE
======================================================= */

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

      site:
        result

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


/* =======================================================
   ADMIN AUTHENTICATION
======================================================= */

function checkAdminKey(
  request,
  env
) {

  const adminKey =
    request.headers.get(
      "X-Admin-Key"
    );

  if (!env.ADMIN_KEY) {

    return {

      ok: false,

      response:
        json(
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

      response:
        json(
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


/* =======================================================
   UPDATE EXISTING SITE
======================================================= */

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
        VALUES (?, ?, ?, ?, ?, 'manual')
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


/* =======================================================
   IMAGE OCR EXTRACTION
=======================================================

   The image is received temporarily.

   It is NOT saved in D1.

   It is NOT saved in Cloudflare Assets.

   OCR.space receives the image and returns text.

======================================================= */

async function extractImage(
  request,
  env
) {

  try {

    /* ---------------------------------------------------
       ADMIN AUTH
    --------------------------------------------------- */

    const auth =
      checkAdminKey(
        request,
        env
      );

    if (!auth.ok) {
      return auth.response;
    }


    /* ---------------------------------------------------
       OCR KEY CHECK
    --------------------------------------------------- */

    if (!env.OCR_SPACE_API_KEY) {

      return json(
        {
          success: false,

          error:
            "OCR_SPACE_API_KEY is not configured in Cloudflare."
        },
        500
      );

    }


    /* ---------------------------------------------------
       CONTENT TYPE
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       READ UPLOADED IMAGE
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       SEND IMAGE TO OCR.SPACE
    --------------------------------------------------- */

    const ocrForm =
      new FormData();


    ocrForm.append(
      "apikey",
      env.OCR_SPACE_API_KEY
    );


    ocrForm.append(
      "language",
      "eng"
    );


    ocrForm.append(
      "isOverlayRequired",
      "false"
    );


    ocrForm.append(
      "OCREngine",
      "2"
    );


    ocrForm.append(
      "file",
      image,
      image.name ||
        "generator.jpg"
    );


    const ocrResponse =
      await fetch(
        "https://api.ocr.space/parse/image",
        {
          method: "POST",

          body:
            ocrForm
        }
      );


    const ocrText =
      await ocrResponse.text();


    /* ---------------------------------------------------
       PARSE OCR RESPONSE
    --------------------------------------------------- */

    let ocrData = {};

    try {

      ocrData =
        ocrText.trim()
          ? JSON.parse(ocrText)
          : {};

    } catch {

      return json(
        {
          success: false,

          error:
            "OCR service returned an invalid response."
        },
        502
      );

    }


    /* ---------------------------------------------------
       OCR ERROR
    --------------------------------------------------- */

    if (
      !ocrResponse.ok ||
      ocrData.IsErroredOnProcessing
    ) {

      const errorMessage =
        Array.isArray(
          ocrData.ErrorMessage
        )
          ? ocrData.ErrorMessage.join(
              " "
            )
          : (
              ocrData.ErrorMessage ||
              "OCR processing failed."
            );


      return json(
        {
          success: false,

          error:
            errorMessage
        },
        502
      );

    }


    /* ---------------------------------------------------
       COLLECT OCR TEXT
    --------------------------------------------------- */

    const parsedResults =
      ocrData.ParsedResults ||
      [];


    const extractedText =
      parsedResults
        .map(
          item =>
            item.ParsedText ||
            ""
        )
        .join("\n")
        .trim();


    if (!extractedText) {

      return json(
        {
          success: false,

          error:
            "No readable text was found in the image."
        },
        422
      );

    }


    /* ---------------------------------------------------
       RETURN OCR TEXT
    ---------------------------------------------------

       We return the raw OCR text for now.

       The admin page will use this response
       to populate the editable fields.

    --------------------------------------------------- */

    return json({

      success: true,

      extraction_ready:
        true,

      site_id:
        siteId || null,

      text:
        extractedText

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


/* =======================================================
   DEBUG CONFIGURATION
======================================================= */

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

    ocr_key:
      !!env.OCR_SPACE_API_KEY

  });

}


/* =======================================================
   MAIN WORKER
======================================================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);


    /* ---------------------------------------------------
       CALCULATOR POST
    --------------------------------------------------- */

    if (
      url.pathname ===
        "/api/calculate" &&
      request.method === "POST"
    ) {

      return calculate(
        request
      );

    }


    /* ---------------------------------------------------
       CALCULATOR GET TEST
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       GET SITE
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       ADMIN UPDATE SITE
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       ADMIN IMAGE OCR
    --------------------------------------------------- */

    if (
      url.pathname ===
        "/api/admin/extract-image" &&
      request.method === "POST"
    ) {

      return extractImage(
        request,
        env
      );

    }


    /* ---------------------------------------------------
       DEBUG CONFIG
    --------------------------------------------------- */

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


    /* ---------------------------------------------------
       STATIC WEBSITE
    --------------------------------------------------- */

    return env.ASSETS.fetch(
      request
    );

  }

};
