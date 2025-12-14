<?php
/**
 * Carga de variables de entorno con fallback local.
 * En producción (Render) se usarán variables ya definidas en el contenedor.
 */

function env_default(string $key, string $default): void {
	if (getenv($key) === false) {
		putenv("{$key}={$default}");
	}
}

env_default('DB_DRIVER', 'mongo');
env_default('MONGO_URI', 'mongodb+srv://SrJCBM:bdd2025@cluster0.tjvfmrk.mongodb.net/');
env_default('MONGO_DB', 'travel_brain');
env_default('OPENWEATHER_API_KEY', '51355211649b0894257fe06250faa40d');
env_default('CURRENCY_PROVIDER', 'erapi');
// Timezone configuration: prefer explicit APP_TIMEZONE, fallback to TZ, default to Ecuador (America/Guayaquil)
env_default('APP_TIMEZONE', 'America/Guayaquil');
env_default('TZ', 'America/Guayaquil');
env_default('MAPBOX_TOKEN', 'pk.eyJ1Ijoic3JqY2JtIiwiYSI6ImNtZ3g0eGV5NDAwZzYya3BvdmFveWU2dnEifQ.yYCrLmlo9lW-AJf56akVCw');

// Apply PHP default timezone early so all DateTime operations use local time
$appTz = getenv('APP_TIMEZONE') ?: getenv('TZ') ?: 'UTC';
if (function_exists('date_default_timezone_set')) {
	@date_default_timezone_set($appTz);
}