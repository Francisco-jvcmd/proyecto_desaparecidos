from pydantic import BaseModel
from typing import Literal, Any

class GeoJSONFeature(BaseModel):
    type: Literal["Feature"]
    geometry: dict[str, Any]
    properties: dict[str, Any] | None = None

class GeoJSONResponse(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[GeoJSONFeature]
