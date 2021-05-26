var io = require('socket.io-client');
const request = require('request');
const EventEmitter = require('events');

const ACTION = {
    GET : "get",
    INSTANCE : "instance",
    COLLECT : "collect",
    KILL : "kill",
    HANDLE : "handle",
    RELEASE : "release",
    UPDATE : "update",
};

class ProcessEvent extends EventEmitter {

    onGet(callback){
        this.on(ACTION.GET,callback);
    }

    onInstance(callback){
        this.on(ACTION.INSTANCE,callback);
    }

    onCollect(callback){
        this.on(ACTION.COLLECT,callback);
    }

    onKill(callback){
        this.on(ACTION.KILL,callback);
    }

    onHandle(callback){
        this.on(ACTION.HANDLE,callback);
    }

    onRelease(callback){
        this.on(ACTION.RELEASE,callback);
    }

    onUpdate(callback){
        this.on(ACTION.UPDATE,callback);
    }

}

function ProcessManager(http_host,event){
    this.socket = null;
    this.host = null;
    this.http_host = http_host;
    this.event = event;
}

ProcessManager.prototype.connect = function(host){
    this.host = host;
    var socket = io.connect(
        host,
        {
            reconnect: true,
            transports: ['websocket'],
        }
    );
    this.socket = socket;
    this.init();
};

ProcessManager.prototype.init = function(){
    this.socket.on('connect', function (socket) {
        console.log('Connected!');
    });
    this.socket.on('response', function (msg) {
        this.event.emit(msg.action,msg);
    }.bind(this));
}

ProcessManager.prototype.get = function(id){
    var process = {
        id:id,
        action:ACTION.GET,
        process_forward_aware:true,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.instance = function(id,owner = ""){
    var process = {
        id:id,
        action:ACTION.INSTANCE,
        process_forward_aware:true,
        owned:owner,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.collect = function(owner){
    var process = {
        action:ACTION.COLLECT,
        process_forward_aware:true,
        owned:owner,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.kill = function(id){
    var process = {
        id:id,
        action:ACTION.KILL,
        process_forward_aware:true,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.handle = function(id){
    
};

ProcessManager.prototype.release = function(id){
    var process = {
        id:id,
        action:ACTION.RELEASE,
        process_forward_aware:true,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.update = function(id,result = [],parameter = []){
    var process = {
        id:id,
        action:ACTION.UPDATE,
        parameter:parameter,
        result: result,
        process_forward_aware:true,
    };
    return function(callback){
        return this.send(process,callback);
    }.bind(this);
};

ProcessManager.prototype.send = function(process,callback){
    var options = {
        uri: this.http_host,
        method: 'POST',
        json: process
    };
    request(options, function (error, response, body) {
      //data = JSON.parse(response.body);
      data = response.body;
      callback(data);
    });
    if(this.socket){
        this.socket.emit('request',{
            action: process.action,
            id:process.id,
        })
    }
}

module.exports = {ACTION,ProcessManager,ProcessEvent};
