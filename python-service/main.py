import os
from typing import List
import httpx
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

app = FastAPI(title="VacciChain Analytics", version="1.0.0")

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:3001")


class BatchVerifyRequest(BaseModel):
    wallets: List[str]
    vaccine_name: str


class VerifyResult(BaseModel):
    wallet: str
    verified: bool
    error: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/batch-verify", response_model=List[VerifyResult])
async def batch_verify(req: BatchVerifyRequest):
    """Verify vaccination status for a list of wallets in parallel."""
    async with httpx.AsyncClient() as client:
        tasks = [
            client.get(
                f"{BACKEND_URL}/verify/{wallet}",
                params={"vaccine_name": req.vaccine_name},
                timeout=10,
            )
            for wallet in req.wallets
        ]
        import asyncio
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    results = []
    for wallet, resp in zip(req.wallets, responses):
        if isinstance(resp, Exception):
            results.append(VerifyResult(wallet=wallet, verified=False, error=str(resp)))
        elif resp.status_code == 200:
            data = resp.json()
            results.append(VerifyResult(wallet=wallet, verified=data.get("verified", False)))
        else:
            results.append(VerifyResult(wallet=wallet, verified=False, error=resp.text))
    return results


@app.get("/analytics/summary")
async def summary(wallets: List[str] = Query(...), vaccine_name: str = Query(...)):
    """Return verified/unverified counts for a set of wallets."""
    req = BatchVerifyRequest(wallets=wallets, vaccine_name=vaccine_name)
    results = await batch_verify(req)
    verified = sum(1 for r in results if r.verified)
    return {
        "total": len(results),
        "verified": verified,
        "unverified": len(results) - verified,
        "coverage_pct": round(verified / len(results) * 100, 1) if results else 0,
    }
