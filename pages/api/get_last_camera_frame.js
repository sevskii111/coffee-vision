import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function getLastCameraFrame(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.redirect("/camera.jpg");
  }


  const db = (await clientPromise).db();
  const { id, frameOnly } = req.query;
  const framesCollection = await db.collection("frames");
  const lastFrame = await (
    await framesCollection
      .find({ camera_id: +id })
      .sort({ timestamp_int: -1 })
      .limit(1)
  ).next();
  if (!lastFrame) {
    res.status(404).send();
  } else {
    if (!frameOnly) {
      res.json(lastFrame);
    } else {
      res.redirect(`/dataset/${id}/${lastFrame.timestamp}`)
      // const frame = Buffer.from(lastFrame.frame, 'base64');
      // res.send(frame);
    }
  }
}
