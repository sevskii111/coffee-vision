import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function getClosestCameraFrame(req, res) {
  const user = await getUser(req);

  const db = (await clientPromise).db();
  const { id, timestamp, frameOnly } = req.query;
  const framesCollection = await db.collection("frames");
  const lastFrame = (
    await framesCollection
      .aggregate([
        { $match: { camera_id: +id } },
        {
          $project: {
            diff: { $abs: { $subtract: [+timestamp, "$timestamp_int"] } },
            doc: "$$ROOT",
          },
        },
        { $sort: { diff: 1 } },
        { $limit: 1 },
      ])
      .next()
  ).doc;

  // const lastFrame = await framesCollection
  //   .find({ camera_id: +id, timestamp_int: { $gte: +timestamp } })
  //   .sort({ timestamp_int: 1 })
  //   .limit(1)
  //   .next();

  if (!lastFrame) {
    return res.status(404).send();
  } else {
    if (!frameOnly) {
      if (!user) {
        lastFrame.timestamp = "";
      }
      res.json(lastFrame);

    } else {
      if (!user) {
        res.redirect("/camera.jpg");
      }
      res.redirect(`/dataset/${id}/${lastFrame.timestamp}`);
      // const frame = Buffer.from(lastFrame.frame, 'base64');
      // res.send(frame);
    }
  }
}
