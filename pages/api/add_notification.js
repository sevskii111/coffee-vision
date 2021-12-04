import clientPromise from "../../lib/mongodb";
import { getUser } from "./user";

export default async function add_notification(req, res) {
  const user = await getUser(req);

  if (!user) {
    return res.status(403).send();
  }

  const { left, sign, right, c, name, location, timerange } = req.body;
  if (
    !left ||
    !sign ||
    !right ||
    !name ||
    !location ||
    !location.match(/\d+.\d+;\d+.\d+;\d+.\d+/) ||
    !timerange ||
    !timerange.match(/\d{2}:\d{2}-\d{2}:\d{2}/)
  ) {
    return res.status(400).send();
  }
  const db = (await clientPromise).db();

  const notificationQueriesCollection = await db.collection("notifications");
  notificationQueriesCollection.insertOne({
    user: user._id,
    left,
    sign,
    right,
    c,
    name,
    timerange,
    location,
  });

  res.status(200).send();
}
