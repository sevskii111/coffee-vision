import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function save_frames(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.status(403).send();
  }

  const userLabels = req.body;
  const db = (await clientPromise).db();
  const usersCollection = await db.collection("users");
  usersCollection.updateOne(
    { _id: user._id },
    { $set: { userLabels } }
  );

  res.status(200).send();
}
