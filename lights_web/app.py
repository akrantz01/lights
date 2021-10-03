from fastapi import FastAPI, Request
from fastapi.responses import UJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(docs_url=None, swagger_ui_oauth2_redirect_url=None, redoc_url="/docs")

# Register sub-routers

# Register event handlers


@app.exception_handler(StarletteHTTPException)
async def http_exception(_request: Request, exception: StarletteHTTPException):
    return UJSONResponse(
        {"success": False, "message": exception.detail},
        status_code=exception.status_code,
        headers=getattr(exception, "headers", None),
    )
