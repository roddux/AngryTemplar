'use strict';
rpc.exports.hookFunction = function () {
	var funcAddr = null;
	Process.enumerateModulesSync().forEach(function(module) {
		Module.enumerateSymbols(module["name"],
			{
				"onMatch": function(exp) {
					try {
						if (exp["type"] == "function" &&
						   exp["name"] == "%s") {
							console.log("Found",exp["name"],"at address",exp["address"]);
							funcAddr = exp["address"];
						}
					} catch (e) {}
				}, "onComplete": function(){}
			}
		)
	});
	console.log("Hooking function at address",funcAddr);
	Interceptor.attach(
		ptr(funcAddr),
		{
			onEnter: function(args) {
				var struct = Memory.readPointer(args[1]);
				console.log("ngx_buf_t: ", struct);
				
				var bufPos  = new NativePointer(struct);
				console.log("u_pos:     ", bufPos);
				
//				var bufLast = new NativePointer(struct).add(0x04);
//				console.log("u_last:    ", bufLast);
				
//				var bufStart = new NativePointer(struct).add(0x10);
//				console.log("u_start:   ", bufStart);
				
//				var bufEnd = new NativePointer(struct).add(0x14);
//				console.log("u_end:     ", bufEnd);
				
//				var length = bufLast.sub(bufPos);
//				console.log("length:    ", length);

				// just send teh wh0l damn thing
				//send("mem",Memory.readByteArray(bufPos,32));

				// try and send just line by line
				//var c = Memory.readByteArray(bufPos, 1);
				var c = Memory.readU8(bufPos); 
				console.log(c);
				var j = 0;
				var arr = []
				while (c != 13) {
					arr.push(c);
					j += 1;
					//c = Memory.readByteArray(new NativePointer(bufPos).add(j), 1);
					c = Memory.readU8(new NativePointer(bufPos).add(j));
				}
				var z="";arr.forEach(function(y){z+=String.fromCharCode(y)});
				console.log(arr);
				console.log("Got header: '"+z+"'");

				//console.log(Memory.readByteArray(bufPos, length.toInt32()));
				//send(args);
				console.log("\n");
			}
		}
	);
};

// args[1] is a pointer to ngx_buf_t that likely contains the header line we want to fuzz
// try: make a new pointer from *start and hexdump that
// so we need to skip the offst of u_char *2, off_t*2 into the memory location pointed ar args[1]
// then take a nativepointer() from that address, which is the u_char *start
// then hexdump() that

// u_char is probs unsigned char, aka 1 byte ( 8 bits / 0 to 255)
// off_t is an offset, long int, aka 4 bytes (32 bits / 0 to 2147483647)

// So to get to u_char *start, we need to skip 10 bytes in
// something like ptr(ReadMemory(arg[1] + 10))

/*
typedef struct ngx_buf_s  ngx_buf_t;
struct ngx_buf_s {
    u_char          *pos;
    u_char          *last;
    off_t            file_pos;
    off_t            file_last;
    u_char          *start;         // start of buffer
    u_char          *end;           // end of buffer
    ngx_buf_tag_t    tag;
    ngx_file_t      *file;
    ngx_buf_t       *shadow;
    unsigned         temporary:1;
    unsigned         memory:1;
    unsigned         mmap:1;
    unsigned         recycled:1;
    unsigned         in_file:1;
    unsigned         flush:1;
    unsigned         sync:1;
    unsigned         last_buf:1;
    unsigned         last_in_chain:1;
    unsigned         last_shadow:1;
    unsigned         temp_file:1;
    int   num;
};
*/
