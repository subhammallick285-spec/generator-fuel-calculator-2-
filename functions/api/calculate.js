const CHARTS = {
eicher10: {
name: "Eicher 10 KVA",
rows: [
[0, 0.8, 1.10], [0.8, 1.6, 1.20], [1.6, 2.4, 1.35],
[2.4, 3.2, 1.50], [3.2, 4.0, 1.77], [4.0, 4.8, 1.99],
[4.8, 5.6, 2.22], [5.6, 6.4, 2.23], [6.4, 7.2, 2.71],
[7.2, 8.0, 2.74]
]
},
mahindra10: {
name: "Mahindra 10 KVA",
rows: [
[0, 0.8, 1.02], [0.8, 1.6, 1.20], [1.6, 2.4, 1.38],
[2.4, 3.2, 1.60], [3.2, 4.0, 1.78], [4.0, 4.8, 1.95],
[4.8, 5.6, 2.20], [5.6, 6.4, 2.30], [6.4, 7.2, 2.66],
[7.2, 8.0, 2.84]
]
},
eicher20: {
name: "Eicher 20 KVA",
rows: [
[0, 1.6, 1.33], [1.6, 3.2, 1.53], [3.2, 4.8, 1.87],
[4.8, 6.4, 2.25], [6.4, 8.0, 2.81], [8.0, 9.6, 3.93],
[9.6, 11.2, 3.10]
]
},
mahindra20: {
name: "Mahindra 20 KVA",
rows: [
[0, 1.6, 1.70], [1.6, 3.2, 1.80], [3.2, 4.8, 1.90],
[4.8, 6.4, 2.04], [6.4, 8.0, 2.64], [8.0, 9.6, 3.48],
[9.6, 11.2, 3.48]
]
},
koel20: {
name: "KOEL 20 KVA",
rows: [
[0, 1.6, 1.33], [1.6, 3.2, 1.58], [3.2, 4.8, 1.78],
[4.8, 6.4, 2.13], [6.4, 8.0, 2.42], [8.0, 9.6, 2.77],
[9.6, 11.2, 3.02]
]
}
};

function number(value, name) {
const n = Number(value);
if (!Number.isFinite(n)) throw new Error('${name} must be a valid number.');
return n;
}

export async function onRequestPost(context) {
try {
const body = await context.request.json();

const A = number(body.A, "Current HMR (A)");  
const B = number(body.B, "Current kWH (B)");  
const C = number(body.C, "Previous HMR (C)");  
const D = number(body.D, "Previous kWH (D)");  
const E = number(body.E, "Previous balance (E)");  

if (A <= C) throw new Error("Current HMR must be greater than previous HMR.");  
if (B < D) throw new Error("Current kWH cannot be less than previous kWH.");  

const Z = A - C;  
const Y = B - D;  
const X = Y / Z;  

const chart = CHARTS[body.model];  
if (!chart) throw new Error("Please select a valid generator model.");  

const row = chart.rows.find(([lo, hi]) => X >= lo && X <= hi);  

if (!row) {  
  const max = chart.rows[chart.rows.length - 1][1];  
  throw new Error(`X = ${X.toFixed(4)} is outside the ${chart.name} chart range (0-${max}).`);  
}  

const [lo, hi, L] = row;  
const S = Z * L;  
const T = E - S;  

return new Response(  
  JSON.stringify({  
    modelName: chart.name,  
    band: lo === 0 ? `up to ${hi} HM/hr` : `${lo}-${hi} HM/hr`,  
    A, B, C, D, E, Z, Y, X, L, S, T  
  }),  
  {  
    status: 200,  
    headers: { "Content-Type": "application/json" }  
  }  
);

} catch (err) {
return new Response(
JSON.stringify({ error: err.message || "Invalid request." }),
{
status: 400,
headers: { "Content-Type": "application/json" }
}
);
}
}
