/**
 * Cloudflare Worker for WeMD Image Upload
 * Bindings:
 * - BUCKET: R2Bucket
 * - AUTH_TOKEN: string (Optional, set in Environment Variables)
 * - PUBLIC_URL: string (e.g., "https://img.gudong.site")
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 方便测试：根路径返回一个简单的上传页面
    if (request.method === "GET" && url.pathname === "/") {
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WeMD Uploader Test</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .result { margin-top: 20px; padding: 10px; background: #f0f0f0; display: none; }
        </style>
      </head>
      <body>
        <h1>WeMD Uploader Test</h1>
        <form id="uploadForm">
          <input type="file" name="file" required />
          <button type="submit">Upload</button>
        </form>
        <div id="result" class="result"></div>
        <script>
          document.getElementById('uploadForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Uploading...';
            
            try {
              const res = await fetch('/upload', { method: 'POST', body: formData });
              const data = await res.json();
              resultDiv.innerHTML = res.ok 
                ? 'Success! URL: <a href="' + data.url + '" target="_blank">' + data.url + '</a>'
                : 'Error: ' + JSON.stringify(data);
            } catch (err) {
              resultDiv.textContent = 'Error: ' + err.message;
            }
          };
        </script>
      </body>
      </html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 简单的 CORS 处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/upload") {
      // 鉴权 (如果配置了 AUTH_TOKEN)
      if (env.AUTH_TOKEN) {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
      }

      try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
        }

        // 生成文件名: timestamp-random.ext
        const ext = file.name.split(".").pop() || "png";
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        
        // 存入 R2
        await env.BUCKET.put(filename, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        // 返回 URL
        const publicUrl = env.PUBLIC_URL || "https://img.gudong.site";
        return new Response(JSON.stringify({ url: `${publicUrl}/${filename}` }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
