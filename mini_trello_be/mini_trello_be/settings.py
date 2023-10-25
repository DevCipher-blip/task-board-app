"""Django settings for the mini board API.

Django only serves the GraphQL endpoint here. Cards live in DynamoDB, so there
is no relational database, admin site or user model.
"""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default):
    return [value.strip() for value in os.environ.get(name, default).split(",") if value.strip()]


DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("Set DJANGO_SECRET_KEY when debug mode is disabled")
    SECRET_KEY = get_random_secret_key()

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,backend,testserver")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "corsheaders",
    "graphene_django",
    "boards",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # CorsMiddleware must run before CommonMiddleware so its headers reach
    # every response, including redirects and errors.
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

ROOT_URLCONF = "mini_trello_be.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": ["django.template.context_processors.request"]},
    },
]

WSGI_APPLICATION = "mini_trello_be.wsgi.application"

DATABASES = {}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

# No SQL runs here, so skip graphene-django's debug SQL-tracking middleware.
GRAPHENE = {"SCHEMA": "mini_trello_be.schema.schema", "MIDDLEWARE": []}

DYNAMODB_ENDPOINT_URL = os.environ.get("DYNAMODB_ENDPOINT_URL", "http://localhost:8000")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "Card")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-west-2")
