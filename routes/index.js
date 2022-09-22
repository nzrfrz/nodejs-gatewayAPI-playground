import axios from "axios";
import express from "express";
import multer from "multer";
import FormData from "form-data";
import { readFile } from "fs/promises";
import { Readable } from "stream";

const routes = express.Router();

const storage = multer.memoryStorage();

const upload = multer({storage});

const REGISTRY = JSON.parse(
    await readFile(new URL("../registry/registry.json", import.meta.url))
);

routes.all("/:serviceName/:path(*)?", upload.single("file"), async (req, res) => {
    const serviceData = REGISTRY.filter((data) => data.service === req.params.serviceName);
    if (req.file !== undefined) {
        let formData = new FormData();
        formData.append("file", Readable.from(req.file.buffer), req.file.originalname);
        try {
            const results = await axios.post(`${req.headers.host.includes("localhost") ? serviceData[0].LOCAL_BASE_PATH : serviceData[0].BASE_PATH}/${req.params.serviceName}/${req.params.path}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });
            res.status(results.data.status).send(results.data);
            // console.log(results);
        } catch (error) {
            // console.log(error);
            res.status(error.response.status).send(error.response.data);
        }
    } else {
        await axios({
            method: req.method,
            baseURL: `${req.headers.host.includes("localhost") ? serviceData[0].LOCAL_BASE_PATH : serviceData[0].BASE_PATH}/${req.params.serviceName}/${req.params.path}`,
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
            // console.log(error.response);
            res.status(error.response.status).send(error.response.data);
        })
    }
});

export default routes;
