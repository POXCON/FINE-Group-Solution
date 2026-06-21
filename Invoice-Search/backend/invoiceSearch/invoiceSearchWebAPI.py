import os
import requests
from typing import Optional
from datetime import datetime, timezone, timedelta

# FastAPI imports
from fastapi import HTTPException

# Component imports
from AzLog.azlog import sendCustomTraceLog

# Invoice Search
async def invoiceSearchWebAPI(userId: Optional[str], invoiceNum: list[str], isDebug: bool):
    try:
        result = []

        invoice_numbers_str = ",".join(invoiceNum)
        
        await sendCustomTraceLog(
            f"Starting invoiceSearchWebAPI. Invoice Numbers: {invoice_numbers_str}",
            userId,
            "INFO",
            "invoiceSearchWebAPI.py",
            isDebug
        )

        invoiceAppId = os.environ.get("INVOICE_APP_ID")
        invoiceApiUrl = os.environ.get("INVOICE_API_URL")
        JST = timezone(timedelta(hours=+9), "JST")
        now_jst = datetime.now(JST)
        date_str = now_jst.strftime("%Y-%m-%d")

        if not all(
            [
                invoiceAppId,
                invoiceApiUrl,
            ]
        ):
            raise HTTPException(
                status_code=500, detail="Environment variables are not properly set"
            )

        url = f"{invoiceApiUrl}{invoiceAppId}&number={invoice_numbers_str}&day={date_str}&type=21&history=0"

        response = requests.get(url)
        
        response.raise_for_status()
        data = response.json()

        key = 1
        for item in data.get("announcement", []):
            result.append(
                {
                    "key": str(key),
                    "invoiceNumber": item.get("registratedNumber", ""),
                    "invoiceName": item.get("name", ""),
                    "invoiceAddress": item.get("address", ""),
                }
            )
            key += 1

        await sendCustomTraceLog(
            "Successfully completed invoiceSearchWebAPI",
            userId,
            "INFO",
            "invoiceSearchWebAPI.py",
            isDebug
        )
        
        return result
    except Exception as e:
        await sendCustomTraceLog(
            f"There was an error: [{e.__class__.__name__}]{e}",
            userId,
            "ERROR",
            "invoiceSearchWebAPI.py",
            isDebug
        )
        raise HTTPException(status_code=500, detail=f"There was an error: {e}")
