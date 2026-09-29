"""Typed integration boundary for a future validated screening model.

This module intentionally contains no prediction implementation or default model.
"""
from typing import Literal, Protocol, TypedDict

ScreeningLevel = Literal["LOW", "MODERATE", "HIGH", "INSUFFICIENT_INFORMATION"]
Uncertainty = Literal["low", "moderate", "high"]


class Signal(TypedDict):
    type: Literal["visual", "symptom"]
    name: str
    detected: bool


class ScreeningInput(TypedDict):
    image_reference: str
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    answers: dict[str, object]
    input_schema_version: str


class ScreeningOutput(TypedDict):
    screening_level: ScreeningLevel
    uncertainty: Uncertainty
    signals: list[Signal]
    recommendation: Literal["professional_evaluation", "routine_follow_up", "insufficient_information"]
    model_name: str
    model_version: str
    prediction_timestamp: str
    input_schema_version: str
    probability: float
    confidence: float


class ScreeningModel(Protocol):
    """An adapter must abstain when image quality or model uncertainty is unsafe."""

    model_name: str
    model_version: str

    def predict(self, input_data: ScreeningInput) -> ScreeningOutput:
        """Return schema-valid output from a versioned, evaluated model."""
        ...
