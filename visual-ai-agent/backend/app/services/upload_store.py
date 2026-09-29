from typing import Dict, List

from app.models.upload import ActivityRecord, ScreenshotBatchItem, ScreenshotUploadRequest


class UploadStore:
    """Small in-memory upload store for the current API integration phase."""

    def __init__(self) -> None:
        self._activities: List[ActivityRecord] = []
        self._screenshots: List[ScreenshotBatchItem] = []

    def add_activities(self, activities: List[ActivityRecord]) -> List[str]:
        self._activities.extend(activities)
        return [item.id for item in activities]

    def add_screenshot(self, screenshot: ScreenshotUploadRequest) -> str:
        item = ScreenshotBatchItem(metadata=screenshot.metadata, image=screenshot.image)
        self._screenshots.append(item)
        return screenshot.metadata.id

    def add_screenshots(self, screenshots: List[ScreenshotBatchItem]) -> List[str]:
        self._screenshots.extend(screenshots)
        return [item.metadata.id for item in screenshots]

    def status(self) -> Dict[str, object]:
        latest_activity = self._activities[-1].dict() if self._activities else None
        latest_screenshot = (
            self._screenshots[-1].metadata.dict() if self._screenshots else None
        )
        return {
            "status": "ok",
            "activities": len(self._activities),
            "screenshots": len(self._screenshots),
            "latestActivity": latest_activity,
            "latestScreenshot": latest_screenshot,
        }


upload_store = UploadStore()
