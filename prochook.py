import frida, sys

pid = int(sys.argv[1])
session = frida.attach(pid)

def on_message(message, data):
	print("msg: '{}'\ndata: '{}'".format(message,data))

scriptFile = "prochook.js"
scriptData = open(scriptFile, "r").read()
#print(scriptData)
scriptData = scriptData % "ngx_http_parse_header_line"
funcHook = session.create_script(scriptData)
funcHook.on("message", on_message)
funcHook.load()
funcHook.exports.hook_function()
sys.stdin.read()
