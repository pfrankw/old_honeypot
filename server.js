var net = require('net');
var fs = require('fs');
var crypto = require('crypto');
var exec = require('child_process').exec, child;
var first = true;

var curdir = "";
var remodir = "/";


function writeroot(socket)
{
	if(remodir == "/")
		socket.write('root@xxx:~# ');
	else
		socket.write('root@xxx:'+remodir+'# ');
}


function receiveData(socket, data) {

	fs.appendFileSync(socket.remoteAddress+"/info.log", "Data received: "+data);
	//logf.write("Data received: "+data);
	if(data.indexOf("\n") != -1)
	{
		data = data.substring(0, data.indexOf("\n"));
	}
	else if(data.indexOf("\r\n") != -1)
	{
		data = data.substring(0, data.indexOf("\r\n"));
	}
	else if(data.indexOf("\r") != -1)
	{
		data = data.substring(0, data.indexOf("\r"));
	}
	
	if(data.indexOf('uname') != -1)
	{
		socket.write('Linux xxx 2.6.18-7.4-xxx #1 SMP Sat Jan 15 12:55:33 UTC 2011 7405b0-smp GNU/Linux\n', function(){writeroot(socket);});
	}
	else if(data == 'pwd')
	{
		socket.write(remodir+"\n", function(){writeroot(socket)});
	}
	else if(data.indexOf('wget') != -1)
	{
		cmd = data.split(" ");
		var filename = "";
		crypto.randomBytes(32, function(ex, buf) {
			filename = buf.toString('hex');
			console.log(filename);
			child = exec("wget -O "+socket.remoteAddress+"/"+filename+".txt "+cmd[1], function(error, stdout, stderr)
			{
				if(error === null)
				{
					socket.write(stdout);
					socket.write(stderr, function(){writeroot(socket);});
				}
			});
			
		});
		
	}
	else if(data == "ls")
	{
		if(remodir == "/"){
		socket.write('bin\tdev\tinit\tmedia\tproc\tsys\tusr\n');
		socket.write('config\tetc\tlib\tmnt\tsbin\ttmp\tvar\n', function(){writeroot(socket)});
		}
		else writeroot(socket);
	}
	else if(data.indexOf("cd") != -1)
	{
		var n = data.split(" ");
		//n[1]=n[1].substring(0, n[1].indexOf("\n"));
		console.log("n = "+n[1]);
		if(n[1] == ".");
		else if(n[1] == "..")
		{
			if(remodir.length != 1)
			{
				if(remodir.lastIndexOf('/') == remodir.indexOf('/'))
					remodir = "/";
				else
					remodir = remodir.substring(0, remodir.lastIndexOf('/'));
			}
		}
		else if(n[1].indexOf("/") == -1)
		{
			if(remodir.length != 1)
			{
				remodir += "/";
				remodir += n[1];
			}
			else
				remodir+= n[1];
	
		}
		else if(n[1][0] == '/')
		{
			remodir = n[1];
		}
		writeroot(socket);
	}
	else if(data == "exit")
	{
		fs.appendFileSync(socket.remoteAddress+"/info.log", socket.remoteAddress+" Exited");
		socket.destroy();
	}
	else if(first)
	{
		socket.write('password: ');
		first=false;
	}
	else
		writeroot(socket);
		
		console.log(data);
	
}
 
var server = net.createServer(function (socket) {

	var address = socket.remoteAddress;
	//var logf = fs.createWriteStream(address+"/log.info", {'flags': 'a'});
	
	fs.mkdir(address, function(e){
		
		fs.appendFileSync(address+'/info.log', address+' Connected\n');
		//fs.appendFile(address+'/info.log', address+'Connected\n', function(err)
		//{
			//logf.write(address+'Connected\n');
			//if(err)throw err;
			socket.setEncoding('utf8');
			socket.write('What\n');
			socket.write('xxx login: ');
			socket.on('data', function(data){
				receiveData(socket, data);
			});
			
		//});
		
		
		
	});
	
	
}).listen(8888);
