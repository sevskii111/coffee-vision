import clientPromise from "../../lib/mongodb";

export default async function getHeatmaps(req, res) {
  const db = (await clientPromise).db();
  const heatmapsCollection = await db.collection("heatmaps");
  const heatmaps = await heatmapsCollection.find({}, { timestamp: 1 }).toArray();
  res.json(heatmaps.sort((a, b) => a.timestamp - b.timestamp));
}
