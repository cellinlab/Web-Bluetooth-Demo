const express = require('express');
const app = express();
const port = 3055;
const ip = require('ip');

// 提供静态文件服务
app.use(express.static('public'));

app.listen(port, '0.0.0.0', () => {
  const localIP = ip.address();
  console.log(`服务器运行在:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${localIP}:${port}`);
}); 