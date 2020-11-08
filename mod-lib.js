const m = require('bindings')('../taskDependents/memoryjs.node')
const offsets = require('./offsets.json')
const ea = []
let proc;
const processName = "MCC-Win64-Shipping.exe"

const read = {
    Buffer: function (address, size) {
        return m.readBuffer(proc.handle, address, size);
    },
    Memory: function (address, type) {
        return m.readMemory(proc.handle, address, type);
    },
    Pointer: (address) => {
        return read.Memory(address , 'pointer')
    }
}

const write = {
    Buffer: function (buffer, address) {
        m.writeBuffer(proc.handle, address, buffer);
    },
    Memory: function (address, value, type) {
        m.writeMemory(proc.handle, address, value , type);
    }
}

//Internal functions
function getGameAddresses(){
    let dll = ea['dll'].modBaseAddr
    //TLS Pointer
    ea['tls'] = read.Pointer(dll + parseInt(offsets.tls.address,16)) 
    //ea['tick'] = read.Pointer(dll + parseInt(offsets.tick.address,16)) + parseInt(offsets.tick_rate.address,16) 

    Object.keys(offsets).forEach(function(e) {
        if(offsets[e].type == 'offset'){
            ea[e] = dll + parseInt(offsets[e].address,16)
        } else if(offsets[e].type == 'ml_pointer'){
            pointerResolution(e, offsets[e])
        }
    });
    console.log('Stored game addresses')
    console.log('------------------------------------------')
    console.log('Ready to use Purpl')
}

function pointerResolution(name, pointer){
    let address = ea['dll'].modBaseAddr
    pointer.addresses.forEach(function(e){
        address = read.Pointer(address + parseInt(e,16)) 
    })
    pointer.offsets.forEach(function(e){
        address = address + parseInt(e,16) 
    });
    ea[name] = address
}

function findPlayer(){
    pointerResolution('player_coord',offsets.player_coord)
}

function getModuleBase(moduleBase) {
    return m.findModule(moduleBase, proc.th32ProcessID);
}

module.exports = {
    openProcess: (moduleBase) => {
        m.openProcess(processName, (error, processObject) => {
            if(processObject.szExeFile) {
                proc = processObject
                ea['dll'] = getModuleBase(moduleBase)
                console.log('Successfully attached to', moduleBase);
                getGameAddresses()
            } else {
                console.log("Couldn't open handle on", processName);
                console.log("This is probably because the game isn't running.")
            }
        });
    },
    getGameAddresses,
    findPlayer,
    //Globals
    ea,
    read,
    write
}