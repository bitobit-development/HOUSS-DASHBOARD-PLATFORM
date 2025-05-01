// lib/api/inverters_count.js
// -----------------------------------------------------------------------------
// Fetch aggregate inverter counters from the Bit2Bit backend.
// -----------------------------------------------------------------------------
import { b2bApi } from "@/lib/b2b-api";

export async function getInverterCount () {
  const res = await b2bApi.get("/inverters/count");
  if (!res.ok) {
    throw new Error(`getInverterCount failed: ${await res.text()}`);
  }
  return res.json();
}

export default getInverterCount;
