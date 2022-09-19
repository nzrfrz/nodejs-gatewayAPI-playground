import axios from "axios";
import express from "express";
import { readFile } from "fs/promises";

const routes = express.Router();

const REGISTRY = JSON.parse(
    await readFile(new URL("../registry/registry.json", import.meta.url))
);

routes.all("/:serviceName/:path(*)?", async (req, res) => {
    const serviceData = REGISTRY.filter((data) => data.service === req.params.serviceName);
    try {
        await axios({
            method: req.method,
            baseURL: `${serviceData[0].BASE_PATH}/${req.params.serviceName}/${req.params.path}`,
            headers: {
                authorization: req.headers.authorization || null,
                browser: req.useragent.browser,
                version: req.useragent.version,
                os: req.useragent.os,
                platform: req.useragent.platform,
            },
            data: req.body
        })
        .then((results) => {
            res.status(results.data.status).send(results.data);
        })
        .catch((error) => {
            res.status(error.response.data.status).send(error.response.data);
        })
    } catch(error) {
        res.status(503).send(error);
    }
});

export default routes;
