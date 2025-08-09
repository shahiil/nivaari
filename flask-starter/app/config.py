import os
from typing import Type


class BaseConfig:
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key")
    TESTING: bool = False
    DEBUG: bool = False


class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True


class TestingConfig(BaseConfig):
    TESTING: bool = True


class ProductionConfig(BaseConfig):
    DEBUG: bool = False


def get_config(name: str | None) -> Type[BaseConfig]:
    env_name = (name or os.environ.get("FLASK_ENV", "development")).lower()
    mapping: dict[str, Type[BaseConfig]] = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }
    return mapping.get(env_name, DevelopmentConfig)