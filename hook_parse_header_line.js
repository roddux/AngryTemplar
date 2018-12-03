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
				var struct = args[1];
//				console.log("ngx_buf_t: ", struct); // location of the argument structure
				
				var bufPos = Memory.readPointer(struct.add(0x0)); // bufPos is the first pointer
//				console.log("u_pos:     ", bufPos);
				
				var bufLast = Memory.readPointer(struct.add(0x8)); // bufLast is the second
//				console.log("u_last:    ", bufLast);

				var bufStart = Memory.readPointer(struct.add(0x20)); // bufStart is 5th param
//				console.log("u_start:   ", bufStart);
				
				var bufEnd = Memory.readPointer(struct.add(0x28)); // bufEnd is 6th
//				console.log("u_end:     ", bufEnd);

				var bufLen = bufEnd-bufStart;
//				console.log("end-start: ", bufEnd-bufStart); // 1024 bytes normally

				// Send the memory chunk to Python
				send("mem", Memory.readByteArray(bufStart, bufLen));
				var newBuf = null;
				var op = recv("payload", function(value) {
					var hex = value.payload;
					var typedArray = new Uint8Array(
						hex.match(/[\da-f]{2}/gi).map(
							function (h) { return parseInt(h, 16) }
						)
					)
					newBuf = typedArray.buffer; 
					var myBuf = new ArrayBuffer(bufLen);
					var len = typedArray.length;
					console.log(typedArray.length);
					if (typedArray.length > 1024) {
						console.log("biggie");
						//len = 1024;
					}
					//for(var j=0;j<len;j++) {
					for(var j=0;j<bufLen;j++) {
						myBuf[j]=typedArray[j];
					}
					Memory.writeByteArray(bufStart, myBuf);
				});
				op.wait();
				// Python calls radamsa to fuck with the chunk and sends it back
				// overwrite the existing chunk with our new one
				// divine moment of truth
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
