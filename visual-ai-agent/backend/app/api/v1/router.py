from fastapi import APIRouter, status as http_status

from app.models.upload import (
    ActivityBatchUploadRequest,
    ActivityUploadRequest,
    ScreenshotBatchUploadRequest,
    ScreenshotUploadRequest,
    UploadAcceptedResponse,
    UploadStatusResponse,
)
from app.services.upload_store import upload_store

router = APIRouter()

@router.get("/status", response_model=UploadStatusResponse)
async def api_status():
    return upload_store.status()


@router.post(
    "/activities",
    response_model=UploadAcceptedResponse,
    status_code=http_status.HTTP_202_ACCEPTED,
)
async def upload_activity(payload: ActivityUploadRequest):
    ids = upload_store.add_activities([payload.activity])
    return {"accepted": len(ids), "ids": ids}


@router.post(
    "/activities/batch",
    response_model=UploadAcceptedResponse,
    status_code=http_status.HTTP_202_ACCEPTED,
)
async def upload_activities(payload: ActivityBatchUploadRequest):
    ids = upload_store.add_activities(payload.activities)
    return {"accepted": len(ids), "ids": ids}


@router.post(
    "/screenshots",
    response_model=UploadAcceptedResponse,
    status_code=http_status.HTTP_202_ACCEPTED,
)
async def upload_screenshot(payload: ScreenshotUploadRequest):
    screenshot_id = upload_store.add_screenshot(payload)
    return {"accepted": 1, "ids": [screenshot_id]}


@router.post(
    "/screenshots/batch",
    response_model=UploadAcceptedResponse,
    status_code=http_status.HTTP_202_ACCEPTED,
)
async def upload_screenshots(payload: ScreenshotBatchUploadRequest):
    ids = upload_store.add_screenshots(payload.items)
    return {"accepted": len(ids), "ids": ids}
