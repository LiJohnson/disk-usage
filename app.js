var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var exec = require('child_process').exec;

var port =  process.argv[2]*1 || 9292;

var getPathInfo = function(path,cb,ecb){
	path = path || "/";
	cb = cb || function(){};

	exec("du -d 1 " + path , function(err,stdOut){
		if(err)return ecb.call(this,err);
		
		var data = {total:0,path:path,sub:[]};

		stdOut.trim().split("\n").forEach(function(line){
			line = line.split(/\t+/);
			if( line[1] === "." || line[1] == path ){
				return data.total = line[0]*1;
			}
			data.sub.push({
				size:line[0]*1,
				path:line[1],
				name:line[1].replace(path,"").replace(/^\/?/,'')
			});
		});

		cb.call(this,data);
	});
}


app.get("/",function(req,res){	
	var file = __dirname + "/index.html";
	res.sendFile(file);
});

app.get("/static/*",function(req,res){
	var file = __dirname + "/lib" + req._parsedUrl.pathname.replace(/^\/?static/,'');
	//console.log(file);
	res.sendFile(file);
});

io.on("connection",function(socket){
	socket.on("path",function(path){
		getPathInfo(path,function(data){
			socket.emit("data",data);
		},function(err){
			socket.emit("error",err);
		});
	});
});

server.listen(port,function(){
	console.log("server running on port ", port);
});