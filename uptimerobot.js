////buat bot online terus ------ ///---
const http = require("http");
const express = require("express");
const app = express();
//app.use(express.static("public"));
app.get("/", (request, response) => {
  console.log("keep online bot Boss!");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

//readme plis

//nex to go to website https://script.google.com/

////buat bot online terus // keep the bot online ------ ///---
