import { getUser } from "./user";

export default async function signup(req, res) {
    const user = await getUser(req);
    if (!user) {
        return res.status(403).send();
    }
    
    res.status(200).send({ done: true })
  }