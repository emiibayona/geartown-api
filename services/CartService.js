const { Carts } = require("../database");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const cacheService = require("./cacheService");

const service = {};


const checkFields = (obj, label = "params") => {
    const params = []
    if (!obj?.game) params.push("game")
    if (!obj?.email) params.push("email")
    if (!obj?.tenant) params.push("tenant")
    if (!obj?.type) params.push("type")

    if (params.length) {
        throw { message: `${label} required`, fields: params }
    }
}

service.get = async (params) => {
    if (!params.id) {
        checkFields(params)
    }

    return await cacheService.getOrSet(
        generateKey(prefixes.CartsService, "gcw"),
        { params },
        () =>
            Carts.findOne({ where: params })
    );
}

service.create = async (body) => {
    if (!body.data) throw "data field required"

    body.data = typeof body?.data === "string"
        ? body.data
        : JSON.stringify(body.data);

    const created = await Carts.create(body);

    cacheService.invalidate(
        generateKey(prefixes.CartsService, "gcw"),
    );

    return created;
    // return { data: res[0], new: res[1] }
}

service.update = async (id, body) => {
    if (!id) throw "id field required"
    if (!body.data) throw "data field required"


    body.data = typeof body?.data === "string"
        ? body.data
        : JSON.stringify(body.data);

    const res = await Carts.update(body, { where: { id } });
    if (res[0] === 1) {
        cacheService.invalidate(
            generateKey(prefixes.CartsService, "gcw"),
        );
        return { data: JSON.parse(body.data), id }
    }
}

module.exports = service;