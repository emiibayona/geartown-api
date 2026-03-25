const { Carts, magic: MagicModels } = require("../database");
const { prefixes, generateKey } = require("../utils/CacheUtils");
const { Games } = require("../utils/constants");
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

service.create = async (body, skipClean = false) => {
    if (!body.data) throw "data field required"

    body.data = typeof body?.data === "string"
        ? body.data
        : JSON.stringify(body.data);

    const [cart, created] = await Carts.findCreateFind({
        where: {
            email: body.email,
            game: body.game,
            type: body.type,
            tenant: body.tenant
        },
        // Valores adicionales que se guardarán SOLO si el carrito es nuevo
        defaults: {
            ...body // Aquí puedes pasar el resto de los datos (items, status, etc.)
        }
    });

    if (created && !skipClean) {
        cacheService.invalidate(
            generateKey(prefixes.CartsService, "gcw"),
        );
    }

    return cart || created ? body : false;
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

service.syncUser = async function (body, all = false) {
    try {
        let users = [body];
        if (all) {
            users = await MagicModels.User.findAll({ raw: true, attributes: ['email', 'tenant', 'id'] });
        }
        for (const usr of users) {
            for (const element of Object.values(Games)) {
                await Promise.all([
                    service.create({ data: "[]", email: usr.email, tenant: usr.tenant, game: element, type: 'cart' }, true),
                    service.create({ data: "[]", email: usr.email, tenant: usr.tenant, game: element, type: 'wishlist' }, false)
                ])
            }
        }
        return "Success"
    } catch (error) {
        return error;
    }
}



module.exports = service;