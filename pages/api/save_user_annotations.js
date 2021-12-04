import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function save_frames(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.status(403).send();
  }

  const { cameraId, annotations } = req.body;
  const db = (await clientPromise).db();


  const annotationsCollection = await db.collection("annotations");
  annotationsCollection.updateOne(
    { user: user._id, cameraId },
    { $set: { annotations } },
    { upsert: true }
  );

  res.status(200).send();
}
