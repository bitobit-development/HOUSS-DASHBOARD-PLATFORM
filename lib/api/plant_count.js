// lib/api/plant_count.js
// -----------------------------------------------------------------------------
// Fetch aggregate plant counters from the Bit2Bit backend.
// -----------------------------------------------------------------------------
import { b2bApi } from "@/lib/b2b-api";

/**
 * Returns JSON in the form:
 * {
 *   code: 0,
 *   msg: "Success",
 *   data: {
 *     total, normal, offline, warning, fault, protect, updateAt
 *   },
 *   success: true
 * }
 */
export async function getPlantCount () {
  const res = await b2bApi.get("/plants/count");
  if (!res.ok) {
    throw new Error(`getPlantCount failed: ${await res.text()}`);
  }
  return res.json();
}

export default getPlantCount;
