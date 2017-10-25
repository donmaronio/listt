var allClients = [];
var express = require('express');
var http = require('http');
var ilosc = 2;//ilosć graczy
var app = express();
var server = app.listen(3000);
var gra=0;
var pokoje=[];
var talia=[];
var wlasciciel=[];
var karty = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
var wybrany,ettt;
var graczewpokoju=[];
var trwa=[]
var kolejka=[];
allClients[0]=[];
allClients[1]=[];


//tasowanie
function tasuj(arr) {
    for (var i=0; i<arr.length; i++) {
        var j = Math.floor(Math.random() * arr.length);
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}
function nowagra(){

}
nowagra();

//serwer start
app.use(express.static('public'));

console.log("Diała");

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
	console.log('new connection /' + socket.id);
	
	//Nadaje graczom losowe nicki
	allClients[0].push(socket);
	allClients[1].push(socket.id.slice(0,5));
	
	//zmiana nicku przez gracza
	socket.on("nick",function(data){
		var n = allClients[0].indexOf(socket)
		allClients[1][n]=data;
	});
	
	
	
		//nowa gra
		socket.on('nowagra', stworzpokoj);
		function stworzpokoj(data){
			if(pokoje.length==0){
				pokoje[0]=data;
				talia[0] = karty.slice(0);
				tasuj(talia[0]);
				trwa[0]=0;
				socket.emit('karty', talia[0]);
				socket.join('pokoj0');
				wlasciciel[0]=socket.id;
				graczewpokoju[0]=[socket.id];
				console.log(graczewpokoju);
			}else{
				console.log(pokoje.length);
				var a = pokoje.length;
				pokoje[a]=data;
				talia[a] = karty.slice(0);
				trwa[a]=0;
				tasuj(talia[a]);
				socket.emit('karty', talia[a]);
				wlasciciel[a]=socket.id;
				console.log(wlasciciel);
				graczewpokoju[a]=[socket.id];
				socket.join('pokoj'+a);
			}
		}
		
		
		//dołącz
		socket.on('dolacz', dolacz);
		function dolacz(data){
			if(pokoje==null){
				socket.emit('pokoje', "0");
			}else{
				socket.join('lobby');
				socket.emit('pokoje', pokoje);
				
			}
		}
		
		//rozłączenie gracza
		socket.on('disconnect', function() {
			console.log('Got disconnect!');
			//Jeśli gracz ma pokój, usuń pokoj
			
			if(wlasciciel.indexOf(socket.id)!=-1){
				var x=wlasciciel.indexOf(socket.id);
				pokoje.splice(x,1);
				talia.splice(x,1);
				wlasciciel.splice(x,1);
				trwa.splice(x,1);
				
				
				socket.broadcast.to('pokoj'+x).emit('usunieto',"usunieto");
				socket.broadcast.to('lobby').emit('pokoje',pokoje);
				
			}else{
				//nadaje nowe id graczom w pokoju gdy jeden odejdzie
				if(wybrany!=null){
					if(wybrany.gracze.indexOf(socket.id)!=-1){
						var x = wybrany.gracze.indexOf(socket.id);
						wybrany.gracze.splice(x,1);
						console.log(graczewpokoju);
						
						socket.broadcast.to('pokoj'+wybrany.id).emit('id', graczewpokoju[wybrany.id]);
						
						io.to(wybrany.wlasciciel).emit('iloscgraczy', "usuń");
					}
				}
			}
			
			var i = allClients[0].indexOf(socket);
			allClients[0].splice(i, 1);
			allClients[1].splice(i, 1);
		});
		
		//Wybranie pokoju
		socket.on('wybierz', wybierz);
		function wybierz(data){
			if (!trwa[data.id]){
				if(data.war==pokoje[data.id]){
					console.log(graczewpokoju[data.id]);
					if(graczewpokoju[data.id].length<4){
						socket.leave('lobby');
						graczewpokoju[data.id].push(socket.id);
						wybrany = {"pokoj":pokoje[data.id],"wlasciciel":wlasciciel[data.id],"gracze":graczewpokoju[data.id],"id":data.id};
						socket.emit('wybrales', wybrany);
						socket.join('pokoj'+data.id);
						ettt = graczewpokoju[data.id];
						console.log(ettt.indexOf(socket.id));
						socket.emit('id',  graczewpokoju[wybrany.id]);
						console.log(graczewpokoju);
						io.to(wybrany.wlasciciel).emit('sprawdzwl', wybrany);
					}else{
						socket.emit('limit', 'limit');
					}		
				}else{
					socket.emit("niama", "niema");
				}
			}else{
				socket.emit("trwa","trwa");
			}
		}
		
		//chyba nic juz
		socket.on("gracze" , gracze);
		function gracze(data){
			ilosc=data+1;
		}
	
		//Rozsyła talie do graczy
		socket.on("rozgrywka1", rozgrywka1);
		function rozgrywka1(data){
			trwa[wybrany.id]=1;
			var listagraczy = [];
			for(i=0;i<graczewpokoju[wybrany.id].length;i++){
				var indexOfgracz = allClients[0].findIndex(k => k.id === graczewpokoju[wybrany.id][i]);
				listagraczy[i]=allClients[1][indexOfgracz];				
			}
			io.to('pokoj'+wybrany.id).emit('rozgrywka2',{"talia":talia[wybrany.id],'ilosc':data, 'gracze':listagraczy});
			kolejka[wybrany.id]=0;
			io.to(graczewpokoju[wybrany.id][kolejka[wybrany.id]]).emit('twojruch', 'twojruch');
			
		}
		
		
		//po ruchu
		socket.on('ruch', ruch);
		function ruch(kartar){
				
			kolejka[wybrany.id]++;
			io.to(graczewpokoju[kolejka[wybrany.id]]).emit('twojruch', 'twojruch');
		}
		
		function rozgrywka3(data){
			for(i=0;i<graczewpokoju[wybrany.id].length;i++){
				io.to(graczewpokoju[wybrany.id][i]).emit('rozgrywka4',data);
			}
		}
	
	}