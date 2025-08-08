from flask import Flask

from .config import get_config
from .routes import main_blueprint


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )

    # Load configuration
    app.config.from_object(get_config(config_name))

    # Register blueprints
    app.register_blueprint(main_blueprint)

    return app