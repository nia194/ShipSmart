"""
Orchestration routes.
This service is reserved for AI/orchestration/helper workflows.
It is NOT the system-of-record for shipments or quotes.

The Lovable project had Supabase Edge Functions for AI workflows:
  - ai-shipping-advisor
  - ai-tracking-advisor
  - ai-priority-interpreter
  - ai-notification-generator
  - escalate-tracking-issue
  - import-tracking-from-email
  - find-dropoff-locations
  - validate-address

TODO: Decide which of these become routes here vs stay as Supabase Edge Functions.
      See docs/migration-from-lovable.md and docs/service-boundaries.md.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/orchestration", tags=["orchestration"])


class OrchestrationRequest(BaseModel):
    # TODO: Define proper request schemas in app/schemas/ when workflows are implemented
    workflow: str
    payload: dict


class OrchestrationResponse(BaseModel):
    workflow: str
    status: str
    result: dict | None = None
    message: str | None = None


@router.post("/run", response_model=OrchestrationResponse)
async def run_workflow(request: OrchestrationRequest) -> OrchestrationResponse:
    """
    Run an AI/orchestration workflow.
    TODO: Route to specific workflow handlers based on request.workflow.
    TODO: Integrate LLM provider when AI features are ready.
    Do NOT implement fake AI logic — use clear placeholders.
    """
    return OrchestrationResponse(
        workflow=request.workflow,
        status="not_implemented",
        message=f"Workflow '{request.workflow}' is not yet implemented. "
                "Add handler in app/services/.",
    )


# TODO: Add more specific routes as workflows are defined, e.g.:
# @router.post("/advisor/shipping")   — shipping recommendation
# @router.post("/advisor/tracking")   — tracking issue escalation
# @router.post("/address/validate")   — address validation
# @router.post("/dropoff/find")        — find dropoff locations
