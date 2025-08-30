const server = Bun.serve({
  port: 4000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve the main HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Music</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #000;
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }

        iframe {
            width: 100%;
            height: 100vh;
            border: none;
        }
        
        .info {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: rgba(0,0,0,0.9);
            padding: 15px;
            border-radius: 5px;
            max-width: 400px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .info h3 {
            margin: 0 0 10px 0;
            color: #ff4444;
        }
        
        .info code {
            background: #333;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .info ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .info li {
            margin: 5px 0;
        }
        
        .close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <iframe src="https://music.youtube.com"></iframe>
    
    <div class="info" id="info">
        <button class="close-btn" onclick="document.getElementById('info').style.display='none'">×</button>
        <h3>⚠️ Cannot inject JS into cross-origin iframe</h3>
        <p>Due to browser security, you cannot inject JavaScript into YouTube Music iframe. Here are your options:</p>
        <ol>
            <li><strong>Browser Extension:</strong> Create a Chrome/Firefox extension with content scripts that can modify YouTube Music directly</li>
            <li><strong>Userscript:</strong> Use Tampermonkey/Greasemonkey with a script like:
                <br><code>// @match https://music.youtube.com/*</code>
            </li>
            <li><strong>Electron App:</strong> Build a desktop app without browser restrictions</li>
            <li><strong>Browser DevTools:</strong> Open DevTools, right-click the iframe → "Reload frame in tab", then inject JS directly</li>
        </ol>
        <p style="margin-top: 10px; color: #888;">The proxy approach won't work because YouTube Music uses complex JavaScript that breaks when proxied.</p>
    </div>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    }

    // Favicon handler
    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    return new Response('Not found', { status: 404 });
  }
});

console.log(`Server running at http://localhost:${server.port}`);
console.log('\n📝 For hiding YouTube Music elements, use one of these methods:');
console.log('1. Tampermonkey userscript (easiest)');
console.log('2. Browser extension with content scripts');
console.log('3. Open iframe URL directly and use DevTools console');