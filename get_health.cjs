var http = require('http');
http.get('http://localhost:3000/api/health', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log("DATA:", data); });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
