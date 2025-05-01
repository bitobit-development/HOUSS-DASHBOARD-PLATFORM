// lib/api/get_estate_totals.js
import { b2bApi } from "../b2b-api";

export default async function getEstateTotals(estateId) {
  if (!estateId) throw new Error("estateId required");
  const res = await b2bApi.get(`/db/estate-plant-totals/${estateId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();   // { total_kw, total_today, total_total }
}
