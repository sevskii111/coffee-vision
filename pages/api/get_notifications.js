import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function add_notification(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.status(403).send();
  }

  const db = (await clientPromise).db();

  const notificationQueriesCollection = await db.collection(
    "notifications"
  );

  const notificationQueries = await notificationQueriesCollection
    .find({ user: user._id })
    .toArray();

  res.status(200).json(notificationQueries);
}
