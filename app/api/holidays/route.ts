import xml2js from 'xml2js';

const REG = /^\d{4}-\d{2}-\d{2}$/;
const HTTP_STATUS_400_QUERY_VAL ='The query parameters should include start and end, and please send it in YYYY-MM-DD format'
const HTTP_STATUS_400_YEAR_MATCH = 'Start and end years must be the same';
export async function GET(req: Request) {
    const {searchParams} = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (!start || !REG.test(start) || !end || !REG.test(end)) {
        return new Response(HTTP_STATUS_400_QUERY_VAL, {
            status: 400,
        })
    }
    // if (start.slice(0, 4) != end.slice(0, 4)) {
    //     return new Response(HTTP_STATUS_400_YEAR_MATCH, {
    //         status: 400,
    //     })
    // }
    if (new Date(start).getTime() > new Date(end).getTime()) {
        return new Response(JSON.stringify({
            holidays: [],
        }))
    }

    try {
        const ret: string[] = [];

        for(let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year ++) {
            var url = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo'; /*URL*/
            var queryParams = '?' + 'servicekey=' + process.env.SERVICE_KEY; /*Service Key*/
            queryParams += '&' + encodeURIComponent('solYear') + '=' + String(year); /**/
            queryParams += '&numOfRows=100'

            const st = new Date(start);
            const en = new Date(end);
            const res = await fetch(url + queryParams).then(res => res.text()).then(res => xml2js.parseStringPromise(res));
            // console.log(res.response.body[0].items[0].item)
            for(const item of res.response.body[0].items[0].item) {
                const val = item.locdate[0].replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3');
                const date = new Date(val);
                if (st.getTime() > date.getTime()) {
                    continue;
                }
                if (date.getTime() > en.getTime()) {
                    break;
                }
                ret.push(val);
            }
        }
        

        return new Response(JSON.stringify({holidays: ret}));
    } catch(e: any) {
        return new Response(e?.message, {
            status: 500
        })
    }
}