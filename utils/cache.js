const NodeCache = require("node-cache");

// Crear instancia de caché con configuración por defecto
const cache = new NodeCache({
    stdTTL: 300, // 5 minutos por defecto
    checkperiod: 60, // Verifica cada 60 segundos por claves expiradas
    useClones: false // No clonar objetos para mejor performance
});

// Logs para monitoreo
cache.on("set", (key, value) => {
    console.log(`📦 Cache SET: ${key}`);
});

cache.on("del", (key, value) => {
    console.log(`🗑️  Cache DEL: ${key}`);
});

cache.on("expired", (key, value) => {
    console.log(`⏰ Cache EXPIRED: ${key}`);
});

/**
 * Middleware de caché para rutas GET
 * @param {number} ttl - Tiempo de vida en segundos (por defecto 300 = 5 minutos)
 */
const cacheMiddleware = (ttl = 300) => {
    return (req, res, next) => {
        // Solo cachear peticiones GET
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl || req.url;
        const cachedData = cache.get(key);

        if (cachedData) {
            console.log(`✅ Cache HIT: ${key}`);
            return res.json(cachedData);
        }

        console.log(`❌ Cache MISS: ${key} - Consultando BD...`);

        // Interceptar res.json para guardar en caché
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Solo cachear respuestas exitosas
            if (res.statusCode === 200) {
                cache.set(key, data, ttl);
            }
            return originalJson(data);
        };

        next();
    };
};

/**
 * Invalida caché por patrón de clave
 * @param {string} pattern - Patrón a buscar (ej: '/users')
 */
const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));
    
    if (keysToDelete.length > 0) {
        cache.del(keysToDelete);
        console.log(`🔄 Cache invalidado: ${keysToDelete.length} claves eliminadas para patrón '${pattern}'`);
    }
};

/**
 * Invalida una clave específica de caché
 * @param {string} key - Clave exacta a eliminar
 */
const invalidateCacheKey = (key) => {
    const deleted = cache.del(key);
    if (deleted) {
        console.log(`🔄 Cache key invalidada: ${key}`);
    }
};

/**
 * Limpia todo el caché
 */
const clearCache = () => {
    cache.flushAll();
    console.log(`🧹 Cache completamente limpiado`);
};

/**
 * Obtiene estadísticas del caché
 */
const getCacheStats = () => {
    return cache.getStats();
};

module.exports = {
    cache,
    cacheMiddleware,
    invalidateCache,
    invalidateCacheKey,
    clearCache,
    getCacheStats
};
