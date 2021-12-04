import cameras from "../../cameras";
import clientPromise from "../../lib/mongodb";

function strToDate(str) {
  const day = str.slice(0, 2);
  const month = str.slice(3, 5);
  const year = str.slice(6, 10);
  let hour = +str.slice(11, 13);
  const minute = str.slice(14, 16);
  const second = str.slice(17, 19);
  if (str.indexOf('_PM') != -1)
  {
    hour += 12;
  }
  return new Date(year, month - 1, day, hour, minute, second);
}

export default async function getCameras(req, res) {
  if (req.query.secret != process.env.PYTHON_SECRET) {
    return res.status(403).send();
  }

  const db = (await clientPromise).db();
  const frames = db.collection("frames");

  const queryRes = await frames
    .aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$camera_id",
          labels: { $first: "$labels" },
          timestamp: { $first: "$timestamp" },
        },
      },
    ])
    .toArray();

  const points = {};
  let timestamp = 0;
  for (const camera of queryRes) {
    const cameraInd = camera._id;
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

    timestamp = camera.timestamp;
  }
  const heatmaps = db.collection("heatmaps");
  await heatmaps.insertOne({
    timestamp: strToDate(timestamp).getTime(),
    heatmap: points,
  });

  res.send();
}
