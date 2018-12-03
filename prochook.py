import frida, sys, tempfile, time, subprocess, os

radamsa="/root/PROJECTS/fuzz/radamsa/bin/radamsa"
#scriptFile = "hook_parse_header_line.js"
scriptFile = "hook_parse_request_line.js"
scriptData = open(scriptFile, "r").read()
# scriptData = scriptData % "ngx_http_parse_header_line"
scriptData = scriptData % "ngx_http_parse_request_line"

def fuzzChunk(chunkData):
	"""Hack to take a raw memory blob and pass it to radamsa"""
	fname = tempfile.mktemp(dir="/tmp/samples/")
	print(fname)
	x = open(fname, "wb")
	x.write(chunkData)
	x.close()
	subprocess.run("{} {} -o {}".format(radamsa,fname,fname), shell=True)
	x = open(fname, "rb")
	x = x.read()
	x = "".join("{:02x}".format(_) for _ in x)
	return x

def on_message(message, data):
	#print("msg: '{}'\ndata: '{}'".format(message,data))
	if "payload" in message and message["payload"] == "mem":
		# print("found memory message!")
		funcHook.post({"type":"payload","payload":fuzzChunk(data)})
	else:
		print(message,data)

# Attach to (what should be) the only nginx process
def getPID():
	#ngxpid = subprocess.Popen("pgrep -u nobody nginx", shell=True, stdout=subprocess.PIPE)
	ngxpid = subprocess.Popen("pgrep -u nobody nginx", shell=True, stdout=subprocess.PIPE)
	ngxpid = ngxpid.stdout.read()
	return int(ngxpid.decode("utf-8").split("\n")[0])

newPID = 999999999
try:
	while True:
		try: # Check our nginx PID is still alive
			os.kill(newPID, 0)
			time.sleep(1)
		except ProcessLookupError: # Or reattach
			#frida.shutdown()
			newPID = getPID()
			print("Got PID for nginx worker: '{}'. ".format(newPID), end="")
			print("Attaching... ",end="")
			session = frida.attach(newPID)
			print("done. Loading scripts...", end="")
			funcHook = session.create_script(scriptData)
			funcHook.on("message", on_message)
			funcHook.load()
			funcHook.exports.hook_function()
			print("done.")
except KeyboardInterrupt:
	print("Quitting...")
