import cameras from "../../cameras";
import clientPromise from "../../lib/mongodb";


export default async function save_frames(req, res) {
  const { body } = req;
  if (!body || body.secret != process.env.PYTHON_SECRET) {
    return res.status(403).send();
  }

  const { payload } = req.body;
  const db = (await clientPromise).db();
  res.status(200).send();
  const frames_collection = await db.collection("frames");
  await frames_collection.insertMany(payload);

  if (body.buildHeatmap) {
    const points = {};
    let timestamp = 0;
    for (const camera of payload) {
      const cameraInd = camera.camera_id;
      const counts = {};

      for (const num of camera.labels) {
        counts[num] = counts[num] ? counts[num] + 1 : 1;
      }

      for (const [label, count] of Object.entries(counts)) {
        if (!points[label]) {
          points[label] = [];
        }
        points[label].push([
          cameras[cameraInd].longitude,
          cameras[cameraInd].latitude,
          count,
        ]);
      }
      timestamp = camera.timestamp_int;
    }

    const heatmaps = db.collection("heatmaps");
    await heatmaps.insertOne({
      timestamp: timestamp * 1000,
      heatmap: points,
    });
  }

  
}
