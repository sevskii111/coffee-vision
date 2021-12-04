import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function get_user_annotations(req, res) {
  const user = await getUser(req);
  if (!user) {
    return res.status(403).send();
  }

  const { cameraId } = req.query;
  const db = (await clientPromise).db();


  const annotationsCollection = await db.collection("annotations");
  const annotations = await annotationsCollection.findOne(
    { user: user._id, cameraId: +cameraId }
  );

  res.status(200).json(annotations ? annotations.annotations : []);
}
