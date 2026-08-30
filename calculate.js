const CHARTS = {
  eicher10: {
    name: "Eicher 10 KVA",
    rows: [
      [0, 0.8, 1.15], [0.8, 1.6, 1.30], [1.6, 2.0, 1.35],
      [2.0, 2.4, 1.39], [2.4, 3.2, 1.68], [3.2, 4.0, 1.72],
      [4.0, 4.8, 1.99], [4.8, 5.6, 2.22], [5.6, 6.0, 2.23],
      [6.0, 6.4, 2.52], [6.4, 7.2, 2.71], [7.2, 8.0, 2.74]
    ]
  },
  mahindra10: {
    name: "Mahindra 10 KVA",
    rows: [
      [0, 0.8, 1.02], [0.8, 1.6, 1.20], [1.6, 2.0, 1.28],
      [2.0, 2.4, 1.37], [2.4, 3.2, 1.60], [3.2, 4.0, 1.79],
      [4.0, 4.8, 1.95], [4.8, 5.6, 2.20], [5.6, 6.0, 2.30],
      [6.0, 6.4, 2.41], [6.4, 7.2, 2.66], [7.2, 8.0, 2.84]
    ]
  },
  eicher20: {
    name: "Eicher 20 KVA",
    rows: [
      [0, 1.6, 1.33], [1.6, 3.2, 1.63], [3.2, 4.0, 1.92],
      [4.0, 4.8, 1.99], [4.8, 6.4, 2.29], [6.4, 8.0, 2.55],
      [8.0, 9.6, 2.92], [9.6, 11.2, 3.10]
    ]
  },
  mahindra20: {
    name: "Mahindra 20 KVA",
    rows: [
      [0, 1.6, 1.70], [1.6, 3.2, 1.80], [3.2, 4.0, 1.90],
      [4.0, 4.8, 2.64], [4.8, 6.4, 2.64], [6.4, 8.0, 2.64],
      [8.0, 9.6, 3.48], [9.6, 11.2, 3.48]
    ]
  },
  koel20: {
    name: "KOEL 20 KVA",
    rows: [
      [0, 1.6, 1.32], [1.6, 3.2, 1.58], [3.2, 4.0, 1.78],
      [4.0, 4.8, 1.85], [4.8, 6.4, 2.13], [6.4, 8.0, 2.42],
      [8.0, 9.6, 2.77], [9.6, 11.2, 3.02]
    ]
  }
};

function number(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a valid number.`);
  return n;
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const A = number(body.A, "Current HMR (A)");
    const B = number(body.B, "Current kWh (B)");
    const C = number(body.C, "Previous HMR (C)");
    const D = number(body.D, "Previous kWh (D)");
    const E = number(body.E, "Previous balance (E)");

    if (A <= C) throw new Error("Current HMR must be greater than previous HMR.");
    if (B < D) throw new Error("Current kWh cannot be less than previous kWh.");

    const Z = A - C;
    const Y = B - D;
    const X = Y / Z;

    const chart = CHARTS[body.model];
    if (!chart) throw new Error("Please select a valid generator model.");

    // Chart lookup: X is placed in the stated KW/H range.
    // Boundary convention: the lower boundary belongs to the new row,
    // except the first row, which starts at 0.
    const row = chart.rows.find(([lo, hi]) => X >= lo && X <= hi + 1e-12);
    if (!row) {
      const max = chart.rows[chart.rows.length - 1][1];
      throw new Error(`X = ${X.toFixed(4)} is outside the ${chart.name} chart range (0–${max}).`);
    }

    const [lo, hi, L] = row;
    const S = L * Z;
    const T = E - S;

    return Response.json({
      modelName: chart.name,
      band: lo === 0 ? `up to ${hi} kW/hr` : `${lo}-${hi} kW/hr`,
      A, B, C, D, E, Z, Y, X, L, S, T
    });
  } catch (e) {
    return Response.json({ error: e.message || "Invalid request." }, { status: 400 });
  }
}
