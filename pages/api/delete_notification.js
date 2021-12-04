import { ObjectId } from "bson";
import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function add_notification(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.status(403).send();
  }

  const { id } = req.query;

  const db = (await clientPromise).db();

  const notificationQueriesCollection = await db.collection(
    "notifications"
  );

  notificationQueriesCollection.deleteOne({ user: user._id, _id: ObjectId(id) });

  res.status(200).send();
}
