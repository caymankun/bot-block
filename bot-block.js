const https = require('https');
const fs = require('fs');
const querystring = require('querystring');

// SSL証明書と秘密鍵のパス
const privateKeyPath = '/path/to/private/key.pem';
const certificatePath = '/path/to/certificate.pem';

// reCAPTCHAのシークレットキー
const recaptchaSecretKey = 'YOUR_RECAPTCHA_SECRET_KEY';

// HTTPSサーバーの設定
const serverOptions = {
  key: fs.readFileSync(privateKeyPath),
  cert: fs.readFileSync(certificatePath)
};

// HTTPSサーバーの作成
const server = https.createServer(serverOptions, (req, res) => {
  if (req.method === 'POST' && req.url === '/validate-recaptcha') {
    // POSTデータの受信と解析
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const postData = querystring.parse(body);

      // reCAPTCHAトークンの検証
      const recaptchaResponse = postData.recaptchaResponse;
      const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaResponse}`;

      https.get(recaptchaUrl, (recaptchaRes) => {
        let recaptchaData = '';
        recaptchaRes.on('data', (chunk) => {
          recaptchaData += chunk;
        });
        recaptchaRes.on('end', () => {
          const recaptchaResult = JSON.parse(recaptchaData);
          if (recaptchaResult.success) {
            // reCAPTCHA検証成功
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('reCAPTCHA validation successful');
          } else {
            // reCAPTCHA検証失敗
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('reCAPTCHA validation failed');
          }
        });
      }).on('error', (err) => {
        console.error('An error occurred during reCAPTCHA verification:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An error occurred during reCAPTCHA verification');
      });
    });
  } else {
    // その他のリクエストには404エラーを返す
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// サーバーの起動
server.listen(443, () => {
  console.log('Server listening on port 443');
});
