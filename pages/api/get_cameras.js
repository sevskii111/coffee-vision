import cameras from "../../cameras";

export default async function getCameras(req, res) {
    if (req.query.secret != process.env.PYTHON_SECRET)
    {
        return res.status(403).send();
    }
    res.json(cameras);
}