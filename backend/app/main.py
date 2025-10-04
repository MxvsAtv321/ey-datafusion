import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware
from .core.logging import setup_logging, generate_request_id
from .core.config import settings
from .api.routes import router as api_router
from .core.config import settings


setup_logging()
app = FastAPI(title="ey-datafusion", version="0.1.0", openapi_url=(None if settings.disable_openapi else "/openapi.json"))


@app.middleware("http")
async def add_request_id_logging(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id") or generate_request_id()
    request.state.request_id = request_id
    logger = logging.getLogger("app")
    # propagate run id if provided by client
    run_id = request.headers.get("X-Run-Id")
    if run_id:
        request.state.run_id = run_id
    response = await call_next(request)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "run_id": getattr(request.state, "run_id", None),
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
        },
    )
    response.headers["X-Request-Id"] = request_id
    if run_id:
        response.headers["X-Run-Id"] = run_id
    return response


origins = settings.allowed_origins or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
async def healthz():
    return {"service": settings.service_name, "version": settings.version}


def _err(code: str, message: str, details: dict | None = None) -> dict:
    return {"code": code, "message": message, "details": details or {}}


@app.exception_handler(StarletteHTTPException)
async def http_exc_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content=_err("ERR_HTTP", str(exc.detail)))


@app.exception_handler(RequestValidationError)
async def validation_exc_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=_err("ERR_VALIDATION", "Invalid request", {"errors": exc.errors()}))


@app.exception_handler(Exception)
async def unhandled_exc_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content=_err("ERR_INTERNAL", "Unexpected error"))


