import config from "../config";

export const getWelcomeHtml = () => {
    const responseData = {
        success: true,
        statusCode: 200,
        message: "🚀 Welcome to Initialize Backend API",
        version: "1.0.0",
        environment: config.node_env || "development",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        health: "OK",
    };

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Initialize Backend API</title>
            <link rel="icon" type="image/png" href="/favicon.png">
            <style>
                body {
                    background-color: #0d1117;
                    color: #c9d1d9;
                    font-family: 'Consolas', 'Fira Code', monospace;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .box {
                    background: #161b22;
                    padding: 28px 36px;
                    border-radius: 12px;
                    border: 1px solid #30363d;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                    max-width: 600px;
                    width: 90%;
                }
                pre {
                    color: #58a6ff;
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
            </style>
        </head>
        <body>
            <div class="box">
                <pre>${JSON.stringify(responseData, null, 2)}</pre>
            </div>
        </body>
        </html>
    `;
};
