var http = require('http');
const port = process.env.PORT || 3000;
http.get(`http://localhost:${port}/api/health`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log("DATA:", data); });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
