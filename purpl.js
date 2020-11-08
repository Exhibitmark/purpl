const fs = require('fs');
const path = require('path');
console.log("process.cwd() = " + process.cwd());
const ioHook = require('iohook');
const gamepad = require('gamepad')
const {keys, buttons} = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')));
const {read, write, openProcess, ea, getGameAddresses, findPlayer} = require('./mod-lib.js')
console.clear()
const config = {}
const button_mapping = {
    "thumbstick_left": 6,
    "thumbstick_right": 7,
    "dpad_up": 0,
    "dpad_right": 3,
    "dpad_down": 1,
    "dpad_left": 2,
    "back": 5,
    "start": 4,
    "xbox": 14,
    "x": 12,
    "a": 10,
    "b": 11,
    "y": 13
}

openProcess("halo2.dll")
remapping()
/*
{
    "wireframe on/off" : Up arrow or Xbox button
    "checkpoint" : Number 4 or Back button
    "revert" : Tab or D-Pad Up
    "double revert on/off" : Down arrow or D-Pad Down
    "hud on/off" : H or D-Pad Right
    "tick 30/60 toggle" : Number 0 or D-Pad Left
    "big jump": Right arrow or X button
} */
const ticks = {
    30: Buffer.from([0x1E,0x00,0x89,0x88,0x08,0x3D]),
    60: Buffer.from([0x3C,0x00,0x89,0x88,0x88,0x3C])
}

function remapping(){
    Object.keys(buttons).forEach(function(b) {
        config[button_mapping[b]] = buttons[b]
    });
}

function toggle(address){
    let current = read.Memory(address, 'byte')
    write.Memory(address, current ^ 1, 'byte')
}

function toggleTick(){
    let rate = read.Memory(ea['tick'], 'byte')
    if(rate == 60){
        console.log("Tickrate is now: 30")
        write.Buffer(ticks[30], ea['tick'])
    } else if(rate == 30){
        console.log("Tickrate is now: 60")
        write.Buffer(ticks[60], ea['tick'])
    }
}

function flag(address){
    write.Memory(address, 1, 'byte')
}

function findAction(action){
    switch(action) {
        case "checkpoint":
            flag(ea['checkpoint'])
            break; 

        case "revert":
            flag(ea['revert'])
            break;

        case "double":
            toggle(ea['double'])
            break;
        
        case "jump":
            toggle(ea['jump'])
            break;
            
        case "hud":
            toggle(ea['hud'])
            break;  

        case "wireframe":
            toggle(ea['wireframe'])
            break;    
                        
        case "tick":
            toggleTick()
            break;  

        case "restart":
            getGameAddresses()
            break; 
      
        default:
          // code block
      }
}
  
gamepad.init()
gamepad.on("down", function (id, num) {
    let action = config[num.toString()]
    findAction(action)
});

ioHook.on('keydown', e => {
    if(e.altKey == false){
        let action = keys[e.rawcode.toString()]
        findAction(action)
    }
});
// Create a game loop and poll for events
setInterval(gamepad.processEvents, 33);
// Scan for new gamepads as a slower rate
setInterval(gamepad.detectDevices, 2000);
setInterval(function(){ 
    findPlayer()
},10000);
// Register and start hook
ioHook.start();