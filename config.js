const config = {
        mongodb_url: "mongodb://localhost/ios-heatmap-backend",
        app_listen_port: 8080,
        cluster_enabled: false,
        quantization: 10, // in pixels
        image_updated_in: 3600, // in seconds
}

switch (process.env.NODE_ENV) {
        case "production":
                config.app_listen_port = 80;
                config.cluster_enabled = true;
                break;
        case "test":
                config.cluster_enabled = true;
                config.mongodb_url = "mongodb://localhost/ios-heatmap-backend-test"
                break;
}

module.exports = config;