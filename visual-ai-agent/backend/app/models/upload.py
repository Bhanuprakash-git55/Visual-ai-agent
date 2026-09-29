from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ActivityRecord(BaseModel):
    id: str
    timestamp: str
    url: Optional[str] = None
    title: Optional[str] = None
    eventType: str = Field(..., min_length=1)
    tabId: Optional[int] = None
    windowId: Optional[int] = None


class ActivityUploadRequest(BaseModel):
    activity: ActivityRecord


class ActivityBatchUploadRequest(BaseModel):
    activities: List[ActivityRecord]


class ScreenshotMetadata(BaseModel):
    id: str
    timestamp: str
    tabId: Optional[int] = None
    windowId: Optional[int] = None
    url: Optional[str] = None
    title: Optional[str] = None
    uploaded: bool = False


class ScreenshotUploadRequest(BaseModel):
    metadata: ScreenshotMetadata
    image: str = Field(..., min_length=1)


class ScreenshotBatchItem(BaseModel):
    metadata: ScreenshotMetadata
    image: str = Field(..., min_length=1)


class ScreenshotBatchUploadRequest(BaseModel):
    items: List[ScreenshotBatchItem]


class UploadAcceptedResponse(BaseModel):
    accepted: int
    ids: List[str]


class UploadStatusResponse(BaseModel):
    status: str
    activities: int
    screenshots: int
    latestActivity: Optional[Dict[str, Any]] = None
    latestScreenshot: Optional[Dict[str, Any]] = None
