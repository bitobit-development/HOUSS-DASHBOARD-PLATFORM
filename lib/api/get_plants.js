// lib/api/get_plants.js
// -----------------------------------------------------------------------------
// Wrapper around b2bApi to fetch Sunsynk plant list.
// Usage:
//   import { getPlants } from "@/lib/api/get_plants";
//   const { data } = await getPlants(1); // page 1
// -----------------------------------------------------------------------------

import { b2bApi } from "@/lib/b2b-api";

/**
 * Fetch a page of plants from the backend.
 *
 * @param {number} [page=1] - 1‑based page index.
 * @returns {Promise<any>}  Resolves to the JSON payload from /plants.
 */
export async function getPlants (page = 1) {
  // Adjust endpoint if your backend expects /plant instead of /plants
  const res = await b2bApi.get(`/plants?page=${page}`);

  if (!res.ok) {
    // Bubble up a readable message
    const text = await res.text();
    throw new Error(`getPlants() failed: ${text}`);
  }

  return res.json();
}

// Optional default export for convenience
export default getPlants;
