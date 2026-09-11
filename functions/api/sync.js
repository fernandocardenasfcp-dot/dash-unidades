// =========================================================================
// CLOUDFLARE PAGES FUNCTION (API) + R2 BUCKET
// Este código maneja la lectura y escritura en tu Bucket R2.
// =========================================================================

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // 1. ENDPOINT GET (Lectura de archivos y listado)
    if (request.method === "GET") {
        
        // A. Listar todos los archivos para armar el rompecabezas
        if (action === 'syncInit') {
            try {
                // PTL_BUCKET es el nombre de la variable que unirás a tu R2
                const listed = await env.PTL_BUCKET.list();
                let res = { ewm: [], totes: [], empeno: [], k22: [], k24: [], v01: [], k23: [], cerradoras: [], detalles: [], magestic: [], manuales: false, fraudes: false };
                
                for (let object of listed.objects) {
                    let name = object.key;
                    if(name.startsWith("EWM_")) res.ewm.push(name.replace("EWM_","").replace(".json",""));
                    else if(name.startsWith("Totes_")) res.totes.push(name.replace("Totes_","").replace(".json",""));
                    else if(name.startsWith("Empeno_")) res.empeno.push(name.replace("Empeno_","").replace(".json",""));
                    else if(name.startsWith("K22_")) res.k22.push(name.replace("K22_","").replace(".json",""));
                    else if(name.startsWith("K24_")) res.k24.push(name.replace("K24_","").replace(".json",""));
                    else if(name.startsWith("V01_")) res.v01.push(name.replace("V01_","").replace(".json",""));
                    else if(name.startsWith("K23_")) res.k23.push(name.replace("K23_","").replace(".json",""));
                    else if(name.startsWith("Cerradoras_")) res.cerradoras.push(name.replace("Cerradoras_","").replace(".json",""));
                    else if(name.startsWith("Detalle_")) res.detalles.push(name);
                    else if(name.startsWith("Magestic_")) res.magestic.push(name.replace("Magestic_","").replace(".json",""));
                    else if(name === "Cierres_Manuales.json") res.manuales = true;
                    else if(name === "Fraudes.json") res.fraudes = true;
                }
                return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500 });
            }
        }

        // B. Leer un archivo en específico
        if (action === 'getFile') {
            const filename = url.searchParams.get('filename');
            if (!filename) return new Response("Falta filename", { status: 400 });
            
            const object = await env.PTL_BUCKET.get(filename);
            if (!object) return new Response("", { status: 404 });
            
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            return new Response(object.body, { headers });
        }

        return new Response("Acción no válida", { status: 400 });
    }

    // 2. ENDPOINT POST (Subir nuevos JSON a R2)
    if (request.method === "POST") {
        try {
            const body = await request.json();
            if (body.filename && body.data) {
                // Guarda el JSON directo en el Bucket R2
                await env.PTL_BUCKET.put(body.filename, JSON.stringify(body.data));
                return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
            }
            return new Response("Faltan datos", { status: 400 });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
    }

    return new Response("Método no permitido", { status: 405 });
}
