import os
import aiohttp
import xml.etree.ElementTree as ET
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import SessionLocal
from app.models.pharmacy import Pharmacy
from dotenv import load_dotenv

load_dotenv()

async def sync_pharmacies():
    db = SessionLocal()
    try:
        API_KEY = os.getenv("PUBLIC_DATA_API_KEY")
        if not API_KEY:
            raise ValueError("API key not set in .env file")
        base_url = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire"
        params = {
            "serviceKey": API_KEY,
            "numOfRows": 1000,
            "pageNo": 1,
        }
        async with aiohttp.ClientSession() as session:
            while True:
                async with session.get(base_url, params=params) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise Exception(f"API request failed with status {response.status}: {text}")
                    xml_data = await response.text()
                    try:
                        root = ET.fromstring(xml_data)
                    except ET.ParseError:
                        raise Exception(f"Invalid XML response: {xml_data}")
                    items = root.findall(".//item")
                    if not items:
                        break
                    for item in items:
                        pharmacy_data = {child.tag: child.text for child in item if child.text}
                        operating_hours = {}
                        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Holiday"]
                        for i, day in enumerate(days, start=1):
                            start_key = f"dutyTime{i}s" if i <= 7 else "dutyTime8s"
                            close_key = f"dutyTime{i}c" if i <= 7 else "dutyTime8c"
                            start = pharmacy_data.get(start_key, "")
                            close = pharmacy_data.get(close_key, "")
                            if start and close:
                                operating_hours[day] = {"start": start, "close": close}
                        try:
                            latitude = float(pharmacy_data.get("wgs84Lat", 0)) if pharmacy_data.get("wgs84Lat") else None
                            longitude = float(pharmacy_data.get("wgs84Lon", 0)) if pharmacy_data.get("wgs84Lon") else None
                        except ValueError:
                            latitude, longitude = None, None
                        pharmacy = Pharmacy(
                            id=pharmacy_data.get("hpid", ""),
                            name=pharmacy_data.get("dutyName", ""),
                            address=pharmacy_data.get("dutyAddr", ""),
                            latitude=latitude,
                            longitude=longitude,
                            operating_hours=operating_hours,
                            phone=pharmacy_data.get("dutyTel1", ""),
                            status="active"
                        )
                        db.merge(pharmacy)
                    db.commit()
                    params["pageNo"] += 1
    except Exception as e:
        print(f"Sync error: {str(e)}")
    finally:
        db.close()

scheduler = AsyncIOScheduler()
scheduler.add_job(sync_pharmacies, "interval", hours=24)
scheduler.start()