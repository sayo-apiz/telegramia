require("./config");
const {IgApiClient} = require("instagram-private-api");
const {withRealtime} = require("instagram_mqtt");
const fs = require("fs");
const pkg = require("request-promise");
const schedule = require('node-schedule');
const axios = require('axios');
const cheerio = require("cheerio");
const express = require('express');

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { get } = pkg;

const ig = withRealtime(new IgApiClient())
ig.state.generateDevice("kasumi");


function saveState(data) {
    fs.writeFileSync(__dirname + "/state.json",JSON.stringify(data))
    return data;
  }
  
  function stateExists() {
    if(fs.existsSync(__dirname+"/state.json")) return true
    return false;
  }
  
  function loadState() {
    let data = fs.readFileSync(__dirname+"/state.json",{encoding:"utf-8"})
    return data;
  }
  
  
function pensador(nome) {
return new Promise((resolve, reject) => {
  axios.get(`https://www.pensador.com/busca.php?q=${nome}`).then( tod => {
  const $ = cheerio.load(tod.data)  
  var postagem = [];
$("div.thought-card.mb-20").each((_, say) => {
    var frase = $(say).find("p").text().trim(); 
    var compartilhamentos = $(say).find("div.total-shares").text().trim(); 
    var autor = $(say).find("a").text().split("\n")[0];
    var imagem = $(say).find("div.sg-social-hidden.sg-social").attr('data-media');
    var resultado = {
      autor: autor,
      compartilhamentos: compartilhamentos,      
      imagem: imagem,
      frase: frase
    }
    postagem.push(resultado)
  })
//  console.log(tod.data)
  resolve(postagem)
  }).catch(reject)
  });
}

  
const postarInstagram = async () => {  
if (stateExists()) {
await ig.state.deserialize(loadState());
}
let loggedInUser
try{
loggedInUser = await ig.account.currentUser()
console.log("conectado")
}catch(err){
console.log(err)
loggedInUser = await ig.account.login(bot,senha)
const serialized = await ig.state.serialize();
delete serialized.constants; 
saveState(serialized);
}
//postar
schedule.scheduleJob("0 0 */3 * * *", async () => { 
//imagem
pensador("motivação").then(async resultado => { 
let somenteum = resultado[Math.floor(Math.random() * resultado.length)]
const imageBuffer = await get({
        url: somenteum.imagem,
        encoding: null, 
})

//publicando...
await ig.publish.photo({
        file: imageBuffer,
        caption: somenteum.frase + "\n\n#frases #motivação #diadia #fy #enriquece\n\nolhe a minha bio e te ensinarei a crescer 🤝",
})
})
console.log("imagem publicada")

})
}


app.get('/', async (req, res) => {
  res.sendFile('index.html', { root: __dirname })
});

postarInstagram()

const porta = process.env.PORT || 5000;
//iniciando...
app.listen(porta, () => console.log("site Online na porta:", porta));
