/***
 * Xen api main module
 ***/
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.on('uncaughtException', function (err) {
     console.log(err);
});
var async = require('async');
var xmlrpc = require('xmlrpc');
var client, sessionId, username, password = null;

var xenapi = function(srvHostname, srvPort){
	console.log("DEBUG : Construct xenapi object..."); 
	client = xmlrpc.createSecureClient({ host: srvHostname, port: srvPort, cookies: true, path: '/'});
	console.log("DEBUG : ...End construct!");
};

function sessionLogin(cb){
	client.methodCall('session.login_with_password', [username, password, '2.0'], function(error, session){
		if(error) throw error;
		sessionId = session.Value;
		console.log('DEBUG : sessionId='+ JSON.stringify(session.Value));
		cb(null, 'Login');
	});
};

function sessionLogout(cb){
	client.methodCall('session.logout', [sessionId], function(error, value){
		if(error) throw error;
		console.log('DEBUG : logout = ' + JSON.stringify(value)); 
	cb(null, 'Logout');
	});
};

function setCredentials(user, pass){
   username = user;
   password = pass;
};

xenapi.prototype.login = setCredentials;


xenapi.prototype.startAllVm = function() {
	async.series([
		sessionLogin,
		function(cb){			
     			client.methodCall('VM.get_all_records', [sessionId], function (error, vms) {
		                if(error) throw error;
                		console.log('VMS : ' + JSON.stringify(vms));
		                vms = vms.Value;
				var vmsArray = [];
				for( var ref in vms){
					console.log('DEBUG : ref =  ' + ref);  
					var vmObject = {'ref' : ref ,'datas' : vms[ref]};
					vmsArray.push(vmObject);
				}
                		async.forEach(vmsArray, function(vm, callback){
                         		console.log('VM_UUID = ' + vm.datas.uuid);
                        		if(vm.datas.is_a_template == false){
                                 		client.methodCall('VM.start', [ sessionId, vm.ref, false, false], function(error, data){
							if(error) throw error;
                                        		console.log('VM = ' + JSON.stringify(data));
							callback();
                                 		});
                         		}
                 		}, function(err){
					if(err) throw err;
				});
							
				cb(null, 'StartAllVm');
			});
		},
		sessionLogout
	],
	function(err, results){
		console.log('RESULTS : ');
		for(var res in results)	{
			console.log(' '+results[res]);
		}
	});
};

xenapi.prototype.stopAllVm = function() {
	async.series([
		sessionLogin,
		function(cb){			
     			client.methodCall('VM.get_all_records', [sessionId], function (error, vms) {
		                if(error) throw error;
                		console.log('VMS : ' + JSON.stringify(vms));
		                vms = vms.Value;
				var vmsArray = [];
				for( var ref in vms){
					console.log('DEBUG : ref =  ' + ref);  
					var vmObject = {'ref' : ref ,'datas' : vms[ref]};
					vmsArray.push(vmObject);
				}
                		async.forEach(vmsArray, function(vm, callback){
                         		console.log('VM_UUID = ' + vm.datas.uuid);
                        		if(vm.datas.is_a_template == false){
                                 		client.methodCall('VM.shutdown', [ sessionId, vm.ref], function(error, data){
							if(error) throw error;
                                        		console.log('VM = ' + JSON.stringify(data));
							callback();
                                 		});
                         		}
                 		}, function(err){
					if(err) throw err;
				});
							
				cb(null, 'StopAllVm');
			});
		},
		sessionLogout
	],
	function(err, results){
		console.log('RESULTS : ');
		for(var res in results)	{
			console.log(' '+results[res]);
		}
	});
};


xenapi.prototype.start = function(vmUuid, callback) {
	async.series([
		sessionLogin,
		function(cb){		
			client.methodCall('VM.get_by_uuid', [sessionId, vmUuid], function (error, vmRef){
				if(error) throw error;
				console.log('DEBUG : start VM get_by_uuid = ' + JSON.stringify(vmRef));
				vmRef = vmRef.Value;
                       		client.methodCall('VM.get_record', [sessionId, vmRef], function(error, vm){
		                  vm = vm.Value;
				  if(vm.is_a_template == false){
                               		client.methodCall('VM.start', [ sessionId, vmRef, false, false ], function(error, data){
						if(error) throw error;
                                       		console.log('DEBUG : Start VM result = ' + JSON.stringify(data));
						cb(null, 'Start');
                               		});
                       		  }else{
					console.log('DEBUG : Start : ERROR, We cannot start a template vm!');
					cb(null, 'Start');
				  }
				});
			});
		},
		sessionLogout
	],
	function(err, results){
		console.log('RESULTS : ');
		for(var res in results)	{
			console.log(' '+results[res]);
		}
		callback();
	});
};

xenapi.prototype.stop = function(vmUuid, callback) {
	async.series([
		sessionLogin,
		function(cb){		
			client.methodCall('VM.get_by_uuid', [sessionId, vmUuid], function (error, vmRef){
				if(error) throw error;
				console.log('DEBUG : stop VM get_by_uuid = ' + JSON.stringify(vmRef));
				vmRef = vmRef.Value;
                       		client.methodCall('VM.get_record', [sessionId, vmRef], function(error, vm){
		                  vm = vm.Value;
				  if(vm.is_a_template == false){
                               		client.methodCall('VM.shutdown', [ sessionId, vmRef ], function(error, data){
						if(error) throw error;
                                       		console.log('DEBUG : stop VM result = ' + JSON.stringify(data));
						cb(null, 'Stop');
                               		});
                       		  }else{
					console.log('DEBUG : Stop : ERROR, We cannot stop a template vm!');
					cb(null, 'Stop');
				  }
				});
			});
		},
		sessionLogout
	],
	function(err, results){
		console.log('RESULTS : ');
		for(var res in results)	{
			console.log(' '+results[res]);
		}
		callback();
	});
};

module.exports = xenapi;

