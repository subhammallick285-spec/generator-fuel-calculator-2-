# Generator Fuel Calculator

Mobile-first calculator for the formula:

Z = A - C
Y = B - D
X = Y / Z
L = chart value selected from X and generator model
S = L * Z
T = E - S

The chart values are stored in `functions/api/calculate.js`, so they are not exposed in the page UI.

## Models
- Eicher 10 KVA
- Eicher 20 KVA
- KOEL 20 KVA
- Mahindra 20 KVA
- Mahindra 10 KVA

## Important chart rule
The current version treats each printed range as inclusive of both endpoints. At an exact shared boundary (for example X=1.6), JavaScript finds the earlier row first. If you want exact boundaries to belong to the next row, change the lookup rule before publishing.

## Deployment
Recommended free setup: Cloudflare Pages with a `/functions` directory. Pages Functions run server-side without a dedicated server. See the official Cloudflare documentation for current free-plan limits.

Do not put passwords, API keys, or private information in this project.
