import aiohttp
import asyncio

async def test_api():
    async with aiohttp.ClientSession() as session:
        url = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire"
        params = {"serviceKey": "FH3fivjwNsdp8hVWBT7wIF/2Hxi7gQIA7bu19DxYK6Ld111bKFoCRHDw2AL5nq9Oa48+2pa+ktvsGWO3kcjupQ==", "numOfRows": 10, "pageNo": 1}
        async with session.get(url, params=params) as response:
            print(await response.text())

asyncio.run(test_api())