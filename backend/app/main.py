import logging
from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from .core.logging import setup_logging, generate_request_id
from .api.routes import router as api_router
from .core.config import settings


setup_logging()
app = FastAPI(title="ey-datafusion", version="0.1.0", openapi_url="/openapi.json")


@app.middleware("http")
async def add_request_id_logging(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id") or generate_request_id()
    request.state.request_id = request_id
    logger = logging.getLogger("app")
    response = await call_next(request)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
        },
    )
    response.headers["X-Request-Id"] = request_id
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
async def healthz():
    return {"service": settings.service_name, "version": settings.version}


