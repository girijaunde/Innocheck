"""CodeStudio API endpoints: unified code generation and prototyping."""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db, get_optional_user_id
from backend.rate_limit import limiter
from backend.services.codestudio_service import codestudio_service

router = APIRouter(prefix="/api/codestudio", tags=["codestudio"])


# Request Models
class GenerateComponentRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)
    framework: str = Field(default="react")  # react, vue, flask, fastapi, html
    typescript: bool = False


class GeneratePrototypeRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)
    template_type: str = Field(default="blank")  # landing_page, dashboard, form, ecommerce, blank
    color_scheme: str = Field(default="light")  # light, dark, brand


class RefineCodeRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=100000)
    instruction: str = Field(..., min_length=5, max_length=1000)
    framework: str = Field(default="react")
    code_type: str = Field(default="component")  # component or prototype


class ExplainCodeRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=50000)
    framework: str = Field(default="react")


class SuggestStackRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)


class AnalyzeComplexityRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)


class ChatRefineRequest(BaseModel):
    instruction: str = Field(..., min_length=5, max_length=1000)
    code: str = Field(..., min_length=10, max_length=100000)
    framework: str = Field(default="react")
    code_type: str = Field(default="component")
    session_id: Optional[str] = None


class TestCodeRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=100000)
    framework: str = Field(default="react")


class ExportPlatformRequest(BaseModel):
    platform: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    code: str = Field(..., min_length=10, max_length=100000)
    framework: str = Field(default="react")
    code_type: str = Field(default="component")


class SaveProjectRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    framework: str = Field(default="react")
    code: str = Field(..., min_length=10, max_length=100000)
    files: Optional[dict[str, str]] = None
    tags: Optional[list[str]] = None
    is_public: bool = False
    fork_from: Optional[int] = None


# Endpoints
@router.post("/component")
@limiter.limit("30/minute")
async def generate_component(
    request: Request,
    payload: GenerateComponentRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Generate framework-specific component code."""
    try:
        result = await codestudio_service.generate_component(
            description=payload.description,
            framework=payload.framework,
            typescript=payload.typescript,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component generation failed: {str(e)}") from e


@router.post("/prototype")
@limiter.limit("20/minute")
async def generate_prototype(
    request: Request,
    payload: GeneratePrototypeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Generate complete HTML prototype."""
    try:
        result = await codestudio_service.generate_prototype(
            description=payload.description,
            template_type=payload.template_type,
            color_scheme=payload.color_scheme,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prototype generation failed: {str(e)}") from e


@router.post("/refine")
@limiter.limit("40/minute")
async def refine_code(
    request: Request,
    payload: RefineCodeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Refine existing code based on user instruction."""
    try:
        result = await codestudio_service.refine_code(
            existing_code=payload.code,
            instruction=payload.instruction,
            framework=payload.framework,
            code_type=payload.code_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}") from e


@router.post("/explain")
@limiter.limit("30/minute")
async def explain_code(
    request: Request,
    payload: ExplainCodeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Get explanation of code."""
    try:
        result = await codestudio_service.explain_code(
            code=payload.code,
            framework=payload.framework,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}") from e


@router.post("/suggest-stack")
@limiter.limit("20/minute")
async def suggest_stack(
    request: Request,
    payload: SuggestStackRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Suggest a best tech stack for the user's idea."""
    try:
        result = await codestudio_service.suggest_stack(description=payload.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stack suggestion failed: {str(e)}") from e


@router.post("/analyze-complexity")
@limiter.limit("20/minute")
async def analyze_complexity(
    request: Request,
    payload: AnalyzeComplexityRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Analyze project complexity and effort."""
    try:
        result = await codestudio_service.analyze_complexity(description=payload.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complexity analysis failed: {str(e)}") from e


@router.post("/chat-refine")
@limiter.limit("40/minute")
async def chat_refine(
    request: Request,
    payload: ChatRefineRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Iteratively refine code through chat instructions."""
    try:
        result = await codestudio_service.chat_refine(
            instruction=payload.instruction,
            current_code=payload.code,
            framework=payload.framework,
            code_type=payload.code_type,
            session_id=payload.session_id,
            user_id=user_id,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat refinement failed: {str(e)}") from e


@router.post("/test-code")
@limiter.limit("30/minute")
async def test_code(
    request: Request,
    payload: TestCodeRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Run automated validation and testing on generated code."""
    try:
        result = await codestudio_service.test_code(code=payload.code, framework=payload.framework)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code testing failed: {str(e)}") from e


@router.post("/export-platform")
@limiter.limit("20/minute")
async def export_platform(
    request: Request,
    payload: ExportPlatformRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Export generated code for a target platform."""
    try:
        result = await codestudio_service.export_platform(
            platform=payload.platform,
            description=payload.description,
            current_code=payload.code,
            framework=payload.framework,
            code_type=payload.code_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Platform export failed: {str(e)}") from e


@router.get("/templates")
@limiter.limit("20/minute")
async def get_templates(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return the CodeStudio template library."""
    try:
        return codestudio_service.get_templates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template library failed: {str(e)}") from e


@router.post("/save-project")
@limiter.limit("20/minute")
async def save_project(
    request: Request,
    payload: SaveProjectRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Save a student project in CodeStudio."""
    try:
        return codestudio_service.save_project(
            user_id=user_id,
            title=payload.title,
            description=payload.description,
            framework=payload.framework,
            code=payload.code,
            files=payload.files,
            tags=payload.tags,
            is_public=payload.is_public,
            fork_from=payload.fork_from,
            db=db,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save project failed: {str(e)}") from e


@router.get("/my-projects")
@limiter.limit("20/minute")
async def get_my_projects(
    request: Request,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict[str, Any]:
    """List saved CodeStudio student projects."""
    try:
        return codestudio_service.get_my_projects(user_id=user_id, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List projects failed: {str(e)}") from e


@router.post("/fork-project/{project_id}")
@limiter.limit("20/minute")
async def fork_project(
    request: Request,
    project_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Fork an existing saved project."""
    try:
        return codestudio_service.fork_project(user_id=user_id, project_id=project_id, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fork project failed: {str(e)}") from e


# New Custom Endpoints for Mock Database Seeding, Presentation Pitch Deck, and Plagiarism scan
class GenerateMockDataRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)


class GeneratePitchDeckRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)
    code: str = Field(..., min_length=10, max_length=100000)


class OriginalityCheckRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=100000)


@router.post("/mock-data")
@limiter.limit("20/minute")
async def generate_mock_data(
    request: Request,
    payload: GenerateMockDataRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Generate realistic mock database seeding JSON dataset."""
    try:
        result = await codestudio_service.generate_mock_data(description=payload.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mock data generation failed: {str(e)}") from e


@router.post("/pitch-deck")
@limiter.limit("20/minute")
async def generate_pitch_deck(
    request: Request,
    payload: GeneratePitchDeckRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Generate professional Markdown presentation slide outlines."""
    try:
        result = await codestudio_service.generate_pitch_deck(
            description=payload.description,
            code=payload.code
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch deck outline failed: {str(e)}") from e


@router.post("/plagiarism-check")
@limiter.limit("30/minute")
async def originality_check(
    request: Request,
    payload: OriginalityCheckRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    """Evaluate generated code originality / plagiarism similarity."""
    try:
        result = codestudio_service.check_originality(code=payload.code, db=db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Originality checker failed: {str(e)}") from e
