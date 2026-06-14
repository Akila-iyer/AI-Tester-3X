"""Flask application factory for Visual UI Testing Platform."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory
from flask_cors import CORS

from loggers.logger import setup_logging, get_logger
from config.schema import load_config
from storage.manager import StorageManager
from ui.routes.api import api_bp

logger = get_logger(__name__)


def create_app(config_path: str = None) -> Flask:
    """Create and configure the Flask application.

    Args:
        config_path: Path to YAML config file. Defaults to config/default.yaml.

    Returns:
        Configured Flask application.
    """
    # Load configuration
    config = load_config(config_path)
    log_level = config.ui.theme if hasattr(config.ui, 'theme') else "INFO"

    # Setup logging
    setup_logging("INFO")

    # Ensure directories exist
    StorageManager.ensure_dirs()

    # Create Flask app
    app = Flask(
        __name__,
        static_folder=None,  # We handle static files manually
        static_url_path="",
    )

    # Enable CORS for frontend dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Store config in app context
    app.config["app_config"] = config

    # Register blueprints
    app.register_blueprint(api_bp)

    # Serve frontend static files
    frontend_dist = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend", "dist",
    )

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path: str):
        """Serve the React frontend build."""
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(frontend_dist, "index.html")
        return {"message": "Visual UI Testing Platform API. Build the frontend with: cd frontend && npm run build"}, 200

    logger.info("Flask app created — config: %s", config_path or "default")
    return app


if __name__ == "__main__":
    app = create_app()
    logger.info("Starting Visual UI Testing Platform on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
