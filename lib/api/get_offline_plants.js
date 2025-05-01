import { b2bApi } from "../b2b-api";

export default async function getOfflinePlants(estateId) {
  const res = await b2bApi.get(`/db/offline-plants/${estateId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();  // array
}