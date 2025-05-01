// lib/api/get_estate_plants_table.js
// -----------------------------------------------------------------------------
// Fetch paginated "estate-plants" view (Sunsynk plant + residential-estate
// join) from the Bit2Bit backend.
//
//   import getEstatePlants from "@/lib/api/get_estate_plants_table";
//
//   const { data, error } = await getEstatePlants({ page: 2, pageSize: 50 });
//
// Requires b2bApi.fetch() to inject an up-to-date Authorization header.
// -----------------------------------------------------------------------------

import { b2bApi } from "../b2b-api";          // adjust path if you colocate files

/**
 * @typedef {import('../b2b-api').default} B2BApiResponse
 * @typedef {Object} EstatePlantRow
 * @property {number}  id
 * @property {string}  name
 * @property {string}  thumb_url
 * @property {number}  status
 * @property {string}  address
 * @property {number}  pac
 * @property {number}  efficiency
 * @property {number}  etoday
 * @property {number}  etotal
 * @property {Object}  residential_estates
 * @property {number}  residential_estates.id
 * @property {string}  residential_estates.estate_name
 * @property {string}  residential_estates.physical_address
 * @property {string}  residential_estates.estate_type
 * @property {string}  residential_estates.estate_description
 * @property {string}  residential_estates.estate_area
 */

/**
 * Retrieve estate-plant records.
 *
 * @param {Object}   [opts={}]
 * @param {number}   [opts.page=1]       1-based page index
 * @param {number}   [opts.pageSize=30]  Rows per page (1–100)
 * @returns {Promise<{data: EstatePlantRow[]|null, error: any}>}
 */
export default async function getEstatePlants({ page = 1, pageSize = 30 } = {}) {
  try {
    const qs = new URLSearchParams({
      page:        String(page),
      page_size:   String(pageSize),
    }).toString();

    const res = await b2bApi.get(`/db/estate-plants?${qs}`);

    if (!res.ok) {
      throw new Error(await res.text());
    }

    /** @type {EstatePlantRow[]} */
    const data = await res.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
